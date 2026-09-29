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
  // point = wall anchor (scene coords, y ignored); normal = wall direction; turn pivots ±90°.
  const tvState = { size: 50, y: 110, point: new THREE.Vector3(), normal: new THREE.Vector3(0, 0, 1), turn: 0, extension: 20 };
  const swing = new THREE.Group(); tv.add(swing);
  const screen = new THREE.Group();
  const wallPlate = new THREE.Group(); tv.add(wallPlate);

  function clearGroup(group) {
    while (group.children.length) {
      const child = group.children[0];
      group.remove(child);
      child.traverse(o => { if (o.geometry) o.geometry.dispose(); });
    }
  }

  function buildTvMesh() {
    clearGroup(screen);
    if (screen.parent) screen.parent.remove(screen);
    clearGroup(swing);
    clearGroup(wallPlate);
    const [w, h] = TV_SIZES[tvState.size];
    const extension = Math.max(10, Math.min(45, tvState.extension || 20));
    const elbow = extension * 0.52;

    // Wall plate remains flush to the wall while the paired links swivel and extend.
    lbox(24, 22, 2, 0, 0, 1, M.black, wallPlate);
    [-1, 1].forEach(side => {
      const x = side * 7;
      const firstLen = Math.max(1, elbow - 3);
      const secondLen = Math.max(1, extension - elbow - 2);
      lbox(4, 5, firstLen, x, 0, 2.5 + firstLen / 2, M.steel, swing);
      lbox(4, 5, secondLen, x, 0, elbow + 1 + secondLen / 2, M.steel, swing);
      [2.5, elbow, extension - 1].forEach(z => {
        const joint = new THREE.Mesh(new THREE.CylinderGeometry(2.7, 2.7, 5, 20), M.black);
        joint.rotation.z = Math.PI / 2;
        joint.position.set(x, 0, z);
        swing.add(joint);
      });
    });

    screen.position.set(0, 0, extension);
    lbox(22, 18, 2, 0, 0, -2, M.black, screen); // TV-side mounting plate
    lbox(w, h, 3, 0, 0, 0, M.black, screen);
    const s = new THREE.Mesh(new THREE.PlaneGeometry(w - 1.6, h - 1.6), M.screen);
    s.position.z = 1.55; screen.add(s);
    swing.add(screen);
  }

  function placeTv() {
    const wallNormal = tvState.normal.clone().normalize();
    const turn = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, tvState.turn || 0));
    tvState.extension = Math.max(10, Math.min(45, tvState.extension || 20));
    tv.position.set(tvState.point.x, tvState.y, tvState.point.z);
    tv.lookAt(tv.position.x + wallNormal.x, tvState.y, tv.position.z + wallNormal.z);
    swing.rotation.y = turn;
    screen.position.z = tvState.extension;
    updateTvTable();
    // gap between the top of the screen and the AC, when the TV is under it
    const el = document.getElementById("tvAcGap");
    const [w, h] = TV_SIZES[tvState.size];
    const p = screen.getWorldPosition(new THREE.Vector3());
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
    tvState.turn = 0;
    placeTv();
  }

  // seats for the viewing readout: plan position, facing direction, eye height
  const SEATS = [
    { name: "ספה", p: [276, 470], f: [0, -1], eye: 105 },
    { name: "כורסה", p: [160, 340], f: [1, 0], eye: 105 },
    { name: "מיטה", p: [60, 150], f: [1, 0], eye: 100 },
  ];
  function updateTvTable() {
    const screenCenter = screen.getWorldPosition(new THREE.Vector3());
    const tx = screenCenter.x + CX, tz = screenCenter.z + CZ;
    const wallNormal = tvState.normal.clone().normalize();
    const tangent = new THREE.Vector3(-wallNormal.z, 0, wallNormal.x).normalize();
    const n = wallNormal.multiplyScalar(Math.cos(tvState.turn || 0)).addScaledVector(tangent, Math.sin(tvState.turn || 0));
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
