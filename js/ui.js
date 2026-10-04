/* ui.js — panel readouts, labels, camera views, door animation, theme sync and control wiring.
 * Exposes: B.updateWardKv, B.updateKitchenNote, B.updateRainNote, B.updateSofaKv, B.renderShopping, B.syncLighting,
 *          B.setDoorProp, B.stepDoors, B.updateLabels, B.goView, B.stepCamera
 */
(function (B) {
  "use strict";
  if (B.failed) return;
  const { H, CX, CZ, M, scene, camera, controls, canvas, stage, ceiling, doors, wallMeshes, tvState, WARDS, WX, V } = B;
  const $ = (s) => document.querySelector(s);

  /* ---------- readouts ---------- */
  function updateWardKv(key) {
    const o = WARDS[key];
    const front = WX + o.d;
    const passage = 170 - front;
    const gap = Math.round((H - o.h) * 10) / 10;
    $("#wardKv").innerHTML =
      "<dt>מיקום</dt><dd>קיר מערבי · x 20–" + (20 + Math.round(o.d * 10) / 10) + " · z " + (o.z0 === undefined ? 398 : o.z0) + "–" + ((o.z0 === undefined ? 398 : o.z0) + (o.w || 240)) + "</dd>" +
      "<dt>רוחב × עומק</dt><dd class='num'>" + (o.w || 240) + "×" + Math.round(o.d * 10) / 10 + " ס״מ</dd>" +
      "<dt>מעבר עד המטבחון</dt><dd class='num'>" + Math.round(passage) + " ס״מ</dd>" +
      "<dt>מרווח לתקרה</dt><dd class='num'>" + (gap <= 0 ? "עד התקרה" : gap + " ס״מ") + "</dd>";
  }
  function updateKitchenNote(L) {
    const width = +L;
    $("#kitNote").textContent = width <= 110
      ? "המטבחון קטן וצפוף: מכונת קפה, כיור, מתקן ייבוש כלים, ומעליהם מדף עם כוסות זכוכית לקור וקרמיקה לחם."
      : "המטבחון מרווח מעט יותר, אבל עדיין שומר על תצורה קומפקטית: מכונת קפה, כיור, מדף עליון וכמה כלי שתייה.";
  }
  function updateRainNote() {
    const rain = +document.querySelector("input[name=rain]:checked").value;
    const ph = +$("#personH").value;
    const gap = rain - ph;
    const cls = gap >= 15 ? "good" : gap >= 5 ? "warn" : "bad";
    const word = gap >= 15 ? "מספיק" : gap >= 5 ? "צפוף" : gap >= 0 ? "כמעט נוגע" : "ראש הגשם נמוך מהראש";
    $("#rainNote").innerHTML =
      "גובה החלל במקלחון אחרי ההגבהה: <b class='num'>205</b> ס״מ. בין הראש לראש הגשם: <b class='num'>" + gap + "</b> ס״מ <span class='pill " + cls + "'>" + word + "</span>";
  }

  // Clearances around the KIVIK sofa, to the kitchenette counter front (z 578), the east wall beside it
  // (x 473: the entry-door wall and the alcove) and the coffee table's south edge (z 382). Under 60 → warning.
  function updateSofaKv() {
    const S = B.SOFA;
    const gaps = [
      ["מאחור, עד דלפק המטבחון", 578 - S.z1],
      ["מהקצה המזרחי עד הקיר", 473 - S.x1],
      ["מקדימה, עד שולחן הקפה", S.z0 - 382],
    ];
    $("#sofaKv").innerHTML =
      "<dt>מיקום</dt><dd class='num'>x " + S.x0 + "–" + S.x1 + " · z " + S.z0 + "–" + S.z1 + "</dd>" +
      gaps.map(([k, v]) => "<dt>" + k + "</dt><dd><span class='num'>" + v + " ס״מ</span>" +
        (v < 60 ? " <span class='pill warn'>פחות מ־60</span>" : "") + "</dd>").join("");
  }

  // Shopping list. `unsure` = price not confirmed yet (shown with "?"); the total adds up by itself.
  const n = (x) => "<span class='num'>" + x + "</span>";
  const SHOPPING = [
    { name: "KIVIK", what: "ספה תלת־מושבית", sub: n("228×95×83") + " · ריפוד Tibbleby בז׳/אפור · שלד " + n("1,950") + " + ריפוד " + n(345), price: 2295 },
    { name: "STORKLINTA × 2", what: "שידת 2 מגירות, אפקט אלון", sub: n("40×50×53") + " · " + n(325) + " ₪ ליחידה", price: 650 },
    { name: "BLÅSVERK", what: "מנורת שולחן צהובה", sub: "גובה " + n(36) + " · המחיר נקרא מתג מטושטש", price: 95, unsure: true },
    { name: "LOKALTÅG", what: "שטיח בערימה קצרה, בז׳/אפור", sub: n("133×195"), price: 245 },
  ];
  const shekel = (v, unsure) => v.toLocaleString("en-US") + " ₪" + (unsure ? "?" : "");
  function renderShopping() {
    $("#shopList").innerHTML = SHOPPING.map(i =>
      "<tr><td><b>" + i.name + "</b> · " + i.what + "<span class='sub'>" + i.sub + "</span></td><td class='num'>" + shekel(i.price, i.unsure) + "</td></tr>").join("");
    const total = SHOPPING.reduce((t, i) => t + i.price, 0), unsure = SHOPPING.some(i => i.unsure);
    $("#shopTotal").innerHTML = "<tr><th>סה״כ</th><th class='num'>" + shekel(total, unsure) + "</th></tr>";
    $("#shopNote").textContent = unsure ? "סימן שאלה: המחיר עוד לא אושר." : "";
  }

  /* ---------- labels (HTML overlay, projected every frame) ---------- */
  const LABELS = [
    ["מיטה", 120, 70, 150], ["ארון בגדים", 54, 240, 540], ["מטבחון", 220, 108, 610], ["ספה KIVIK", 276, 95, 470],
    ["כורסה", 170, 96, 340], ["שולחן כתיבה", 434, 88, 83], ["מקלחון", 204, 212, 700], ["כיור", 312, 118, 752],
    ["אסלה", 422, 64, 725], ["נישת מדפים", 515, 205, 684], ["ארון בגומחה", 511, 228, 560],
    ["כניסה מהמדרגות", 478, 222, 375], ["קיר המדרגות", 464, 236, 150, "stairs"],
  ];
  const labelWrap = $("#labels");
  const labelEls = LABELS.map(l => {
    const e = document.createElement("div"); e.className = "lab" + (l[4] ? " " + l[4] : ""); e.textContent = l[0];
    labelWrap.appendChild(e); return { e, v: V(l[1], l[2], l[3]) };
  });
  let labelsOn = true;
  const tmpV = new THREE.Vector3();
  function updateLabels() {
    const show = labelsOn && !isFirstPerson;
    labelWrap.hidden = !show;
    if (!show) return;
    const w = stage.clientWidth, h = stage.clientHeight;
    labelEls.forEach(l => {
      tmpV.copy(l.v).project(camera);
      if (tmpV.z > 1 || Math.abs(tmpV.x) > 1.1 || Math.abs(tmpV.y) > 1.1) { l.e.style.display = "none"; return; }
      l.e.style.display = "";
      l.e.style.left = ((tmpV.x + 1) / 2 * w) + "px";
      l.e.style.top = ((1 - tmpV.y) / 2 * h) + "px";
    });
  }

  /* ---------- camera views ---------- */
  // pos = camera position, look = where it looks (plan coords). fp = first-person (eye level, ceiling on).
  const VIEWS = {
    over: { pos: V(650, 690, 1040), look: V(290, 0, 410), fp: false },
    plan: { pos: V(286, 1150, 402), look: V(286, 0, 400), fp: false },
    entry: { pos: V(462, 160, 372), look: V(100, 105, 330), fp: true },
    sofa: { pos: V(276, 108, 480), look: V(251, 106, 20), fp: true },   // seated on the KIVIK, looking at the TV
    bed: { pos: V(62, 102, 150), look: V(464, 105, 225), fp: true },
    arm: { pos: V(158, 106, 340), look: V(464, 108, 270), fp: true },
    kitchen: { pos: V(260, 190, 590), look: V(220, 80, 560), fp: true },
    bath: { pos: V(448, 168, 655), look: V(220, 120, 732), fp: true },
  };
  let isFirstPerson = false;
  let tween = null;
  const reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  function applyMode(fp) {
    isFirstPerson = fp;
    ceiling.visible = fp;
    controls.enableZoom = !fp;
    controls.enablePan = !fp;
    controls.rotateSpeed = fp ? -0.32 : 0.8;       // negative in first person = drag to look around
    controls.minDistance = fp ? 0.5 : 120;
    controls.maxDistance = fp ? 2 : 2600;
    controls.minPolarAngle = fp ? 0.25 * Math.PI : 0;
    controls.maxPolarAngle = fp ? 0.78 * Math.PI : 0.47 * Math.PI;
    camera.fov = fp ? 72 : 50; camera.updateProjectionMatrix();
    $("#hint").textContent = fp
      ? "גררו כדי להסתכל סביב. לחזרה: מבט על."
      : "גררו לסיבוב, גלגלת או צביטה לזום, שתי אצבעות או קליק ימני להזזה.";
  }
  function goView(key, instant) {
    const v = VIEWS[key];
    document.querySelectorAll("#views button").forEach(b => b.setAttribute("aria-pressed", b.dataset.view === key ? "true" : "false"));
    let targetPos = v.pos.clone(), targetLook = v.look.clone();
    if (v.fp) { const dir = targetLook.clone().sub(targetPos).normalize(); targetLook = targetPos.clone().addScaledVector(dir, 1); }
    else if (camera.aspect < 1) { targetPos = targetLook.clone().add(targetPos.clone().sub(targetLook).multiplyScalar(1 + (1 - camera.aspect) * 1.1)); }
    applyMode(v.fp);
    if (instant || reduceMotion) { camera.position.copy(targetPos); controls.target.copy(targetLook); controls.update(); tween = null; return; }
    tween = { t0: performance.now(), dur: 750, p0: camera.position.clone(), l0: controls.target.clone(), p1: targetPos, l1: targetLook };
  }
  function stepCamera(now) {
    if (!tween) return;
    let k = Math.min(1, (now - tween.t0) / tween.dur);
    k = k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
    camera.position.lerpVectors(tween.p0, tween.p1, k);
    controls.target.lerpVectors(tween.l0, tween.l1, k);
    if (k >= 1) tween = null;
  }
  document.querySelectorAll("#views button").forEach(b => b.addEventListener("click", () => goView(b.dataset.view)));

  /* ---------- doors animation ---------- */
  function setDoorProp(d, val) { if (d.prop === "ry") d.obj.rotation.y = val; else d.obj.position.z = val; d.cur = val; }
  let doorsOpen = false;
  function stepDoors() {
    doors.forEach(d => {
      const target = doorsOpen ? d.open : d.closed;
      if (d.cur === undefined) d.cur = d.prop === "ry" ? d.obj.rotation.y : d.obj.position.z;
      if (Math.abs(target - d.cur) < 1e-3) return;
      setDoorProp(d, reduceMotion ? target : d.cur + (target - d.cur) * 0.14);
    });
  }

  /* ---------- theme-aware background ---------- */
  function syncBg() {
    const c = getComputedStyle(document.documentElement).getPropertyValue("--scene-bg").trim() || "#e3e6eb";
    scene.background = new THREE.Color(c);
  }
  syncBg();
  if (window.matchMedia) window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", syncBg);
  new MutationObserver(syncBg).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

  /* ---------- control wiring ---------- */
  const radios = (name, fn) => document.querySelectorAll("input[name=" + name + "]").forEach(r => r.addEventListener("change", () => r.checked && fn(r.value)));
  const tvNotes = {
    north: "על הקיר הצפוני, ממורכז מתחת למזגן, מול הספה.",
    stairs: "ההצעה של המעצבת: על קיר הגבס החדש שסוגר את הפתח לחדר המדרגות.",
    free: "לחצו על כל קיר במודל כדי להעביר אליו את הטלוויזיה.",
  };
  let placing = false;
  radios("tvpos", v => {
    placing = v === "free";
    stage.classList.toggle("placing", placing);
    $("#tvPosNote").textContent = tvNotes[v];
    if (!placing) B.setTvPreset(v);
  });
  radios("tvsize", v => { tvState.size = +v; B.buildTvMesh(); B.placeTv(); });
  $("#tvH").addEventListener("input", e => { tvState.y = +e.target.value; $("#tvHOut").textContent = e.target.value + " ס״מ"; B.placeTv(); });
  $("#tvTurn").addEventListener("input", e => {
    tvState.turn = +e.target.value * Math.PI / 180;
    $("#tvTurnOut").textContent = e.target.value + "°";
    B.placeTv();
  });
  $("#tvExtend").addEventListener("input", e => {
    tvState.extension = +e.target.value;
    $("#tvExtendOut").textContent = e.target.value + " ס״מ";
    B.buildTvMesh();
    B.placeTv();
  });
  radios("ward", v => B.buildWardrobe(v));
  radios("kit", v => { B.buildKitchen(+v); updateKitchenNote(+v); });
  radios("frame", v => { M.frame.color.set(v === "black" ? "#232427" : "#f3f3f1"); M.frame.roughness = v === "black" ? 0.4 : 0.5; });
  radios("glass", v => {
    M.glass.map = v === "fluted" ? B.flutedTex : null;
    M.glass.opacity = v === "fluted" ? 0.62 : 0.2;
    M.glass.needsUpdate = true;
  });
  radios("bdoor", v => B.setBathDoor(v));
  radios("rain", v => { B.buildRain(+v); updateRainNote(); });
  $("#personH").addEventListener("input", e => { $("#personHOut").textContent = e.target.value + " ס״מ"; B.buildPerson(+e.target.value); updateRainNote(); });
  $("#optDoors").addEventListener("change", e => { doorsOpen = e.target.checked; });
  $("#optLabels").addEventListener("change", e => { labelsOn = e.target.checked; });
  // Lighting: reads every lighting control and applies them (lights.js). Also called once at start (main.js).
  function syncLighting() {
    const tone = +$("#warmTone").value, wl = +$("#warmLevel").value, cl = +$("#ceilLevel").value;
    $("#warmToneOut").textContent = "≈" + B.warmKelvin(tone / 100) + "K";
    $("#warmLevelOut").textContent = wl + "%";
    $("#ceilLevelOut").textContent = cl + "%";
    B.setWarmLights({ on: $("#warmOn").checked, tone: tone / 100, level: wl / 100 });
    B.setCeilingLights({ on: $("#ceilOn").checked, level: cl / 100 });
    B.setEvening($("#optEvening").checked);
  }
  ["#optEvening", "#warmOn", "#warmTone", "#warmLevel", "#ceilOn", "#ceilLevel"].forEach(id => $(id).addEventListener("input", syncLighting));
  $("#optNew").addEventListener("change", e => {
    const on = e.target.checked;
    M.newWall.color.set(on ? "#f2c2bb" : "#f2f0eb");
    M.newCap.color.set(on ? "#d1382a" : "#8f959e");
  });

  // Wall raycasting supports click-to-place and dragging the TV along a wall.
  const ray = new THREE.Raycaster(), ptr = new THREE.Vector2();
  let downAt = null;
  let tvDrag = null;
  let draggingTv = false;
  function pointerRay(clientX, clientY) {
    const r = canvas.getBoundingClientRect();
    ptr.set(((clientX - r.left) / r.width) * 2 - 1, -((clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ptr, camera);
  }
  function pickWall(clientX, clientY) {
    pointerRay(clientX, clientY);
    const hit = ray.intersectObjects(wallMeshes, false)[0];
    if (!hit || !hit.face) return null;
    const n = hit.face.normal.clone().transformDirection(hit.object.matrixWorld);
    if (Math.abs(n.y) > 0.3) return null;
    n.y = 0; n.normalize();
    return { hit, normal: n };
  }
  canvas.addEventListener("pointerdown", e => {
    downAt = [e.clientX, e.clientY];
    pointerRay(e.clientX, e.clientY);
    const tvHit = ray.intersectObjects(B.tv.children, true)[0];
    if (tvHit) {
      tvDrag = { startX: e.clientX, startY: e.clientY };
      draggingTv = false;
      controls.enabled = false;
      if (canvas.setPointerCapture) canvas.setPointerCapture(e.pointerId);
    }
  });
  canvas.addEventListener("pointermove", e => {
    if (!tvDrag) return;
    if (Math.hypot(e.clientX - tvDrag.startX, e.clientY - tvDrag.startY) < 5) return;
    draggingTv = true;
    const picked = pickWall(e.clientX, e.clientY);
    if (!picked) return;
    tvState.point.copy(picked.hit.point); tvState.point.y = 0;
    tvState.normal.copy(picked.normal);
    B.placeTv();
  });
  function finishTvDrag() {
    controls.enabled = true;
    if (draggingTv) controls.update();
    tvDrag = null; draggingTv = false;
  }
  canvas.addEventListener("pointercancel", finishTvDrag);
  canvas.addEventListener("pointerup", e => {
    if (tvDrag) {
      finishTvDrag(); downAt = null; return;
    }
    if (!placing || !downAt || Math.hypot(e.clientX - downAt[0], e.clientY - downAt[1]) > 6) { downAt = null; return; }
    const picked = pickWall(e.clientX, e.clientY);
    if (!picked) { downAt = null; return; }
    tvState.point.copy(picked.hit.point); tvState.point.y = 0;
    tvState.normal.copy(picked.normal);
    B.placeTv();
    downAt = null;
  });

  Object.assign(B, { updateWardKv, updateKitchenNote, updateRainNote, updateSofaKv, renderShopping, syncLighting, setDoorProp, stepDoors, updateLabels, goView, stepCamera });
})(window.B);
