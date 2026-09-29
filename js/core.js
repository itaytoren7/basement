/* core.js — shared namespace, renderer, scene, camera, lights and geometry helpers.
 *
 * Every script adds to one global object, window.B, and later scripts read from it.
 * Load order (see index.html): core → materials → room → furniture → bathroom → tv → ui → main.
 *
 * Plan coordinates (used everywhere): centimetres, measured from the designer's drawing.
 *   origin = outer top-left corner of the building outline on the drawing
 *   x → east  (right on the drawing)
 *   z → south (down on the drawing)
 *   y → up    (floor = 0, ceiling = B.H = 220)
 * The helpers below take plan coordinates and subtract (CX, CZ) so the model sits around the scene origin.
 */
window.B = window.B || {};
(function (B) {
  "use strict";
  if (!window.THREE) {
    B.failed = true;
    document.getElementById("loading").textContent = "הספרייה התלת־ממדית לא נטענה. בדקו חיבור לאינטרנט ורעננו את הדף.";
    return;
  }

  const H = 220;            // ceiling height (designer: 220 before the shower is raised)
  const CX = 286, CZ = 400; // scene centre in plan coordinates
  Object.assign(B, { H, CX, CZ, ARMCHAIR_BACK_X: 132 });

  THREE.ColorManagement.legacyMode = false;
  const canvas = document.getElementById("c");
  const stage = document.getElementById("stage");
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(55, 1, 2, 6000);
  const controls = new THREE.OrbitControls(camera, canvas);
  controls.enableDamping = true;
  controls.dampingFactor = 0.09;

  /* ---------- lights ---------- */
  scene.add(new THREE.HemisphereLight(0xffffff, 0xcfc6b8, 0.72));
  scene.add(new THREE.AmbientLight(0xffffff, 0.18));
  const sun = new THREE.DirectionalLight(0xfff6ea, 0.85);
  sun.position.set(-220, 700, 260);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -460, right: 460, top: 520, bottom: -520, near: 100, far: 1600 });
  sun.shadow.bias = -0.0004;
  sun.shadow.normalBias = 0.6;
  scene.add(sun);
  const fill = new THREE.PointLight(0xfff3e0, 0.35, 900, 1.6);
  fill.position.set(250 - CX, 200, 330 - CZ);
  scene.add(fill);

  /* ---------- geometry helpers ---------- */
  const root = new THREE.Group(); scene.add(root);
  const wallMeshes = []; // every wall mesh; the TV "click on a wall" mode raycasts against these

  // Axis-aligned box from plan coordinates: x0..x1, z0..z1, y0..y1.
  function box(x0, x1, z0, z1, y0, y1, mat, parent, opt) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(Math.abs(x1 - x0), Math.abs(y1 - y0), Math.abs(z1 - z0)), mat);
    m.position.set((x0 + x1) / 2 - CX, (y0 + y1) / 2, (z0 + z1) / 2 - CZ);
    m.castShadow = !(opt && opt.noCast);
    m.receiveShadow = true;
    (parent || root).add(m);
    return m;
  }
  // Box in a group's local space (no plan offset) — used for doors that rotate around a hinge.
  function lbox(w, h, d, x, y, z, mat, parent) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true;
    parent.add(m); return m;
  }
  // Vertical cylinder centred at plan (x, z), mid-height y.
  function cyl(r, h, x, y, z, mat, parent, seg) {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, seg || 20), mat);
    m.position.set(x - CX, y, z - CZ); m.castShadow = true; m.receiveShadow = true;
    (parent || root).add(m); return m;
  }
  // Horizontal rectangle (floor) with UVs scaled so one texture repeat = `tile` cm.
  function floorRect(x0, x1, z0, z1, y, mat, tile) {
    const g = new THREE.PlaneGeometry(x1 - x0, z1 - z0);
    const uv = g.attributes.uv;
    for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * (x1 - x0) / tile, uv.getY(i) * (z1 - z0) / tile);
    const m = new THREE.Mesh(g, mat);
    m.rotation.x = -Math.PI / 2;
    m.position.set((x0 + x1) / 2 - CX, y, (z0 + z1) / 2 - CZ);
    m.receiveShadow = true;
    root.add(m); return m;
  }
  // Plan point → scene vector.
  const V = (x, y, z) => new THREE.Vector3(x - CX, y, z - CZ);

  Object.assign(B, { canvas, stage, renderer, scene, camera, controls, sun, root, wallMeshes, box, lbox, cyl, floorRect, V });
})(window.B);
