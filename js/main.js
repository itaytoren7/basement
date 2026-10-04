/* main.js — initial state, resize handling and the render loop. Loaded last.
 * The initial state here must match the options marked `checked` in index.html.
 */
(function (B) {
  "use strict";
  if (B.failed) return;
  const { renderer, scene, camera, controls, stage } = B;

  B.buildKitchen(110); B.updateKitchenNote(110);
  B.buildRain(200);
  B.setBathDoor("solid");
  B.buildPerson(165);
  B.updateRainNote();
  B.buildWardrobe("paxglass");
  B.updateSofaKv();
  B.renderShopping();
  B.syncFabrics();
  B.syncLighting();
  B.buildTvMesh(); B.setTvPreset("north");

  function resize() {
    const w = stage.clientWidth, h = stage.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h; camera.updateProjectionMatrix();
  }
  new ResizeObserver(resize).observe(stage);
  resize();
  B.goView("over", true);
  document.getElementById("loading").hidden = true;

  function frame(now) {
    B.stepCamera(now);
    B.stepDoors();
    controls.update();
    renderer.render(scene, camera);
    B.updateLabels();
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  window.__basement = B; // handy in the browser console, e.g. __basement.goView("bath")
})(window.B);
