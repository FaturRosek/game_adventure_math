export const UI_ASSET_PATHS = {
  menuSceneJpg: "./assets/ui/menu-scene-bg.jpg",
  menuScenePng: "./assets/ui/menu-scene-bg.png",
  worldBgJpg: "./assets/ui/fantasy-world-bg.jpg",
  worldBgPng: "./assets/ui/fantasy-world-bg.png",
};

export function renderMainMenuBackdrop() {
  return `
    <div class="pdp-world-backdrop pdp-menu-scene-backdrop" aria-hidden="true">
      <img
        id="pdp-menu-scene-img"
        class="pdp-world-img"
        src="${UI_ASSET_PATHS.menuSceneJpg}"
        alt="Dunia Petualangan Dunia Pintar"
        onload="this.classList.add('loaded'); document.body.classList.add('pdp-has-menu-art');"
        onerror="if(!this.dataset.triedPng){this.dataset.triedPng='1';this.src='${UI_ASSET_PATHS.menuScenePng}';}else{this.remove();document.body.classList.remove('pdp-has-menu-art');}"
      />
      <div class="pdp-world-vignette"></div>
    </div>
  `;
}

export function renderFantasyWorldBackdrop() {
  return `
    <div class="pdp-world-backdrop" aria-hidden="true">
      <img
        class="pdp-world-img"
        src="${UI_ASSET_PATHS.worldBgJpg}"
        alt=""
        onload="this.classList.add('loaded')"
        onerror="if(!this.dataset.triedPng){this.dataset.triedPng='1';this.src='${UI_ASSET_PATHS.worldBgPng}';}else{this.remove();}"
      />
      <div class="pdp-world-vignette"></div>
    </div>
  `;
}

export function renderFallbackTitleCrest() {
  return `
    <div class="pdp-title-crest pdp-fallback-only">
      <div class="pdp-crest-board">
        <div class="pdp-crest-title-top">Petualangan</div>
        <div class="pdp-crest-title-main">Dunia Pintar</div>
      </div>
      <div class="pdp-crest-ribbon">Belajar • Bermain • Berpetualang</div>
      <div class="pdp-asset-notice">
        Simpan aset gambar di <code>public/assets/ui/menu-scene-bg.jpg</code> untuk tampilan 3D penuh.
      </div>
    </div>
  `;
}
