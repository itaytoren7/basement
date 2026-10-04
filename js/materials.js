/* materials.js — procedural textures (drawn on canvas, nothing to download) and all materials.
 * Change a finish here and every object that uses it updates.
 * Exposes: B.tex, B.M, B.std, B.flutedTex, B.FABRICS, B.setFabric(mats, key)
 */
(function (B) {
  "use strict";
  if (B.failed) return;

  function canvasTex(w, h, draw) {
    const cv = document.createElement("canvas"); cv.width = w; cv.height = h;
    draw(cv.getContext("2d"), w, h);
    const t = new THREE.CanvasTexture(cv);
    t.encoding = THREE.sRGBEncoding;
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.anisotropy = 4;
    return t;
  }
  function rng(seed) { let s = seed; return () => (s = (s * 16807) % 2147483647) / 2147483647; }
  // `strength` multiplies the grain contrast (1 = the subtle light-oak default).
  function woodTex(base, grain, seed, strength) {
    return canvasTex(256, 512, (g, w, h) => {
      const r = rng(seed);
      g.fillStyle = base; g.fillRect(0, 0, w, h);
      for (let i = 0; i < 70; i++) {
        const x = r() * w; g.strokeStyle = grain; g.globalAlpha = (0.03 + r() * 0.07) * (strength || 1); g.lineWidth = 0.5 + r() * 1.4;
        g.beginPath(); g.moveTo(x, 0);
        const amp = 0.6 + r() * 1.4, ph = r() * 6;
        for (let y = 0; y <= h; y += 32) g.lineTo(x + Math.sin(y / 140 + ph) * amp, y);
        g.stroke();
      }
      g.globalAlpha = 1;
    });
  }
  function tileTex(base, grout, px) {
    return canvasTex(256, 256, (g, w, h) => {
      g.fillStyle = base; g.fillRect(0, 0, w, h);
      const r = rng(7);
      for (let i = 0; i < 900; i++) { g.fillStyle = "rgba(0,0,0," + (r() * 0.025) + ")"; g.fillRect(r() * w, r() * h, 2, 2); }
      g.fillStyle = grout; g.fillRect(0, 0, w, px); g.fillRect(0, 0, px, h);
    });
  }
  // Main-room floor: light-oak parquet. Planks 20 cm wide, 90–180 cm long, staggered, running along z.
  // One texture repeat = 160 × 640 cm (8 planks across), drawn in cm units.
  function parquetTex() {
    const PW = 20, COLS = 8, LEN = 640;
    const tones = ["#c39b6a", "#ba9161", "#c8a374", "#b68d5d", "#bf9767", "#c59e6c", "#b99263"];
    function plank(g, x, y, len, seed) {
      const r = rng(seed);
      g.save(); g.beginPath(); g.rect(x, y, PW, len); g.clip();
      g.fillStyle = tones[Math.floor(r() * tones.length)]; g.fillRect(x, y, PW, len);
      const sh = g.createLinearGradient(0, y, 0, y + len);              // slight tone drift along the plank
      sh.addColorStop(0, "rgba(255,240,215," + (r() * 0.08) + ")"); sh.addColorStop(1, "rgba(60,35,10," + (r() * 0.07) + ")");
      g.fillStyle = sh; g.fillRect(x, y, PW, len);
      g.strokeStyle = "#7a5430";
      for (let i = 0; i < 13; i++) {                                     // grain lines
        const gx = x + r() * PW, amp = 0.2 + r() * 0.6, ph = r() * 6, per = 25 + r() * 40;
        g.globalAlpha = 0.04 + r() * 0.1; g.lineWidth = 0.08 + r() * 0.22;
        g.beginPath(); g.moveTo(gx, y);
        for (let t = 0; t <= len; t += 4) g.lineTo(gx + Math.sin(t / per + ph) * amp, y + t);
        g.stroke();
      }
      g.fillStyle = "#e2c497";                                           // oak flecks
      for (let i = 0; i < 18; i++) { g.globalAlpha = 0.08 + r() * 0.12; g.fillRect(x + r() * PW, y + r() * len, 0.25, 0.8 + r() * 2.5); }
      if (r() < 0.22) {                                                  // an occasional small knot
        const kx = x + 4 + r() * (PW - 8), ky = y + 10 + r() * (len - 20);
        g.globalAlpha = 0.35; g.fillStyle = "#6b4626";
        g.beginPath(); g.ellipse(kx, ky, 0.5 + r() * 0.5, 1 + r() * 1.2, 0, 0, Math.PI * 2); g.fill();
      }
      g.globalAlpha = 1;
      g.strokeStyle = "rgba(70,44,20,.5)"; g.lineWidth = 0.32;           // joints
      g.beginPath(); g.moveTo(x, y); g.lineTo(x, y + len); g.moveTo(x, y); g.lineTo(x + PW, y); g.stroke();
      g.restore();
    }
    const t = canvasTex(512, 2048, (g, w, h) => {
      const r = rng(41);
      g.scale(w / (PW * COLS), h / LEN);
      for (let c = 0; c < COLS; c++) {
        // lengths sum to exactly one repeat, so each column wraps without a seam
        const n = 4 + Math.floor(r() * 4), lens = Array(n).fill(LEN / n);
        for (let k = 0; k < 60; k++) {
          const i = Math.floor(r() * n), j = Math.floor(r() * n), d = (r() - 0.5) * 50;
          if (i !== j && lens[i] + d >= 90 && lens[i] + d <= 180 && lens[j] - d >= 90 && lens[j] - d <= 180) { lens[i] += d; lens[j] -= d; }
        }
        let y = r() * LEN;
        lens.forEach((len, i) => {
          const seed = 1000 + c * 37 + i * 7;
          plank(g, c * PW, y, len, seed);
          plank(g, c * PW, y - LEN, len, seed);                         // the part that wraps past the end
          y += len;
        });
      }
    });
    t.anisotropy = 8;
    return t;
  }

  // IKEA LOKALTÅG rug 133 × 195: off-white field, a faded grey/charcoal vintage oriental pattern
  // (floral motifs in a diamond lattice) and a 13 cm patterned border. Drawn in cm units.
  function rugTex() {
    const W = 133, L = 195, BD = 13;
    const grey = "rgba(122,118,112,.55)", char = "rgba(72,70,68,.5)", field = "#d9d3c6";
    function flower(g, x, y, s, petals, col, core) {
      g.fillStyle = col;
      for (let k = 0; k < petals; k++) {
        const a = k * Math.PI * 2 / petals;
        g.beginPath(); g.ellipse(x + Math.cos(a) * s * 0.55, y + Math.sin(a) * s * 0.55, s * 0.45, s * 0.2, a, 0, Math.PI * 2); g.fill();
      }
      g.fillStyle = core; g.beginPath(); g.arc(x, y, s * 0.22, 0, Math.PI * 2); g.fill();
    }
    function leaf(g, x, y, a, s, col) {
      g.fillStyle = col; g.beginPath(); g.ellipse(x, y, s, s * 0.32, a, 0, Math.PI * 2); g.fill();
    }
    return canvasTex(512, 1024, (g, w, h) => {
      const r = rng(53);
      g.scale(w / W, h / L);
      g.fillStyle = field; g.fillRect(0, 0, W, L);
      for (let i = 0; i < 70; i++) {                                     // abrash: faint bands across the width
        g.fillStyle = r() < 0.5 ? "rgba(255,252,244,.07)" : "rgba(120,110,95,.05)";
        g.fillRect(0, r() * L, W, 0.4 + r() * 3);
      }
      // border: guard lines, a running vine and rosettes
      g.strokeStyle = char; g.lineWidth = 0.9;
      g.strokeRect(1.6, 1.6, W - 3.2, L - 3.2); g.strokeRect(BD - 0.5, BD - 0.5, W - 2 * BD + 1, L - 2 * BD + 1);
      g.strokeStyle = grey; g.lineWidth = 0.45;
      g.strokeRect(3.2, 3.2, W - 6.4, L - 6.4); g.strokeRect(BD - 2.2, BD - 2.2, W - 2 * BD + 4.4, L - 2 * BD + 4.4);
      g.fillStyle = "rgba(160,155,146,.22)"; g.fillRect(3.4, 3.4, W - 6.8, BD - 5.8); g.fillRect(3.4, L - BD + 2.4, W - 6.8, BD - 5.8);
      g.fillRect(3.4, BD - 2.4, BD - 5.8, L - 2 * BD + 4.8); g.fillRect(W - BD + 2.4, BD - 2.4, BD - 5.8, L - 2 * BD + 4.8);
      const m = (3.2 + BD - 2.2) / 2;                                    // centre line of the border band
      const side = (x0, y0, x1, y1) => {
        const len = Math.hypot(x1 - x0, y1 - y0), n = Math.round(len / 11), ux = (x1 - x0) / len, uy = (y1 - y0) / len;
        g.strokeStyle = grey; g.lineWidth = 0.5; g.beginPath();
        for (let t = 0; t <= len; t += 1) {
          const o = Math.sin(t / len * n * Math.PI * 2) * 2;
          const px = x0 + ux * t - uy * o, py = y0 + uy * t + ux * o;
          t ? g.lineTo(px, py) : g.moveTo(px, py);
        }
        g.stroke();
        for (let k = 0; k <= n; k++) {
          const px = x0 + ux * len * k / n, py = y0 + uy * len * k / n;
          flower(g, px, py, 3, k % 2 ? 6 : 8, k % 2 ? grey : char, char);
        }
      };
      side(m, m, W - m, m); side(m, L - m, W - m, L - m); side(m, m, m, L - m); side(W - m, m, W - m, L - m);
      // field: diamond lattice with a flower in every diamond
      const fx0 = BD + 1, fy0 = BD + 1, fw = W - 2 * fx0, fh = L - 2 * fy0, cw = fw / 5, ch = fh / 6;
      g.save(); g.beginPath(); g.rect(fx0, fy0, fw, fh); g.clip();
      const centres = [];
      for (let i = 0; i <= 5; i++) for (let j = 0; j <= 6; j++) centres.push([fx0 + i * cw, fy0 + j * ch, 0]);
      for (let i = 0; i < 5; i++) for (let j = 0; j < 6; j++) centres.push([fx0 + (i + 0.5) * cw, fy0 + (j + 0.5) * ch, 1]);
      const diamond = (x, y) => { g.beginPath(); g.moveTo(x, y - ch / 2); g.lineTo(x + cw / 2, y); g.lineTo(x, y + ch / 2); g.lineTo(x - cw / 2, y); g.closePath(); };
      centres.forEach(([x, y]) => { diamond(x, y); g.strokeStyle = grey; g.lineWidth = 1.3; g.stroke(); g.strokeStyle = field; g.lineWidth = 0.45; g.stroke(); });
      centres.forEach(([x, y, odd]) => {
        flower(g, x, y, odd ? 4.6 : 3.8, odd ? 8 : 6, odd ? char : grey, odd ? grey : char);
        [0, Math.PI / 2, Math.PI, Math.PI * 1.5].forEach(a => leaf(g, x + Math.cos(a) * cw * 0.27, y + Math.sin(a) * ch * 0.27, a, 2.2, grey));
      });
      g.restore();
      // vintage wear: washed-out patches and a fine pile speckle
      for (let i = 0; i < 420; i++) {
        g.fillStyle = "rgba(222,217,206," + (0.12 + r() * 0.4) + ")";
        g.beginPath(); g.ellipse(r() * W, r() * L, 0.6 + r() * 5, 0.4 + r() * 2.2, r() * Math.PI, 0, Math.PI * 2); g.fill();
      }
      for (let i = 0; i < 9000; i++) {
        g.fillStyle = r() < 0.5 ? "rgba(255,255,255,.07)" : "rgba(60,55,48,.06)";
        g.fillRect(r() * W, r() * L, 0.3, 0.3);
      }
    });
  }

  // fluted ("גלינה") glass: vertical ribs
  const flutedTex = canvasTex(64, 8, (g, w, h) => {
    for (let x = 0; x < w; x++) {
      const v = 0.5 + 0.5 * Math.cos((x / w) * Math.PI * 2 * 4);
      const c = Math.round(205 + v * 45);
      g.fillStyle = "rgb(" + c + "," + Math.min(255, c + 4) + "," + Math.min(255, c + 6) + ")";
      g.fillRect(x, 0, 1, h);
    }
  });
  flutedTex.repeat.set(12, 1);
  const screenTex = canvasTex(256, 144, (g, w, h) => {
    const gr = g.createLinearGradient(0, 0, w, h);
    gr.addColorStop(0, "#1b2a44"); gr.addColorStop(0.55, "#0d1422"); gr.addColorStop(1, "#131a2a");
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
    g.fillStyle = "rgba(255,255,255,.06)"; g.beginPath(); g.moveTo(0, 0); g.lineTo(w * 0.45, 0); g.lineTo(0, h * 0.9); g.fill();
  });

  const tex = {
    oak: woodTex("#cfab7c", "#6e4a22", 11),
    oakLight: woodTex("#dcc29c", "#8a6534", 13),
    whiteOak: woodTex("#e4d6c1", "#9c8466", 17),
    harelOak: woodTex("#c49b6c", "#5d3d1b", 19),
    darkOak: woodTex("#5b3f2a", "#1f1209", 29, 3.4), // coffee table: dark oak with visible grain
    floor: parquetTex(),                            // main room: light-oak parquet
    rug: rugTex(),
    // IKEA Tibbleby cover (KIVIK): light warm grey, a fine woven mélange
    tibbleby: canvasTex(128, 128, (g, w, h) => {
      const r = rng(61);
      g.fillStyle = "#aca497"; g.fillRect(0, 0, w, h);                // darker than the real fabric: the model's daylight is bright
      for (let y = 0; y < h; y += 2) for (let x = 0; x < w; x += 2) {
        const v = r(), across = ((x + y) / 2) % 2;
        g.fillStyle = v < 0.35 ? "rgba(255,250,240,.16)" : v < 0.7 ? "rgba(88,80,68,.13)" : "rgba(150,140,125,.08)";
        g.fillRect(x, y, across ? 2 : 1, across ? 1 : 2);
      }
    }),
    bathFloor: tileTex("#eceae6", "#cfd6de", 3),    // bathroom floor: 30×30
    showerTile: tileTex("#e7ecef", "#c5ced6", 3),
    // bathroom walls: 4×4 hand-glazed turquoise tiles of 15 cm per texture repeat (60 cm)
    clad: canvasTex(256, 256, (g, w, h) => {
      const r = rng(23), shades = ["#6fc3c8", "#79cacd", "#66bcc3", "#82cfd1", "#72c5cb"];
      g.fillStyle = "#e6f1f0"; g.fillRect(0, 0, w, h);
      for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) {
        g.fillStyle = shades[Math.floor(r() * shades.length)];
        g.fillRect(i * 64 + 2, j * 64 + 2, 60, 60);
        g.fillStyle = "rgba(255,255,255," + (0.05 + r() * 0.08) + ")";
        g.fillRect(i * 64 + 6, j * 64 + 6, 26, 20);
      }
    }),
    // neutral woven fabric, tinted by the material colour (upholstery colour options)
    weave: canvasTex(128, 128, (g, w, h) => {
      const r = rng(67);
      g.fillStyle = "#f2f2f2"; g.fillRect(0, 0, w, h);
      for (let y = 0; y < h; y += 2) for (let x = 0; x < w; x += 2) {
        const v = r(), across = ((x + y) / 2) % 2;
        g.fillStyle = v < 0.35 ? "rgba(255,255,255,.35)" : v < 0.7 ? "rgba(0,0,0,.09)" : "rgba(0,0,0,.04)";
        g.fillRect(x, y, across ? 2 : 1, across ? 1 : 2);
      }
    }),
  };
  tex.tibbleby.repeat.set(5, 5);
  tex.weave.repeat.set(5, 5);

  const std = (o) => new THREE.MeshStandardMaterial(Object.assign({ roughness: 0.85, metalness: 0 }, o));
  // Note: there is no environment map, so keep metalness low (≤ 0.45) or metals render black.
  const M = {
    wall: std({ color: "#f2f0eb", roughness: 0.95 }),
    cap: std({ color: "#8f959e", roughness: 1 }),          // cut top of walls, like the grey fill in the drawing
    newWall: std({ color: "#f2f0eb", roughness: 0.95 }),   // new walls (red hatch in the drawing); tinted by the "new walls" toggle
    newCap: std({ color: "#8f959e", roughness: 1 }),
    ceiling: std({ color: "#f7f6f3", roughness: 1, side: THREE.DoubleSide }),
    floor: std({ map: tex.floor, roughness: 0.55 }),
    bathFloor: std({ map: tex.bathFloor, roughness: 0.6 }),
    shower: std({ map: tex.showerTile, roughness: 0.5 }),
    white: std({ color: "#f4f3f0", roughness: 0.7 }),
    whiteGloss: std({ color: "#fbfbfa", roughness: 0.25 }),
    porcelain: std({ color: "#fcfcfb", roughness: 0.18 }),
    oak: std({ map: tex.oak, roughness: 0.65 }),
    oakLight: std({ map: tex.oakLight, roughness: 0.65 }),
    whiteOak: std({ map: tex.whiteOak, roughness: 0.65 }),
    harelOak: std({ map: tex.harelOak, roughness: 0.6 }),
    darkOak: std({ map: tex.darkOak, roughness: 0.5 }),                  // coffee table only
    kivik: std({ map: tex.tibbleby, roughness: 1 }),                      // KIVIK sofa, Tibbleby beige/grey (user's choice)
    mustard: std({ color: "#a8771c", roughness: 1 }),                     // throw pillows
    navy: std({ color: "#1f2a44", roughness: 1 }),
    fabric2: std({ color: "#584f61", roughness: 1 }),
    armchair: std({ color: "#473f4d", roughness: 1 }),                    // armchair body
    armchairSeat: std({ color: "#584f61", roughness: 1 }),                // armchair seat cushions (own material: M.fabric2 is the desk chair)
    bedBase: std({ color: "#bdb3a5", roughness: 1 }),
    mattress: std({ color: "#f3f1ec", roughness: 1 }),
    duvet: std({ color: "#dfe3e6", roughness: 1 }),
    pillow: std({ color: "#fbfaf7", roughness: 1 }),
    rug: std({ map: tex.rug, roughness: 1 }),                             // LOKALTÅG, top face
    rugEdge: std({ color: "#cdc6b8", roughness: 1 }),
    black: std({ color: "#1d1f23", roughness: 0.45 }),
    darkGlass: std({ color: "#15171b", roughness: 0.15, metalness: 0.2 }),
    steel: std({ color: "#b7bbc1", roughness: 0.35, metalness: 0.3 }),
    chrome: std({ color: "#d6dadf", roughness: 0.22, metalness: 0.3 }),
    bronze: std({ color: "#b3895a", roughness: 0.3, metalness: 0.35 }),   // shower fixtures (user's choice)
    clad: std({ map: tex.clad, roughness: 0.28 }),                        // bathroom wall tiles (user's choice)
    counter: std({ map: tex.oakLight, roughness: 0.5 }),
    groove: std({ color: "#6b6f75", roughness: 1 }),
    frame: std({ color: "#f3f3f1", roughness: 0.5 }),                     // vitrine + bathroom door frame (white / black option)
    glass: new THREE.MeshStandardMaterial({ color: "#e9f3f5", map: flutedTex, transparent: true, opacity: 0.62, roughness: 0.1, metalness: 0, depthWrite: false, side: THREE.DoubleSide }),
    cabinetGlass: new THREE.MeshStandardMaterial({ color: "#e8f2f4", transparent: true, opacity: 0.16, roughness: 0.05, depthWrite: false, side: THREE.DoubleSide }), // PAX glass doors
    showerGlass: new THREE.MeshStandardMaterial({ color: "#dff0f4", transparent: true, opacity: 0.2, roughness: 0.05, depthWrite: false, side: THREE.DoubleSide }),
    winGlass: new THREE.MeshStandardMaterial({ color: "#cfe3ee", transparent: true, opacity: 0.45, roughness: 0.05, depthWrite: false, emissive: "#9fc0d6", emissiveIntensity: 0.25 }),
    screen: new THREE.MeshBasicMaterial({ map: screenTex }),
    person: std({ color: "#8fa3b8", roughness: 0.9 }),
    ac: std({ color: "#fafafa", roughness: 0.4 }),
  };

  // Upholstery colour options for the panel (sofa and armchairs, chosen separately).
  // `tex: "tibbleby"` uses the KIVIK cover's own mélange texture; the others tint the neutral weave.
  // Colours are a little darker than the real fabric, because the model's daylight is bright.
  const FABRICS = [
    { family: "לבן ובז׳", items: [
      { key: "offwhite", name: "לבן שבור", color: "#d9d5cc" },
      { key: "cream", name: "שמנת", color: "#d2c4a6" },
      { key: "tibbleby", name: "בז׳/אפור · Tibbleby", color: "#aca497", tex: "tibbleby" },
      { key: "sand", name: "בז׳ חולי", color: "#b39b7b" },
    ] },
    { family: "כחול ותכלת", items: [
      { key: "skyblue", name: "תכלת", color: "#9cbdd4" },
      { key: "dustyblue", name: "כחול אפרפר", color: "#6c89a3" },
      { key: "denim", name: "כחול ג׳ינס", color: "#3e5e86" },
      { key: "navyblue", name: "כחול כהה", color: "#24334f" },
    ] },
    { family: "חום", items: [
      { key: "taupe", name: "טאופ", color: "#8b7b6a" },
      { key: "camel", name: "קאמל", color: "#a06c3e" },
      { key: "walnut", name: "חום אגוז", color: "#6c4930" },
      { key: "chocolate", name: "שוקולד", color: "#43302a" },
    ] },
    { family: "כהה", items: [
      { key: "charcoal", name: "פחם כהה", color: "#473f4d" },
    ] },
  ];
  // Apply fabric `key` to mats[0] (body); mats[1], if given, gets a slightly lighter shade (seat cushions).
  function setFabric(mats, key) {
    const f = FABRICS.flatMap(g => g.items).find(i => i.key === key);
    mats.forEach((m, i) => {
      m.map = f.tex ? tex[f.tex] : tex.weave;
      m.color.set(f.tex ? "#ffffff" : f.color);
      if (i > 0) m.color.offsetHSL(0, 0, f.tex ? -0.04 : 0.06);
      m.needsUpdate = true;
    });
  }

  Object.assign(B, { tex, M, std, flutedTex, FABRICS, setFabric });
})(window.B);
