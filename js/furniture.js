/* furniture.js — furniture from the designer's layout, the kitchenette and the wardrobe options.
 * Positions are plan coordinates in cm, read off the drawing.
 * Exposes: B.buildKitchen(L), B.buildWardrobe(key), B.WARDS, B.WX, B.SOFA, B.SOFAS, B.setSofa(key), B.deskScreen
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
  function soft(x0, x1, z0, z1, y0, y1, puff, mat, parent) {
    const m = softMesh(x1 - x0, y1 - y0, z1 - z0, puff, mat);
    m.position.set((x0 + x1) / 2 - CX, (y0 + y1) / 2, (z0 + z1) / 2 - CZ);
    (parent || root).add(m); return m;
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
  /* ---------- sofa: two models to compare. Both face north, front edge 40 cm from the armchairs / coffee table ----------
   * The panel picks one (ui.js → setSofa). Both are upholstered in M.kivik, so the sofa colour picker recolours either one;
   * picking a model also moves the picker to that model's own colour (`fabric`). B.SOFA is the current model: the gaps
   * readout, the walking grid (nav.js) and the seats in life mode (sim.js) all read it.
   * backFront = z of the back cushions' front at seat level; seats = x of the two seat-cushion centres (west, east). */
  const SOFAS = {
    // IKEA KIVIK 3-seat, 228 × 95 × 83, Tibbleby beige/grey — the decision (and the shopping list). Seat 45, seat depth 60.
    kivik: { x0: 162, x1: 390, z0: 423, z1: 518, seatH: 45, backFront: 483, seats: [231, 321], fabric: "tibbleby", label: "ספה KIVIK" },
    // Green 3-seat from a store photo Itay sent (Nov 2026). Length 220 (Itay); depth 90 and height 84 are assumed.
    // Slim arms set back from the seat front, 2 seat + 2 back cushions in olive-green woven fabric, 2 small pillows,
    // black tapered metal legs. Centred on x 276 like KIVIK.
    green: { x0: 166, x1: 386, z0: 423, z1: 513, seatH: 47, backFront: 481, seats: [227, 325], fabric: "olive", label: "ספה ירוקה" },
  };
  const SOFA = Object.assign({}, SOFAS.kivik);
  // a back cushion leaning back 10°: bottom-front edge on the seat at (z, y), top-front edge at height `top`
  function backCushion(a, b, z, y, top, d, parent) {
    const t = 0.1745, h = (top - y) / Math.cos(t);
    const c = softMesh(b - a, h, d, [1, 1, 2.2], M.kivik);
    c.rotation.x = t;
    c.position.set((a + b) / 2 - CX, y + h / 2 * Math.cos(t) - d / 2 * Math.sin(t), z + h / 2 * Math.sin(t) + d / 2 * Math.cos(t) - CZ);
    parent.add(c); return c;
  }
  // a square throw pillow w × w, thin at the edges, leaning back by `lean`, turned by `yaw`, tipped by `roll`
  function pillow(w, mat, x, y, z, yaw, roll, lean, parent) {
    const p = softMesh(w, w, 3, [0.6, 0.6, w / 8], mat);
    p.rotation.order = "YXZ"; p.rotation.set(lean, yaw, roll);
    p.position.set(x - CX, y, z - CZ); parent.add(p); return p;
  }
  const sofaModels = {
    kivik: (function () {
      const g = new THREE.Group(); root.add(g);
      const { x0, x1, z0, z1, seatH, backFront } = SOFAS.kivik, arm = 24, back = 20;
      const sx0 = x0 + arm, sx1 = x1 - arm, mid = (sx0 + sx1) / 2;    // seat 180 wide
      [[x0 + 5, x0 + 9], [x1 - 9, x1 - 5]].forEach(x => [[z0 + 5, z0 + 9], [z1 - 9, z1 - 5]].forEach(z => box(x[0], x[1], z[0], z[1], 0, 3, M.black, g)));
      soft(sx0, sx1, z0 + 1, z1 - back, 3, 30, 0.6, M.kivik, g);     // base under the seat cushions
      soft(x0, sx0, z0, z1, 3, 64, [0.8, 1.2, 0.8], M.kivik, g);      // wide, low, boxy arms
      soft(sx1, x1, z0, z1, 3, 64, [0.8, 1.2, 0.8], M.kivik, g);
      soft(sx0, sx1, z1 - back, z1, 3, 70, [0.8, 1, 0.8], M.kivik, g); // back frame
      [[sx0, mid], [mid, sx1]].forEach(([a, b]) => {
        soft(a + 0.4, b - 0.4, z0 + 1, z1 - back, 30, seatH, [1, 1.6, 1], M.kivik, g);   // 2 large seat cushions
        backCushion(a + 0.5, b - 0.5, backFront, seatH, 83, 20, g);  // 2 back cushions, top at 83
      });
      // 4 throw pillows (~50×50) leaning on the back cushions: navy behind at the outer ends, mustard in front of it
      [[sx0 + 27, M.navy, 0, -0.18], [sx0 + 54, M.mustard, 6, -0.08], [sx1 - 54, M.mustard, 6, 0.08], [sx1 - 27, M.navy, 0, 0.18]].forEach(([x, mat, fwd, yaw], i) =>
        pillow(48, mat, x, seatH + 23, backFront - 10 - fwd, yaw, i % 2 ? 0.04 : -0.04, 0.3, g));
      return g;
    })(),
    green: (function () {
      const g = new THREE.Group(); root.add(g);
      const { x0, x1, z0, z1, seatH, backFront } = SOFAS.green, arm = 12, legH = 15, mid = (x0 + x1) / 2;
      // black tapered metal legs at the corners, splayed slightly outward
      const legMat = std({ color: "#1c1c1e", roughness: 0.4, metalness: 0.3 });
      [[x0 + 5, 1], [x1 - 5, -1]].forEach(([x, sx]) => [[z0 + 6, 1], [z1 - 6, -1]].forEach(([z, sz]) => {
        const leg = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 0.8, legH + 1, 12), legMat);
        leg.position.set(x - CX, legH / 2, z - CZ); leg.rotation.set(sz * 0.08, 0, -sx * 0.08); leg.castShadow = true; g.add(leg);
      }));
      soft(x0 + 1, x1 - 1, z0 + 2, z1 - 1, legH, 30, [0.6, 0.8, 0.8], M.kivik, g);                 // upholstered base rail
      soft(x0 + arm, x1 - arm, z1 - 14, z1, 28, 64, [0.6, 1, 0.6], M.kivik, g);                   // back frame, behind the cushions
      [[x0, x0 + arm], [x1 - arm, x1]].forEach(([a, b]) => soft(a, b, z0 + 12, z1, 28, 62, [0.8, 1.2, 0.8], M.kivik, g));   // slim arms, set back from the seat front
      [[x0 + 1, mid], [mid, x1 - 1]].forEach(([a, b]) => soft(a + 0.4, b - 0.4, z0, z1 - 16, 30, seatH, [1, 1.6, 1], M.kivik, g));   // 2 seat cushions, full width
      [[x0 + arm + 4, mid], [mid, x1 - arm - 4]].forEach(([a, b]) => backCushion(a + 0.5, b - 0.5, backFront, seatH, 84, 19, g));    // 2 big back cushions, top at 84
      pillow(36, M.kivik, x0 + arm + 15, seatH + 17, backFront - 12, -0.5, -0.12, 0.35, g);         // 2 small pillows against the arms
      pillow(36, M.kivik, x1 - arm - 15, seatH + 17, backFront - 12, 0.5, 0.12, 0.35, g);
      return g;
    })(),
  };
  function setSofa(key) {
    Object.keys(sofaModels).forEach(k => { sofaModels[k].visible = k === key; });
    Object.assign(SOFA, SOFAS[key], { key });
  }
  setSofa("kivik");
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
  // Twins Design "Copenhagen" (from the catalogue photo Itay sent, Nov 2026): light-oak body, three equal bays behind six
  // clear-glass doors in slim aluminium frames with long bar handles; shelves | hanging + drawers | shelves.
  // Size from Itay (Nov 2026): 240 wide × 60 deep × 210 high — exactly the plan's wardrobe slot.
  WARDS.twins = { w: 240, d: 60, h: 210, type: "hinged", layout: "twins", sections: [80, 80, 80], doorsPer: [2, 2, 2],
    glassDoors: true, frameMat: M.steel, frameW: 2.6, frameT: 1.4, handleMat: M.steel, handleH: 34, handleY: 112,
    body: M.oakLight, front: M.oakLight, shelves: M.oakLight, name: "Twins Design · קופנהגן" };
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
    } else if (o.layout === "twins") {
      const [b1, b2, b3] = [wz0, wz0 + o.sections[0], wz0 + o.sections[0] + o.sections[1]], b4 = wz1;
      [b2, b3].forEach(d => box(xb, xf, d - 0.9, d + 0.9, 8, h - 1.8, o.body, wardrobe));
      const pale = std({ color: "#e9e4dc", roughness: 0.8 });
      // oak shelf with a pale front edge, like the catalogue photo
      const shelf = (za, zb, y) => { box(xb + 2, xf - 2.6, za + 1, zb - 1, y, y + 2, o.shelves, wardrobe); box(xf - 2.6, xf - 2, za + 1, zb - 1, y, y + 2, pale, wardrobe); };
      const item = (x0, x1, za, zb, y0, y1, color, rough) => box(x0, x1, za, zb, y0, y1, std({ color, roughness: rough === undefined ? 1 : rough }), wardrobe);
      const stack = (za, zb, y, layers, colors, each) => layers.forEach((t, i) => item(xf - 34, xf - 8, za + (i % 2) * 1.2, zb - ((i + 1) % 2) * 1.2, y + i * each, y + i * each + t, colors[i % colors.length]));
      const fabricBox = (za, zb, y, hgt, color) => { item(xf - 36, xf - 7, za, zb, y, y + hgt, color); box(xf - 7.2, xf - 6.8, (za + zb) / 2 - 3, (za + zb) / 2 + 3, y + hgt * 0.6, y + hgt * 0.6 + 2.5, M.steel, wardrobe); };
      const rows = [36, 66, 96, 126, 156, 186];

      // Left bay: pillows on top, then folded linen and towels, fabric boxes, a wicker basket at the bottom
      rows.forEach(y => shelf(b1, b2, y));
      [[b1 + 6, b1 + 38], [b1 + 42, b1 + 74]].forEach(([za, zb]) => item(xf - 40, xf - 6, za, zb, 188.5, 199, "#f3f1ec"));
      stack(b1 + 8, b1 + 40, 158, [5, 5, 5, 5], ["#ecebe7", "#dcd8d1"], 5.6); stack(b1 + 44, b1 + 72, 158, [6, 6, 6], ["#d9d3c8", "#c8c1b4"], 6.6);
      stack(b1 + 8, b1 + 40, 128, [5, 5, 5, 5], ["#e8e4dc", "#f1efe9"], 5.6); fabricBox(b1 + 44, b1 + 74, 128, 22, "#cfc8bb");
      stack(b1 + 6, b1 + 36, 98, [6, 6, 6], ["#f2f0eb", "#e3ded5", "#cfc9bf"], 6.6); fabricBox(b1 + 42, b1 + 74, 98, 21, "#bfb9b0");
      stack(b1 + 8, b1 + 38, 68, [4, 4, 4, 4, 4], ["#e9e5de", "#d5cfc5"], 4.6); fabricBox(b1 + 44, b1 + 74, 68, 24, "#d3cdc2");
      fabricBox(b1 + 6, b1 + 38, 38, 24, "#c9c3b8"); fabricBox(b1 + 42, b1 + 74, 38, 22, "#dbd5ca");
      item(xf - 40, xf - 6, b1 + 6, b1 + 74, 9, 32, "#b08f5a");                                   // wicker basket
      item(xf - 39, xf - 7, b1 + 7, b1 + 73, 32, 33.5, "#c7a56d");

      // Middle bay: top shelf, hanging rail with a long coat and two shirts, two deep drawers and a shoe drawer below
      shelf(b2, b3, 186);
      const rail = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.1, b3 - b2 - 8, 12), M.steel);
      rail.rotation.x = Math.PI / 2; rail.position.set((xb + xf) / 2 - CX, 176, (b2 + b3) / 2 - CZ); wardrobe.add(rail);
      [[b2 + 14, 82, "#b89b7b"], [b2 + 34, 70, "#ece8e0"], [b2 + 50, 66, "#d9cdb8"], [b2 + 64, 74, "#c9bda9"]].forEach(([za, len, color]) => {   // all end above the shelf at 86
        item((xb + xf) / 2 - 20, (xb + xf) / 2 + 20, za, za + 3, 174 - len, 174, color);
        box((xb + xf) / 2 - 20, (xb + xf) / 2 + 20, za + 0.5, za + 2.5, 174, 176.5, M.steel, wardrobe);            // hanger
      });
      shelf(b2, b3, 86);
      item(xf - 22, xf - 8, b2 + 10, b2 + 32, 88, 96, "#2a2b2e", 0.6); item(xf - 24, xf - 6, b2 + 42, b2 + 70, 88, 92, "#d9d3c8");   // watch box, tray
      [[8, 30], [34, 58], [60, 84]].forEach(([y0, y1], i) => {
        box(xf - 3.4, xf - 2, b2 + 2, b3 - 2, y0, y1, o.front, wardrobe);                                          // drawer front
        box(xf - 2, xf - 0.9, (b2 + b3) / 2 - 10, (b2 + b3) / 2 + 10, (y0 + y1) / 2 - 0.6, (y0 + y1) / 2 + 0.6, M.steel, wardrobe); // slim handle
      });

      // Right bay: books and a vase on top, books, shoe boxes, shoes and slippers
      rows.forEach(y => shelf(b3, b4, y));
      [[2.8, 17, "#d8d3c9"], [3.6, 19, "#7c8794"], [2.6, 15, "#cfc6b4"], [4.2, 18, "#9a8c7c"], [3.2, 16, "#e3dfd6"], [2.9, 19, "#5e6570"], [3.4, 14, "#c2bbb0"]].reduce((za, [t, hgt, color]) => { item(xf - 30, xf - 8, za, za + t, 188.5, 188.5 + hgt, color, 0.8); return za + t + 0.6; }, b3 + 6);
      const vase = new THREE.Mesh(new THREE.CylinderGeometry(4.5, 3.2, 14, 20), std({ color: "#e8e2d6", roughness: 0.5 }));
      vase.position.set(xf - 18 - CX, 195.5, b4 - 16 - CZ); wardrobe.add(vase);
      stack(b3 + 8, b3 + 36, 158, [3, 3, 3, 3, 3], ["#e6e1d8", "#aeb6bf", "#d2cabc"], 3.4);                       // books lying
      [[3, 20, "#6d7682"], [3.6, 23, "#d9d4ca"], [2.8, 19, "#b5aca0"], [4, 24, "#8e8577"], [3.2, 22, "#e1ddd4"]].reduce((za, [t, hgt, color]) => { item(xf - 28, xf - 8, za, za + t, 158.5, 158.5 + hgt, color, 0.8); return za + t + 0.6; }, b3 + 42);
      [[3.4, 22, "#cfc8bd"], [3, 25, "#596270"], [3.8, 21, "#ddd8cf"], [2.9, 24, "#a79d90"], [3.5, 20, "#e8e4dc"], [3.1, 23, "#7f8893"]].reduce((za, [t, hgt, color]) => { item(xf - 28, xf - 8, za, za + t, 128.5, 128.5 + hgt, color, 0.8); return za + t + 0.6; }, b3 + 8);
      [[b3 + 6, b3 + 38, "#c9c7c3"], [b3 + 42, b3 + 74, "#2b2b2d"]].forEach(([za, zb, color]) => item(xf - 38, xf - 6, za, zb, 98.5, 112, color, 0.7));   // shoe boxes
      [[b3 + 6, b3 + 38, "#f1efea"], [b3 + 42, b3 + 74, "#3a3a3c"]].forEach(([za, zb, color]) => item(xf - 38, xf - 6, za, zb, 68.5, 81, color, 0.7));
      [[b3 + 8, "#2c2c2e"], [b3 + 20, "#2c2c2e"], [b3 + 44, "#e4e0d8"], [b3 + 56, "#e4e0d8"]].forEach(([za, color]) => item(xf - 36, xf - 8, za, za + 10, 38.5, 47, color, 0.6));   // shoes
      [[b3 + 8, "#d9cfc0"], [b3 + 20, "#d9cfc0"]].forEach(([za, color]) => item(xf - 34, xf - 8, za, za + 10, 8.5, 13, color));                                 // slippers
      item(xf - 38, xf - 6, b3 + 40, b3 + 74, 8.5, 28, "#dfe6ea", 0.3);                                            // clear storage box
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
            // stiles and rails around a clear glass pane: ~5 cm light oak (PAX) or a slim aluminium profile (frameW / frameMat)
            const f = o.frameW || 5, ft = o.frameT || 1.8, fm = o.frameMat || o.front, dw = w - 0.4, zc = s * (w / 2), hh = y1 - y0, yc = (y0 + y1) / 2;
            lbox(ft, hh, f, 0, yc, s * (0.2 + f / 2), fm, pivot);
            lbox(ft, hh, f, 0, yc, s * (w - 0.2 - f / 2), fm, pivot);
            lbox(ft, f, dw - 2 * f, 0, y1 - f / 2, zc, fm, pivot);
            lbox(ft, f, dw - 2 * f, 0, y0 + f / 2, zc, fm, pivot);
            lbox(0.6, hh - 2 * f + 1, dw - 2 * f + 1, 0, yc, zc, M.cabinetGlass, pivot).castShadow = false;
          } else lbox(1.8, y1 - y0, w - 0.4, 0, (y0 + y1) / 2, s * (w / 2), o.front, pivot);
          if (o.layout !== "pax") lbox(1.2, o.handleH || (key === "harel" ? 30 : 22), 1.4, 1.6, o.handleY || 100, s * (w - 4), o.handleMat || M.black, pivot); // PAX: push-open, no handles
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

  Object.assign(B, { buildKitchen, buildWardrobe, WARDS, WX, SOFA, SOFAS, setSofa, deskScreen: screenMat });
})(window.B);
