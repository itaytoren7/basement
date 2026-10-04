/* furniture.js — furniture from the designer's layout, the kitchenette and the wardrobe options.
 * Positions are plan coordinates in cm, read off the drawing.
 * Exposes: B.buildKitchen(L), B.buildWardrobe(key), B.WARDS, B.WX, B.SOFA
 */
(function (B) {
  "use strict";
  if (B.failed) return;
  const { CX, CZ, M, std, root, box, lbox, cyl, doors } = B;

  // Upholstered box with faces that bulge outward (cushions, sofa arms, throw pillows).
  // w/h/d along x/y/z; `puff` = bulge in cm at the middle of each face, a number or [x, y, z].
  function softMesh(w, h, d, puff, mat) {
    const g = new THREE.BoxGeometry(w, h, d, 8, 6, 8);
    const pos = g.attributes.position, half = [w / 2, h / 2, d / 2];
    const pf = Array.isArray(puff) ? puff : [puff, puff, puff];
    for (let i = 0; i < pos.count; i++) {
      const c = [pos.getX(i), pos.getY(i), pos.getZ(i)], n = c.map((v, k) => v / half[k]);
      const k = n.reduce((best, v, j) => Math.abs(v) > Math.abs(n[best]) ? j : best, 0); // which face
      const [a, b] = [0, 1, 2].filter(j => j !== k);
      c[k] += Math.sign(n[k]) * pf[k] * (1 - n[a] * n[a]) * (1 - n[b] * n[b]);
      pos.setXYZ(i, c[0], c[1], c[2]);
    }
    g.computeVertexNormals();
    const m = new THREE.Mesh(g, mat);
    m.castShadow = true; m.receiveShadow = true;
    return m;
  }
  // Axis-aligned upholstered box in plan coordinates.
  function soft(x0, x1, z0, z1, y0, y1, puff, mat) {
    const m = softMesh(x1 - x0, y1 - y0, z1 - z0, puff, mat);
    m.position.set((x0 + x1) / 2 - CX, (y0 + y1) / 2, (z0 + z1) / 2 - CZ);
    root.add(m); return m;
  }

  /* ---------- fixed furniture ---------- */
  // bed 140×200, headboard against the west wall under the window
  box(20, 220, 80, 220, 4, 32, M.bedBase);
  box(20, 27, 80, 220, 4, 108, M.bedBase);
  box(27, 218, 82, 218, 32, 54, M.mattress);
  box(62, 219, 81, 219, 54, 58, M.duvet);
  box(62, 84, 80.5, 219.5, 57, 61, M.pillow);
  box(30, 58, 90, 146, 53, 66, M.pillow);
  box(30, 58, 154, 210, 53, 66, M.pillow);
  [[80, 86], [214, 220]].forEach(z => [[22, 28], [212, 218]].forEach(x => box(x[0], x[1], z[0], z[1], 0, 4, M.black)));
  // nightstands: IKEA STORKLINTA chest of 2 drawers, oak effect, 40 W × 50 D × 53 H, 4 cm from the bed on each side.
  // Two flat drawers facing east, a finger-grip gap above each (no handles), a top that overhangs ~1 cm, a low plinth.
  // The BLÅSVERK lamp on the south one is in lights.js.
  const gripShadow = std({ color: "#3a2b1d", roughness: 1 });
  [[36, 76], [224, 264]].forEach(([z0, z1]) => {
    box(22, 64, z0 + 3, z1 - 3, 0, 5, gripShadow);                    // recessed plinth
    box(20, 67.5, z0 + 1, z1 - 1, 5, 50.5, M.oak);                    // carcass
    box(20, 70, z0, z1, 50.5, 53, M.oak);                             // top
    [[5.5, 25.5], [28, 48]].forEach(([y0, y1]) => {
      box(67.5, 69, z0 + 1.3, z1 - 1.3, y0, y1, M.oak);               // drawer front
      box(66.8, 67.6, z0 + 1.3, z1 - 1.3, y1, y1 + 2.5, gripShadow);  // finger-grip gap above it
    });
  });
  // rug: IKEA LOKALTÅG 133 × 195, short pile, beige/grey (texture in materials.js)
  box(163, 296, 56.5, 251.5, 0, 1, [M.rugEdge, M.rugEdge, M.rug, M.rugEdge, M.rugEdge, M.rugEdge], root, { noCast: true });
  // Enlarged desk, centred on the east wall segment between the entry door and north wall
  box(399, 464, 80, 260, 72, 75, M.oak);
  [[401, 405], [458, 462]].forEach(x => [[82, 86], [254, 258]].forEach(z => box(x[0], x[1], z[0], z[1], 0, 72, M.black)));

  // A compact, organized workstation across the long desk top.
  const deskBlack = std({ color: "#202329", roughness: 0.42 });
  const screenMat = new THREE.MeshBasicMaterial({ color: "#172537" });
  const glassMat = new THREE.MeshStandardMaterial({ color: "#a9c2ce", roughness: 0.22, metalness: 0.12 });
  const screenOnWestFace = (x, y, z, w, h, material) => {
    const screen = new THREE.Mesh(new THREE.PlaneGeometry(w, h), material);
    screen.rotation.y = -Math.PI / 2; // face the chair, westward
    screen.position.set(x - CX, y, z - CZ); root.add(screen);
    return screen;
  };

  // Monitor, stand and broad foot at the back of the desk.
  box(438, 460, 151, 189, 76, 78, deskBlack);
  box(452, 456, 167, 173, 78, 101, M.steel);
  box(455, 460, 146, 194, 98, 128, deskBlack);
  screenOnWestFace(454.7, 113, 170, 43, 26, screenMat);
  box(454.6, 454.9, 157, 183, 99, 101, M.steel); // lower bezel accent

  // Laptop lifted on a metal stand, to the left of the main monitor.
  box(422, 451, 97, 132, 77, 79, M.steel);           // stand foot
  box(442, 445, 99, 103, 79, 87, M.steel);           // stand supports
  box(422, 445, 100, 129, 85, 88, deskBlack);        // keyboard deck
  for (let row = 0; row < 3; row++) for (let key = 0; key < 7; key++) {
    const x = 425 + row * 5, z = 102 + key * 3.5;
    box(x, x + 3.2, z, z + 2.5, 88.2, 88.7, M.steel);
  }
  box(443, 446, 101, 128, 88, 110, deskBlack);       // raised laptop display
  screenOnWestFace(442.8, 99, 114.5, 24, 18, screenMat);
  box(442.7, 443, 108, 121, 88.2, 89.2, M.steel);

  // Tablet on an angled stand at the far end of the desk.
  box(431, 455, 217, 243, 77, 79, deskBlack);
  box(438, 446, 220, 240, 79, 94, M.steel);
  box(446, 449, 220, 240, 87, 115, deskBlack);
  screenOnWestFace(445.7, 101, 230, 18, 26, screenMat);

  // Open notebook and pen, kept in the clear front-left writing area.
  box(401, 420, 142, 176, 75.3, 76.2, M.oakLight);
  box(402, 410, 143, 175, 76.2, 76.6, M.whiteGloss);
  box(411, 419, 143, 175, 76.2, 76.6, M.whiteGloss);
  box(410, 411, 143, 175, 76.6, 77, M.groove);        // notebook spine
  box(404, 417, 158.5, 159.2, 77, 77.8, M.black);     // pen on the page

  // Phone on a small angled stand.
  box(402, 415, 92, 111, 75.5, 77, deskBlack);
  box(410, 414, 96, 107, 77, 89, M.steel);
  box(411, 413, 96, 107, 79, 94, deskBlack);
  screenOnWestFace(410.7, 86.5, 101.5, 7.5, 13, screenMat);

  // Pen cup, candle and reed diffuser, arranged along the open front edge.
  cyl(5, 12, 408, 81, 244, M.oakLight);
  [
    [405.5, 244, 1.8], [408, 242.5, 2.8], [410.5, 245, 1.2], [412, 243, 2.2],
  ].forEach(([x, z, h]) => {
    const pen = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 12 + h, 10), M.black);
    pen.position.set(x - CX, 87 + h / 2, z - CZ); root.add(pen);
  });
  cyl(4.5, 9, 408, 79.5, 188, M.whiteGloss);          // candle body
  cyl(0.45, 2, 408, 85, 188, M.black);                // wick
  const flame = new THREE.Mesh(new THREE.SphereGeometry(1.5, 12, 10), std({ color: "#f5a33b", emissive: "#c45a14", emissiveIntensity: 0.45 }));
  flame.scale.y = 1.8; flame.position.set(408 - CX, 87, 188 - CZ); root.add(flame);
  const diffuser = new THREE.Mesh(new THREE.CylinderGeometry(3.8, 4.4, 10, 18), glassMat);
  diffuser.position.set(408 - CX, 80, 211 - CZ); root.add(diffuser);
  [
    [405, 210, -0.14], [407, 211, 0.08], [409, 210, -0.05], [411, 212, 0.16], [413, 210, -0.1],
  ].forEach(([x, z, lean]) => {
    const reed = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 15, 8), M.oak);
    reed.position.set(x - CX, 91, z - CZ); reed.rotation.z = lean; root.add(reed);
  });

  // Compact stereo pair beside the monitor, with drivers aimed toward the chair.
  [[140, 0], [200, 1]].forEach(([z, side]) => {
    box(448, 461, z - 6, z + 6, 78, 97, deskBlack);
    const woofer = new THREE.Mesh(new THREE.CylinderGeometry(3.2, 3.2, 1, 20), M.black);
    woofer.rotation.z = Math.PI / 2; woofer.position.set(447.3 - CX, 86, z - CZ); root.add(woofer);
    const tweeter = new THREE.Mesh(new THREE.CylinderGeometry(1.35, 1.35, 1, 16), M.steel);
    tweeter.rotation.z = Math.PI / 2; tweeter.position.set(447.2 - CX, 93, z - CZ); root.add(tweeter);
  });

  // Subwoofer on the floor beneath the desk, tucked between the desk legs.
  box(430, 454, 211, 241, 4, 36, deskBlack);
  const subDriver = new THREE.Mesh(new THREE.CylinderGeometry(7, 7, 1.5, 28), M.black);
  subDriver.rotation.z = Math.PI / 2; subDriver.position.set(429.2 - CX, 21, 226 - CZ); root.add(subDriver);
  const subPort = new THREE.Mesh(new THREE.CylinderGeometry(2, 2, 1.5, 20), M.steel);
  subPort.rotation.z = Math.PI / 2; subPort.position.set(429.1 - CX, 9, 226 - CZ); root.add(subPort);

  box(357, 391, 150, 190, 43, 47, M.fabric2);
  box(355, 359, 150, 190, 47, 86, M.fabric2);
  [[357, 360], [388, 391]].forEach(x => [[151, 154], [186, 189]].forEach(z => box(x[0], x[1], z[0], z[1], 0, 43, M.black)));
  // air conditioner on the north wall (x 203–298, 186–214 high)
  box(203, 298, 20, 40, 186, 214, M.ac);
  box(206, 295, 39.6, 40.2, 188, 192, M.groove);
  // armchair (faces east) + coffee table
  box(132, 208, 298, 383, 6, 40, M.armchair);
  box(132, 147, 298, 383, 40, 86, M.armchair);
  box(147, 208, 298, 310, 40, 60, M.armchair);
  box(147, 208, 371, 383, 40, 60, M.armchair);
  box(147, 206, 310, 371, 40, 47, M.armchairSeat);
  box(366, 442, 298, 383, 6, 40, M.armchair);
  box(427, 442, 298, 383, 40, 86, M.armchair);
  box(366, 427, 298, 310, 40, 60, M.armchair);
  box(366, 427, 371, 383, 40, 60, M.armchair);
  box(368, 425, 310, 371, 40, 47, M.armchairSeat);
  box(247, 327, 307, 382, 40, 43, M.darkOak);                          // coffee table top: dark oak
  [[250, 253], [321, 324]].forEach(x => [[310, 313], [376, 379]].forEach(z => box(x[0], x[1], z[0], z[1], 0, 40, M.black)));
  /* ---------- sofa: IKEA KIVIK 3-seat, 228 × 95 × 83, Tibbleby beige/grey (faces north) ---------- */
  // Centred on x 276; front edge 40 cm from the armchairs / coffee table. Seat height 45, seat depth 60.
  const SOFA = { x0: 162, x1: 390, z0: 423, z1: 518, seatH: 45 };
  (function kivik() {
    const { x0, x1, z0, z1 } = SOFA, arm = 24, back = 20;
    const sx0 = x0 + arm, sx1 = x1 - arm, mid = (sx0 + sx1) / 2;      // seat 180 wide
    const backFront = z0 + 60;                                         // front of the back cushions at seat level
    [[x0 + 5, x0 + 9], [x1 - 9, x1 - 5]].forEach(x => [[z0 + 5, z0 + 9], [z1 - 9, z1 - 5]].forEach(z => box(x[0], x[1], z[0], z[1], 0, 3, M.black)));
    soft(sx0, sx1, z0 + 1, z1 - back, 3, 30, 0.6, M.kivik);           // base under the seat cushions
    soft(x0, sx0, z0, z1, 3, 64, [0.8, 1.2, 0.8], M.kivik);            // wide, low, boxy arms
    soft(sx1, x1, z0, z1, 3, 64, [0.8, 1.2, 0.8], M.kivik);
    soft(sx0, sx1, z1 - back, z1, 3, 70, [0.8, 1, 0.8], M.kivik);     // back frame
    [[sx0, mid], [mid, sx1]].forEach(([a, b]) => {
      soft(a + 0.4, b - 0.4, z0 + 1, z1 - back, 30, 45, [1, 1.6, 1], M.kivik); // 2 large seat cushions
      // 2 back cushions, leaning back 10°; bottom-front edge on the seat at backFront, top at 83
      const t = 0.1745, h = 38.5, d = 20;
      const c = softMesh(b - a - 1, h, d, [1, 1, 2.2], M.kivik);
      c.rotation.x = t;
      c.position.set((a + b) / 2 - CX, 45 + h / 2 * Math.cos(t) - d / 2 * Math.sin(t), backFront + h / 2 * Math.sin(t) + d / 2 * Math.cos(t) - CZ);
      root.add(c);
    });
    // 4 throw pillows (~50×50) leaning on the back cushions: navy behind at the outer ends, mustard in front of it
    [[sx0 + 27, M.navy, 0, -0.18], [sx0 + 54, M.mustard, 6, -0.08], [sx1 - 54, M.mustard, 6, 0.08], [sx1 - 27, M.navy, 0, 0.18]].forEach(([x, mat, fwd, yaw], i) => {
      const p = softMesh(48, 48, 3, [0.6, 0.6, 6], mat);              // thin edges, ~15 thick in the middle
      p.rotation.order = "YXZ";
      p.rotation.set(0.3, yaw, (i % 2 ? 0.04 : -0.04));
      p.position.set(x - CX, 45 + 23, backFront - 10 - fwd - CZ);
      root.add(p);
    });
  })();
  // built-in closet in the east alcove (73 × 153)
  box(476, 547, 485, 638, 0, 214, M.white);
  box(475.4, 476, 486, 637, 4, 212, M.white);
  box(475.2, 475.6, 561, 562, 6, 210, M.groove);
  box(474, 476, 548, 550, 95, 120, M.steel);
  box(474, 476, 573, 575, 95, 120, M.steel);

  /* ---------- kitchenette (compact, with coffee machine, sink, drying rack and upper cup storage) ---------- */
  const kitchen = new THREE.Group(); root.add(kitchen);
  function buildKitchen(L) {
    while (kitchen.children.length) { const c = kitchen.children[0]; kitchen.remove(c); c.geometry && c.geometry.dispose(); }
    const width = Math.max(110, Math.min(120, +L || 110));
    const x0 = 170, x1 = x0 + width, z0 = 578, z1 = 638;
    box(x0, x1, z0 + 6, z1, 0, 10, M.groove, kitchen);
    box(x0, x1, z0 + 2, z1, 10, 86, M.white, kitchen);
    box(x0, x1, z0, z1, 86, 90, M.counter, kitchen);
    const sinkX = x0 + width / 2;
    box(sinkX - 18, sinkX + 18, 592, 626, 90, 90.4, std({ color: "#8a8e93", roughness: 0.3, metalness: 0.6 }), kitchen);
    cyl(1.4, 28, sinkX, 104, 631, M.chrome, kitchen);
    box(sinkX - 1, sinkX + 1, 612, 631, 116, 118, M.chrome, kitchen);
    // Compact espresso machine on the counter, facing into the room (north)
    box(x0 + 12, x0 + 38, z0 + 18, z0 + 48, 90, 114, std({ color: "#292b2e", roughness: 0.55, metalness: 0.18 }), kitchen);
    box(x0 + 14, x0 + 36, z0 + 18, z0 + 19, 103, 111, M.steel, kitchen); // front control panel
    box(x0 + 18, x0 + 32, z0 + 17, z0 + 18, 107, 109, M.black, kitchen); // display
    [x0 + 16, x0 + 34].forEach(x => {
      const button = new THREE.Mesh(new THREE.CylinderGeometry(1.3, 1.3, 1, 12), M.chrome);
      button.rotation.x = Math.PI / 2; button.position.set(x - CX, 105, z0 + 17.3 - CZ); kitchen.add(button);
    });
    box(x0 + 17, x0 + 33, z0 + 25, z0 + 28, 114, 115, M.steel, kitchen); // warming tray
    const espressoCup = new THREE.Mesh(new THREE.CylinderGeometry(4, 3.5, 7, 20), M.whiteGloss);
    espressoCup.position.set(x0 + 25 - CX, 118.5, z0 + 34 - CZ); kitchen.add(espressoCup);
    box(x0 + 35, x0 + 37, z0 + 29, z0 + 31, 95, 107, M.steel, kitchen); // steam wand
    box(x0 + 48, x1 - 14, z0 + 18, z1 - 10, 90, 92, M.steel, kitchen); // drying rack
    box(x0 + 10, x1 - 10, z0 + 4, z1 - 4, 120, 122, M.oakLight, kitchen); // upper shelf
    const cupY = 126.5;
    const glassCols = ["#dff4ff", "#aee7ff", "#d7f0f5"];
    for (let i = 0; i < 3; i++) {
      const cx = x0 + 18 + i * 22;
      const cup = new THREE.Mesh(new THREE.CylinderGeometry(4.2, 4.2, 11, 20), std({ color: glassCols[i], transparent: true, opacity: 0.7, roughness: 0.2 }));
      cup.position.set(cx - CX, cupY, (z0 + 20 + i * 8) - CZ); kitchen.add(cup);
    }
    for (let i = 0; i < 3; i++) {
      const cx = x0 + 54 + i * 18;
      const cup = new THREE.Mesh(new THREE.CylinderGeometry(4.8, 4.8, 12, 20), std({ color: i % 2 ? "#d3b08c" : "#c3beb5", roughness: 0.6 }));
      cup.position.set(cx - CX, cupY, (z0 + 30 + i * 9) - CZ); kitchen.add(cup);
    }
  }

  /* ---------- wardrobe options (west wall, x 20–80, z 398–638, 240 wide) ---------- */
  const WARDS = {
    storklinta: { w: 249.8, z0: 388.2, d: 37.4, h: 201.2, type: "hinged", layout: "pax", sections: [100, 100, 49.8], doorsPer: [2, 2, 1], body: M.whiteOak, front: M.oakLight, shelves: M.oakLight, name: "IKEA PAX · התכנון של איתי" },
    hasvik:     { w: 240, d: 66, h: 201, type: "sliding", sections: [100, 100], body: M.whiteOak, front: M.whiteOak, shelves: M.white, name: "IKEA PAX / HASVIK" },
    harel:      { w: 240, d: 52.5, h: 213, type: "hinged", sections: [80, 40, 80], doorsPer: [2, 1, 2], drawers: 1, body: M.harelOak, front: M.harelOak, shelves: M.white, name: "הראל · גיל" },
    carp:       { w: 240, d: 60, h: 220, type: "hinged", sections: [120, 120], doorsPer: [2, 2], body: M.oakLight, front: M.oakLight, shelves: M.oakLight, name: "נגרות" },
  };
  // Selected (user): the same PAX as Itay's layout, with light-oak framed clear-glass doors so the interior shows.
  WARDS.paxglass = Object.assign({}, WARDS.storklinta, { glassDoors: true, name: "IKEA PAX · דלתות זכוכית" });
  const WZ0 = 398, WZ1 = 638, WX = 20;
  const wardrobe = new THREE.Group(); root.add(wardrobe);

  function buildWardrobe(key) {
    while (wardrobe.children.length) wardrobe.remove(wardrobe.children[0]);
    doors.splice(0, doors.length, ...doors.filter(d => !d.ward));
    const o = WARDS[key];
    const dc = o.type === "sliding" ? o.d - 8 : o.d - 2;   // carcass depth
    const xb = WX, xf = WX + dc;
    const h = o.h;
    const wz0 = o.z0 === undefined ? WZ0 : o.z0, wz1 = wz0 + (o.w || WZ1 - WZ0);
    box(xb, xb + 1.6, wz0, wz1, 0, h, o.body, wardrobe);                // back
    box(xb, xf, wz0, wz0 + 1.8, 0, h, o.body, wardrobe);                // sides
    box(xb, xf, wz1 - 1.8, wz1, 0, h, o.body, wardrobe);
    box(xb, xf, wz0, wz1, h - 1.8, h, o.body, wardrobe);                // top
    box(xb, xf, wz0, wz1, 0, 8, o.body, wardrobe);                      // plinth/bottom

    if (o.layout === "pax") {
      const [leftWidth, middleWidth, rightWidth] = o.sections;
      const div1 = wz0 + leftWidth, div2 = div1 + middleWidth;
      box(xb, xf, div1 - 1.2, div1 + 1.2, 8, h - 1.8, o.body, wardrobe);
      box(xb, xf, div2 - 1.2, div2 + 1.2, 8, h - 1.8, o.body, wardrobe);
      const shelf = (za, zb, y) => box(xb + 3, xf - 2, za + 2, zb - 2, y, y + 2, o.shelves, wardrobe);
      const rail = (za, zb, y) => {
        const r = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.2, zb - za - 8, 12), M.steel);
        r.rotation.x = Math.PI / 2; r.position.set((xb + xf) / 2 - CX, y, (za + zb) / 2 - CZ); wardrobe.add(r);
      };

      // Left bay: upper hanging space, four drawers below.
      shelf(wz0, div1, 176); rail(wz0, div1, 163);
      [14, 38, 62, 86].forEach((y, i) => {
        box(xf - 3.5, xf - 2, wz0 + 5, div1 - 5, y, y + 21, o.front, wardrobe);
        box(xf - 4, xf - 2.8, wz0 + 42, wz0 + 58, y + 9, y + 10.5, M.steel, wardrobe);
      });
      [0, 1, 2].forEach(i => {
        const color = ["#dce1e3", "#333b43", "#7890a2"][i];
        box(xf - 15, xf - 5, wz0 + 15 + i * 23, wz0 + 30 + i * 23, 112, 155 - i * 6, std({ color, roughness: 1 }), wardrobe);
      });

      // Middle bay: full-height hanging space and a low storage shelf.
      shelf(div1, div2, 176); shelf(div1, div2, 48); rail(div1, div2, 163);
      [0, 1, 2, 3].forEach(i => {
        const color = ["#333a40", "#7d91a2", "#e8e7e2", "#b8c5ce"][i];
        const za = div1 + 12 + i * 20;
        box(xf - 17, xf - 4, za, za + 14, 66 + (i % 2) * 9, 151 - (i % 2) * 4, std({ color, roughness: 1 }), wardrobe);
      });

      // Narrow right bay: adjustable-looking shelves with folded linen and bags.
      [48, 96, 144].forEach(y => shelf(div2, wz1, y));
      [[div2 + 9, 64, 4], [div2 + 22, 67, 5], [div2 + 8, 112, 5], [div2 + 25, 159, 4]].forEach(([z, y, d]) => {
        box(xf - 18, xf - 5, z, Math.min(z + d * 3, wz1 - 6), y, y + 8, std({ color: "#c9bda9", roughness: 1 }), wardrobe);
      });
    } else {
      let z = wz0;
      o.sections.forEach((sw, i) => {
        const za = z, zb = z + sw;
        if (i > 0) box(xb, xf, za - 0.9, za + 0.9, 8, h - 1.8, o.body, wardrobe);
        const hang = sw >= 80 && i !== 1 || (o.sections.length === 2 && i === 0);
        if (hang) {
          box(xb + 2, xf - 1, za + 1, zb - 1, h - 26, h - 24.2, o.shelves, wardrobe);
          const r = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.2, sw - 4, 12), M.steel);
          r.rotation.x = Math.PI / 2; r.position.set((xb + xf) / 2 - CX, h - 33, (za + zb) / 2 - CZ); wardrobe.add(r);
          const cols = ["#8aa0b4", "#d8d2c6", "#5f6b78", "#c9b39a", "#e8e6e1", "#7d8c7a"];
          for (let k = 0; k < Math.floor((sw - 10) / 9); k++) {
            const len = 70 + ((k * 37) % 40);
            box((xb + xf) / 2 - 22, (xb + xf) / 2 + 22, za + 6 + k * 9, za + 8.5 + k * 9, h - 35 - len, h - 35, std({ color: cols[k % cols.length], roughness: 1 }), wardrobe);
          }
        } else {
          const step = sw < 60 ? 32 : 38;
          for (let y = 8 + step; y < h - 20; y += step) box(xb + 2, xf - 1, za + 1, zb - 1, y, y + 1.8, o.shelves, wardrobe);
          for (let y = 8 + step; y < h - 20; y += step) box(xb + 6, xf - 12, za + 6, zb - 6, y + 1.8, y + 12, std({ color: "#dcd7ce", roughness: 1 }), wardrobe);
        }
        z = zb;
      });
    }
    // doors
    if (o.type === "sliding") {
      const half = (wz1 - wz0) / 2;
      [0, 1].forEach(i => {
        const g = new THREE.Group(); g.position.set((xf + (i ? 5.5 : 2)) - CX, 0, 0); wardrobe.add(g);
        const za = wz0 + i * half;
        lbox(1.8, h - 8, half, 0, (h - 8) / 2 + 4, za + half / 2 - CZ, o.front, g);
        lbox(0.6, h - 8, 1.2, 0.8, (h - 8) / 2 + 4, za + (i ? 2 : half - 2) - CZ, M.steel, g);
        doors.push({ obj: g, prop: "pz", closed: 0, open: i ? -(half - 6) : 0, ward: true });
      });
      box(xf, xf + 8, wz0, wz1, h - 4, h, o.body, wardrobe);
      box(xf, xf + 8, wz0, wz1, 0, 4, o.body, wardrobe);
    } else {
      let z2 = wz0;
      o.sections.forEach((sw, si) => {
        const n = o.doorsPer[si], w = sw / n;
        for (let k = 0; k < n; k++) {
          const za = z2 + k * w, zb = za + w;
          const hingeLow = n === 1 ? true : k === 0;
          const pivot = new THREE.Group();
          pivot.position.set(xf + 1 - CX, 0, (hingeLow ? za : zb) - CZ);
          wardrobe.add(pivot);
          const short = o.drawers && si === 1;
          const y0 = short ? 64 : 3, y1 = h - 3;
          const s = hingeLow ? 1 : -1;
          if (o.glassDoors) {
            // ~5 cm light-oak stiles and rails around a clear glass pane
            const f = 5, dw = w - 0.4, zc = s * (w / 2), hh = y1 - y0, yc = (y0 + y1) / 2;
            lbox(1.8, hh, f, 0, yc, s * (0.2 + f / 2), o.front, pivot);
            lbox(1.8, hh, f, 0, yc, s * (w - 0.2 - f / 2), o.front, pivot);
            lbox(1.8, f, dw - 2 * f, 0, y1 - f / 2, zc, o.front, pivot);
            lbox(1.8, f, dw - 2 * f, 0, y0 + f / 2, zc, o.front, pivot);
            lbox(0.6, hh - 2 * f + 1, dw - 2 * f + 1, 0, yc, zc, M.cabinetGlass, pivot).castShadow = false;
          } else lbox(1.8, y1 - y0, w - 0.4, 0, (y0 + y1) / 2, s * (w / 2), o.front, pivot);
          if (o.layout !== "pax") lbox(1.2, key === "harel" ? 30 : 22, 1.4, 1.6, 100, s * (w - 4), M.black, pivot); // PAX: push-open, no handles
          doors.push({ obj: pivot, prop: "ry", closed: 0, open: s * Math.PI / 2 * 0.98, ward: true });
        }
        if (o.drawers && si === 1) {
          for (let d = 0; d < 3; d++) {
            const y0 = 4 + d * 19.8, y1 = y0 + 19.2;
            box(xf, xf + 1.8, z2 + 0.3, z2 + sw - 0.3, y0, y1, o.front, wardrobe);
            box(xf + 1.8, xf + 2.8, z2 + 12, z2 + sw - 12, y1 - 5, y1 - 3.8, M.black, wardrobe);
          }
        }
        z2 += sw;
      });
    }
    const open = document.getElementById("optDoors").checked;
    doors.filter(d => d.ward).forEach(d => B.setDoorProp(d, open ? d.open : d.closed));
    B.updateWardKv(key);
  }

  Object.assign(B, { buildKitchen, buildWardrobe, WARDS, WX, SOFA });
})(window.B);
