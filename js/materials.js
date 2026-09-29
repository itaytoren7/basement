/* materials.js — procedural textures (drawn on canvas, nothing to download) and all materials.
 * Change a finish here and every object that uses it updates.
 * Exposes: B.tex, B.M, B.std, B.flutedTex
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
  function woodTex(base, grain, seed) {
    return canvasTex(256, 512, (g, w, h) => {
      const r = rng(seed);
      g.fillStyle = base; g.fillRect(0, 0, w, h);
      for (let i = 0; i < 70; i++) {
        const x = r() * w; g.strokeStyle = grain; g.globalAlpha = 0.03 + r() * 0.07; g.lineWidth = 0.5 + r() * 1.4;
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
    floor: tileTex("#dcd6cc", "#c4bdb1", 2),        // main room: 60×60 tiles
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
  };

  const std = (o) => new THREE.MeshStandardMaterial(Object.assign({ roughness: 0.85, metalness: 0 }, o));
  // Note: there is no environment map, so keep metalness low (≤ 0.45) or metals render black.
  const M = {
    wall: std({ color: "#f2f0eb", roughness: 0.95 }),
    cap: std({ color: "#8f959e", roughness: 1 }),          // cut top of walls, like the grey fill in the drawing
    newWall: std({ color: "#f2f0eb", roughness: 0.95 }),   // new walls (red hatch in the drawing); tinted by the "new walls" toggle
    newCap: std({ color: "#8f959e", roughness: 1 }),
    ceiling: std({ color: "#f7f6f3", roughness: 1, side: THREE.DoubleSide }),
    floor: std({ map: tex.floor, roughness: 0.7 }),
    bathFloor: std({ map: tex.bathFloor, roughness: 0.6 }),
    shower: std({ map: tex.showerTile, roughness: 0.5 }),
    white: std({ color: "#f4f3f0", roughness: 0.7 }),
    whiteGloss: std({ color: "#fbfbfa", roughness: 0.25 }),
    porcelain: std({ color: "#fcfcfb", roughness: 0.18 }),
    oak: std({ map: tex.oak, roughness: 0.65 }),
    oakLight: std({ map: tex.oakLight, roughness: 0.65 }),
    whiteOak: std({ map: tex.whiteOak, roughness: 0.65 }),
    harelOak: std({ map: tex.harelOak, roughness: 0.6 }),
    fabric: std({ color: "#9aa3a8", roughness: 1 }),
    fabric2: std({ color: "#aab2b6", roughness: 1 }),
    armchair: std({ color: "#c7a57e", roughness: 1 }),
    bedBase: std({ color: "#bdb3a5", roughness: 1 }),
    mattress: std({ color: "#f3f1ec", roughness: 1 }),
    duvet: std({ color: "#dfe3e6", roughness: 1 }),
    pillow: std({ color: "#fbfaf7", roughness: 1 }),
    rug: std({ color: "#b9c3c9", roughness: 1 }),
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
    showerGlass: new THREE.MeshStandardMaterial({ color: "#dff0f4", transparent: true, opacity: 0.2, roughness: 0.05, depthWrite: false, side: THREE.DoubleSide }),
    winGlass: new THREE.MeshStandardMaterial({ color: "#cfe3ee", transparent: true, opacity: 0.45, roughness: 0.05, depthWrite: false, emissive: "#9fc0d6", emissiveIntensity: 0.25 }),
    screen: new THREE.MeshBasicMaterial({ map: screenTex }),
    person: std({ color: "#8fa3b8", roughness: 0.9 }),
    ac: std({ color: "#fafafa", roughness: 0.4 }),
  };

  Object.assign(B, { tex, M, std, flutedTex });
})(window.B);
