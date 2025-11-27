// app.js

let camera;
let renderer;
let controls;
let scene;

// Three.js 初期化
function initThree() {
  camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.set(0, 2.5, 5);
  camera.lookAt(new THREE.Vector3(0, 0, 0));

  renderer = new THREE.WebGLRenderer();
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.outputColorSpace   = THREE.SRGBColorSpace;
  renderer.toneMapping        = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.setClearColor(0x000000, 0);

  document.body.appendChild(renderer.domElement);

  controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.25;
  controls.enableZoom    = true;
  controls.autoRotate    = true;
  controls.autoRotateSpeed = -0.15;
  controls.enablePan     = false;
  controls.target.set(0, 0.5, 0);
  controls.update();

  scene = new THREE.Scene();
  setupLights(scene);
  scene.background = new THREE.Color(INITIAL_BG_COLOR);
}

function setupLights(scene) {
  const ambCfg = LIGHT_CONFIG.ambient;
  const ambient = new THREE.AmbientLight(ambCfg.color, ambCfg.intensity);
  scene.add(ambient);

  const kCfg = LIGHT_CONFIG.key;
  const keyLight = new THREE.SpotLight(kCfg.color, kCfg.intensity);
  keyLight.position.set(kCfg.position.x, kCfg.position.y, kCfg.position.z);
  keyLight.angle    = kCfg.angle;
  keyLight.penumbra = kCfg.penumbra;
  scene.add(keyLight);
  scene.add(keyLight.target);
  keyLight.target.position.set(0, kCfg.targetY, 0);

  const fCfg = LIGHT_CONFIG.fill;
  const fillLight = new THREE.DirectionalLight(fCfg.color, fCfg.intensity);
  fillLight.position.set(fCfg.position.x, fCfg.position.y, fCfg.position.z);
  scene.add(fillLight);

  const hCfg = LIGHT_CONFIG.hemi;
  const hemi = new THREE.HemisphereLight(
    hCfg.skyColor,
    hCfg.groundColor,
    hCfg.intensity
  );
  scene.add(hemi);
}

// テクスチャ読み込み
function loadInitialTexture(imagePath) {
  const loader = new THREE.TextureLoader();
  loader.load(
    imagePath,
    (tex) => { updateTexture(tex); },
    undefined,
    (err) => { console.error('テクスチャ読み込み失敗:', err); }
  );
}

// ファイル読み込み
function handleFile(file) {
  const reader = new FileReader();
  reader.onload = (event) => {
    const dataUri = event.target.result;

    // IndexedDB に保存
    saveTextureToIndexedDB(file).catch(err => {
      console.warn('IndexedDB に画像を保存できませんでした:', err);
    });

    // テクスチャ更新
    loadInitialTexture(dataUri);
  };
  reader.readAsDataURL(file);
}

// 背景色変更
function changeBackground() {
  const picker = document.getElementById('backgroundColorPicker');
  if (!picker) return;

  const newColor = picker.value;
  scene.background = new THREE.Color(newColor);
  saveSettings();
}

// イベント設定
function setupUI() {
  const bgPicker = document.getElementById('backgroundColorPicker');
  if (bgPicker) {
    bgPicker.addEventListener('change', changeBackground);
  }

  const cakeTypeSelect = document.getElementById('cakeType');
  if (cakeTypeSelect) {
    cakeTypeSelect.addEventListener('change', (event) => {
      setCakeTheme(event.target.value);
    });
  }

  const candleInput = document.getElementById('candleInput');
  const candleValue = document.getElementById('candleValue');
  if (candleInput) {
    candleInput.addEventListener('input', (e) => {
      const n = parseInt(e.target.value, 10) || 0;
      if (candleValue) candleValue.textContent = n;
      setCandleCount(n);
    });
  }

  const fileInput = document.getElementById('fileInput');
  if (fileInput) {
    fileInput.addEventListener('change', (event) => {
      event.preventDefault();
      if (!event.target.files || event.target.files.length === 0) return;
      handleFile(event.target.files[0]);
    });
  }

  // ドラッグ＆ドロップ
  document.addEventListener('dragover', (event) => event.preventDefault(), false);
  document.addEventListener('drop', (event) => {
    event.preventDefault();
    if (!event.dataTransfer.files || event.dataTransfer.files.length === 0) return;
    handleFile(event.dataTransfer.files[0]);
  }, false);

  // ⚙ トグル（前に書いたものをここに移動）
  const footer         = document.querySelector('.footer');
  const settingsToggle = document.getElementById('settingsToggle');
  if (footer && settingsToggle) {
    settingsToggle.addEventListener('click', (event) => {
      event.stopPropagation();
      footer.classList.toggle('open');
    });

    document.addEventListener('click', (event) => {
      if (!footer.contains(event.target)) {
        footer.classList.remove('open');
      }
    });
  }
}

// アニメーションループ
function animate() {
  requestAnimationFrame(animate);
  controls.update();
  updateFlameFlicker();
  renderer.render(scene, camera);
}

// エントリーポイント
window.addEventListener('load', () => {
  initThree();
  updateSceneWithNewTexture(scene);

  // 設定復元
  loadSettings();

  // IndexedDB の画像 or デフォルト
  loadTextureFromIndexedDB()
    .then(blob => {
      if (!blob) {
        loadInitialTexture(DEFAULT_TEXTURE);
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUri = e.target.result;
        loadInitialTexture(dataUri);
      };
      reader.readAsDataURL(blob);
    })
    .catch(err => {
      console.warn('IndexedDB から画像読み込み失敗:', err);
      loadInitialTexture(DEFAULT_TEXTURE);
    });

  setupUI();
  animate();
});
