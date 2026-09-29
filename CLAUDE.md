# The BASEment — 3D model of the basement unit

Interactive 3D model of Itay's basement renovation, built from the interior designer's plan so the family can check sizes, layout and finishes before building. It answers the open points in the designer's letter (wardrobe, kitchenette, bathroom vitrine, rain-shower height, TV position) and records the family's final furniture choices.

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
| `js/core.js` | `window.B`, constants (`H`, `CX`, `CZ`), renderer, scene, camera, OrbitControls, lights, geometry helpers (`box`, `lbox`, `cyl`, `floorRect`, `V`) |
| `js/materials.js` | Canvas-drawn textures (wood, tiles, turquoise wall tiles, fluted glass, TV screen) and all materials `B.M` |
| `js/room.js` | Floors, ceiling, the `WALLS` table, windows, entry door, bathroom vitrine + glass door; `B.wall()` |
| `js/furniture.js` | Bed, nightstands, desk, AC, armchair, coffee table, sofa, alcove closet; `buildKitchen(L)`; wardrobe options `WARDS` + `buildWardrobe(key)` |
| `js/bathroom.js` | Shower (raised 15), bronze fixtures, vanity, standard toilet, wall tiles (`cladPanel`), `buildRain(h)`, `buildPerson(height)`, niche shelves |
| `js/tv.js` | TV sizes, presets (`north` = under the AC, `stairs` = designer's idea), placement, viewing readout, AC gap check |
| `js/ui.js` | Panel readouts, labels, camera `VIEWS`, door animation, theme sync, all control wiring, draggable TV and click-a-wall placement |
| `js/main.js` | Initial state (must match the `checked` inputs in `index.html`), resize, render loop |
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
| Bed 140×200 | x 20–220, z 80–220, headboard on the west wall; nightstands z 20–80 and 220–280 |
| Desk + chair | desk x 399–464, z 80–260 (65 × 180), centred on the east wall between the entry door and north wall; chair x 357–391, z 150–190 |
| Lounge seating | armchairs x 132–208 and 366–442, z 298–383, facing each other across the coffee table x 247–327, z 307–382; sofa 150 wide x 201–351, z 430–506 (faces north) |
| Wardrobe | west wall, **240 wide × 60 deep**, x 20–80, z 398–638; **90** clear to the kitchenette |
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
- **TV under the AC**, centred on the north wall (x ≈ 250), default 50″ at 110 centre height. The designer's stairs-wall position stays as an option to compare.
- **TV on an articulated telescoping arm**, draggable along walls, extending 10–45 cm, with 180° total swivel (90° left and right).
- **Bathroom walls: turquoise / light-blue tiles, 15×15, up to the ceiling** (under the window only up to the sill).
- **Shower fixtures in bronze** (mixer, hand shower, rain head). The basin faucet is still chrome — not decided.
- **Wardrobe: carpentry to the ceiling, 240 × 60 × 220**, in the south-west corner, x 20–80, z 398–638.
- **Kitchenette: fixed 120 wide**, x 170–290, z 578–638, with a coffee machine, sink centred at x 230, and a small dish-drying rack; no cooktop.
- **Desk: enlarged to 65 × 180** and centred on the east wall segment between the north TV wall and entry door.
- **Toilet: standard floor-mounted model**, with visible tank and no concealed-cistern wall.
- **Upholstery: near-black charcoal** for the sofa and both opposing armchairs.
- **Bathroom wall / vitrine: low wall to 160, glass above x 164–302, post x 302–307, glass door 72 x 308–380, solid wall x 383–547**.

Still open (options in the panel):
- Bathroom door: regular white interior door (Pandor-style, solid: better privacy, sound and smell) vs the designer's framed glass door. The vitrine glass above the low wall stays either way. Default in the panel: regular white. Code: `room.js` `setBathDoor(type)`. Not yet discussed with the designer.
- IKEA/Harel wardrobe options were 200 wide and are not yet updated with the new plan; pending a decision from Itay.
- Vitrine frame white (designer's preference, Greek style) or black; clear or fluted ("גלינה") glass.
- Rain head 195 or 200 above the raised shower floor.

Assumptions (not in the plan): bedroom window height, door heights (≈205), floor tiles, furniture finishes and colours.

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
