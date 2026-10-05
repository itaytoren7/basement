/* bathroom.js — shower with its screen, taps, vanity, mirrored cabinet, wall-hung toilet, wall tiles, rain head, person, niche shelves.
 * Bathroom interior: x 164–463, z 648–778 (299 × 130). Shower x 164–244, raised 15 cm. Everything follows the store order
 * (docs/bathroom-order.jpg, kept out of the repo): white stone-look floor, vertical aqua wall tiles, all taps in brushed
 * rose gold (Vered VPRO), wall-hung toilet on a concealed-cistern wall, split-oak vanity. Shower screen: placeholder for "קספר".
 * Exposes: B.buildRain(h), B.buildPerson(height), B.cladPanel, B.person
 */
(function (B) {
  "use strict";
  if (B.failed) return;
  const { H, CX, CZ, M, std, root, box, lbox, cyl, floorRect, doors, floorMeshes, wallParts, V } = B;

  // a bent tube (hoses, spouts) along plan points [[x, y, z], ...]
  function tube(points, r, mat, parent) {
    const curve = new THREE.CatmullRomCurve3(points.map(q => V(q[0], q[1], q[2])));
    const m = new THREE.Mesh(new THREE.TubeGeometry(curve, 32, r, 10, false), mat);
    m.castShadow = true; (parent || root).add(m); return m;
  }
  // a cylinder lying along x (plates, hubs and knobs on the west wall)
  function alongX(r, len, x, y, z, mat, seg) {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, seg || 24), mat);
    m.rotation.z = Math.PI / 2; m.position.set(x - CX, y, z - CZ); m.castShadow = true; root.add(m); return m;
  }

  /* ---------- shower: raised tray with the stone floor on top, linear drain ---------- */
  const tray = box(164, 244, 648, 778, 0, 15, M.shower);                      // the step
  tray.userData.floor = true; floorMeshes.push(tray);                         // residents can walk (and step up) onto it
  floorRect(164, 244, 648, 778, 15.1, M.bathFloor, [120, 120], true);        // 60×60 stone tiles, like the rest of the floor
  box(214, 222, 658, 768, 15.1, 15.4, M.steel, root, { noCast: true });       // linear drain

  /* ---------- shower screen: "מקלחון קספר" — PLACEHOLDER until the catalogue is checked ----------
   * Clear 8 mm glass along x 243 for the whole front: a fixed panel z 708–778 and a hinged door z 648–708 whose
   * hinge is at the north end, opening outward into the bathroom. Thin rose-gold profiles, hinges and handle. */
  (function () {
    const X = 243, pane = (a, b, c, d, e, f) => { const g = box(a, b, c, d, e, f, M.showerGlass, root, { noCast: true }); g.castShadow = false; return g; };
    pane(X - 0.4, X + 0.4, 709.5, 776, 15, 203);                               // fixed panel
    box(X - 1.2, X + 1.2, 776, 778, 15, 205, M.roseGold);                       // wall profile, south end
    box(X - 1.2, X + 1.2, 706.5, 709.5, 15, 205, M.roseGold);                   // post where the door meets the fixed panel
    box(X - 1.2, X + 1.2, 709.5, 776, 203, 205, M.roseGold);                    // top rail over the fixed panel
    box(X - 1.2, X + 1.2, 648, 650, 15, 205, M.roseGold);                       // wall profile, north end (hinge side)
    const pivot = new THREE.Group(); pivot.position.set(X - CX, 0, 650 - CZ); root.add(pivot);
    lbox(0.8, 186, 55, 0, 110, 28.5, M.showerGlass, pivot).castShadow = false;  // door leaf z 651–706
    [45, 165].forEach(y => lbox(3, 7, 3, 0, y, 1.5, M.roseGold, pivot));        // hinges
    [-2.6, 2.6].forEach(x => lbox(1.5, 24, 1.5, x, 105, 51, M.roseGold, pivot)); // handle bar on both faces
    [94, 116].forEach(y => lbox(5.2, 1.4, 1.4, 0, y, 51, M.roseGold, pivot));
    doors.push({ obj: pivot, prop: "ry", closed: 0, open: Math.PI / 2 * 0.9, name: "shower" });
  })();

  /* ---------- shower taps (Vered VPRO, rose gold): concealed 4-way mixer with a vertical oval plate,
   * 110 above the shower floor, 57 from the window wall; hand-shower outlet 15 cm from it ---------- */
  (function () {
    const plate = alongX(7, 1.2, 165.2, 125, 721, M.roseGold, 40); plate.scale.set(20 / 14, 1, 1);   // oval 14 wide × 20 high
    alongX(2.6, 3, 167.3, 127, 721, M.roseGold);                                  // central hub
    box(167.6, 169.4, 721, 731, 126.2, 127.8, M.roseGold);                        // lever, pointing right
    alongX(1.7, 2.4, 166.9, 118, 721, M.roseGold);                                // small diverter knob below
    // shower set: wall outlet, hose, slim hand shower on a wall holder (the rain head is built in buildRain)
    alongX(2.3, 2.4, 165.3, 125, 706, M.roseGold);                                // outlet
    box(164.6, 168, 703.5, 708.5, 150, 156, M.roseGold);                          // holder
    const hs = new THREE.Mesh(new THREE.CylinderGeometry(1.25, 1.05, 22, 16), M.roseGold);
    hs.position.set(169 - CX, 146, 706 - CZ); hs.rotation.z = -0.25; hs.castShadow = true; root.add(hs);   // handle
    const hh = new THREE.Mesh(new THREE.CylinderGeometry(4.2, 4.2, 1.6, 24), M.roseGold);
    hh.position.set(171.5 - CX, 158.5, 706 - CZ); hh.rotation.z = Math.PI / 2 - 0.35; hh.castShadow = true; root.add(hh);   // head
    tube([[167, 124, 706], [173, 106, 712], [175, 92, 707], [171.5, 101, 702.5], [169.5, 120, 705], [168.4, 134.5, 706.3]], 0.65, M.roseGold); // hose
  })();

  /* ---------- vanity: "סניטק רימקס" 100/47 in natural split oak, sit-on basin, tall rose-gold mixer ---------- */
  box(263, 362, 732, 778, 30, 80, M.vanityOak);                                   // cabinet
  box(263, 362, 731, 778, 80, 83, M.whiteGloss);                                  // counter
  box(312.3, 312.7, 733, 776, 34, 78, M.groove);                                  // gap between the two doors
  (function () {
    const b = new THREE.Mesh(new THREE.CylinderGeometry(20, 16, 13, 32), M.porcelain);
    b.scale.z = 0.72; b.position.set(312 - CX, 89.5, 753 - CZ); b.castShadow = true; root.add(b);
    const inner = new THREE.Mesh(new THREE.CylinderGeometry(17.5, 14, 1, 32), std({ color: "#e9eaeb", roughness: 0.3 }));
    inner.scale.z = 0.72; inner.position.set(312 - CX, 95.6, 753 - CZ); root.add(inner);
    // tall single-lever mixer ("אושן", פרח גבוה): a slim column on the counter behind the basin, the spout curving out over its centre
    cyl(1.9, 30, 312, 98, 772, M.roseGold, root, 24);                             // column, 83–113
    tube([[312, 112, 772], [312, 118, 766.5], [312, 117, 759], [312, 110.5, 754]], 1.25, M.roseGold);   // spout
    alongX(1.3, 1.6, 314.5, 105, 772, M.roseGold, 16);                            // lever hub on the side
    box(315, 320.5, 771.2, 772.8, 104.3, 105.7, M.roseGold);                      // lever
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
    lbox(1.5, 8, 1.5, -5, (y1 - y0) / 2, -2, M.roseGold, pivot); // discreet edge pull
    doors.push({ obj: pivot, prop: "ry", closed: 0, open: -Math.PI / 2 * 0.95 });
  })();

  /* ---------- wall-hung toilet "אולימפיה קליר" on the concealed-cistern wall (JOMO, x 363–463, z 758–778, in WALLS) ----------
   * Glossy white rimless-style rounded bowl, rim at 42, slim white seat; bowl centre (422, 732). ---------- */
  (function () {
    const cx = 422, cz = 732;
    const bowl = new THREE.Mesh(new THREE.CylinderGeometry(18, 12.5, 26, 32), M.porcelain);
    bowl.scale.z = 1.35; bowl.position.set(cx - CX, 29, cz - CZ); bowl.castShadow = true; root.add(bowl);
    box(404, 440, 745, 758, 16, 42, M.porcelain);                                 // back of the bowl, into the wall
    const rim = new THREE.Mesh(new THREE.CylinderGeometry(19, 19, 2, 32), M.porcelain);
    rim.scale.z = 1.35; rim.position.set(cx - CX, 42, cz - CZ); rim.castShadow = true; root.add(rim);
    const inside = new THREE.Mesh(new THREE.CylinderGeometry(14, 14, 0.6, 32), std({ color: "#e4e7ea", roughness: 0.25 }));
    inside.scale.z = 1.35; inside.position.set(cx - CX, 43.1, cz - CZ); root.add(inside);
    const seat = new THREE.Mesh(new THREE.TorusGeometry(16, 2.2, 10, 40), M.whiteGloss);
    seat.scale.set(1, 1.35, 1); seat.rotation.x = Math.PI / 2; seat.position.set(cx - CX, 43.8, cz - 1 - CZ); seat.castShadow = true; root.add(seat);
    box(406, 438, 755.5, 757.5, 44, 86, M.whiteGloss);                            // lid, standing up against the wall
    // white rectangular "Switch" flush plate, 22 × 15, centred at x 422 and 105 high, with two buttons
    box(411, 433, 757.0, 757.6, 97.5, 112.5, M.whiteGloss);
    box(413, 421, 756.6, 757.0, 100, 110, M.white);
    box(423, 431, 756.6, 757.0, 100, 110, M.white);
  })();

  /* ---------- wall tiles ---------- */
  // Thin plane just in front of a wall face. rotY 0 / π: runs along x at depth `at` (a z value);
  // rotY ±π/2: runs along z at depth `at` (an x value). One texture repeat = 60 cm (8 columns of 7.5 × 15 tiles, 4 rows).
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
  cladPanel(363, 463, 757.6, 0, H, Math.PI, cladding);            // front of the cistern wall, behind the toilet
  cladPanel(758, 778, 362.6, 0, H, -Math.PI / 2, cladding);       // west side of the cistern wall (behind the vanity)
  cladPanel(698, 758, 462.6, 0, H, -Math.PI / 2, cladding);       // east wall (opening to niche starts at z 698)
  cladPanel(383, 547, 648.4, 0, H, 0, cladding);                  // north wall beside the door and the solid wall
  cladPanel(164, 302, 648.4, 0, 160, 0, cladding);                // low wall, shower side

  /* ---------- rain head (height above the raised shower floor): thin round head 25 Ø on a wall arm ---------- */
  const rainGroup = new THREE.Group(); root.add(rainGroup);
  function buildRain(h) {
    while (rainGroup.children.length) rainGroup.remove(rainGroup.children[0]);
    const y = 15 + h;
    const arm = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.1, 36, 16), M.roseGold);
    arm.rotation.z = Math.PI / 2; arm.position.set(182 - CX, y + 2.6, 721 - CZ); arm.castShadow = true; rainGroup.add(arm);
    const flange = new THREE.Mesh(new THREE.CylinderGeometry(2.6, 2.6, 1, 20), M.roseGold);
    flange.rotation.z = Math.PI / 2; flange.position.set(164.5 - CX, y + 2.6, 721 - CZ); rainGroup.add(flange);
    const stub = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.1, 2.4, 12), M.roseGold);
    stub.position.set(200 - CX, y + 1.6, 721 - CZ); rainGroup.add(stub);
    const head = new THREE.Mesh(new THREE.CylinderGeometry(12.5, 12.5, 0.8, 40), M.roseGold);
    head.position.set(200 - CX, y + 0.4, 721 - CZ); head.castShadow = true; rainGroup.add(head);
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
