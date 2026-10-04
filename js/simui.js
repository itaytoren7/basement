/* simui.js — the life-mode panel and the HUD over the stage: mode switch, portraits, who is selected and what
 * they are doing, the activity and outfit choices, the hour slider, the walls switch and camera follow.
 * All text is Hebrew, with verb forms per resident.
 * Exposes: B.simui = { refresh }
 */
(function (B) {
  "use strict";
  if (B.failed) return;
  const { sim, nav, radios } = B;
  const $ = (s) => document.querySelector(s);
  const ACT = sim.ACTIVITIES;

  radios("mode", v => sim.setActive(v === "life"));

  // Small 2D portrait drawn from the look in PEOPLE (skin, hair, beard, glasses, home top)
  function drawPortrait(c) {
    const S = 44, dpr = 2, cv = document.createElement("canvas");
    cv.width = cv.height = S * dpr; cv.style.width = cv.style.height = S + "px";
    const g = cv.getContext("2d"); g.scale(dpr, dpr);
    const circle = (x, y, rx, ry, col, a0, a1) => { g.fillStyle = col; g.beginPath(); g.ellipse(x, y, rx, ry, 0, a0 || 0, a1 === undefined ? Math.PI * 2 : a1); g.fill(); };
    const curly = c.hair.style === "curly", long = c.hair.style === "long";
    circle(22, 48, 17, 12, c.outfits.home.top || c.skin);                 // shoulders
    g.fillStyle = c.skin; g.fillRect(18.5, 27, 7, 10);                     // neck
    if (long) { circle(22, 29, 12.5, 16, c.hair.color); if (c.hair.tips) circle(22, 41, 11, 5, c.hair.tips); }   // hair behind the head
    circle(22, 22, 9.5, 11, c.skin);                                       // face
    circle(22, curly ? 13 : 14.5, curly ? 11.5 : 10, curly ? 8.5 : 6.5, c.hair.color, Math.PI, Math.PI * 2);   // hair on top
    if (curly) [[11.5, 15], [32.5, 15], [14, 9.5], [30, 9.5], [22, 5.5]].forEach(([x, y]) => circle(x, y, 2.6, 2.6, c.hair.color));
    if (!long) { g.fillStyle = c.hair.color; g.fillRect(12.4, 14, 2.2, 7); g.fillRect(29.4, 14, 2.2, 7); }
    if (c.beard) { circle(22, 29.5, 8, 5, c.beard, 0, Math.PI); g.fillStyle = c.beard; g.fillRect(18.5, 25.3, 7, 1.4); }
    [-3.3, 3.3].forEach(dx => circle(22 + dx, 22, 1.2, 1.5, "#1b1b1b"));
    g.fillStyle = "#2a2a2a"; [-3.3, 3.3].forEach(dx => g.fillRect(22 + dx - 2.2, 18.2, 4.4, 0.9)); // brows
    if (c.glasses) { g.strokeStyle = "#3a2a1e"; g.lineWidth = 1; [-3.3, 3.3].forEach(dx => { g.beginPath(); g.ellipse(22 + dx, 22, 3.2, 3, 0, 0, Math.PI * 2); g.stroke(); }); g.beginPath(); g.moveTo(21.5, 22); g.lineTo(22.5, 22); g.stroke(); }
    return cv;
  }
  const wrap = $("#portraits");
  sim.order.forEach(k => {
    const p = sim.people[k];
    const btn = document.createElement("button"); btn.type = "button"; btn.className = "portrait"; btn.dataset.key = k;
    btn.appendChild(drawPortrait(p.cfg));
    const nm = document.createElement("span"); nm.textContent = p.cfg.name; btn.appendChild(nm);
    btn.addEventListener("click", () => sim.select(k));
    wrap.appendChild(btn);
  });

  // activity chips (one person), outfit chips, and the shared activities
  const single = Object.keys(ACT).filter(k => !ACT[k].both && !ACT[k].hidden), shared = Object.keys(ACT).filter(k => ACT[k].both);
  $("#actList").innerHTML = single.map(k => "<input type='radio' name='act' id='act-" + k + "' value='" + k + "'><label for='act-" + k + "'>" + ACT[k].inf + "</label>").join("");
  const OUTFITS = { home: "בית", out: "יציאה", pajama: "פיג׳מה" };
  $("#wearList").innerHTML = Object.keys(OUTFITS).map(k => "<input type='radio' name='wear' id='wear-" + k + "' value='" + k + "'><label for='wear-" + k + "'>" + OUTFITS[k] + "</label>").join("");
  $("#bothList").innerHTML = shared.map(k => "<button type='button' data-both='" + k + "'>" + ACT[k].inf + "</button>").join("");
  radios("act", k => sim.startActivity(k, sim.people[sim.selected]));
  radios("wear", k => sim.setOutfit(sim.people[sim.selected], k));
  document.querySelectorAll("#bothList button").forEach(b => b.addEventListener("click", () => sim.startActivity(b.dataset.both, sim.people[sim.selected])));

  // the hour
  const hourInput = $("#hourRange");
  const fmt = (h) => { const m = Math.round(h * 60); return String(Math.floor(m / 60)).padStart(2, "0") + ":" + String(m % 60).padStart(2, "0"); };
  hourInput.addEventListener("input", () => sim.setHour(+hourInput.value / 60));
  document.querySelectorAll("#hud [data-walls]").forEach(b => b.addEventListener("click", () => { sim.setWalls(b.dataset.walls); refresh(); }));
  $("#hudFollow").addEventListener("click", () => { sim.follow = !sim.follow; refresh(); });

  function status(p) {
    const a = sim.activityStatus(p);
    if (a) return a + ".";
    if (p.path) return p.v("הולך", "הולכת") + " למקום שבחרתם.";
    const o = nav.nearestObject(p.pos.x, p.pos.z, 60);
    return p.v("עומד", "עומדת") + (o ? " ליד " + o.name + "." : " באמצע החדר.");
  }
  function refresh() {
    document.querySelectorAll("#portraits .portrait").forEach(b => b.setAttribute("aria-pressed", b.dataset.key === sim.selected ? "true" : "false"));
    const p = sim.people[sim.selected];
    $("#lifeStatus").innerHTML = "<b>" + p.cfg.name + "</b> · " + status(p);
    $("#actWho").textContent = p.cfg.name;
    const cur = p.act ? p.act.key : "idle";
    document.querySelectorAll("input[name=act]").forEach(r => { r.checked = r.value === cur; });
    document.querySelectorAll("input[name=wear]").forEach(r => { r.checked = r.value === p.wear; });
    document.querySelectorAll("#bothList button").forEach(b => b.setAttribute("aria-pressed", p.act && p.act.key === b.dataset.both ? "true" : "false"));
    document.querySelectorAll("#hud [data-walls]").forEach(b => b.setAttribute("aria-pressed", b.dataset.walls === sim.walls ? "true" : "false"));
    $("#hudFollow").setAttribute("aria-pressed", sim.follow ? "true" : "false");
    if (document.activeElement !== hourInput) hourInput.value = Math.round(sim.hour * 60);
    $("#hourOut").textContent = fmt(sim.hour);
  }
  refresh();

  B.simui = { refresh };
})(window.B);
