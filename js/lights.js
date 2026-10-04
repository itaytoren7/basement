/* lights.js — lamps, ceiling lights and the "evening" switch.
 * Every lamp is one line in LAMPS (plan coordinates, cm): move a lamp by editing its x/z, add one by adding a line.
 * The warm lamps share one colour + brightness control; the two ceiling lights have their own colour, switch and brightness.
 * None of these lights cast shadows (keeps it fast). Intensities are three.js legacy units, like the daylight in core.js.
 * Exposes: B.LAMPS, B.CEILING_LIGHTS, B.WARM_RANGE, B.WARM_PRESETS, B.CEILING_PRESETS, B.warmKelvin(tone), B.warmTone(k),
 *          B.warmHex(tone), B.setWarmLights(s), B.setCeilingLights(s), B.setEvening(on), B.setDaylight(hour), B.restoreDaylight()
 */
(function (B) {
  "use strict";
  if (B.failed) return;
  const { CX, CZ, H, M, std, root, ceiling, daylight, box, cyl } = B;

  // Warm-lamp colour: tone 0 = light yellow (~3000K) … tone 1 = orange (~2000K).
  const WARM_RANGE = { from: "#ffe2a6", to: "#ff9440", kFrom: 3000, kTo: 2000 };
  // Colour options in the panel. Warm lamps: points on the slider above. Ceiling lights: their own colours.
  const WARM_PRESETS = [
    { k: 3000, name: "לבן חם" }, { k: 2700, name: "חם" }, { k: 2200, name: "ענבר" }, { k: 2000, name: "כתום" },
  ];
  const CEILING_PRESETS = [
    { k: 3000, name: "לבן חם", color: "#ffe2a6" },
    { k: 4000, name: "ניטרלי", color: "#fff3e6", def: true },
    { k: 5000, name: "לבן קר", color: "#fbf9f6" },
    { k: 6500, name: "אור יום", color: "#eef3ff" },
  ];

  // kind: "blasverk" | "floor" | "desk" | "strip". y = the surface the lamp stands on (for "strip": underside of the shelf).
  // power = light intensity at 100% brightness; reach = distance (cm) at which the light fades out.
  const LAMPS = [
    { kind: "blasverk", x: 45, z: 244, y: 53, power: 1.1, reach: 340 },          // IKEA BLÅSVERK, yellow, on the south nightstand
    { kind: "floor", x: 425, z: 470, y: 0, power: 1.4, reach: 480 },             // floor lamp, fabric shade, between the sofa and the east wall
    { kind: "strip", x0: 184, x1: 266, z: 586, y: 120, power: 0.9, reach: 150 }, // warm LED strip under the kitchenette's upper shelf
    { kind: "desk", x: 454, z: 90, y: 75, power: 0.8, reach: 260 },              // small table lamp at the north end of the desk
  ];
  // Flat round ceiling fixtures, 40 Ø, evenly spaced along the room's length.
  const CEILING_LIGHTS = [
    { x: 242, z: 175, power: 0.6, reach: 700 },
    { x: 242, z: 485, power: 0.6, reach: 700 },
  ];

  /* ---------- fixtures ---------- */
  const warmLights = [], warmGlows = [], ceilLights = [], ceilGlows = [];
  // Glowing part: its emissive colour follows the light colour (times `tint`), its strength follows brightness × gain.
  function glow(list, opts, tint, gain) {
    const mat = new THREE.MeshStandardMaterial(Object.assign({ roughness: 0.9 }, opts));
    list.push({ mat, tint: new THREE.Color(tint), gain });
    return mat;
  }
  function addLight(list, light, x, y, z, L) {
    light.position.set(x - CX, y, z - CZ);
    light.userData.power = L.power;
    root.add(light); list.push(light);
    return light;
  }
  const point = (L) => new THREE.PointLight(0xffffff, 0, L.reach, 2);
  const mesh = (geo, mat, x, y, z, parent) => {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x - CX, y, z - CZ); (parent || root).add(m); return m;
  };

  const BUILD = {
    // BLÅSVERK, 36 high: flat round base 16 Ø, tube stem 3.5 Ø, mushroom shade 23 Ø —
    // glossy translucent yellow glass on top, opal white glass below.
    blasverk(L) {
      const { x, z, y } = L;
      const yellow = std({ color: "#e8b42a", roughness: 0.3 });
      cyl(8, 1.6, x, y + 0.8, z, yellow, root, 32);
      cyl(1.75, 19, x, y + 1.6 + 9.5, z, yellow, root, 16);
      const opal = glow(warmGlows, { color: "#fbf6ec", roughness: 0.4 }, "#ffffff", 1.5);
      mesh(new THREE.CylinderGeometry(11.5, 7.5, 7, 40), opal, x, y + 22.5, z);
      const top = glow(warmGlows, { color: "#f2bf26", roughness: 0.1, transparent: true, opacity: 0.9 }, "#ffd23c", 1.2);
      mesh(new THREE.SphereGeometry(11.5, 40, 14, 0, Math.PI * 2, 0, Math.PI / 2), top, x, y + 26, z).scale.y = 0.87;
      addLight(warmLights, point(L), x, y + 25, z, L);
    },
    // Floor lamp ~150 high: round base, slim black pole, linen drum shade.
    floor(L) {
      const { x, z, y } = L;
      const metal = std({ color: "#25272b", roughness: 0.45, metalness: 0.3 });
      cyl(15, 2.5, x, y + 1.25, z, metal, root, 40);
      cyl(1.1, 118, x, y + 61, z, metal, root, 12);
      const shade = glow(warmGlows, { color: "#efe5d3", side: THREE.DoubleSide }, "#ffffff", 1.1);
      mesh(new THREE.CylinderGeometry(19, 21, 30, 48, 1, true), shade, x, y + 133, z);
      const bulb = glow(warmGlows, { color: "#fff7e8" }, "#ffffff", 2);
      mesh(new THREE.SphereGeometry(3.2, 16, 12), bulb, x, y + 128, z);
      addLight(warmLights, point(L), x, y + 128, z, L);
    },
    // Small desk lamp: black base and stem, fabric cone shade.
    desk(L) {
      const { x, z, y } = L;
      cyl(5.5, 1.5, x, y + 0.75, z, M.black, root, 24);
      cyl(0.7, 20, x, y + 11.5, z, M.black, root, 10);
      const shade = glow(warmGlows, { color: "#f1e8d8", side: THREE.DoubleSide }, "#ffffff", 1.1);
      mesh(new THREE.CylinderGeometry(5, 8, 11, 32, 1, true), shade, x, y + 26.5, z);
      addLight(warmLights, point(L), x, y + 24, z, L);
    },
    // LED strip under a shelf: a thin glowing bar and two downward spotlights along it.
    strip(L) {
      const { x0, x1, z, y } = L;
      const bar = glow(warmGlows, { color: "#fff4df" }, "#ffffff", 2.2);
      box(x0, x1, z - 0.8, z + 0.8, y - 0.6, y - 0.05, bar, root, { noCast: true });
      [0.25, 0.75].forEach(f => {
        const x = x0 + (x1 - x0) * f;
        const s = addLight(warmLights, new THREE.SpotLight(0xffffff, 0, L.reach, 1.15, 0.9, 1.5), x, y - 1, z, L);
        s.target.position.set(x - CX, 0, z + 6 - CZ); root.add(s.target);
      });
    },
  };
  LAMPS.forEach(L => BUILD[L.kind](L));

  // Ceiling fixtures: white body + glowing diffuser. They belong to the ceiling group, so (like the ceiling)
  // they show only in first-person views; their light reaches the room in every view.
  CEILING_LIGHTS.forEach(L => {
    mesh(new THREE.CylinderGeometry(20, 20, 3.5, 48), M.white, L.x, H - 1.75, L.z, ceiling);
    const diffuser = glow(ceilGlows, { color: "#ffffff" }, "#ffffff", 1.4);
    mesh(new THREE.CylinderGeometry(18.5, 18.5, 0.4, 48), diffuser, L.x, H - 3.7, L.z, ceiling);
    addLight(ceilLights, new THREE.PointLight(0xffffff, 0, L.reach, 1.5), L.x, H - 14, L.z, L);
  });

  /* ---------- controls (wired in ui.js) ---------- */
  const warmFrom = new THREE.Color(WARM_RANGE.from), warmTo = new THREE.Color(WARM_RANGE.to);
  const warmKelvin = (tone) => Math.round((WARM_RANGE.kFrom + (WARM_RANGE.kTo - WARM_RANGE.kFrom) * tone) / 50) * 50;
  const warmTone = (k) => (WARM_RANGE.kFrom - k) / (WARM_RANGE.kFrom - WARM_RANGE.kTo);
  const warmColor = (tone) => new THREE.Color().lerpColors(warmFrom, warmTo, tone);
  const warmHex = (tone) => "#" + warmColor(tone).getHexString();   // sRGB, for the panel swatches
  // s = { on, tone 0..1, level 0..1 }: light colour and glowing shades change together.
  function setWarmLights(s) {
    const c = warmColor(s.tone), k = s.on ? s.level : 0;
    warmLights.forEach(l => { l.color.copy(c); l.intensity = l.userData.power * k; });
    warmGlows.forEach(g => { g.mat.emissive.copy(c).multiply(g.tint); g.mat.emissiveIntensity = g.gain * k; });
  }
  // s = { on, level 0..1, color }
  function setCeilingLights(s) {
    const k = s.on ? s.level : 0;
    ceilLights.forEach(l => { l.color.set(s.color); l.intensity = l.userData.power * k; });
    ceilGlows.forEach(g => { g.mat.emissive.set(s.color); g.mat.emissiveIntensity = g.gain * (s.on ? 0.3 + 0.7 * s.level : 0); });
  }
  // Evening: daylight (sun, sky, ambient, fill) and the window glow drop to 15%, so the lamps show.
  function setEvening(on) {
    daylight.concat([M.winGlass]).forEach(o => {
      const prop = o.isMaterial ? "emissiveIntensity" : "intensity";
      if (o.userData.day === undefined) o.userData.day = o[prop];
      o[prop] = o.userData.day * (on ? 0.15 : 1);
    });
  }

  // Daylight by the clock (life mode): the sun rises in the east at ~06:00, is highest at noon, sets in the west
  // at ~18:00. Low sun is warm with long shadows; at night only a faint blue sky light remains. Returns 0..1 daylight.
  const dayBase = { sunPos: B.sun.position.clone(), sunColor: B.sun.color.clone(), hemiSky: daylight[0].color.clone(), hemiGround: daylight[0].groundColor.clone(), win: M.winGlass.emissive.clone() };
  const cA = new THREE.Color(), cB = new THREE.Color();
  const clamp01 = (v) => Math.max(0, Math.min(1, v));
  function setDaylight(hour) {
    const el = Math.sin(Math.PI * (hour - 6) / 12);                // sun elevation factor: 1 at noon, < 0 at night
    const day = clamp01(el * 2.2);                                 // full daylight by ~08:00, dusk from ~16:30
    const warm = clamp01(1 - el * 2.5);                            // low sun = orange
    const a = Math.PI * (hour - 6) / 12;                           // east → overhead → west
    daylight.concat([M.winGlass]).forEach(o => {
      const prop = o.isMaterial ? "emissiveIntensity" : "intensity";
      if (o.userData.day === undefined) o.userData.day = o[prop];
    });
    B.sun.position.set(Math.cos(a) * 620, Math.max(60, Math.sin(a) * 700), 300);
    B.sun.intensity = B.sun.userData.day * day;
    B.sun.color.copy(cA.set("#fff6ea").lerp(cB.set("#ff9a55"), warm * 0.9));
    const hemi = daylight[0];
    hemi.intensity = hemi.userData.day * (0.1 + 0.9 * day);
    hemi.color.copy(cA.set("#ffffff").lerp(cB.set("#3a4a6e"), 1 - day));
    hemi.groundColor.copy(cA.copy(dayBase.hemiGround).lerp(cB.set("#1f1d24"), 1 - day));
    daylight[1].intensity = daylight[1].userData.day * (0.2 + 0.8 * day);
    daylight[3].intensity = daylight[3].userData.day * (0.15 + 0.85 * day);
    M.winGlass.emissiveIntensity = M.winGlass.userData.day * (0.15 + 0.85 * day);
    M.winGlass.emissive.copy(cA.copy(dayBase.win).lerp(cB.set("#2b3a5c"), 1 - day));
    return day;
  }
  function restoreDaylight() {
    B.sun.position.copy(dayBase.sunPos); B.sun.color.copy(dayBase.sunColor);
    daylight[0].color.copy(dayBase.hemiSky); daylight[0].groundColor.copy(dayBase.hemiGround); M.winGlass.emissive.copy(dayBase.win);
    setEvening(false);
  }

  Object.assign(B, { LAMPS, CEILING_LIGHTS, WARM_RANGE, WARM_PRESETS, CEILING_PRESETS, warmKelvin, warmTone, warmHex, setWarmLights, setCeilingLights, setEvening, setDaylight, restoreDaylight });
})(window.B);
