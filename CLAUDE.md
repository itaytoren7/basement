# The BASEment — 3D model of the basement unit

Interactive 3D model of Itay's basement renovation, built from the interior designer's plan so the family can check sizes, layout and finishes before building. It answers the open points in the designer's letter (wardrobe, kitchenette, bathroom vitrine, rain-shower height, TV position), records the family's final furniture choices with a shopping list, and lets you try the lighting (lamps, ceiling lights, evening).

The UI is in **Hebrew, right-to-left**. Talk to Itay in Hebrew unless he writes in English.

## Run it

- Open `index.html` in a browser (double-click works: the page uses classic scripts, no ES modules, no `fetch`).
- Or serve the folder: `python3 -m http.server 8000` → http://localhost:8000
- Needs internet: three.js r147 and the fonts load from CDNs (jsDelivr, Google Fonts).
- Useful in the browser console: `__basement.goView("bath")` (views: over, plan, entry, sofa, bed, arm, kitchen, bath).

## Stack and rules

- Plain HTML + CSS + JS. No build step, no npm, no framework.
- three.js **r147**, classic builds (`build/three.min.js` + `examples/js/controls/OrbitControls.js`), pinned on jsDelivr. r148+ dropped `examples/js`; upgrading means switching to ES modules and then the page no longer works from `file://` — only do that together with serving over http.
- Keep it working from `file://`: no `type="module"`, no `fetch`, no imports.
- All scripts share one global object, `window.B`. Each file is an IIFE that reads what earlier files put on `B` and adds its own exports at the bottom. **Load order matters** (see `index.html`).
- Every colour in the page UI is a CSS token in `:root` with dark-mode overrides. Don't hardcode colours in components.
- No environment map in the scene, so keep material `metalness` ≤ ~0.45 or metals render black.
- UI strings are Hebrew. Numbers use the `num` class (tabular digits).

## Files

