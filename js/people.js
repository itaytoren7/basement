/* people.js — the two residents. Each body is a joint hierarchy of three.js primitives (hips → torso → head,
 * arms and legs in two parts, feet) with real human proportions, animated procedurally: breathing, blinking,
 * weight shifts, walking. Poses for the activities (sitting, lying, typing, drinking, reading, showering, ...)
 * are in POSE below; props (cup, book, phone) hang from the right hand. Looks and outfits are in PEOPLE, matched
 * to Itay's photos (the photos themselves never go into the repo — it is public). Colours are a little darker than
 * real cloth: the model's daylight is bright.
 * Exposes: B.PEOPLE, B.makePerson(key)
 */
(function (B) {
  "use strict";
  if (B.failed) return;
  const { CX, CZ, root, std } = B;

  // Looks (from the photos). height in cm; build scales widths (1 = average man).
  // hair.style: "short" | "curly" | "long"; hair.length (long only) = how far it falls down the back, cm; hair.tips = lighter ends.
  // beard: colour or null (+ moustache). glasses: true for round frames. necklace: chain colour. tattoo: a small line drawing on the left upper arm.
  // outfits: top/bottom colours (null = bare skin), sleeves "long" | "short" | "none", legs "long" | "short", shoes colour or null.
  // bedSide: which half of the 140 bed (north = z 80–150, south = z 150–220). start: where they stand at the beginning.
  const PEOPLE = {
    itay: {
      name: "איתי", gender: "m", height: 168, build: 1.08,
      skin: "#cf9b74", hair: { style: "curly", color: "#2d1b12" }, eyes: "#4a3222", beard: "#2a1a12", glasses: true, necklace: "#d8d4c8",
      outfits: {
        home:   { top: "#1e1e22", sleeves: "short", bottom: "#5a5a5e", legs: "long", shoes: "#2b2b2b" },   // black t-shirt, sweatpants, slippers
        out:    { top: "#1e1e22", sleeves: "short", bottom: "#2e3d5c", legs: "long", shoes: "#3f2d22" },   // black t-shirt, jeans, shoes
        pajama: { top: "#6f7f9c", sleeves: "long", bottom: "#6f7f9c", legs: "long", shoes: null },
        towel:  { top: null, sleeves: "none", bottom: "#ebe6dc", legs: "short", shoes: null },            // towel around the waist
      },
      bedSide: "north", start: { x: 330, z: 215, yaw: -Math.PI / 2 },
    },
    mia: {
      name: "מיה", gender: "f", height: 165, build: 0.84,
      skin: "#d9a67e", hair: { style: "long", color: "#6b4a2b", tips: "#b8905a", length: 48 }, eyes: "#5a6a4a", beard: null, glasses: false, tattoo: "#3a3a3a",
      outfits: {
        home:   { top: "#efe9df", sleeves: "none", bottom: "#4f4a55", legs: "long", shoes: "#d9d2c6" },    // white top, leggings
        out:    { top: "#f1ece4", sleeves: "none", bottom: "#c9b9a3", legs: "short", shoes: "#2a2a2a" },   // white top, light shorts
        pajama: { top: "#b7c7d8", sleeves: "short", bottom: "#b7c7d8", legs: "short", shoes: null },
        towel:  { top: "#ebe6dc", sleeves: "none", bottom: "#ebe6dc", legs: "short", shoes: null },       // towel wrap
      },
      bedSide: "south", start: { x: 232, z: 545, yaw: 0 },
    },
  };

  const JOINTS = ["hips", "torso", "head", "uArmL", "uArmR", "lArmL", "lArmR", "uLegL", "uLegR", "lLegL", "lLegR", "footL", "footR"];

  function makePerson(key) {
    const c = PEOPLE[key], s = c.height / 168, b = c.build;
    const cm = (v) => v * s;                        // lengths follow the height
    const rad = (v) => v * s * b;                   // widths follow the build too
    const mat = (color, rough) => std({ color, roughness: rough === undefined ? 0.95 : rough });
    const skin = mat(c.skin, 0.72);
    const cloth = { top: mat("#888888"), bottom: mat("#888888"), shoes: mat("#444444", 0.55) };
    const hairM = mat(c.hair.color, 0.62);

    const obj = new THREE.Group(); root.add(obj);
    const joints = {}, parts = {};
    const J = (name, parent, x, y, z) => { const g = new THREE.Group(); g.position.set(x, y, z); parent.add(g); joints[name] = g; return g; };
    const add = (name, geo, m, parent, x, y, z, sc) => {
      const mesh = new THREE.Mesh(geo, m); mesh.position.set(x, y, z); if (sc) mesh.scale.set(sc[0], sc[1], sc[2]);
      mesh.castShadow = true; mesh.receiveShadow = true; parent.add(mesh); if (name) parts[name] = mesh; return mesh;
    };
    const cap = (r, len) => new THREE.CapsuleGeometry(r, len, 4, 14);
    const sph = (r, ws, hs) => new THREE.SphereGeometry(r, ws || 20, hs || 14);
    const headSc = [1, 1.12, 1.02];

    /* ---------- trunk, neck, head (proportions of a 168 cm adult, scaled) ---------- */
    const hipY = cm(86), headR = cm(9.8);
    const hips = J("hips", obj, 0, hipY, 0);
    add("pelvis", cap(rad(11), cm(5)), cloth.bottom, hips, 0, cm(-2), 0, [1.35, 0.85, 0.95]);
    const torso = J("torso", hips, 0, cm(8), 0);                                 // waist pivot
    add("chest", cap(rad(11), cm(22)), cloth.top, torso, 0, cm(20), 0, [1.45, 1, 0.82]);   // waist to the shoulders
    add(null, new THREE.CylinderGeometry(rad(4.6), rad(5), cm(8), 12), skin, torso, 0, cm(46), 0);  // neck
    const head = J("head", torso, 0, cm(49), 0);
    const hc = { x: 0, y: cm(10.5), z: cm(0.5) };                                 // head centre, in the head joint's space
    add("head", sph(headR, 28, 20), skin, head, hc.x, hc.y, hc.z, headSc);
    const face = (geo, m, x, y, z, sc) => add(null, geo, m, head, hc.x + x, hc.y + y, hc.z + z, sc);

    /* ---------- face ---------- */
    const eyeWhite = mat("#f4f1ec", 0.35), iris = mat(c.eyes, 0.3), pupil = mat("#101010", 0.3);
    const eyes = [-1, 1].map(sd => {
      const g = new THREE.Group(); g.position.set(hc.x + sd * cm(3.5), hc.y + cm(1.6), hc.z + headR * 0.86); head.add(g);
      add(null, sph(cm(1.55), 14, 10), eyeWhite, g, 0, 0, 0, [1, 0.85, 0.55]);
      add(null, sph(cm(0.85), 12, 8), iris, g, 0, 0, cm(0.95), [1, 1, 0.5]);
      add(null, sph(cm(0.4), 8, 6), pupil, g, 0, 0, cm(1.3), [1, 1, 0.5]);
      return g;
    });
    [-1, 1].forEach(sd => {                                                       // brows
      const br = face(new THREE.BoxGeometry(cm(4.2), cm(0.7), cm(0.8)), hairM, sd * cm(3.5), cm(4.3), headR * 0.9);
      br.rotation.z = -sd * 0.12; br.rotation.x = -0.3;
    });
    face(sph(cm(1.3), 12, 8), skin, 0, cm(-0.6), headR * 0.98, [0.75, 1.25, 0.9]);                 // nose
    face(new THREE.BoxGeometry(cm(3.8), cm(0.7), cm(0.5)), mat("#9b5f55", 0.8), 0, cm(-4.6), headR * 0.9); // mouth
    [-1, 1].forEach(sd => face(sph(cm(1.9), 10, 8), skin, sd * headR, cm(0.2), 0, [0.45, 1, 0.75]));    // ears
    // hair: a crown cap all round, then sides and back down to the nape, leaving the face open
    const curly = c.hair.style === "curly", long = c.hair.style === "long";
    const hr = headR + cm(curly ? 2.2 : 0.7);
    face(new THREE.SphereGeometry(hr, 28, 12, 0, Math.PI * 2, 0, Math.PI * (curly ? 0.5 : 0.46)), hairM, 0, cm(curly ? 1.2 : 0.3), 0, headSc);
    face(new THREE.SphereGeometry(hr, 28, 10, Math.PI * 0.8, Math.PI * 1.4, Math.PI * 0.4, Math.PI * (long ? 0.5 : 0.36)), hairM, 0, cm(0.3), 0, headSc);
    if (curly) {                                                                   // curls: small bumps over the crown and sides
      const r = (i) => ((i * 7919) % 1000) / 1000;
      for (let i = 0; i < 26; i++) {
        const th = 0.12 + r(i) * 0.5, ph = r(i + 40) * Math.PI * 2;
        if (th > 0.42 && Math.sin(ph) > 0.35) continue;                            // not over the face
        const x = Math.sin(th * Math.PI) * Math.cos(ph) * hr, y = Math.cos(th * Math.PI) * hr * 1.12, z = Math.sin(th * Math.PI) * Math.sin(ph) * hr;
        face(sph(cm(1.9 + r(i + 80) * 1.3), 10, 8), hairM, x, y + cm(1.2), z);
      }
    }
    if (long) {                                                                    // long wavy hair with lighter ends
      const len = cm(c.hair.length || 24), tips = c.hair.tips ? mat(c.hair.tips, 0.62) : hairM;
      const fall = add(null, cap(cm(6.5), len - cm(8)), hairM, head, 0, hc.y - len / 2 + cm(1), hc.z - cm(6.5), [1.55, 1, 0.5]);   // down the back
      fall.rotation.x = -0.04;
      add(null, cap(cm(6.2), cm(8)), tips, head, 0, hc.y - len + cm(2), hc.z - cm(6), [1.5, 1, 0.5]);                             // ends
      [-1, 1].forEach(sd => {                                                      // strands in front of the shoulders
        const l2 = len * 0.62;
        add(null, cap(cm(2.6), l2 - cm(6)), hairM, head, sd * cm(8.4), hc.y - l2 / 2 - cm(2), hc.z + cm(2.5), [1, 1, 0.9]);
        add(null, cap(cm(2.5), cm(6)), tips, head, sd * cm(8.4), hc.y - l2 - cm(1), hc.z + cm(2.5), [1, 1, 0.9]);
        const wave = add(null, cap(cm(1.6), cm(10)), hairM, head, sd * cm(10.5), hc.y - cm(6), hc.z - cm(1), [1, 1, 0.9]);        // a loose wave by the ear
        wave.rotation.z = sd * 0.25;
      });
    }
    if (c.beard) {
      const beardM = mat(c.beard, 0.85);
      face(new THREE.SphereGeometry(headR + cm(0.6), 24, 10, Math.PI * 0.1, Math.PI * 0.8, Math.PI * 0.64, Math.PI * 0.32), beardM, 0, cm(-0.2), 0, headSc);
      face(new THREE.BoxGeometry(cm(4.6), cm(1.1), cm(0.9)), beardM, 0, cm(-3.2), headR * 0.93, [1, 1, 1]).rotation.x = -0.2;    // moustache
    }
    if (c.necklace) {                                                              // thin chain at the base of the neck
      const chain = add(null, new THREE.TorusGeometry(rad(5.4), cm(0.22), 6, 32), std({ color: c.necklace, roughness: 0.35, metalness: 0.4 }), torso, 0, cm(43), cm(1));
      chain.rotation.x = Math.PI / 2 + 0.25;
    }
    if (c.glasses) {                                                               // round frames
      const gm = mat("#3a2a1e", 0.4);
      [-1, 1].forEach(sd => face(new THREE.TorusGeometry(cm(3.4), cm(0.28), 6, 24), gm, sd * cm(3.6), cm(1.6), headR * 0.98));
      face(new THREE.BoxGeometry(cm(1.6), cm(0.3), cm(0.3)), gm, 0, cm(2), headR);
      [-1, 1].forEach(sd => face(new THREE.BoxGeometry(cm(0.3), cm(0.3), cm(10)), gm, sd * cm(7), cm(2.2), headR * 0.55));
    }

    /* ---------- arms and legs ---------- */
    let tattooMat = null;
    if (c.tattoo) {                                                                // a stem with a flower and two leaves, line-drawn
      const cv = document.createElement("canvas"); cv.width = 256; cv.height = 256;
      const g = cv.getContext("2d"); g.clearRect(0, 0, 256, 256);
      g.strokeStyle = c.tattoo; g.lineWidth = 2.2; g.lineCap = "round";
      g.beginPath(); g.moveTo(128, 200); g.bezierCurveTo(132, 160, 118, 130, 126, 92); g.stroke();
      g.beginPath(); g.moveTo(126, 92); g.bezierCurveTo(110, 80, 112, 56, 128, 50); g.bezierCurveTo(144, 56, 146, 80, 126, 92); g.stroke();
      g.beginPath(); g.moveTo(129, 150); g.bezierCurveTo(150, 148, 160, 132, 156, 118); g.bezierCurveTo(140, 124, 132, 136, 129, 150); g.stroke();
      g.beginPath(); g.moveTo(125, 172); g.bezierCurveTo(104, 168, 96, 150, 100, 138); g.bezierCurveTo(114, 146, 122, 158, 125, 172); g.stroke();
      const tex = new THREE.CanvasTexture(cv); tex.encoding = THREE.sRGBEncoding;
      tattooMat = new THREE.MeshStandardMaterial({ map: tex, transparent: true, roughness: 0.75, polygonOffset: true, polygonOffsetFactor: -1 });
    }
    [-1, 1].forEach(sd => {
      const L = sd < 0 ? "L" : "R";
      const ua = J("uArm" + L, torso, sd * rad(17.5), cm(44), 0);
      add("uArm" + L, cap(rad(4.8), cm(22)), cloth.top, ua, 0, cm(-15), 0);
      if (tattooMat && L === "L") add(null, cap(rad(4.85), cm(22)), tattooMat, ua, 0, cm(-15), 0).rotation.y = -Math.PI * 0.55;   // outer side of the left arm
      const la = J("lArm" + L, ua, 0, cm(-30), 0);
      add("lArm" + L, cap(rad(4), cm(16)), skin, la, 0, cm(-11), 0);
      add("hand" + L, cap(cm(3), cm(6)), skin, la, 0, cm(-25), 0, [1, 1, 0.55]);
      const ul = J("uLeg" + L, hips, sd * rad(9), 0, 0);
      add("uLeg" + L, cap(rad(7.6), cm(24)), cloth.bottom, ul, 0, cm(-19.5), 0);
      const ll = J("lLeg" + L, ul, 0, cm(-39), 0);
      add("lLeg" + L, cap(rad(5.4), cm(27)), cloth.bottom, ll, 0, cm(-20), 0);
      const ft = J("foot" + L, ll, 0, cm(-40), 0);
      add("foot" + L, cap(cm(4.6), cm(15)), cloth.shoes, ft, 0, cm(-3.2), cm(5.5), [1.05, 1, 0.72]).rotation.x = Math.PI / 2;
    });

    /* ---------- selection ring, click target, name label ---------- */
    const ring = new THREE.Mesh(new THREE.TorusGeometry(cm(26), 0.8, 8, 48), new THREE.MeshBasicMaterial({ color: "#1d4ed8", transparent: true, opacity: 0.9 }));
    ring.rotation.x = Math.PI / 2; ring.position.y = 0.8; ring.visible = false; obj.add(ring);
    const hit = new THREE.Mesh(cap(cm(20), cm(c.height - 50)), new THREE.MeshBasicMaterial());
    hit.position.y = cm(c.height) / 2 + 2; hit.layers.set(1); hit.userData.person = key; obj.add(hit);  // layer 1: raycast only, never drawn
    const label = document.createElement("div"); label.className = "plab"; label.textContent = c.name; label.dataset.key = key;
    // props, held in the right hand (hidden until an activity shows one)
    const handR = joints.lArmR;
    const props = {
      cup: add(null, new THREE.CylinderGeometry(cm(3.4), cm(2.8), cm(8.5), 18), mat("#f4f1ea", 0.4), handR, cm(0.5), cm(-27), cm(4)),
      book: add(null, new THREE.BoxGeometry(cm(13), cm(19), cm(2)), mat("#8a5a3c", 0.8), handR, cm(-5), cm(-26), cm(6)),
      phone: add(null, new THREE.BoxGeometry(cm(7), cm(14), cm(0.8)), mat("#1b1b1f", 0.35), handR, 0, cm(-27), cm(4)),
    };
    props.book.rotation.set(0.9, 0, 0); props.phone.rotation.set(0.5, 0, 0);
    Object.values(props).forEach(m => { m.visible = false; });

    const p = {
      key, cfg: c, obj, joints, parts, ring, hit, label, props,
      pos: { x: c.start.x, z: c.start.z }, y: 0, yaw: c.start.yaw, state: "idle", speed: 0, outfit: "home", wear: "home",
      pose: null, carry: false, eyesClosed: false,
      v: (m, f) => c.gender === "m" ? m : f,          // Hebrew verb form for this person
      showProp(name) { Object.keys(props).forEach(k => { props[k].visible = k === name; }); },
    };

    function setOutfit(name) {
      const o = c.outfits[name] || c.outfits.home;
      p.outfit = name;
      const top = o.top ? (cloth.top.color.set(o.top), cloth.top) : skin;
      const bottom = o.bottom ? (cloth.bottom.color.set(o.bottom), cloth.bottom) : skin;
      parts.chest.material = top; parts.pelvis.material = bottom;
      ["L", "R"].forEach(sd => {
        parts["uArm" + sd].material = o.sleeves === "none" ? skin : top;
        parts["lArm" + sd].material = o.sleeves === "long" ? top : skin;
        parts["uLeg" + sd].material = bottom;
        parts["lLeg" + sd].material = o.legs === "long" ? bottom : skin;
        parts["foot" + sd].material = o.shoes ? (cloth.shoes.color.set(o.shoes), cloth.shoes) : skin;
      });
    }
    setOutfit("home");

    /* ---------- animation: targets per joint, eased towards each frame ---------- */
    const T = {};
    const set = (n, x, y, z) => { T[n] = [x, y, z]; };
    let phase = 0, blinkT = 2 + Math.random() * 3, blinkLeft = 0, hipLift = 0;
    const t0 = Math.random() * 10;

    // Poses for activities. Each gets (t seconds, options, breathing) and sets joint targets; it returns the hip
    // joint height in world cm when the body is not standing (sitting: seat height; lying: mattress top).
    // Joint angles: rotation.x negative = the limb swings forward; positive on a lower leg = the knee bends.
    const POSE = {
      sit(t, o, br) {
        set("hips", 0, 0, 0); set("torso", 0.06 + (o.lean || 0) + br * 0.012, 0, 0); set("head", -0.04 + (o.headDown || 0), o.headYaw || 0, 0);
        set("uLegL", -1.5, 0, 0.1); set("uLegR", -1.5, 0, -0.1); set("lLegL", 1.35, 0, 0); set("lLegR", 1.35, 0, 0); set("footL", 0.15, 0, 0); set("footR", 0.15, 0, 0);
        set("uArmL", -0.35, 0, 0.12); set("uArmR", -0.35, 0, -0.12); set("lArmL", -0.9, 0, 0); set("lArmR", -0.9, 0, 0);   // hands on the thighs
        return { hipsY: o.seat + 5 };
      },
      lie(t, o, br) {
        set("hips", -Math.PI / 2, 0, 0); set("torso", 0.05 + br * 0.015, 0, 0); set("head", 0.12, 0.2 * Math.sin(t * 0.1), 0);
        set("uLegL", 0.05, 0, 0.06); set("uLegR", 0.05, 0, -0.06); set("lLegL", 0.1, 0, 0); set("lLegR", 0.1, 0, 0); set("footL", -0.3, 0, 0); set("footR", -0.3, 0, 0);
        set("uArmL", 0.15, 0, 0.25); set("uArmR", 0.15, 0, -0.25); set("lArmL", -0.3, 0, 0); set("lArmR", -0.3, 0, 0);
        return { hipsY: o.y + 11 };
      },
      type(t, o, br) {
        POSE.sit(t, o, br); set("torso", 0.18 + br * 0.01, 0, 0); set("head", 0.05, 0, 0);
        const tap = (ph) => 0.06 * Math.max(0, Math.sin(t * 9 + ph));
        set("uArmL", -0.85, 0, 0.1); set("uArmR", -0.85, 0, -0.1); set("lArmL", -0.55 - tap(0), 0.12, 0); set("lArmR", -0.55 - tap(1.7), -0.12, 0);
        return { hipsY: o.seat + 5 };
      },
      drink(t, o, br) {
        POSE.sit(t, o, br);
        const up = Math.max(0, Math.min(1, (Math.sin(t * 0.7) - 0.55) * 4));             // the cup comes up every ~9 s
        set("uArmR", -0.5 - 0.3 * up, 0, -0.15); set("lArmR", -1.1 - 1.2 * up, 0.35 * up, 0); set("head", -0.04 - 0.12 * up, 0, 0);
        set("uArmL", -0.3, 0, 0.12); set("lArmL", -0.8, 0, 0);
        return { hipsY: o.seat + 5 };
      },
      read(t, o, br) {
        POSE.sit(t, o, br); set("torso", 0.12 + br * 0.012, 0, 0); set("head", 0.38, 0.03 * Math.sin(t * 0.5), 0);
        set("uArmL", -0.55, 0, 0.1); set("uArmR", -0.55, 0, -0.1); set("lArmL", -1.75, 0.3, 0); set("lArmR", -1.75, -0.3, 0);
        return { hipsY: o.seat + 5 };
      },
      toilet(t, o, br) {
        POSE.sit(t, o, br); set("torso", 0.3 + br * 0.012, 0, 0); set("head", 0.1, 0, 0);
        set("uLegL", -1.45, 0, 0.18); set("uLegR", -1.45, 0, -0.18);
        set("uArmL", -1.0, 0, 0.15); set("uArmR", -1.0, 0, -0.15); set("lArmL", -1.1, 0, 0); set("lArmR", -1.1, 0, 0);   // elbows on the knees
        return { hipsY: o.seat + 5 };
      },
      phone(t, o, br) {
        set("uArmR", -0.35, 0, -0.1); set("lArmR", -2.25, 0.25, 0); set("head", 0.45, 0, 0); set("torso", 0.08 + br * 0.012, 0, 0);
      },
      shower(t, o, br) {
        const w = 0.5 + 0.5 * Math.sin(t * 0.45);                                           // hair ↔ shoulders
        set("head", 0.1 - 0.25 * w, 0, 0); set("torso", 0.02 + br * 0.012, 0, 0);
        set("uArmL", -2.6 + 1.2 * w, 0, 0.45); set("uArmR", -2.5 + 1.2 * w, 0, -0.4);
        set("lArmL", -1.9 + 0.2 * Math.sin(t * 5), 0.3, 0); set("lArmR", -1.8 + 0.2 * Math.sin(t * 5 + 1.5), -0.3, 0);
      },
      wash(t, o, br) {
        set("torso", 0.3 + br * 0.012, 0, 0); set("head", 0.3, 0, 0);
        set("uArmL", -0.95, 0, 0.15); set("uArmR", -0.95, 0, -0.15);
        set("lArmL", -0.9 + 0.1 * Math.sin(t * 7), 0.35, 0); set("lArmR", -0.9 - 0.1 * Math.sin(t * 7), -0.35, 0);
      },
      press(t, o, br) {                                                                      // working the coffee machine
        set("head", 0.22, 0, 0); set("torso", 0.1 + br * 0.012, 0, 0);
        set("uArmR", -1.05, 0, -0.1); set("lArmR", -0.5 + 0.08 * Math.sin(t * 4), 0, 0);
      },
      hold(t, o, br) {                                                                       // standing with a cup
        set("uArmR", -0.3, 0, -0.1); set("lArmR", -1.65, 0.2, 0); set("torso", 0.03 + br * 0.012, 0, 0);
      },
      dress(t, o, br) {
        set("head", 0.12, 0, 0); set("torso", 0.08 + br * 0.012, 0, 0);
        set("uArmL", -1.0 + 0.3 * Math.sin(t * 2), 0, 0.2); set("lArmL", -1.2, 0.2, 0);
        set("uArmR", -1.0 - 0.3 * Math.sin(t * 2), 0, -0.2); set("lArmR", -1.2, -0.2, 0);
      },
      hug(t, o, br) {
        set("torso", 0.14 + br * 0.012, 0, 0); set("head", 0.12, 0, 0.14);
        set("uArmL", -1.3, 0.35, 0.3); set("uArmR", -1.3, -0.35, -0.3); set("lArmL", -0.5, 0.9, 0); set("lArmR", -0.5, -0.9, 0);
      },
      talk(t, o, br) {
        const ph = o.phase || 0;
        set("head", 0.03 + 0.05 * Math.sin(t * 1.7 + ph), 0.08 * Math.sin(t * 0.6 + ph), 0.03 * Math.sin(t * 0.9));
        set("torso", 0.03 + br * 0.012, 0.03 * Math.sin(t * 0.4 + ph), 0);
        set("uArmR", -0.35 + 0.2 * Math.sin(t * 1.3 + ph), 0, -0.15); set("lArmR", -1.2 + 0.35 * Math.sin(t * 1.9 + ph), -0.2, 0);
        set("uArmL", 0.05, 0, 0.12); set("lArmL", -0.5 + 0.15 * Math.sin(t * 1.1 + ph), 0, 0);
      },
    };
    // while carrying a cup the right arm does not swing
    const carryArm = () => { set("uArmR", -0.3, 0, -0.1); set("lArmR", -1.65, 0.2, 0); };
    function animate(now, dt) {
      const t = now / 1000 + t0;
      // standing: arms hanging, breathing, slow weight shifts and small head movements
      const br = Math.sin(t * 2 * Math.PI * 0.22);
      set("hips", 0, 0, 0.012 * Math.sin(t * 0.37));
      set("torso", 0.02 + br * 0.012, 0, -0.012 * Math.sin(t * 0.37));
      set("head", -0.03 + br * 0.01 + 0.04 * Math.sin(t * 0.7), 0.12 * Math.sin(t * 0.31), 0.02 * Math.sin(t * 0.47));
      set("uArmL", 0.04, 0, 0.1); set("uArmR", 0.04, 0, -0.1); set("lArmL", -0.18, 0, 0); set("lArmR", -0.18, 0, 0);
      set("uLegL", 0, 0, 0.03); set("uLegR", 0, 0, -0.03); set("lLegL", 0, 0, 0); set("lLegR", 0, 0, 0); set("footL", 0, 0, 0); set("footR", 0, 0, 0);
      hipLift = 0;
      if (p.state === "walk" && p.speed > 1) {
        const stride = cm(64);                                   // one step; the phase advances π per step
        phase += dt * p.speed / stride * Math.PI;
        const a = Math.min(1, p.speed / cm(95));                 // amplitude follows the speed
        const s1 = Math.sin(phase), c1 = Math.cos(phase);
        const thighL = -0.42 * a * s1, thighR = 0.42 * a * s1;   // negative = forward (≈ ±24°, an easy indoor stride)
        const kneeL = 0.95 * a * Math.max(0, Math.cos(phase + 0.45)), kneeR = 0.95 * a * Math.max(0, Math.cos(phase + Math.PI + 0.45));
        set("uLegL", thighL, 0, 0.03); set("uLegR", thighR, 0, -0.03);
        set("lLegL", kneeL, 0, 0); set("lLegR", kneeR, 0, 0);
        set("footL", -(thighL + kneeL) * 0.6, 0, 0); set("footR", -(thighR + kneeR) * 0.6, 0, 0);
        set("uArmL", 0.33 * a * s1, 0, 0.08); set("uArmR", -0.33 * a * s1, 0, -0.08);   // arms swing against the legs
        set("lArmL", -0.25 - 0.25 * a * Math.max(0, -s1), 0, 0); set("lArmR", -0.25 - 0.25 * a * Math.max(0, s1), 0, 0);
        set("hips", 0, -0.06 * a * s1, 0.02 * a * c1); set("torso", 0.06 * a, 0.08 * a * s1, 0); set("head", -0.03, -0.02 * a * s1, 0);
        hipLift = -1.3 * a * (1 - Math.cos(2 * phase)) / 2;     // lowest when both feet are down
        if (p.carry) carryArm();
      } else if (p.pose) {
        const r = POSE[p.pose.name](t, p.pose, br);
        if (r && r.hipsY !== undefined) hipLift = r.hipsY - hipY;
      } else if (p.carry) carryArm();
      const k = Math.min(1, dt * 14);
      JOINTS.forEach(n => {
        const j = joints[n], r = T[n];
        j.rotation.x += (r[0] - j.rotation.x) * k; j.rotation.y += (r[1] - j.rotation.y) * k; j.rotation.z += (r[2] - j.rotation.z) * k;
      });
      joints.hips.position.y += (hipY + hipLift - joints.hips.position.y) * k;
      // blink every few seconds
      blinkT -= dt;
      if (blinkT <= 0) { blinkLeft = 0.14; blinkT = 2.5 + Math.random() * 4; }
      if (blinkLeft > 0) blinkLeft -= dt;
      const open = blinkLeft > 0 || p.eyesClosed ? 0.12 : 1;
      eyes.forEach(e => { e.scale.y += (open - e.scale.y) * Math.min(1, dt * 30); });
      // selection ring: slow turn and a faint pulse
      ring.rotation.z += dt * 0.8; const pulse = 1 + 0.03 * Math.sin(t * 3); ring.scale.set(pulse, pulse, 1);
      obj.position.set(p.pos.x - CX, p.y, p.pos.z - CZ); obj.rotation.y = p.yaw;
    }

    Object.assign(p, { setOutfit, animate });
    animate(0, 0);
    return p;
  }

  Object.assign(B, { PEOPLE, makePerson });
})(window.B);
