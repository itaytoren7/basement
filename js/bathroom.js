/* bathroom.js — shower, fixtures, vanity, standard toilet, wall tiles, rain head, person, niche shelves.
 * Bathroom interior: x 164–463, z 648–778 (299 × 130). Shower x 164–244, raised 15 cm.
 * Exposes: B.buildRain(h), B.buildPerson(height), B.cladPanel, B.person
 */
(function (B) {
  "use strict";
  if (B.failed) return;
  const { H, CX, CZ, M, std, root, box, lbox, cyl, doors, floorMeshes, wallParts } = B;

  /* ---------- shower ---------- */
  const tray = box(164, 244, 648, 778, 0, 15, M.shower);             // whole shower raised 15
  tray.userData.floor = true; floorMeshes.push(tray);                // residents can walk (and step up) onto it
  box(214, 222, 658, 768, 15, 15.3, M.steel, root, { noCast: true }); // linear drain
  const shGlass = box(242.5, 244.5, 688, 778, 15, 205, M.showerGlass, root, { noCast: true });
  shGlass.castShadow = false;                                        // glass lines up with where the window sashes meet
  box(242, 245, 686, 688, 15, 205, M.chrome);

  // shower fixtures (bronze): 4-way mixer 110 above the shower floor, 57 from the window wall;
  // hand-shower outlet 15 cm from it
  (function () {
    const plate = new THREE.Mesh(new THREE.CylinderGeometry(8, 8, 1.2, 32), M.bronze);
    plate.rotation.z = Math.PI / 2; plate.position.set(165.2 - CX, 125, 721 - CZ); plate.castShadow = true; root.add(plate);
    const knob = new THREE.Mesh(new THREE.CylinderGeometry(2.6, 2.6, 4, 20), M.bronze);
    knob.rotation.z = Math.PI / 2; knob.position.set(168 - CX, 125, 721 - CZ); root.add(knob);
    box(169, 171, 720, 722, 125, 135, M.bronze);                  // lever
    const out = new THREE.Mesh(new THREE.CylinderGeometry(2.4, 2.4, 3, 16), M.bronze);
    out.rotation.z = Math.PI / 2; out.position.set(166 - CX, 125, 706 - CZ); root.add(out);
    box(164.6, 168, 703, 709, 150, 156, M.bronze);                // holder
    const hs = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.3, 22, 16), M.bronze);
    hs.position.set(169 - CX, 146, 706 - CZ); hs.rotation.z = -0.25; root.add(hs);
    const hh = new THREE.Mesh(new THREE.CylinderGeometry(4.5, 4.5, 2, 20), M.bronze);
    hh.position.set(171 - CX, 158, 706 - CZ); hh.rotation.z = Math.PI / 2 - 0.35; root.add(hh);
  })();

  /* ---------- vanity 100/47 with a vessel basin ---------- */
  box(263, 362, 732, 778, 30, 80, M.oakLight);
  box(263, 362, 731, 778, 80, 83, M.whiteGloss);
  box(312.3, 312.7, 733, 776, 34, 78, M.groove);
  (function () {
    const b = new THREE.Mesh(new THREE.CylinderGeometry(20, 16, 13, 32), M.porcelain);
    b.scale.z = 0.72; b.position.set(312 - CX, 89.5, 753 - CZ); b.castShadow = true; root.add(b);
    const inner = new THREE.Mesh(new THREE.CylinderGeometry(17.5, 14, 1, 32), std({ color: "#e9eaeb", roughness: 0.3 }));
    inner.scale.z = 0.72; inner.position.set(312 - CX, 95.6, 753 - CZ); root.add(inner);
    cyl(1.3, 34, 312, 100, 773, M.chrome);             // basin faucet (chrome — not decided yet)
    box(311, 313, 758, 774, 115, 117, M.chrome);
  })();

  /* ---------- shallow mirrored medicine cabinet above the basin ---------- */
  (function () {
    const x0 = 282, x1 = 342, z0 = 758, z1 = 778, y0 = 120, y1 = 160;
    const mirror = new THREE.MeshStandardMaterial({ color: "#cbd6db", metalness: 0.35, roughness: 0.12, side: THREE.DoubleSide });
    // Carcass is tucked below the window sill; 60 × 40 × 20 cm, centered on the basin.
    box(x0, x1, z0, z1, y0, y1, M.whiteGloss);
    box(x0 + 2, x1 - 2, z1 - 2, z1 - 1, y0 + 2, y1 - 2, M.white);
    box(x0 + 2, x1 - 2, z0 + 4, z1 - 2, 139, 141, M.whiteGloss); // internal shelf

    // A few small bottles and cream jars make the closed-storage purpose apparent when open.
    [
      [290, 127, 4, 10], [302, 128, 5, 12], [317, 127, 4, 9],
      [328, 146, 5, 11], [296, 146, 4, 8], [312, 146, 4, 10],
    ].forEach(([x, y, r, h]) => {
      const bottle = new THREE.Mesh(new THREE.CylinderGeometry(r, r * 0.9, h, 16), M.whiteGloss);
      bottle.position.set(x - CX, y + h / 2, 767 - CZ); root.add(bottle);
      box(x - 1.5, x + 1.5, 765.5, 768.5, y + h, y + h + 2, M.chrome);
    });

    // Mirrored leaf, hinged at the right edge and opening into the bathroom with the door toggle.
    const pivot = new THREE.Group(); pivot.position.set(x1 - CX, y0 - 1, z0 - CZ); root.add(pivot);
    lbox(1.4, y1 - y0, x1 - x0, -((x1 - x0) / 2), (y1 - y0) / 2, 0, M.frame, pivot);
    const glass = lbox(0.5, y1 - y0 - 3, x1 - x0 - 3, -((x1 - x0) / 2), (y1 - y0) / 2, -1, mirror, pivot);
    glass.castShadow = false;
    lbox(1.5, 8, 1.5, -5, (y1 - y0) / 2, -2, M.chrome, pivot); // discreet edge pull
    doors.push({ obj: pivot, prop: "ry", closed: 0, open: -Math.PI / 2 * 0.95 });
  })();

  /* ---------- standard floor-mounted toilet with a visible tank ---------- */
  (function () {
    const t = new THREE.Mesh(new THREE.CylinderGeometry(18, 15, 34, 28), M.porcelain);
    t.scale.z = 1.45; t.position.set(422 - CX, 23 + 17, 732 - CZ); t.castShadow = true; root.add(t);
    const tank = new THREE.Mesh(new THREE.BoxGeometry(26, 30, 18), M.porcelain);
    tank.position.set(418 - CX, 36, 748 - CZ); tank.castShadow = true; root.add(tank);
    box(404, 440, 704, 760, 40, 42, M.porcelain);
  })();

  /* ---------- wall tiles ---------- */
  // Thin plane just in front of a wall face. rotY 0 / π: runs along x at depth `at` (a z value);
  // rotY ±π/2: runs along z at depth `at` (an x value). One texture repeat = 60 cm (4 tiles of 15).
  function cladPanel(a0, a1, at, y0, y1, rotY, parent) {
    const len = a1 - a0, hgt = y1 - y0;
    const g = new THREE.PlaneGeometry(len, hgt);
    const uv = g.attributes.uv;
    for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * len / 60, uv.getY(i) * hgt / 60 + y0 / 60);
    const m = new THREE.Mesh(g, M.clad);
    m.rotation.y = rotY; m.receiveShadow = true;
    const mid = (a0 + a1) / 2, ym = (y0 + y1) / 2, alongZ = Math.abs(Math.sin(rotY)) > 0.5;
    if (alongZ) m.position.set(at - CX, ym, mid - CZ);
    else m.position.set(mid - CX, ym, at - CZ);
    wallParts.push({ obj: m, kind: "scale", y0, y1, cx: alongZ ? at : mid, cz: alongZ ? mid : at }); // cut with the wall behind it
    (parent || root).add(m); return m;
  }
  const cladding = new THREE.Group(); root.add(cladding);
  cladPanel(648, 778, 164.4, 0, H, Math.PI / 2, cladding);        // west wall (shower wall)
  cladPanel(164, 322, 777.6, 0, 161, Math.PI, cladding);          // south wall under the window
  cladPanel(322, 363, 777.6, 0, H, Math.PI, cladding);            // south wall beside the vanity
  cladPanel(363, 463, 777.6, 0, H, Math.PI, cladding);            // south wall behind the toilet
  cladPanel(698, 758, 462.6, 0, H, -Math.PI / 2, cladding);       // east wall (opening to niche starts at z 698)
  cladPanel(383, 547, 648.4, 0, H, 0, cladding);                  // north wall beside the door and the solid wall
  cladPanel(164, 302, 648.4, 0, 160, 0, cladding);                // low wall, shower side

  /* ---------- rain head (height above the raised shower floor) ---------- */
  const rainGroup = new THREE.Group(); root.add(rainGroup);
  function buildRain(h) {
    while (rainGroup.children.length) rainGroup.remove(rainGroup.children[0]);
    const y = 15 + h;
    box(164, 196, 719, 723, y + 2, y + 4, M.bronze, rainGroup);
    const head = new THREE.Mesh(new THREE.CylinderGeometry(13, 13, 1.6, 36), M.bronze);
    head.position.set(200 - CX, y + 0.8, 721 - CZ); rainGroup.add(head);
  }

  /* ---------- a person standing in the shower (height is a UI slider) ---------- */
  const person = new THREE.Group(); root.add(person);
  function buildPerson(hgt) {
    while (person.children.length) person.remove(person.children[0]);
    const s = hgt / 180;
    const p = (geo, x, y, z, sx) => { const m = new THREE.Mesh(geo, M.person); m.position.set(x, y, z); if (sx) m.scale.x = sx; m.castShadow = true; person.add(m); return m; };
    p(new THREE.CylinderGeometry(6.5 * s, 5 * s, 84 * s, 16), 0, 42 * s, -8 * s);
    p(new THREE.CylinderGeometry(6.5 * s, 5 * s, 84 * s, 16), 0, 42 * s, 8 * s);
    p(new THREE.CylinderGeometry(17 * s, 14 * s, 64 * s, 20), 0, 84 * s + 32 * s, 0, 0.62);
    p(new THREE.CylinderGeometry(5 * s, 5 * s, 8 * s, 12), 0, 152 * s, 0);
    p(new THREE.SphereGeometry(11 * s, 24, 16), 0, hgt - 11 * s, 0);
    p(new THREE.CylinderGeometry(4 * s, 3.5 * s, 62 * s, 12), 0, 116 * s, -21 * s);
    p(new THREE.CylinderGeometry(4 * s, 3.5 * s, 62 * s, 12), 0, 116 * s, 21 * s);
    person.position.set(203 - CX, 15, 721 - CZ);
  }

  /* ---------- niche shelves, facing the 50 cm opening ---------- */
  [30, 70, 110, 150, 190].forEach(y => box(484, 546, 649, 719, y, y + 2, M.white));

  Object.assign(B, { buildRain, buildPerson, cladPanel, person });
})(window.B);
