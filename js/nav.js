/* nav.js — the walkable grid (10 cm cells over the plan) and A* pathfinding for the residents.
 * Walkable = the floor rectangles from room.js + the door gaps. Blocked = walls (from WALLS, automatic) and the
 * furniture in OBJECTS below, each a plan rectangle. When a piece of furniture moves, change its rect here; the
 * wardrobe and kitchenette follow the panel options by themselves. `B.nav.showGrid(true)` draws the grid to check it.
 * Exposes: B.nav = { CELL, OBJECTS, rebuild, isFree, nearestFree, findPath, elevation, nearestObject, showGrid }
 */
(function (B) {
  "use strict";
  if (B.failed) return;
  const { CX, CZ, WALLS, MAIN_FLOORS, BATH_FLOORS, WARDS, WX, root } = B;

  const CELL = 10, COLS = 58, ROWS = 80;                  // covers x 0–580, z 0–800
  const WALL_PAD = 14, OBJ_PAD = 11;                      // the body centre keeps this far from walls / furniture
  const DOOR_GAPS = [[307, 383, 636, 650]];               // bathroom doorway (no floor mesh there)
  const RAISED = [{ rect: [164, 244, 648, 778], y: 15 }]; // shower tray

  // Furniture that blocks walking: plan rectangles [x0, x1, z0, z1] and a Hebrew name (for "standing by the …").
  // `dyn` entries are computed from the current panel options.
  const state = { ward: "paxglass", kitchen: 110 };
  const OBJECTS = [
    { key: "bed", name: "המיטה", rect: [20, 220, 80, 220] },
    { key: "nightstandN", name: "השידה", rect: [20, 70, 36, 76] },
    { key: "nightstandS", name: "השידה", rect: [20, 70, 224, 264] },
    { key: "desk", name: "שולחן הכתיבה", rect: [399, 464, 80, 260] },
    { key: "chair", name: "כיסא הכתיבה", rect: [355, 391, 150, 190] },
    { key: "armchairW", name: "הכורסה", rect: [132, 208, 298, 383] },
    { key: "armchairE", name: "הכורסה", rect: [366, 442, 298, 383] },
    { key: "coffeeTable", name: "שולחן הקפה", rect: [247, 327, 307, 382] },
    { key: "sofa", name: "הספה", rect: [162, 390, 423, 518] },
    { key: "floorLamp", name: "מנורת העמידה", rect: [411, 439, 456, 484] },
    { key: "alcoveCloset", name: "הארון בגומחה", rect: [473, 547, 485, 638] },
    { key: "vanity", name: "הכיור", rect: [263, 362, 731, 778] },
    { key: "toilet", name: "האסלה", rect: [404, 440, 706, 758] },     // wall-hung bowl; the cistern wall behind it comes from WALLS
    { key: "showerGlass", name: "המקלחון", rect: [241, 246, 708, 778] }, // the fixed panel; the door (z 648–708) is the way in
    { key: "niche", name: "נישת המדפים", rect: [483, 547, 648, 720] },
    { key: "wardrobe", name: "ארון הבגדים", dyn: () => { const o = WARDS[state.ward]; const z0 = o.z0 === undefined ? 398 : o.z0; return [WX, WX + o.d, z0, z0 + (o.w || 240)]; } },
    { key: "kitchen", name: "המטבחון", dyn: () => [170, 170 + state.kitchen, 578, 638] },
  ];
  const rectOf = (o) => o.dyn ? o.dyn() : o.rect;

  /* ---------- grid ---------- */
  const grid = new Uint8Array(COLS * ROWS);               // 1 = blocked
  const idx = (cx, cz) => cz * COLS + cx;
  const inRect = (x, z, r, pad) => x >= r[0] - pad && x <= r[1] + pad && z >= r[2] - pad && z <= r[3] + pad;
  function rebuild() {
    const floors = MAIN_FLOORS.concat(BATH_FLOORS, DOOR_GAPS);
    const walls = WALLS.filter(w => w[4] < 100);          // not the header above the entry door
    const objs = OBJECTS.map(rectOf);
    for (let cz = 0; cz < ROWS; cz++) for (let cx = 0; cx < COLS; cx++) {
      const x = cx * CELL + CELL / 2, z = cz * CELL + CELL / 2;
      let free = floors.some(r => inRect(x, z, r, 0));
      if (free) free = !walls.some(w => inRect(x, z, w, WALL_PAD)) && !objs.some(r => inRect(x, z, r, OBJ_PAD));
      grid[idx(cx, cz)] = free ? 0 : 1;
    }
    if (gridMesh) showGrid(true);
  }
  const cellOf = (x, z) => [Math.floor(x / CELL), Math.floor(z / CELL)];
  const blockedAt = (cx, cz, extra) => cx < 0 || cz < 0 || cx >= COLS || cz >= ROWS || grid[idx(cx, cz)] === 1 || (extra !== null && extra[idx(cx, cz)] === 1);
  const isFree = (x, z, extra) => !blockedAt(Math.floor(x / CELL), Math.floor(z / CELL), extra || null);
  // nearest free cell (centre, in cm) within `maxR` cells, searching outward
  function nearestFree(x, z, extra, maxR) {
    const [cx, cz] = cellOf(x, z);
    for (let r = 0; r <= (maxR || 20); r++) {
      let best = null, bestD = Infinity;
      for (let dz = -r; dz <= r; dz++) for (let dx = -r; dx <= r; dx++) {
        if (Math.max(Math.abs(dx), Math.abs(dz)) !== r) continue;
        if (blockedAt(cx + dx, cz + dz, extra || null)) continue;
        const px = (cx + dx) * CELL + CELL / 2, pz = (cz + dz) * CELL + CELL / 2, d = Math.hypot(px - x, pz - z);
        if (d < bestD) { bestD = d; best = { x: px, z: pz }; }
      }
      if (best) return best;
    }
    return null;
  }
  const elevation = (x, z) => { const r = RAISED.find(q => inRect(x, z, q.rect, 0)); return r ? r.y : 0; };
  function nearestObject(x, z, maxD) {
    let best = null, bestD = maxD || 60;
    OBJECTS.forEach(o => {
      const r = rectOf(o);
      const d = Math.hypot(Math.max(r[0] - x, 0, x - r[1]), Math.max(r[2] - z, 0, z - r[3]));
      if (d < bestD) { bestD = d; best = o; }
    });
    return best;
  }

  /* ---------- A* with diagonals (no corner cutting) ---------- */
  function astar(sx, sz, gx, gz, extra) {
    const n = COLS * ROWS, gS = new Float32Array(n).fill(Infinity), fS = new Float32Array(n), from = new Int32Array(n).fill(-1), closed = new Uint8Array(n);
    const open = [];
    const push = (i) => { open.push(i); let k = open.length - 1; while (k > 0) { const pr = (k - 1) >> 1; if (fS[open[pr]] <= fS[open[k]]) break; [open[pr], open[k]] = [open[k], open[pr]]; k = pr; } };
    const pop = () => {
      const top = open[0], last = open.pop();
      if (open.length) { open[0] = last; let k = 0; for (;;) { const a = 2 * k + 1, c = a + 1; let m = k; if (a < open.length && fS[open[a]] < fS[open[m]]) m = a; if (c < open.length && fS[open[c]] < fS[open[m]]) m = c; if (m === k) break; [open[m], open[k]] = [open[k], open[m]]; k = m; } }
      return top;
    };
    const h = (cx, cz) => { const dx = Math.abs(cx - gx), dz = Math.abs(cz - gz); return dx + dz + (Math.SQRT2 - 2) * Math.min(dx, dz); };
    const start = idx(sx, sz), goal = idx(gx, gz);
    gS[start] = 0; fS[start] = h(sx, sz); push(start);
    while (open.length) {
      const cur = pop();
      if (cur === goal) break;
      if (closed[cur]) continue;
      closed[cur] = 1;
      const cx = cur % COLS, cz = (cur / COLS) | 0;
      for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
        if (!dx && !dz) continue;
        const nx = cx + dx, nz = cz + dz;
        if (blockedAt(nx, nz, extra)) continue;
        if (dx && dz && (blockedAt(cx + dx, cz, extra) || blockedAt(cx, cz + dz, extra))) continue;
        const ni = idx(nx, nz), ng = gS[cur] + (dx && dz ? Math.SQRT2 : 1);
        if (ng < gS[ni]) { gS[ni] = ng; fS[ni] = ng + h(nx, nz); from[ni] = cur; push(ni); }
      }
    }
    if (goal !== start && from[goal] < 0) return null;
    const cells = [];
    for (let i = goal; i >= 0; i = from[i]) { cells.push(i); if (i === start) break; }
    return cells.reverse();
  }
  // straight segment free of obstacles? (sampled every 4 cm)
  function lineFree(a, b, extra) {
    const d = Math.hypot(b.x - a.x, b.z - a.z), n = Math.max(1, Math.ceil(d / 4));
    for (let i = 0; i <= n; i++) if (!isFree(a.x + (b.x - a.x) * i / n, a.z + (b.z - a.z) * i / n, extra)) return false;
    return true;
  }
  // string-pulling: keep only the corners that are needed
  function smooth(pts, extra) {
    const out = [pts[0]];
    let i = 0;
    while (i < pts.length - 1) {
      let j = pts.length - 1;
      while (j > i + 1 && !lineFree(pts[i], pts[j], extra)) j--;
      out.push(pts[j]); i = j;
    }
    return out;
  }
  // from/to in plan cm. avoid: [{x, z, r}] cells blocked for this search only (the other resident).
  // Returns waypoints [{x, z}] starting at `from`, or null when there is no way.
  function findPath(from, to, avoid) {
    let extra = null;
    if (avoid && avoid.length) {
      extra = new Uint8Array(COLS * ROWS);
      avoid.forEach(a => {
        const [acx, acz] = cellOf(a.x, a.z), rc = Math.ceil(a.r / CELL);
        for (let dz = -rc; dz <= rc; dz++) for (let dx = -rc; dx <= rc; dx++) {
          const cx = acx + dx, cz = acz + dz;
          if (cx < 0 || cz < 0 || cx >= COLS || cz >= ROWS) continue;
          if (Math.hypot(dx, dz) * CELL <= a.r) extra[idx(cx, cz)] = 1;
        }
      });
      const [fcx, fcz] = cellOf(from.x, from.z);                     // never block where we stand
      if (fcx >= 0 && fcz >= 0 && fcx < COLS && fcz < ROWS) extra[idx(fcx, fcz)] = 0;
    }
    const s = nearestFree(from.x, from.z, extra, 6), g = nearestFree(to.x, to.z, extra, 20);
    if (!s || !g) return null;
    const cells = astar(...cellOf(s.x, s.z), ...cellOf(g.x, g.z), extra);
    if (!cells) return null;
    const pts = cells.map(i => ({ x: (i % COLS) * CELL + CELL / 2, z: ((i / COLS) | 0) * CELL + CELL / 2 }));
    pts[0] = { x: from.x, z: from.z };
    if (isFree(to.x, to.z, extra)) pts[pts.length - 1] = { x: to.x, z: to.z };
    return smooth(pts, extra);
  }

  /* ---------- debug overlay: blocked cells in red, free in green (B.nav.showGrid(true)) ---------- */
  let gridMesh = null;
  function showGrid(on) {
    if (gridMesh) { root.remove(gridMesh); gridMesh.geometry.dispose(); gridMesh.material.map.dispose(); gridMesh.material.dispose(); gridMesh = null; }
    if (!on) return;
    const data = new Uint8Array(COLS * ROWS * 4);
    for (let i = 0; i < COLS * ROWS; i++) { const b = grid[i]; data[i * 4] = b ? 220 : 40; data[i * 4 + 1] = b ? 50 : 200; data[i * 4 + 2] = 40; data[i * 4 + 3] = 140; }
    const tex = new THREE.DataTexture(data, COLS, ROWS); tex.flipY = true; tex.needsUpdate = true;
    gridMesh = new THREE.Mesh(new THREE.PlaneGeometry(COLS * CELL, ROWS * CELL), new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false }));
    gridMesh.rotation.x = -Math.PI / 2; gridMesh.position.set(COLS * CELL / 2 - CX, 2, ROWS * CELL / 2 - CZ); root.add(gridMesh);
  }

  // the wardrobe and kitchenette options change the obstacles
  const bw = B.buildWardrobe, bk = B.buildKitchen;
  B.buildWardrobe = (key) => { bw(key); state.ward = key; rebuild(); };
  B.buildKitchen = (L) => { bk(L); state.kitchen = Math.max(110, Math.min(120, +L || 110)); rebuild(); };
  rebuild();

  B.nav = { CELL, OBJECTS, rebuild, isFree, nearestFree, findPath, elevation, nearestObject, showGrid };
})(window.B);
