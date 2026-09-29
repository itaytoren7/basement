/* room.js — floors, ceiling, walls, windows, entry door and the bathroom vitrine + glass door.
 * All numbers are plan coordinates in cm (see core.js).
 * Exposes: B.wall, B.ceiling, B.doors, B.WALLS
 */
(function (B) {
  "use strict";
  if (B.failed) return;
  const { H, CX, CZ, M, root, box, lbox, floorRect, wallMeshes } = B;

  /* ---------- floors & ceiling ---------- */
  const MAIN_FLOORS = [
    [20, 464, 20, 638],   // main room, inner 444 × 618
    [464, 473, 320, 485], // strip in front of the new door wall
    [473, 547, 485, 638], // east alcove (built-in closet)
    [473, 483, 330, 420], // entry door threshold
  ];
  const BATH_FLOORS = [
    [164, 463, 648, 778], // bathroom, inner 299 × 130
    [463, 483, 648, 689], // 41 cm opening to the niche
    [483, 547, 648, 720], // shelf niche
  ];
  MAIN_FLOORS.forEach(r => floorRect(r[0], r[1], r[2], r[3], 0, M.floor, 60));
  BATH_FLOORS.forEach(r => floorRect(r[0], r[1], r[2], r[3], 0, M.bathFloor, 30));

  // ceiling is shown only in first-person views (ui.js → applyMode)
  const ceiling = new THREE.Group(); root.add(ceiling);
  MAIN_FLOORS.concat(BATH_FLOORS).forEach(r => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(r[1] - r[0], r[3] - r[2]), M.ceiling);
    m.rotation.x = Math.PI / 2; m.position.set((r[0] + r[1]) / 2 - CX, H, (r[2] + r[3]) / 2 - CZ);
    ceiling.add(m);
  });
  ceiling.visible = false;

  /* ---------- walls ---------- */
  const WALL_MATS = [M.wall, M.wall, M.cap, M.wall, M.wall, M.wall];      // box faces: +x, -x, +y(top), -y, +z, -z
  const NEW_MATS = [M.newWall, M.newWall, M.newCap, M.newWall, M.newWall, M.newWall];
  // Add a wall. Always use this (not box) for walls, so the TV click-placement can find it.
  function wall(x0, x1, z0, z1, y0, y1, isNew, parent) {
    const m = box(x0, x1, z0, z1, y0, y1, isNew ? NEW_MATS : WALL_MATS, parent);
    m.userData.wall = true; wallMeshes.push(m);
    return m;
  }

  // x0, x1, z0, z1, y0, y1, new? (1 = new wall, red hatch in the drawing)
  const WALLS = [
    [0, 484, 0, 20, 0, H, 0],          // north wall (AC pipes go into this wall)
    [0, 20, 20, 40, 0, H, 0],          // west wall, north of the window
    [0, 20, 40, 200, 0, 130, 0],       // under the bedroom window (sill height assumed)
    [0, 20, 200, 638, 0, H, 0],        // west wall
    [0, 164, 638, 658, 0, H, 0],       // wall behind the kitchenette
    [144, 164, 658, 798, 0, H, 0],     // bathroom west wall
    [164, 322, 778, 798, 0, 161, 0],   // under the bathroom window (sill 161)
    [322, 483, 778, 798, 0, H, 0],     // bathroom south wall
    [464, 484, 20, 257, 0, H, 1],      // "stairs wall": new drywall closing the old opening (237)
    [464, 484, 257, 320, 0, H, 0],
    [473, 483, 320, 330, 0, H, 1],     // new wall with the entry door
    [473, 483, 330, 420, 205, H, 1],   // header above the 90 cm door
    [473, 483, 420, 453, 0, H, 1],
    [473, 483, 453, 475, 0, H, 0],
    [473, 572, 475, 485, 0, H, 0],     // alcove north wall
    [547, 572, 485, 740, 0, H, 0],     // alcove + niche east wall
    [463, 572, 720, 740, 0, H, 0],     // niche south wall
    [463, 483, 689, 778, 0, H, 0],     // bathroom east wall (41 cm opening to the niche north of it)
    [361, 547, 638, 648, 0, H, 1],     // new wall between room and bathroom
    [164, 282, 638, 648, 0, 160, 1],   // low wall up to 160 behind the kitchenette (vitrine glass above)
  ];
  WALLS.forEach(w => wall(w[0], w[1], w[2], w[3], w[4], w[5], !!w[6]));

  /* ---------- windows ---------- */
  function windowPane(x0, x1, z0, z1, y0, y1) {
    box(x0, x1, z0, z1, y0, y1, M.winGlass, root, { noCast: true }).castShadow = false;
  }
  windowPane(8, 12, 40, 200, 130, H);          // bedroom window over the bed (height assumed: 130–220)
  box(4, 22, 40, 200, 128, 131, M.white);        // sill
  windowPane(164, 322, 786, 790, 161, H);      // bathroom window 158 × 59, sill 161
  box(164, 322, 776, 792, 159, 162, M.white);
  box(241, 245, 786, 791, 161, H, M.white);      // the sashes meet here — shower glass lines up with it

  /* ---------- doors ---------- */
  // Each entry: { obj, prop: "ry" (rotation.y) | "pz" (position.z), closed, open, ward? }
  const doors = [];
  // entry door: hinge at the north end of the 90 cm opening, swings into the room
  (function () {
    const pivot = new THREE.Group(); pivot.position.set(478 - CX, 0, 330 - CZ); root.add(pivot);
    lbox(4, 203, 88, 0, 101.5, 45, M.white, pivot);
    lbox(3, 3, 12, -3.5, 100, 78, M.steel, pivot);
    doors.push({ obj: pivot, prop: "ry", closed: 0, open: -Math.PI / 2 * 0.95 });
  })();

  /* ---------- bathroom vitrine + glass door (frame colour and glass type are UI options) ---------- */
  (function vitrine() {
    // glass above the 160 low wall
    box(164, 282, 642, 644, 163, 217, M.glass, root, { noCast: true }).castShadow = false;
    box(164, 282, 640, 646, 160, 163, M.frame);
    box(164, 282, 640, 646, 217, H, M.frame);
    [[164, 167], [221.5, 224.5], [279, 282]].forEach(p => box(p[0], p[1], 640, 646, 163, 217, M.frame));
    box(282, 289, 639, 647, 0, H, M.frame);           // post
    // transom over the door
    box(289, 361, 640, 646, 204, 207, M.frame);
    box(289, 361, 642, 644, 207, 217, M.glass, root, { noCast: true }).castShadow = false;
    box(289, 361, 640, 646, 217, H, M.frame);
    box(358, 361, 639, 647, 0, 204, M.frame);
    // door leaf: 72 cm, hinge on the west side, swings into the bathroom
    const pivot = new THREE.Group(); pivot.position.set(289 - CX, 0, 643 - CZ); root.add(pivot);
    const fw = 4;
    lbox(fw, 204, 3, fw / 2, 102, 0, M.frame, pivot);
    lbox(fw, 204, 3, 69 - fw / 2, 102, 0, M.frame, pivot);
    lbox(69, fw, 3, 34.5, 202, 0, M.frame, pivot);
    lbox(69, fw + 6, 3, 34.5, 5, 0, M.frame, pivot);
    const g = lbox(69 - 2 * fw, 190, 1.2, 34.5, 104, 0, M.glass, pivot); g.castShadow = false;
    lbox(2, 22, 5, 62, 105, 0, M.chrome, pivot);
    doors.push({ obj: pivot, prop: "ry", closed: 0, open: -Math.PI / 2 * 0.95 });
  })();

  Object.assign(B, { wall, ceiling, doors, WALLS });
})(window.B);
