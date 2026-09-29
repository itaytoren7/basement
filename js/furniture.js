/* furniture.js — furniture from the designer's layout, the kitchenette and the wardrobe options.
 * Positions are plan coordinates in cm, read off the drawing.
 * Exposes: B.buildKitchen(L), B.buildWardrobe(key), B.WARDS, B.WX
 */
(function (B) {
  "use strict";
  if (B.failed) return;
  const { CX, CZ, M, std, root, box, lbox, cyl, doors } = B;

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
  // nightstands + lamps
  [[20, 80], [220, 280]].forEach(z => {
    box(20, 55, z[0] + 4, z[1] - 4, 8, 50, M.oak);
    box(54.6, 55.2, z[0] + 8, z[1] - 8, 30, 31, M.groove);
    cyl(7, 3, 38, 51.5, (z[0] + z[1]) / 2, M.white);
    cyl(1, 26, 38, 64, (z[0] + z[1]) / 2, M.black);
    const shade = cyl(10, 16, 38, 82, (z[0] + z[1]) / 2, std({ color: "#f5ecd9", emissive: "#f3d9a4", emissiveIntensity: 0.35 }));
    shade.castShadow = false;
  });
  box(170, 289, 59, 249, 0, 0.8, M.rug);
  // desk + chair against the stairs wall
  box(404, 464, 20, 146, 72, 75, M.oak);
  [[406, 410], [458, 462]].forEach(x => [[22, 26], [140, 144]].forEach(z => box(x[0], x[1], z[0], z[1], 0, 72, M.black)));
  box(366, 398, 66, 100, 43, 47, M.fabric2);
  box(364, 368, 66, 100, 47, 86, M.fabric2);
  [[366, 369], [395, 398]].forEach(x => [[67, 70], [96, 99]].forEach(z => box(x[0], x[1], z[0], z[1], 0, 43, M.black)));
  // air conditioner on the north wall (x 203–298, 186–214 high)
  box(203, 298, 20, 40, 186, 214, M.ac);
  box(206, 295, 39.6, 40.2, 188, 192, M.groove);
  // armchair (faces east) + coffee table
  box(132, 208, 298, 383, 6, 40, M.armchair);
  box(132, 147, 298, 383, 40, 86, M.armchair);
  box(147, 208, 298, 310, 40, 60, M.armchair);
  box(147, 208, 371, 383, 40, 60, M.armchair);
  box(147, 206, 310, 371, 40, 47, std({ color: "#d3b48f", roughness: 1 }));
  box(247, 327, 307, 382, 40, 43, M.oak);
  [[250, 253], [321, 324]].forEach(x => [[310, 313], [376, 379]].forEach(z => box(x[0], x[1], z[0], z[1], 0, 40, M.black)));
  // sofa 150 wide (faces north)
  box(201, 351, 430, 506, 8, 40, M.fabric);
  box(201, 351, 491, 506, 40, 82, M.fabric);
  box(201, 213, 430, 491, 40, 62, M.fabric);
  box(339, 351, 430, 491, 40, 62, M.fabric);
  box(213.5, 275.5, 432, 490, 40, 49, M.fabric2);
  box(276.5, 338.5, 432, 490, 40, 49, M.fabric2);
  box(214, 275, 478, 491, 49, 78, M.fabric2);
  box(277, 338, 478, 491, 49, 78, M.fabric2);
  [[204, 208], [344, 348]].forEach(x => [[433, 437], [499, 503]].forEach(z => box(x[0], x[1], z[0], z[1], 0, 8, M.black)));
  // built-in closet in the east alcove (73 × 153)
  box(476, 547, 485, 638, 0, 214, M.white);
  box(475.4, 476, 486, 637, 4, 212, M.white);
  box(475.2, 475.6, 561, 562, 6, 210, M.groove);
  box(474, 476, 548, 550, 95, 120, M.steel);
  box(474, 476, 573, 575, 95, 120, M.steel);

  /* ---------- kitchenette (length 200 / 250 is a UI option) ---------- */
  // along the south wall from x = 20, 60 deep (z 578–638); 90 cm clear passage to the wardrobe
  const kitchen = new THREE.Group(); root.add(kitchen);
  function buildKitchen(L) {
    while (kitchen.children.length) { const c = kitchen.children[0]; kitchen.remove(c); c.geometry && c.geometry.dispose(); }
    const x0 = 20, x1 = 20 + L, z0 = 578, z1 = 638;
    box(x0, x1, z0 + 6, z1, 0, 10, M.groove, kitchen);
    box(x0, x1, z0 + 2, z1, 10, 86, M.white, kitchen);
    box(x0, x1, z0, z1, 86, 90, M.counter, kitchen);
    const n = L === 250 ? 5 : 4, w = L / n;
    for (let i = 1; i < n; i++) box(x0 + i * w - 0.3, x0 + i * w + 0.3, z0 + 1.6, z0 + 2.2, 12, 84, M.groove, kitchen);
    for (let i = 0; i < n; i++) box(x0 + i * w + 8, x0 + i * w + w - 8, z0 + 1, z0 + 2, 80, 81.5, M.steel, kitchen);
    box(100, 150, 592, 626, 90, 90.4, std({ color: "#8a8e93", roughness: 0.3, metalness: 0.6 }), kitchen); // sink
    cyl(1.4, 28, 125, 104, 631, M.chrome, kitchen);
    box(124, 126, 612, 631, 116, 118, M.chrome, kitchen);
    box(x1 - 60, x1 - 12, 588, 630, 90, 90.7, M.darkGlass, kitchen);                            // cooktop
    box(25, 160, 614, 638, 150, 152.5, M.oakLight, kitchen);                                     // open shelf on the solid wall
    [40, 62, 84].forEach((x, i) => cyl(4 + i, 10 + i * 3, x, 152.5 + (10 + i * 3) / 2, 626, std({ color: ["#e6e1d6", "#c8d3d9", "#d9c6a8"][i], roughness: 0.6 }), kitchen));
  }

  /* ---------- wardrobe options (west wall, z 288–488, 200 wide) ---------- */
  // d = total depth incl. doors, h = height. Prices and sizes: store websites, Sep 2026.
  const WARDS = {
    storklinta: { d: 60, h: 201.2, type: "hinged", sections: [100, 100], doorsPer: [2, 2], body: M.white, front: M.oak, shelves: M.white, name: "IKEA PAX / STORKLINTA" },
    hasvik:     { d: 66, h: 201, type: "sliding", sections: [100, 100], body: M.whiteOak, front: M.whiteOak, shelves: M.white, name: "IKEA PAX / HASVIK" },
    harel:      { d: 52.5, h: 213, type: "hinged", sections: [80, 40, 80], doorsPer: [2, 1, 2], drawers: 1, body: M.harelOak, front: M.harelOak, shelves: M.white, name: "הראל · גיל" },
    carp:       { d: 60, h: 220, type: "hinged", sections: [100, 100], doorsPer: [2, 2], body: M.oakLight, front: M.oakLight, shelves: M.oakLight, name: "נגרות" },
  };
  const WZ0 = 288, WZ1 = 488, WX = 20;
  const wardrobe = new THREE.Group(); root.add(wardrobe);

  function buildWardrobe(key) {
    while (wardrobe.children.length) wardrobe.remove(wardrobe.children[0]);
    doors.splice(0, doors.length, ...doors.filter(d => !d.ward));
    const o = WARDS[key];
    const dc = o.type === "sliding" ? o.d - 8 : o.d - 2;   // carcass depth
    const xb = WX, xf = WX + dc;
    const h = o.h;
    box(xb, xb + 1.6, WZ0, WZ1, 0, h, o.body, wardrobe);                // back
    box(xb, xf, WZ0, WZ0 + 1.8, 0, h, o.body, wardrobe);                // sides
    box(xb, xf, WZ1 - 1.8, WZ1, 0, h, o.body, wardrobe);
    box(xb, xf, WZ0, WZ1, h - 1.8, h, o.body, wardrobe);                // top
    box(xb, xf, WZ0, WZ1, 0, 8, o.body, wardrobe);                      // plinth/bottom
    let z = WZ0;
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
    // doors
    if (o.type === "sliding") {
      const half = (WZ1 - WZ0) / 2;
      [0, 1].forEach(i => {
        const g = new THREE.Group(); g.position.set((xf + (i ? 5.5 : 2)) - CX, 0, 0); wardrobe.add(g);
        const za = WZ0 + i * half;
        lbox(1.8, h - 8, half, 0, (h - 8) / 2 + 4, za + half / 2 - CZ, o.front, g);
        lbox(0.6, h - 8, 1.2, 0.8, (h - 8) / 2 + 4, za + (i ? 2 : half - 2) - CZ, M.steel, g);
        doors.push({ obj: g, prop: "pz", closed: 0, open: i ? -(half - 6) : 0, ward: true });
      });
      box(xf, xf + 8, WZ0, WZ1, h - 4, h, o.body, wardrobe);
      box(xf, xf + 8, WZ0, WZ1, 0, 4, o.body, wardrobe);
    } else {
      let z2 = WZ0;
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
          lbox(1.8, y1 - y0, w - 0.4, 0, (y0 + y1) / 2, s * (w / 2), o.front, pivot);
          lbox(1.2, key === "harel" ? 30 : 22, 1.4, 1.6, 100, s * (w - 4), M.black, pivot);
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

  Object.assign(B, { buildKitchen, buildWardrobe, WARDS, WX });
})(window.B);
