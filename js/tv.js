/* tv.js — the TV: sizes, preset positions, placement, and the viewing readout.
 * Current choice (user): under the AC on the north wall. The designer's suggestion (stairs wall) stays as an option.
 * Exposes: B.tv, B.tvState, B.TV_SIZES, B.buildTvMesh(), B.placeTv(), B.setTvPreset(key)
 */
(function (B) {
  "use strict";
  if (B.failed) return;
  const { CX, CZ, M, root, lbox } = B;

  const TV_SIZES = { 43: [96, 56], 50: [112, 65], 55: [123, 71], 65: [145, 83] }; // inch → [width, height] cm
  const AC = { x0: 203, x1: 298, bottom: 186 };                                    // AC unit on the north wall
  const tv = new THREE.Group(); root.add(tv);
  // point = where the TV touches the wall (scene coords, y ignored); normal = direction the screen faces
  const tvState = { size: 50, y: 110, point: new THREE.Vector3(), normal: new THREE.Vector3(0, 0, 1) };

  function buildTvMesh() {
    while (tv.children.length) tv.remove(tv.children[0]);
    const [w, h] = TV_SIZES[tvState.size];
    lbox(w, h, 3, 0, 0, 0, M.black, tv);
    const s = new THREE.Mesh(new THREE.PlaneGeometry(w - 1.6, h - 1.6), M.screen);
    s.position.z = 1.55; tv.add(s);
    lbox(20, 14, 2, 0, 0, -2.4, M.black, tv);   // wall mount
  }

  function placeTv() {
    const p = tvState.point.clone().addScaledVector(tvState.normal, 4);
    tv.position.set(p.x, tvState.y, p.z);
    tv.lookAt(p.x + tvState.normal.x, tvState.y, p.z + tvState.normal.z);
    updateTvTable();
    // gap between the top of the screen and the AC, when the TV is under it
    const el = document.getElementById("tvAcGap");
    const [w, h] = TV_SIZES[tvState.size];
    const cx = p.x + CX, onNorth = tvState.normal.z > 0.9 && p.z + CZ < 40;
    const under = onNorth && cx + w / 2 > AC.x0 && cx - w / 2 < AC.x1;
    el.hidden = !under;
    if (under) {
      const gap = Math.round(AC.bottom - (tvState.y + h / 2));
      const cls = gap >= 20 ? "good" : gap >= 5 ? "warn" : "bad";
      el.innerHTML = gap < 0 ? "<span class='pill bad'>המסך עולה על המזגן</span> הורידו את הגובה או בחרו מסך קטן יותר."
        : "בין החלק העליון של המסך לתחתית המזגן: <b class='num'>" + gap + "</b> ס״מ <span class='pill " + cls + "'>" + (gap >= 20 ? "מרווח טוב" : "צפוף") + "</span>";
    }
  }

  const TV_PRESETS = {
    north: { x: 250.5, z: 20, n: [0, 1] },   // centred under the AC (x 203–298) — user's choice
    stairs: { x: 464, z: 238, n: [-1, 0] },  // designer's suggestion: new drywall on the stairs wall
  };
  function setTvPreset(k) {
    const p = TV_PRESETS[k];
    tvState.point.set(p.x - CX, 0, p.z - CZ);
    tvState.normal.set(p.n[0], 0, p.n[1]);
    placeTv();
  }

  // seats for the viewing readout: plan position, facing direction, eye height
  const SEATS = [
    { name: "ספה", p: [276, 470], f: [0, -1], eye: 105 },
    { name: "כורסה", p: [160, 340], f: [1, 0], eye: 105 },
    { name: "מיטה", p: [60, 150], f: [1, 0], eye: 100 },
  ];
  function updateTvTable() {
    const tx = tv.position.x + CX, tz = tv.position.z + CZ, n = tvState.normal;
    const rows = SEATS.map(s => {
      const dx = tx - s.p[0], dz = tz - s.p[1];
      const dist = Math.hypot(dx, dz);
      const head = Math.acos(Math.max(-1, Math.min(1, (dx * s.f[0] + dz * s.f[1]) / dist))) * 180 / Math.PI;
      const facing = (-dx * n.x + -dz * n.z) / dist;   // > 0 means the screen faces the seat
      let cls, txt;
      if (facing < 0.26) { cls = "bad"; txt = "המסך לא פונה"; }
      else if (head <= 25) { cls = "good"; txt = Math.round(head) + "° · נוח"; }
      else if (head <= 50) { cls = "warn"; txt = Math.round(head) + "° · סביר"; }
      else { cls = "bad"; txt = Math.round(head) + "°"; }
      return "<tr><td>" + s.name + "</td><td class='num'>" + Math.round(dist) + " ס״מ</td><td><span class='pill " + cls + "'>" + txt + "</span></td></tr>";
    });
    document.getElementById("tvTable").innerHTML = rows.join("");
  }

  Object.assign(B, { tv, tvState, TV_SIZES, buildTvMesh, placeTv, setTvPreset });
})(window.B);
