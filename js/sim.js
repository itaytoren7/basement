/* sim.js — life mode: a visualisation of the two residents living in the unit (not a game).
 *  - selecting a resident, walking along paths from nav.js, residents giving way to each other
 *  - doors that open when someone passes and close behind them, stepping up onto the raised shower floor
 *  - ACTIVITIES: what a resident can do (sleep, shower, work, TV, coffee, ...); each is a short list of steps:
 *    walk somewhere, hold a pose (optionally sliding into a seat), run a side effect. Picked from the panel or by
 *    clicking the object itself. It goes on until something else is picked.
 *  - effects: shower water and steam, the TV and desk screens, wardrobe doors
 *  - the clock: hour of day → daylight (lights.js) and the lamps switch themselves on when it gets dark
 *  - the life-mode camera (follow the selected resident, cut the walls facing the camera)
 * Exposes: B.sim = { active, people, order, selected, hour, walls, follow, ACTIVITIES, setActive, select, click,
 *          goTo, startActivity, setOutfit, setHour, applyClock, setWalls, step }
 */
(function (B) {
  "use strict";
  if (B.failed) return;
  const { CX, CZ, V, M, camera, controls, doors, wallParts, floorMeshes, canvas, stage, nav, person, root, std } = B;

  const order = ["itay", "mia"];
  const people = {}; order.forEach(k => { people[k] = B.makePerson(k); });
  const sim = { active: false, people, order, selected: "itay", hour: 7, walls: "cut", follow: false };
  const WALK = 95;                   // cm/s, an unhurried indoor walk
  const BODY = 22;                   // body radius: residents keep ~2 × this apart
  const CUT_H = 40;                  // cut walls drop to this height
  // Doors open while a resident walks through the zone in front of them (plan rects), and close behind.
  const DOOR_ZONES = { entry: [428, 522, 316, 434], bath: [294, 394, 598, 692], shower: [222, 266, 646, 714] };
  const doorByName = (n) => doors.find(d => d.name === n);
  const wardrobeFront = () => nav.OBJECTS.find(o => o.key === "wardrobe").dyn()[1];   // x of the wardrobe doors

  const labelWrap = document.getElementById("plabels");
  order.forEach(k => { labelWrap.appendChild(people[k].label); people[k].label.addEventListener("click", () => select(k)); people[k].obj.visible = false; });
  const hitMeshes = order.map(k => people[k].hit);
  const ray = new THREE.Raycaster(), ptr = new THREE.Vector2(), tmp = new THREE.Vector3();

  /* ---------- activities ----------
   * steps: { go: [x, z, yaw] } walk there (yaw = face this way on arrival)
   *        { pose: { name, seat|y, ... }, at: [x, z, yaw], secs, now, prop, start(p) } hold a pose; `at` slides the body
   *          into a seat / onto the bed over a second; `secs` = how long (omit = until something else is picked)
   *        { fn(p) } a side effect (outfit, screens, water, doors)
   * now: present-tense [m, f] for the status line. inf: the name in the panel. both: the activity is for the two of them.
   * keep: the activity stays "current" after its last step (outside the house); otherwise the resident is just standing again.
   * going: status text while walking there (default: הולך/הולכת + inf).
   */
  const SOFA_SEATS = { itay: 231, mia: 321 };                       // x of the two seat cushions
  const sofaSeatFor = (p) => { const o = other(p); return (o.act && o.act.seat !== undefined && o.act.seat === SOFA_SEATS[p.key]) ? SOFA_SEATS[o.key] : SOFA_SEATS[p.key]; };
  const other = (p) => people[order.find(k => k !== p.key)];
  // the armchair the other one is not sitting in: W (faces east) unless taken, then E (faces west)
  const armchairFor = (p) => {
    const o = other(p), west = !(o.act && o.act.armchair === "W");
    p.act.armchair = west ? "W" : "E";
    return west ? { go: [225, 340, -Math.PI / 2], at: [162, 340, Math.PI / 2] } : { go: [345, 340, Math.PI / 2], at: [412, 340, -Math.PI / 2] };
  };
  const bedSpot = (p) => p.cfg.bedSide === "north" ? { go: [160, 48, 0], at: [117, 115, Math.PI / 2] } : { go: [160, 252, Math.PI], at: [117, 185, Math.PI / 2] };
  const dressSteps = (p, outfit) => [
    { go: () => [wardrobeFront() + 32, 513, -Math.PI / 2] },
    { fn: () => setWardrobe(true) },
    { pose: { name: "dress" }, secs: 5, now: ["מתלבש", "מתלבשת"] },
    { fn: () => { p.setOutfit(outfit); p.wear = outfit; setWardrobe(false); } },
  ];
  const ACTIVITIES = {
    idle:   { inf: "לעמוד", now: ["עומד", "עומדת"], steps: () => [] },
    sleep:  { inf: "לישון", now: ["ישן", "ישנה"], steps: (p) => [
      ...(p.outfit === "pajama" ? [] : dressSteps(p, "pajama")),
      { go: bedSpot(p).go },
      { pose: { name: "lie", y: 54 }, at: bedSpot(p).at, start: () => { p.eyesClosed = true; } },
    ], end: (p) => { p.eyesClosed = false; } },
    shower: { inf: "להתקלח", now: ["מתקלח", "מתקלחת"], steps: (p) => [
      { go: [205, 721, -Math.PI / 2] },
      { fn: () => { p.setOutfit("towel"); setShower(true); } },
      { pose: { name: "shower" } },
    ], end: (p) => { setShower(false); p.setOutfit(p.wear); } },
    toilet: { inf: "ללכת לשירותים", now: ["בשירותים", "בשירותים"], going: "בדרך לשירותים", steps: () => [
      { go: [422, 688, 0] },
      { pose: { name: "toilet", seat: 44 }, at: [422, 735, Math.PI] },
    ] },
    wash:   { inf: "לרחוץ ידיים", now: ["רוחץ ידיים", "רוחצת ידיים"], steps: () => [
      { go: [312, 714, 0] },
      { pose: { name: "wash" } },
    ] },
    work:   { inf: "לעבוד בשולחן", now: ["עובד בשולחן", "עובדת בשולחן"], steps: () => [
      { go: [340, 170, Math.PI / 2] },
      { fn: () => setDeskScreen(true) },
      { pose: { name: "type", seat: 47 }, at: [368, 170, Math.PI / 2] },
    ], end: () => setDeskScreen(false) },
    sofa:   { inf: "לשבת על הספה", now: ["יושב על הספה", "יושבת על הספה"], steps: (p) => { const x = sofaSeatFor(p); p.act.seat = x; return [
      { go: [x, 405, Math.PI] },
      { pose: { name: "sit", seat: 45 }, at: [x, 468, Math.PI] },
    ]; } },
    tv:     { inf: "לראות טלוויזיה", now: ["רואה טלוויזיה", "רואה טלוויזיה"], steps: (p) => { const x = sofaSeatFor(p); p.act.seat = x; return [
      { go: [x, 405, Math.PI] },
      { fn: () => setTv(true) },
      { pose: { name: "sit", seat: 45, headDown: -0.06 }, at: [x, 468, Math.PI] },
    ]; }, end: (p) => { if (!(other(p).act && other(p).act.key === "tv")) setTv(false); } },
    coffee: { inf: "לשתות קפה", now: ["שותה קפה", "שותה קפה"], steps: (p) => { const c = armchairFor(p); return [
      { go: [195, 555, 0] },
      { pose: { name: "press" }, secs: 7, now: ["מכין קפה", "מכינה קפה"] },
      { fn: () => { p.showProp("cup"); p.carry = true; } },
      { pose: { name: "hold" }, secs: 1.2, now: ["מכין קפה", "מכינה קפה"] },
      { go: c.go },
      { pose: { name: "drink", seat: 47 }, at: c.at },
    ]; }, end: (p) => { p.showProp(null); p.carry = false; } },
    read:   { inf: "לקרוא בכורסה", now: ["קורא בכורסה", "קוראת בכורסה"], steps: (p) => { const c = armchairFor(p); return [
      { go: c.go },
      { pose: { name: "read", seat: 47 }, at: c.at, prop: "book" },
    ]; }, end: (p) => p.showProp(null) },
    phone:  { inf: "להסתכל בטלפון", now: ["בטלפון", "בטלפון"], steps: () => [
      { pose: { name: "phone" }, prop: "phone" },
    ], end: (p) => p.showProp(null) },
    dress:  { inf: "להתלבש", now: ["מתלבש", "מתלבשת"], hidden: true, steps: (p) => dressSteps(p, p.act.outfit || "home") },
    leave:  { inf: "לצאת מהבית", now: ["מחוץ לבית", "מחוץ לבית"], keep: true, steps: () => [
      { go: [468, 375, Math.PI / 2] },
      { fn: (p) => { p.away = true; p.obj.visible = false; p.label.style.display = "none"; } },
    ] },
    // for the two of them
    sofaBoth: { inf: "לשבת יחד על הספה", now: ["יושבים יחד על הספה"], both: true, steps: (p) => [
      { go: [SOFA_SEATS[p.key], 405, Math.PI] },
      { pose: { name: "sit", seat: 45, headYaw: p.key === "itay" ? 0.35 : -0.35 }, at: [SOFA_SEATS[p.key], 468, Math.PI] },
    ] },
    talk:   { inf: "לדבר", now: ["מדברים"], both: true, steps: (p) => [
      { go: p.key === "itay" ? [254, 405, Math.PI / 2] : [316, 405, -Math.PI / 2] },
      { pose: { name: "talk", phase: p.key === "itay" ? 0 : 2.1 } },
    ] },
    hug:    { inf: "להתחבק", now: ["מתחבקים"], both: true, steps: (p) => [
      { go: p.key === "itay" ? [266, 405, Math.PI / 2] : [304, 405, -Math.PI / 2] },
      { pose: { name: "hug" }, secs: 8 },
      { pose: { name: "talk", phase: p.key === "itay" ? 0 : 2.1 }, now: ["מדברים"] },
    ] },
  };
  // click on an object in the model → its activity
  const OBJECT_ACTS = { bed: "sleep", sofa: "sofa", desk: "work", chair: "work", armchairW: "read", armchairE: "read", kitchen: "coffee", wardrobe: "dress", toilet: "toilet", vanity: "wash" };

  function stopActivity(p) {
    if (p.act && ACTIVITIES[p.act.key].end) ACTIVITIES[p.act.key].end(p);
    p.act = null; p.pose = null; p.path = null; p.goal = null; p.resume = null; p.faceYaw = undefined; p.carry = false; p.showProp(null); p.eyesClosed = false;
    if (p.away) { p.away = false; p.obj.visible = true; p.label.style.display = ""; p.pos = { x: 466, z: 375 }; p.yaw = -Math.PI / 2; }
  }
  // Start an activity for a resident (or for both when the activity is shared). opts: { outfit } for "dress".
  function startActivity(key, p, opts) {
    const a = ACTIVITIES[key];
    (a.both ? order.map(k => people[k]) : [p]).forEach(q => {
      stopActivity(q);
      q.act = Object.assign({ key, i: 0, t: 0, steps: null }, opts || {});
      q.act.steps = a.steps(q);
    });
    if (B.simui) B.simui.refresh();
  }
  function setOutfit(p, outfit) { startActivity("dress", p, { outfit }); }
  function runActivity(p, dt) {
    const a = p.act; if (!a) return;
    const s = a.steps[a.i];
    if (!s) return;                                                   // finished: stays as it is
    if (s.go) {
      const g = typeof s.go === "function" ? s.go() : s.go, o = other(p), nxt = a.steps[a.i + 1];
      const spots = nxt && nxt.at ? [g, nxt.at] : [g];              // the spot itself, and the seat it leads to
      const taken = !o.away && !o.path && spots.some(q => Math.hypot(o.pos.x - q[0], o.pos.z - q[1]) < 40);   // the other one is there
      if (!a.started) { if (taken) return; a.started = true; if (!goTo(p, g[0], g[1], { yaw: g[2] })) { next(p); return; } }
      else if (!p.path && !p.goal && p.faceYaw === undefined) {
        if (taken) { a.started = false; return; }                   // wait a step away until the spot is free, then go again
        next(p);
      }
      return;
    }
    if (s.fn) { s.fn(p); next(p); return; }
    if (s.pose) {
      if (!a.started) {
        a.started = true; a.t = 0; p.pose = s.pose; if (s.prop) p.showProp(s.prop); if (s.start) s.start(p);
        if (s.at) { a.from = { x: p.pos.x, z: p.pos.z }; a.at = s.at; } else a.at = null;
      }
      a.t += dt;
      if (a.at) {                                                     // slide into the seat / onto the bed
        const k = Math.min(1, a.t / 1.2), e = k * k * (3 - 2 * k);
        p.pos.x = a.from.x + (a.at[0] - a.from.x) * e; p.pos.z = a.from.z + (a.at[2 - 1] - a.from.z) * e;
        turnToward(p, a.at[2], dt, 3);
      }
      if (s.secs !== undefined && a.t >= s.secs) next(p);
    }
  }
  function next(p) {
    const a = p.act; a.i++; a.started = false; a.at = null;
    if (a.i >= a.steps.length) { p.pose = null; if (!ACTIVITIES[a.key].keep) p.act = null; }   // done: standing again
    if (B.simui) B.simui.refresh();
  }
  // present-tense status for the panel
  function activityStatus(p) {
    const a = p.act; if (!a) return null;
    const s = a.steps[a.i], act = ACTIVITIES[a.key];
    if (s && s.go) return (act.going || (p.v("הולך", "הולכת") + (act.both ? "" : " " + act.inf))) + "…";
    const now = (s && s.now) || act.now;
    return now.length === 1 ? now[0] : p.v(now[0], now[1]);
  }

  /* ---------- effects ---------- */
  function setWardrobe(open) { doors.forEach(d => { if (d.ward) d.sim = open; }); }
  function setDeskScreen(on) { B.deskScreen.color.set(on ? "#8fbaff" : "#172537"); }
  // TV: a canvas that changes picture every few seconds, and a soft blue light in front of the screen
  const tvCanvas = document.createElement("canvas"); tvCanvas.width = 160; tvCanvas.height = 90;
  const tvTex = new THREE.CanvasTexture(tvCanvas); tvTex.encoding = THREE.sRGBEncoding;
  const tvLight = new THREE.PointLight("#8fb0ff", 0, 320, 2); root.add(tvLight);
  const screenOff = { map: M.screen.map, color: M.screen.color.clone() };
  let tvOn = false, tvT = 0, tvSeed = 1;
  function tvFrame() {
    const g = tvCanvas.getContext("2d"), r = () => (tvSeed = (tvSeed * 16807) % 2147483647) / 2147483647;
    const hues = [205, 30, 120, 340, 60, 190];
    const h = hues[Math.floor(r() * hues.length)];
    const gr = g.createLinearGradient(0, 0, 160, 90);
    gr.addColorStop(0, "hsl(" + h + ", 45%, " + (35 + r() * 25) + "%)"); gr.addColorStop(1, "hsl(" + ((h + 40) % 360) + ", 40%, " + (15 + r() * 20) + "%)");
    g.fillStyle = gr; g.fillRect(0, 0, 160, 90);
    for (let i = 0; i < 5; i++) { g.fillStyle = "hsla(" + ((h + r() * 80) % 360) + ", 50%, " + (40 + r() * 40) + "%, " + (0.25 + r() * 0.4) + ")"; g.fillRect(r() * 150, r() * 80, 10 + r() * 60, 6 + r() * 40); }
    g.fillStyle = "rgba(255,255,255,.08)"; g.fillRect(0, 70, 160, 20);
    tvTex.needsUpdate = true;
  }
  function setTv(on) {
    tvOn = on; tvT = 99;
    M.screen.map = on ? tvTex : screenOff.map; M.screen.color.copy(on ? new THREE.Color("#ffffff") : screenOff.color); M.screen.needsUpdate = true;
    tvLight.intensity = on ? 0.45 : 0;
  }
  function placeTvLight() {
    const n = B.tvState.normal;
    tvLight.position.set(B.tv.position.x + n.x * (B.tvState.extension + 30), B.tvState.y, B.tv.position.z + n.z * (B.tvState.extension + 30));
  }
  // shower: falling drops under the rain head (200, 721) and steam behind the glass
  const DROPS = 240, dropPos = new Float32Array(DROPS * 3), dropSpeed = new Float32Array(DROPS);
  for (let i = 0; i < DROPS; i++) { const a = Math.random() * Math.PI * 2, rr = Math.sqrt(Math.random()) * 12; dropPos[i * 3] = 200 + Math.cos(a) * rr - CX; dropPos[i * 3 + 1] = 15 + Math.random() * 200; dropPos[i * 3 + 2] = 721 + Math.sin(a) * rr - CZ; dropSpeed[i] = 150 + Math.random() * 60; }
  const dropGeo = new THREE.BufferGeometry(); dropGeo.setAttribute("position", new THREE.BufferAttribute(dropPos, 3));
  const drops = new THREE.Points(dropGeo, new THREE.PointsMaterial({ color: "#d6ecff", size: 1.4, transparent: true, opacity: 0.75, depthWrite: false }));
  drops.visible = false; root.add(drops);
  const steam = [];
  for (let i = 0; i < 8; i++) {
    const m = new THREE.Mesh(new THREE.SphereGeometry(1, 12, 10), new THREE.MeshBasicMaterial({ color: "#ffffff", transparent: true, opacity: 0.09, depthWrite: false }));
    m.userData = { x: 175 + Math.random() * 55, z: 665 + Math.random() * 100, y: 40 + Math.random() * 160, r: 10 + Math.random() * 8, v: 12 + Math.random() * 10 };
    m.visible = false; root.add(m); steam.push(m);
  }
  let showerOn = false;
  function setShower(on) { showerOn = on; drops.visible = on; steam.forEach(m => { m.visible = on; }); }
  function stepEffects(dt) {
    if (tvOn) { tvT += dt; if (tvT > 1.6) { tvT = 0; tvFrame(); } placeTvLight(); }
    if (showerOn) {
      for (let i = 0; i < DROPS; i++) { dropPos[i * 3 + 1] -= dropSpeed[i] * dt; if (dropPos[i * 3 + 1] < 16) dropPos[i * 3 + 1] = 212; }
      dropGeo.attributes.position.needsUpdate = true;
      steam.forEach(m => { const u = m.userData; u.y += u.v * dt; if (u.y > 205) { u.y = 40; u.r = 10 + Math.random() * 8; } const r = u.r * (0.6 + u.y / 300); m.scale.set(r, r * 0.8, r); m.position.set(u.x - CX + Math.sin(u.y / 25) * 4, u.y, u.z - CZ); });
    }
  }

  /* ---------- the clock: daylight and lamps by the hour (life mode) ---------- */
  function setHour(h) { sim.hour = Math.max(0, Math.min(23.999, h)); applyClock(); if (B.simui) B.simui.refresh(); }
  // Lamps come on when the daylight fades; the ceiling lights only in the evening (not for sleeping hours).
  function applyClock() {
    const day = B.setDaylight(sim.hour), s = B.lightingState();
    const dark = day < 0.5, evening = dark && sim.hour >= 15 && sim.hour < 23.5;
    B.setWarmLights({ on: dark && s.warmOn, tone: s.tone, level: s.warmLevel });
    B.setCeilingLights({ on: evening && s.ceilOn, level: s.ceilLevel, color: s.ceilColor });
  }

  /* ---------- mode and selection ---------- */
  function setActive(on) {
    sim.active = on;
    document.getElementById("app").classList.toggle("life", on);
    order.forEach(k => { people[k].obj.visible = on && !people[k].away; });
    labelWrap.hidden = !on;
    if (person) person.visible = !on;                               // the design-mode figure in the shower
    doors.forEach(d => { d.sim = on ? false : undefined; });        // life mode: doors are automatic, start closed
    if (on) { B.goView("life"); lastDir.set(0, 0, 0); applyWalls(); applyClock(); }
    else { restoreWalls(); B.restoreDaylight(); B.syncLighting(); B.goView("over"); }
    select(sim.selected);
  }
  function select(key) {
    sim.selected = key;
    order.forEach(k => { people[k].ring.visible = sim.active && k === key && !people[k].away; people[k].label.classList.toggle("sel", k === key); });
    if (B.simui) B.simui.refresh();
  }
  function syncRingColor() {
    const c = getComputedStyle(document.documentElement).getPropertyValue("--accent").trim();
    if (c) order.forEach(k => people[k].ring.material.color.set(c));
  }
  syncRingColor();
  if (window.matchMedia) window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", syncRingColor);
  new MutationObserver(syncRingColor).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

  /* ---------- clicks on the stage: a resident → select; an object → its activity; the floor → walk there ---------- */
  const objBoxes = [];
  const objBox = (act, x0, x1, z0, z1, y0, y1) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(x1 - x0, y1 - y0, z1 - z0), new THREE.MeshBasicMaterial());
    m.position.set((x0 + x1) / 2 - CX, (y0 + y1) / 2, (z0 + z1) / 2 - CZ); m.layers.set(1); m.userData.act = act; root.add(m); objBoxes.push(m);
  };
  nav.OBJECTS.forEach(o => {
    const act = OBJECT_ACTS[o.key]; if (!act) return;
    const r = o.key === "wardrobe" ? [20, 90, 388, 638] : o.key === "kitchen" ? [170, 290, 578, 638] : o.rect;
    objBox(act, r[0], r[1], r[2], r[3], 0, o.key === "wardrobe" ? 200 : o.key === "kitchen" ? 125 : o.key === "bed" ? 60 : 90);
  });
  objBox("leave", 468, 490, 328, 422, 0, 205);                     // the entry door
  objBox("shower", 164, 244, 648, 778, 0, 200);                    // the shower
  function click(clientX, clientY) {
    const r = canvas.getBoundingClientRect();
    ptr.set(((clientX - r.left) / r.width) * 2 - 1, -((clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ptr, camera);
    ray.layers.set(1);
    const hit = ray.intersectObjects(hitMeshes.concat(objBoxes), false)[0];
    if (hit && hit.object.userData.person) { select(hit.object.userData.person); return; }
    const p = people[sim.selected];
    if (hit) {
      const act = hit.object.userData.act;
      if (act === "dress") { const next = { home: "out", out: "pajama", pajama: "home" }[p.wear] || "home"; setOutfit(p, next); }
      else startActivity(act, p);
      return;
    }
    ray.layers.set(0);
    if (ray.intersectObjects(B.tv.children, true)[0]) { startActivity("tv", p); return; }
    const fh = ray.intersectObjects(floorMeshes, false)[0];
    if (!fh) return;
    stopActivity(p);
    goTo(p, fh.point.x + CX, fh.point.z + CZ);
    if (B.simui) B.simui.refresh();
  }

  /* ---------- walking ---------- */
  // Send a resident to a plan point. opts.avoid: plan around the other resident. opts.yaw: face this way on arrival.
  function goTo(p, x, z, opts) {
    const others = order.filter(k => k !== p.key).map(k => people[k]).filter(o => !o.away);
    const path = nav.findPath(p.pos, { x, z }, opts && opts.avoid ? others.map(o => ({ x: o.pos.x, z: o.pos.z, r: 2 * BODY + 4 })) : null);
    if (!path) { if (!(opts && opts.avoid)) { p.path = null; p.goal = null; } return false; }
    p.pose = null;
    p.path = path.slice(1); p.goal = { x, z, yaw: opts && opts.yaw }; p.waitT = 0; p.stuckT = 0; p.lastPos = { x: p.pos.x, z: p.pos.z };
    if (!p.path.length) arrive(p);
    return true;
  }
  function arrive(p) {
    p.path = null;
    const g = p.goal; p.goal = null;
    if (p.resume) { const r = p.resume; p.resume = null; goTo(p, r.x, r.z, { yaw: r.yaw }); return; }   // stepped aside: carry on
    if (g && g.yaw !== undefined) p.faceYaw = g.yaw;
  }
  // Step ~55 cm to the side of the heading (away from whoever is in the way), then continue to the goal.
  function stepAside(p, ux, uz, awayFrom, g) {
    const lat = (awayFrom.pos.x - p.pos.x) * uz - (awayFrom.pos.z - p.pos.z) * ux;   // which side the other one is on
    for (const side of [lat > 0 ? -1 : 1, lat > 0 ? 1 : -1]) {
      const x = p.pos.x + uz * side * 55, z = p.pos.z - ux * side * 55;
      if (!nav.isFree(x, z)) continue;
      p.resume = g;
      if (goTo(p, x, z)) return true;
      p.resume = null;
    }
    return false;
  }
  const angleDiff = (a, b) => { let d = a - b; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI; return d; };
  function turnToward(p, yaw, dt, rate) {
    const d = angleDiff(yaw, p.yaw), max = (rate || 4.5) * dt;
    p.yaw += Math.abs(d) < max ? d : Math.sign(d) * max;
    return Math.abs(d);
  }
  function pathLength(p) {
    let len = 0, prev = p.pos;
    p.path.forEach(w => { len += Math.hypot(w.x - prev.x, w.z - prev.z); prev = w; });
    return len;
  }
  function move(p, dt) {
    if (!p.path) {                                                  // standing: slow to a stop, settle the facing
      p.speed = Math.max(0, p.speed - dt * 400);
      if (p.speed < 1) { p.speed = 0; p.state = "idle"; }
      if (p.faceYaw !== undefined && turnToward(p, p.faceYaw, dt, 3) < 0.01) p.faceYaw = undefined;
      return;
    }
    const wp = p.path[0];
    const dx = wp.x - p.pos.x, dz = wp.z - p.pos.z, d = Math.hypot(dx, dz);
    if (d < 3) { p.path.shift(); if (!p.path.length) arrive(p); return; }
    const want = Math.atan2(dx, dz);                                // forward is +z when yaw = 0
    const turning = turnToward(p, want, dt);
    const ux = dx / d, uz = dz / d;
    // someone on the line just ahead? stop; after a moment step aside (or plan around them) if they don't move
    const blocker = order.map(k => people[k]).find(o => {
      if (o === p || !o.obj.visible) return false;
      const rx = o.pos.x - p.pos.x, rz = o.pos.z - p.pos.z, along = rx * ux + rz * uz, lat = Math.abs(rx * uz - rz * ux);
      return along > 0 && along < 2 * BODY + 8 && lat < 2 * BODY - 4;
    });
    if (blocker) {
      p.waitT += dt; p.speed = Math.max(0, p.speed - dt * 500);
      if (p.speed < 1) { p.speed = 0; p.state = "idle"; }
      const yieldAfter = !blocker.path ? 0.4 : order.indexOf(p.key) > order.indexOf(blocker.key) ? 0.8 : 2.0;
      if (p.waitT > yieldAfter && p.goal) {
        const g = p.goal;
        if (stepAside(p, ux, uz, blocker, g) || goTo(p, g.x, g.z, { avoid: true, yaw: g.yaw })) return;
      }
      if (p.waitT > 6) { p.path = null; p.goal = null; p.resume = null; }   // give up
      return;
    }
    p.waitT = 0;
    p.stuckT += dt;                                                 // no progress → plan again around the other resident
    if (p.stuckT > 0.5) {
      if (Math.hypot(p.pos.x - p.lastPos.x, p.pos.z - p.lastPos.z) < 4 && p.goal) { const g = p.goal; goTo(p, g.x, g.z, { avoid: true, yaw: g.yaw }); return; }
      p.stuckT = 0; p.lastPos = { x: p.pos.x, z: p.pos.z };
    }
    // speed: ease in, slow down towards the end of the path, slow when the turn is sharp
    const remaining = pathLength(p);
    let vmax = Math.min(WALK, Math.max(28, remaining * 2.2));
    if (turning > 1.0) vmax = Math.min(vmax, 18);
    p.speed = Math.min(vmax, p.speed + dt * 260);
    const step = Math.min(d, p.speed * dt);
    p.pos.x += dx / d * step; p.pos.z += dz / d * step;
    p.state = "walk";
  }

  /* ---------- doors, floor height, labels ---------- */
  function stepDoors() {
    Object.keys(DOOR_ZONES).forEach(name => {
      const d = doorByName(name); if (!d) return;
      const z = DOOR_ZONES[name];
      d.sim = order.some(k => { const p = people[k]; return p.obj.visible && p.path && p.pos.x >= z[0] && p.pos.x <= z[1] && p.pos.z >= z[2] && p.pos.z <= z[3]; });
    });
    doors.forEach(d => { if (d.sim === undefined) d.sim = false; });   // doors rebuilt with a new wardrobe start closed
  }
  function placeLabels() {
    const w = stage.clientWidth, h = stage.clientHeight;
    order.forEach(k => {
      const p = people[k];
      if (p.away) return;
      const top = p.pose && p.pose.name === "lie" ? p.y + 70 : p.y + p.cfg.height + 9 + (p.pose ? -40 : 0);
      tmp.copy(V(p.pos.x, top, p.pos.z)).project(camera);
      const off = tmp.z > 1 || Math.abs(tmp.x) > 1.1 || Math.abs(tmp.y) > 1.1;
      p.label.style.display = off ? "none" : "";
      if (off) return;
      p.label.style.left = ((tmp.x + 1) / 2 * w) + "px";
      p.label.style.top = ((1 - tmp.y) / 2 * h) + "px";
    });
  }

  /* ---------- camera: follow, wall cutaway ---------- */
  const lastDir = new THREE.Vector3();
  function setWalls(mode) { sim.walls = mode; lastDir.set(0, 0, 0); applyWalls(); }
  function applyWalls() {
    const dir = tmp.subVectors(camera.position, controls.target); dir.y = 0; dir.normalize();
    if (sim.walls === "cut" && dir.distanceTo(lastDir) < 0.02) return;
    lastDir.copy(dir);
    wallParts.forEach(w => {
      const cut = sim.walls === "down" || (sim.walls === "cut" && (w.cx - 286) * dir.x + (w.cz - 400) * dir.z > 0);
      if (w.kind === "hide") { w.obj.visible = !cut && !w.obj.userData.off; return; }
      if (w.kind === "group") { w.obj.visible = !w.obj.userData.off; w.obj.scale.y = cut ? CUT_H / w.h : 1; return; }
      if (!cut) { w.obj.visible = true; w.obj.scale.y = 1; w.obj.position.y = (w.y0 + w.y1) / 2; return; }
      if (w.y0 >= CUT_H - 1) { w.obj.visible = false; return; }
      w.obj.visible = true; w.obj.scale.y = (CUT_H - w.y0) / (w.y1 - w.y0); w.obj.position.y = (w.y0 + CUT_H) / 2;
    });
  }
  function restoreWalls() {
    wallParts.forEach(w => {
      if (w.kind === "hide" || w.kind === "group") { w.obj.visible = !w.obj.userData.off; w.obj.scale.y = 1; return; }
      w.obj.visible = true; w.obj.scale.y = 1; w.obj.position.y = (w.y0 + w.y1) / 2;
    });
  }
  function follow(dt) {
    if (!sim.follow || B.isCameraMoving()) return;
    const p = people[sim.selected];
    if (p.away) return;
    const d = V(p.pos.x, 0, p.pos.z).sub(controls.target).multiplyScalar(Math.min(1, dt * 3));
    controls.target.add(d); camera.position.add(d);
  }

  /* ---------- per frame ---------- */
  let uiT = 0;
  function step(now, dt) {
    if (!sim.active) return;
    order.forEach(k => {
      const p = people[k];
      runActivity(p, dt);
      move(p, dt);
      p.y += (nav.elevation(p.pos.x, p.pos.z) - p.y) * Math.min(1, dt * 8);
      p.animate(now, dt);
    });
    stepDoors();
    stepEffects(dt);
    follow(dt);
    if (sim.walls === "cut") applyWalls();
    placeLabels();
    uiT += dt;
    if (uiT > 0.3 && B.simui) { uiT = 0; B.simui.refresh(); }
  }

  Object.assign(sim, { ACTIVITIES, setActive, select, click, goTo, startActivity, stopActivity, setOutfit, activityStatus, setHour, applyClock, setWalls, step });
  B.sim = sim;
})(window.B);