| File | What's in it |
|---|---|
| `index.html` | Page markup: the options panel (right) and the 3D stage; script tags in load order |
| `css/styles.css` | All styles, colour tokens, light/dark, phone layout (≤820px) |
| `js/core.js` | `window.B`, constants (`H`, `CX`, `CZ`), renderer, scene, camera, OrbitControls, daylight (`B.daylight`: sky, ambient, sun, fill), geometry helpers (`box`, `lbox`, `cyl`, `floorRect`, `V`) |
| `js/materials.js` | Canvas-drawn textures (wood, light-oak parquet, LOKALTÅG rug, Tibbleby fabric, tiles, turquoise wall tiles, fluted glass, TV screen) and all materials `B.M` |
| `js/room.js` | Floors, ceiling, the `WALLS` table, windows, entry door, bathroom vitrine + glass door; `B.wall()` |
| `js/furniture.js` | Bed, STORKLINTA nightstands, LOKALTÅG rug, furnished desk setup, AC, armchairs, dark-oak coffee table, KIVIK sofa + throw pillows (`B.SOFA`), alcove closet; `buildKitchen(L)`; wardrobe options `WARDS` + `buildWardrobe(key)`; `softMesh`/`soft` for upholstered shapes |
| `js/bathroom.js` | Shower (raised 15), bronze fixtures, vanity, mirrored medicine cabinet, standard toilet, wall tiles (`cladPanel`), `buildRain(h)`, `buildPerson(height)`, niche shelves |
| `js/lights.js` | Lamps and ceiling lights from the `LAMPS` / `CEILING_LIGHTS` lists, `setWarmLights`, `setCeilingLights`, `setEvening` |
| `js/tv.js` | TV sizes, presets (`north` = under the AC, `stairs` = designer's idea), placement, viewing readout, AC gap check |
| `js/ui.js` | Panel readouts (wardrobe, sofa gaps, `SHOPPING` list, rain note), labels, camera `VIEWS`, door animation, theme sync, all control wiring incl. `syncLighting`, draggable TV and click-a-wall placement |
| `js/main.js` | Initial state (must match the `checked` inputs in `index.html`; lighting is read from the inputs by `syncLighting`), resize, render loop |
| `תכנית משפחת תורן-יחידת דיור איתי תורן- לעיון בלבד-1.pdf` | The updated designer's plan (sheet TBN01, 24/9/26, scale 1:50). The source for every dimension. Git-ignored — do not publish it. |

## Coordinate system (important)

All geometry is written in **plan coordinates, centimetres**, read off the drawing:

- origin = **outer top-left corner** of the building outline on the drawing
- **x → east** (right on the drawing), **z → south** (down on the drawing), **y → up** (floor 0, ceiling `B.H` = 220)
- `box(x0, x1, z0, z1, y0, y1, material)` takes plan coordinates; the helpers subtract `CX = 286`, `CZ = 400` to centre the model
- Exterior walls are 20 thick, new drywall 10. Inner room corner = (20, 20).
- Use `B.wall(...)` (not `box`) for anything that is a wall, so the TV click-placement can hit it.

## Key dimensions (updated from the new plan)

| Element | Plan coordinates / size |
|---|---|
| Main room (inner) | x 20–464, z 20–638 → **444 × 618**, ceiling **220** |
| North wall | z 0–20; AC unit x 203–298, 186–214 high (pipes into this wall) |
| West wall window (over the bed) | z 40–200 (160 wide). Sill 130 / top 220 are **assumed** |
| "Stairs wall" (east) | new drywall x 464–484, z 20–257 (closes an old 237 opening) |
| Entry door | 90 wide in a new wall at x 473–483, z 330–420, swings into the room; stairs are outside |
| East alcove | x 473–547, z 485–638, holds a built-in closet (73 × 153) |
| Bed 140×200 | x 20–220, z 80–220, headboard on the west wall |
| Nightstands (IKEA STORKLINTA, 40 W × 50 D × 53 H) | x 20–70, z 36–76 and z 224–264 (4 cm from the bed); drawers face east |
| BLÅSVERK lamp (36 high) | on the south nightstand, centre (45, 244) |
| Rug (IKEA LOKALTÅG 133 × 195) | x 163–296, z 56.5–251.5 |
| Desk + chair | desk x 399–464, z 80–260 (65 × 180), centred on the east wall between the entry door and north wall; chair x 357–391, z 150–190 |
| Lounge seating | armchairs x 132–208 and 366–442, z 298–383, facing each other across the coffee table x 247–327, z 307–382 |
| Sofa (IKEA KIVIK 3-seat, 228 × 95 × 83, seat 45) | x 162–390 (centred on x 276), z 423–518, faces north. Gaps: back → kitchenette counter (z 578) **60**; east end → east wall (x 473) **83**; front → coffee table **41** (armchairs 40) |
| Floor lamp (~150 high) | (425, 470), between the sofa's east end and the east wall |
| Ceiling lights (40 Ø, flat) | x 242, z 175 and z 485, on the ceiling (y 220) |
| Wardrobe carpentry option | west wall, **240 wide × 60 deep**, x 20–80, z 398–638 |
| Custom IKEA PAX | **249.8 wide × 37.4 deep × 201.2 high**; aligned to z 388.2–638; five hinged oak-look doors; interior: drawers, hanging rails, and shelves |
| Kitchenette | fixed **120 wide**, x 170–290, z 578–638; sink centred at x 230 |
| Room ↔ bathroom wall | z 638–648: low wall to 160 + glass vitrine above (x 164–302), post x 302–307, glass door 72 (x 308–380, swings into the bathroom), solid new wall x 383–547 |
| Bathroom (inner) | x 164–463, z 648–778 → **299 × 130** |
| Shower | x 164–244, **raised 15** (room height 205 inside). Glass at x 243, where the window sashes meet. Mixer 110 above shower floor, 57 from window wall; hand-shower outlet 15 from it |
| Bathroom window | x 164–322 (158 wide), 59 high, sill 161 |
| Vanity | 100 × 47, x 263–362, z 731–778, vessel basin |
| Toilet | standard floor-mounted toilet, bowl centre ≈ (422, 732), visible tank against the south wall; no concealed-cistern bump-out |
| Shelf niche | x 483–547, z 648–720, reached through a **50 cm** opening from the bathroom (z 648–698); shelves face the opening |

## Decisions and state (updated)

Chosen by Itay:
- **TV under the AC**, centred on the north wall (x ≈ 250), default 55″ at 110 centre height. The designer's stairs-wall position stays as an option to compare.
- **TV on an articulated telescoping arm**, draggable along walls, extending 10–45 cm, with 180° total swivel (90° left and right).
- **Bathroom walls: turquoise / light-blue tiles, 15×15, up to the ceiling** (under the window only up to the sill).
- **Shower fixtures in bronze** (mixer, hand shower, rain head). The basin faucet is still chrome — not decided.
- **Selected wardrobe option: IKEA PAX with glass doors** (`WARDS.paxglass`, the default): the same 249.8 × 37.4 × 201.2 cm PAX as Itay's layout (`storklinta`: bays 100 + 100 + 50, drawers, hanging rails, shelves), with five hinged doors of clear glass in ~5 cm light-oak frames (`M.oakLight`), so the interior shows. Itay's oak-door version and the other options remain available.
- **Kitchenette: fixed 120 wide**, x 170–290, z 578–638, with a coffee machine, sink centred at x 230, and a small dish-drying rack; no cooktop.
- **Desk: enlarged to 65 × 180** and centred on the east wall segment between the north TV wall and entry door.
- **Desk setup:** monitor, raised laptop, tablet stand, open notebook, phone stand, pen cup, candle, reed diffuser, stereo speakers and floor subwoofer under the desk.
- **Toilet: standard floor-mounted model**, with visible tank and no concealed-cistern wall.
- **Vanity storage: 60 × 40 × 20 cm mirrored cabinet**, centered above the basin and below the bathroom window sill; the mirror door opens with the door toggle.
- **Sofa: IKEA KIVIK 3-seat** in **Tibbleby beige/grey** (light warm grey woven fabric, `M.kivik`), 228 × 95 × 83, wide low boxy arms, 2 seat + 2 back cushions, with 4 throw pillows: mustard (`M.mustard`) and dark navy (`M.navy`), one of each at each end. The **armchairs stay near-black charcoal** (`M.armchair`).
- **Nightstands: IKEA STORKLINTA chest of 2 drawers**, oak effect, one on each side of the bed; flat drawers with finger-grip gaps, overhanging top, low plinth. The old nightstand lamps were removed.
- **Lamp: IKEA BLÅSVERK, yellow**, only on the **south** nightstand (toward the armchairs and the wardrobe). Price 95 ₪ read from a blurry tag, **not confirmed**.
- **Rug: IKEA LOKALTÅG**, short pile, beige/grey, 133 × 195: off-white field with a faded grey vintage oriental pattern and a 13 cm border (`tex.rug`).
- **Main-room floor: light-oak parquet** (all `MAIN_FLOORS`; the bathroom keeps its tiles). Planks 20 wide, 90–180 long, staggered, along z; average colour #bf9767, a little darker than `M.oak`.
- **Coffee table: dark oak** with visible grain (`M.darkOak`, base #5b3f2a). `M.oak` stays as it was for the desk and other items.
- **Bathroom wall / vitrine: low wall to 160, glass above x 164–302, post x 302–307, glass door 72 x 308–380, solid wall x 383–547**.

Still open (options in the panel):
- Bathroom door: regular white interior door (Pandor-style, solid: better privacy, sound and smell) vs the designer's framed glass door. The vitrine glass above the low wall stays either way. Default in the panel: regular white. Code: `room.js` `setBathDoor(type)`. Not yet discussed with the designer.
- IKEA/Harel wardrobe options were 200 wide and are not yet updated with the new plan; pending a decision from Itay.
- BLÅSVERK price (95 ₪ from a blurry tag) — shown as "95 ₪?" until Itay confirms; change `unsure` in `SHOPPING` (`ui.js`).
- Vitrine frame white (designer's preference, Greek style) or black; clear or fluted ("גלינה") glass.
- Rain head 195 or 200 above the raised shower floor.

Assumptions (not in the plan): bedroom window height, door heights (≈205), bathroom floor tiles, finishes and colours of the furniture not listed above.

## Shopping list

Shown in the panel ("רשימת קניות"); the data is `SHOPPING` in `ui.js`, and the total adds up automatically.

| Item | Size (cm) | Price |
|---|---|---|
| IKEA KIVIK 3-seat sofa, Tibbleby beige/grey | 228 × 95 × 83 | 2,295 ₪ (frame 1,950 + cover 345) |
| IKEA STORKLINTA chest of 2 drawers, oak effect × 2 | 40 × 50 × 53 | 650 ₪ (325 each) |
| IKEA BLÅSVERK table lamp, yellow | 36 high | 95 ₪? (not confirmed) |
| IKEA LOKALTÅG rug, short pile, beige/grey | 133 × 195 | 245 ₪ |
| **Total** | | **3,285 ₪?** |

## Lighting

- **Daylight** (`core.js`): hemisphere + ambient + sun (casts the only shadows) + a fill light, listed in `B.daylight`.
- **Lamps and ceiling lights** (`js/lights.js`): every lamp is one line in **`LAMPS`**: `kind` (`blasverk`, `floor`, `desk`, `strip`), position in plan cm, `power` (intensity at 100%) and `reach` (fade-out distance in cm). Move a lamp by editing its `x`/`z`, add one by adding a line. The ceiling fixtures are in **`CEILING_LIGHTS`**.
  - BLÅSVERK on the south nightstand (45, 244); floor lamp with a fabric shade (425, 470); warm LED strip under the kitchenette's upper shelf (x 184–266, z 586, two downward spotlights); small table lamp at the north end of the desk (454, 90).
  - Two flat round ceiling fixtures (40 Ø) at x 242, z 175 / 485, neutral-to-cool white (`CEILING_COLOR`, ~4500K). Their meshes are in the ceiling group, so they show only in first-person views; their light works in every view.
- **Colours:** the warm lamps share one colour, from `WARM_RANGE.from` (#ffe2a6, ~3000K) to `WARM_RANGE.to` (#ff9440, ~2000K). The glowing shades and strip take the same colour (times a tint, e.g. yellow for the BLÅSVERK glass), so light and glow change together. The slider's colour bar uses the CSS tokens `--lamp-3000` / `--lamp-2000`.
- **Panel ("תאורה"):** "ערב" (evening) dims the daylight and the window glow to 15%; warm lamps: on/off, colour, brightness; ceiling lights: on/off, brightness. Defaults: evening off, all lamps on, colour ≈2700K, warm 70%, ceiling 60%. `syncLighting()` in `ui.js` reads the inputs and applies them.
- No lamp casts shadows (keeps it fast). Intensities are three.js legacy units (`physicallyCorrectLights` off), like the daylight.

## What changed vs. the previous plan

1. Wardrobe moved to the south-west corner and widened to 240 cm (x 20–80, z 398–638); the 90 cm passage is now between wardrobe front x 80 and kitchenette x 170.
2. Kitchenette fixed to 120 cm wide, x 170–290, and moved in front of the low wall; the old 200/250 options and open shelf were removed.
3. Bathroom wall, vitrine, and glass door changed: x 164–302 low wall, post x 302–307, door x 308–380, solid wall x 383–547.
4. Desk enlarged and moved to the centre of the east wall segment between the entry door and the north TV wall.
5. Niche opening reduced to 50 cm, so the east bathroom wall starts at z 698.

## The designer's open points → where they live

1. Niche shelves facing the 50 cm opening → `bathroom.js` (niche shelves)
2. Wardrobe 240 instead of 200 → `furniture.js` `WARDS`, readout in `ui.js` `updateWardKv`
3. Kitchenette fixed at 120 → `furniture.js` `buildKitchen`, `index.html`, `ui.js`
4. Vitrine: white frame, fluted glass → `room.js` vitrine, `M.frame` / `M.glass`
5. Rain head height (room is 205 inside the shower) → `bathroom.js` `buildRain`, `ui.js` `updateRainNote`
6. TV position and swing range → `tv.js`, `ui.js`

## How to add or change something

- New fixed object: add `box(...)` calls in the right file, in plan coordinates. Check the drawing for position.
- New option in the panel: add the radio/checkbox to `index.html` (give it an `id`), wire it in `ui.js` (`radios(name, fn)`), set its initial state in `main.js`.
- New or moved lamp: edit `LAMPS` in `lights.js`. New shopping item: add to `SHOPPING` in `ui.js`.
- New camera view: add to `VIEWS` in `ui.js` and a button with `data-view` in `index.html`.
- Change a finish: edit the material in `materials.js`.

## Checking your work

- Open the page, open the browser console: there must be no errors.
- Click through every view button and every option; readouts in the panel must update.
- Check a phone width (≈400px) — the stage sits above the panel and nothing scrolls sideways.
- Compare positions against the PDF when you move or add anything.

## Publishing

- Repo: https://github.com/itaytoren7/basement (branch `main`)
- Live site: https://itaytoren7.github.io/basement/
- Itay commits and pushes with GitHub Desktop. Never upload through the GitHub website: it ignores `.gitignore` and would publish the PDF.

GitHub Pages serves `index.html` from the repo root (Settings → Pages → Deploy from a branch → `main` / root). On a free account the repo must be **public**, so everything committed is visible — that's why `*.pdf` is in `.gitignore`. Commit, push, and the site updates within a minute or two.
