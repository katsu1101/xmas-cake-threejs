
// 定数の設定
const GRID_ROWS = 5; // 画像を縦に 5 分割
const GRID_COLS = 5; // 画像を横に 5 分割
const ORNAMENTS_COUNT = GRID_ROWS * GRID_COLS; // 25 個

const CAKE_HEIGHT = 1.0; // ケーキの高さ
const CAKE_RADIUS = 3;   // ケーキの半径
const DEFAULT_TEXTURE = 'default_texture.png';
// ===== ケーキテーマ設定 =====
const CAKE_THEMES = {
  cream: {          // 生クリーム系
    cakeColor: 0xfdfbf7,   // ほぼ白クリーム
    creamColor: 0xffffff   // 完全白に近い
  },
  strawberry: {     // いちごケーキ
    cakeColor: 0xffc4d6,   // いちごらしい淡赤（明るくて可愛い）
    creamColor: 0xffe1ec   // いちごホイップのピンク
  },
  chocolate: {      // チョコレートケーキ
    cakeColor: 0x3a1e0e,   // 深いダークチョコ
    creamColor: 0x7a4a28   // ミルク寄りチョコクリーム
  },
  matcha: {         // 抹茶ケーキ
    cakeColor: 0x486b2a,
    creamColor: 0xf6f3e9
  }
};

// 現在のケーキ種類
let currentCakeType = 'strawberry';

// 実際に使われる色（今までの CAKE_COLOR / CREAM_COLOR を置き換え）
let CAKE_COLOR = CAKE_THEMES[currentCakeType].cakeColor;
let CREAM_COLOR = CAKE_THEMES[currentCakeType].creamColor;

// ===== ローソク設定 =====
const CANDLE_SETTINGS = {
  count: 0,        // ← 0〜100 に変更予定
  max: 100
};
const CANDLE_COLOR = 0xffffff;   // ローソク本体（白）
const FLAME_COLOR = 0xffaa00;    // 炎の色（オレンジっぽく）

// ===== ライト設定（外出し） =====
const LIGHT_CONFIG = {
  ambient: {
    color: 0xffffff,
    intensity: 0.05
  },
  key: {
    color: 0xfff8e8,
    intensity: 0.75,
    position: { x: -10, y: 14, z: 8 },
    angle: Math.PI / 5,
    penumbra: 0.4,
    targetY: 0.8
  },
  fill: {
    color: 0xffffff,
    intensity: 0.2,
    position: { x: 8, y: -2, z: -4 }
  },
  hemi: {
    skyColor: 0xfffefc,
    groundColor: 0x404040,
    intensity: 0.25
  },

  // ろうそく関係（今は光源オフにしておいて、後で使う用）
  candle: {
    flameMaterial: {
      color:    0xff2a00,
      emissive: 0xff0f00,
      emissiveIntensity: 1.4,
      roughness: 0.4,
      metalness: 0.0
    },
    pointLight: {
      color: 0xffb060,
      intensity: 0.0,   // ← 今は光源をオフにしておく（後で上げる）
      distance: 1.0,
      decay: 2.0,
      extraHeight: 0.2
    }
  }
};

function getSpiralPointCoordinates(treeHeight, treeRadius, spiralTurns, steps, fraction) {
    // 総螺旋の長さを計算
    // 螺旋の長さを計算するための積分処理
    let totalLength = 0;
    let dTheta = (2 * Math.PI * spiralTurns) / steps;

    for (let i = 0; i < steps; i++) {
        let startTheta = i * dTheta;
        let endTheta = (i + 1) * dTheta;
        // 台形則による数値積分
        totalLength += (spiralLengthDifferential(startTheta) + spiralLengthDifferential(endTheta)) / 2 * dTheta;
    }

    const totalSpiralLength = totalLength;

    // 目的の距離を計算
    const targetDistance = totalSpiralLength * fraction;

    // 現在の距離と角度
    let currentDistance = 0;
    let currentAngle = 0;

    // 螺旋の半径を計算する関数
    function spiralRadius(theta) {
        let z = (treeHeight / (2 * Math.PI * spiralTurns)) * theta;
        return treeRadius * (1 - z / treeHeight);
    }

    // 螺旋の長さの微分を計算する関数
    function spiralLengthDifferential(theta) {
        let dr_dtheta = -treeHeight / (2 * Math.PI * spiralTurns) * treeRadius / treeHeight;
        let dz_dtheta = treeHeight / (2 * Math.PI * spiralTurns);
        let r = spiralRadius(theta);

        // dx/dtheta, dy/dtheta, dz/dtheta の計算
        let dx_dtheta = dr_dtheta * Math.cos(theta) - r * Math.sin(theta);
        let dy_dtheta = dr_dtheta * Math.sin(theta) + r * Math.cos(theta);

        // 曲線の微小区間の長さを計算
        return Math.sqrt(dx_dtheta * dx_dtheta + dy_dtheta * dy_dtheta + dz_dtheta * dz_dtheta);
    }

    // 螺旋をたどる
    for (let i = 0; i < steps; i++) {
        let startTheta = i * dTheta;
        let endTheta = (i + 1) * dTheta;
        let segmentLength = (spiralLengthDifferential(startTheta) + spiralLengthDifferential(endTheta)) / 2 * dTheta;

        // 次のポイントが目的の距離を超える場合、そのセグメント上で目的の点を見つける
        if (currentDistance + segmentLength >= targetDistance) {
            // 目的の点までの残りの距離
            let remainingDistance = targetDistance - currentDistance;
            // 残りの距離から角度の増分を計算
            let deltaTheta = remainingDistance / spiralLengthDifferential(startTheta);
            currentAngle = startTheta + deltaTheta;

            // 螺旋の半径と高さを計算
            let z = (treeHeight / (2 * Math.PI * spiralTurns)) * currentAngle;
            let r = treeRadius * (1 - z / treeHeight);

            // 3D座標を計算
            let x = r * Math.cos(currentAngle);
            let y = r * Math.sin(currentAngle);

            // 目的の3D座標を返す
            return { x: x, y: z, z: y };
        }

        // 現在の距離を更新
        currentDistance += segmentLength;
    }

    // 目的の距離が螺旋の長さを超えている場合、最終的な座標を返す
    let z = treeHeight / 2; // 螺旋の最高点
    let r = 0; // 最高点での半径は0
    let x = r * Math.cos(currentAngle);
    let y = r * Math.sin(currentAngle);
    return { x: x, y: z, z: y };
}

let ornaments = []
// 5×5 グリッドの「外周 → 内側 → 中心」をリングごとに返す
// 戻り値: [ [ {row, col}, ... ], [ {row, col}, ... ], ... ]

let creams = []; // 生クリーム用

let candles = []; // ローソクグループ

function getRings(rows, cols) {
  const rings = [];
  let top = 0;
  let bottom = rows - 1;
  let left = 0;
  let right = cols - 1;

  while (top <= bottom && left <= right) {
    const ring = [];

    // 上端
    for (let c = left; c <= right; c++) {
      ring.push({ row: top, col: c });
    }
    // 右端
    for (let r = top + 1; r <= bottom - 1; r++) {
      if (right >= left) {
        ring.push({ row: r, col: right });
      }
    }
    // 下端
    if (bottom > top) {
      for (let c = right; c >= left; c--) {
        ring.push({ row: bottom, col: c });
      }
    }
    // 左端
    if (right > left) {
      for (let r = bottom - 1; r >= top + 1; r--) {
        ring.push({ row: r, col: left });
      }
    }

    rings.push(ring);

    top++;
    bottom--;
    left++;
    right--;
  }

  return rings;
}

// 生クリームを生成する（小さなコーン形）
function createCreamMesh(height, radius) {
  const geo = new THREE.ConeGeometry(radius, height, 16);
  // const mat = new THREE.MeshBasicMaterial({ color: CREAM_COLOR });
  const mat = new THREE.MeshPhongMaterial({
    color: CREAM_COLOR,
    roughness: 0.9,
    metalness: 0.0
  });
  return new THREE.Mesh(geo, mat);
}

let cakeMesh = null; // 追加

// テクスチャとシーンを更新する関数
function updateSceneWithNewTexture(scene) {

  ornaments = []; // 念のため初期化
  creams = [];   // ★ 生クリーム配列も初期化

  // ケーキ本体（円柱）
  const cakeGeometry = new THREE.CylinderGeometry(CAKE_RADIUS, CAKE_RADIUS, CAKE_HEIGHT, 32);
  const cakeMaterial = new THREE.MeshPhongMaterial({
    color: CAKE_COLOR,
    roughness: 0.92,
    metalness: 0.0
  });
  cakeMesh = new THREE.Mesh(cakeGeometry, cakeMaterial);
  scene.add(cakeMesh);

  // 5×5 = 25 個のオーナメントを作成
  for (let row = 0; row < GRID_ROWS; row++) {
    for (let col = 0; col < GRID_COLS; col++) {
      const ornamentGeometry = new THREE.PlaneGeometry(0.8, 0.8);
      const ornamentMaterial = new THREE.MeshBasicMaterial({
        side: THREE.DoubleSide,
        alphaTest: 0.5,
        transparent: true
      });
      const ornament = new THREE.Mesh(ornamentGeometry, ornamentMaterial);

      const index = row * GRID_COLS + col;
      ornaments[index] = ornament;
      scene.add(ornaments[index]);
    }
  }

  positionOrnamentsOnCake();
}
function positionOrnamentsOnCake() {
  const rings = getRings(GRID_ROWS, GRID_COLS);
  const layersCount = rings.length;

  const outerRadius = CAKE_RADIUS - 0.3; // 外周リング半径
  const innerRadius = 0.6;               // 最内リング半径
  const radiusStep = layersCount > 1
    ? (outerRadius - innerRadius) / (layersCount - 1)
    : 0;

  const cakeTopY = CAKE_HEIGHT / 2 + 0.05; // ケーキ上面の高さ

  // ★ ここでローソク配置を呼ぶ ★
  // 一番外周と2番目の間にローソクを配置

  // いったん既存ローソク削除
  candles.forEach(c => scene.remove(c));
  candles = [];

  // ← ここだけ追加：0〜100 に制限
  const candleCount = Math.max(0, Math.min(CANDLE_SETTINGS.count, 100));

  if (layersCount >= 2 && candleCount > 0) {
    const outerRingRadius = outerRadius;                 // 外周リングの半径
    const secondRingRadius = outerRadius - radiusStep;   // 2番目リングの半径
    const candleRadius = (outerRingRadius + secondRingRadius) / 2; // 中間あたり

    const candleBaseY = cakeTopY + 0.05; // ケーキ面よりちょい上から生える

    for (let i = 0; i < candleCount; i++) {
      const angle = (2 * Math.PI * i) / candleCount;
      const x = Math.cos(angle) * candleRadius;
      const z = Math.sin(angle) * candleRadius;

      const candleGroup = createCandleGroup();
      candleGroup.position.set(x, candleBaseY, z);

      scene.add(candleGroup);
      candles.push(candleGroup);
    }
  }

  rings.forEach((ringCells, ringIndex) => {
    const isLast = ringIndex === layersCount - 1;
    const count = ringCells.length;

    // 外から内側へ行くほど 0 → 1 に増える値
    const t = (layersCount > 1)
      ? ringIndex / (layersCount - 1)
      : 1;

    // 生クリームの高さ＆パーツの上げ幅（中央ほど高く）
    const creamHeight = 0.35 + t * 0.5;      // 例: 外周0.35 → 中央0.85くらい
    const creamRadius = 0.35 + t * 0.1;      // 中央の方を少し太らせてもOK
    const ornamentLift = 0.15 + t * 0.25;    // パーツ高さの上乗せ量

    // 最後のリングが 1 マスだけ → 中央に1つ
    if (isLast && count === 1) {
      const cell = ringCells[0];
      const idx = cell.row * GRID_COLS + cell.col;
      const ornament = ornaments[idx];

      // 生クリーム（中央）
      const cream = createCreamMesh(creamHeight, creamRadius);
      cream.position.set(0, cakeTopY + creamHeight / 2, 0);
      scene.add(cream);
      creams[idx] = cream;

      // パーツ（クリームの上）
      ornament.position.set(0, cakeTopY + creamHeight + ornamentLift, 0);
      ornament.lookAt(new THREE.Vector3(0, ornament.position.y, 1));
      return;
    }

    // それ以外のリングは円周上に均等配置
    const radius = outerRadius - radiusStep * ringIndex;

    // ★ クリームをどれだけ内側に寄せるか（調整用）
    const creamOffset = 0.3; // 大きくするとさらに内側に寄る

    const creamRingRadius = Math.max(radius - creamOffset, innerRadius * 0.3);

    ringCells.forEach((cell, i) => {
      const idx = cell.row * GRID_COLS + cell.col;
      const ornament = ornaments[idx];

      const angle = (2 * Math.PI * i) / count;

      // パーツは元のリング半径（外側）
      const ornamentX = Math.cos(angle) * radius;
      const ornamentZ = Math.sin(angle) * radius;

      // クリームは少し内側の半径
      const creamX = Math.cos(angle) * creamRingRadius;
      const creamZ = Math.sin(angle) * creamRingRadius;

      // 生クリーム（コーン）
      const cream = createCreamMesh(creamHeight, creamRadius);
      cream.position.set(
        creamX,
        cakeTopY + creamHeight / 2,
        creamZ
      );
      scene.add(cream);
      creams[idx] = cream;

      // パーツは元の位置（外側）＋高さ
      ornament.position.set(
        ornamentX,
        cakeTopY + creamHeight + ornamentLift,
        ornamentZ
      );
      ornament.lookAt(new THREE.Vector3(0, cakeTopY + creamHeight + ornamentLift, 0));
    });
  });
}

let texture

function updateTexture(newTexture) {
  texture = newTexture;
  const segmentWidth = 1 / GRID_COLS;  // 1/5
  const segmentHeight = 1 / GRID_ROWS; // 1/5

  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;

  for (let row = 0; row < GRID_ROWS; row++) {
    for (let col = 0; col < GRID_COLS; col++) {
      const index = row * GRID_COLS + col;
      const ornament = ornaments[index];
      if (!ornament) continue;

      ornament.material.map = texture;

      const u0 = col * segmentWidth;
      const u1 = (col + 1) * segmentWidth;
      const v0 = row * segmentHeight;
      const v1 = (row + 1) * segmentHeight;

      const uvs = new Float32Array([
        u0, v1, // 左上
        u1, v1, // 右上
        u0, v0, // 左下
        u1, v0  // 右下
      ]);

      ornament.geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
      ornament.geometry.attributes.uv.needsUpdate = true;
      ornament.material.needsUpdate = true;
    }
  }
}

// カメラの作成
let camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);

// 斜め45度くらいでケーキを見下ろす
camera.position.set(0, 3, 4.5);
camera.lookAt(new THREE.Vector3(0, 0, 0));

// レンダラーの作成
let renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);

// ここ追加
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;

document.body.appendChild(renderer.domElement);

// 背景を透明に設定
renderer.setClearColor(0x000000, 0); // 背景色を黒（0x000000）で透明度0に
document.body.appendChild(renderer.domElement);

// OrbitControlsの作成
const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true; // インタラクティブな動きに抵抗（ダンピング）を追加
controls.dampingFactor = 0.25; // ダンピングの量
controls.enableZoom = true; // ズームを有効にする
controls.autoRotate = true; // カメラの自動回転を有効にする
controls.autoRotateSpeed = 0.5; // 自動回転の速度

// ★ 水平移動（パン）をオフ
controls.enablePan = false;

// ★ ケーキの中心を注視点にする
controls.target.set(0, 0.5, 0); // だいたいケーキ上あたり
controls.update();

// シーンの作成
let scene = new THREE.Scene();


setupLights(scene);

function setupLights(scene) {
  // 環境光
  const ambCfg = LIGHT_CONFIG.ambient;
  const ambient = new THREE.AmbientLight(ambCfg.color, ambCfg.intensity);
  scene.add(ambient);

  // キーライト（メインのスポットライト）
  const kCfg = LIGHT_CONFIG.key;
  const keyLight = new THREE.SpotLight(kCfg.color, kCfg.intensity);
  keyLight.position.set(kCfg.position.x, kCfg.position.y, kCfg.position.z);
  keyLight.angle = kCfg.angle;
  keyLight.penumbra = kCfg.penumbra;
  scene.add(keyLight);
  scene.add(keyLight.target);
  keyLight.target.position.set(0, kCfg.targetY, 0);

  // フィルライト（影側を少し持ち上げる）
  const fCfg = LIGHT_CONFIG.fill;
  const fillLight = new THREE.DirectionalLight(fCfg.color, fCfg.intensity);
  fillLight.position.set(fCfg.position.x, fCfg.position.y, fCfg.position.z);
  scene.add(fillLight);

  // ヘミスフィアライト（上:空色 / 下:地面色）
  const hCfg = LIGHT_CONFIG.hemi;
  const hemi = new THREE.HemisphereLight(
    hCfg.skyColor,
    hCfg.groundColor,
    hCfg.intensity
  );
  scene.add(hemi);
}


function createCandleGroup() {
  const group = new THREE.Group();

  const bodyHeight = 0.8;
  const bodyRadius = 0.08;
  const bodyGeo = new THREE.CylinderGeometry(bodyRadius, bodyRadius, bodyHeight, 8);
  const bodyMat = new THREE.MeshPhongMaterial({ color: CANDLE_COLOR });
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  body.position.y = bodyHeight / 2;
  group.add(body);

  // --- 炎メッシュ ---
  const flameHeight = 0.25;
  const flameRadius = 0.08;
  const flameGeo = new THREE.ConeGeometry(flameRadius, flameHeight, 8);

  const flameMat = new THREE.MeshStandardMaterial({
    color: 0xff2a00,
    emissive: 0xff0f00,
    emissiveIntensity: 1.4,
    roughness: 0.4,
    metalness: 0.0
  });

  const flame = new THREE.Mesh(flameGeo, flameMat);
  // 炎メッシュ自体は「根元」からのローカルオフセットで上にずらす
  flame.position.y = flameHeight / 2;

  // 🔥 根元を原点にしたグループ
  const flameGroup = new THREE.Group();
  flameGroup.position.y = bodyHeight;  // ロウソク先端位置 = pivot
  flameGroup.add(flame);

  group.add(flameGroup);

  // ゆらめき用のランダムオフセットだけ保持
  flameGroup.userData.timeOffset = Math.random() * 100;

  return group;
}


// 環境光（全体を少しだけ明るく）
const ambient = new THREE.AmbientLight(0xffffff, 0.05); // 0.3 → 0.15
scene.add(ambient);

// スポットライト（カメラが向く方向に当てる）
// const spotLight = new THREE.SpotLight(0xffffff, 0.8);

// spotLight.angle = Math.PI / 4;   // 照射範囲も少し狭める
// spotLight.penumbra = 0.5;
//
// spotLight.decay = 1.0;
// spotLight.distance = 30;           // どこまで届くか（ケーキ中心には十分）
// spotLight.castShadow = true;      // シャドウはいったんオフの方が軽い
//
// // ★ 左斜め上の位置（例：左 X-, 上 Y+, 手前 Z+）
// spotLight.position.set(-15, 20, 12);
//
// scene.add(spotLight);


const keyLight = new THREE.SpotLight(0xfff8e8, 0.75);
keyLight.position.set(-10, 14, 8);
keyLight.angle = Math.PI / 5;
keyLight.penumbra = 0.4;
scene.add(keyLight);
scene.add(keyLight.target);
keyLight.target.position.set(0, 0.8, 0);


const fillLight = new THREE.DirectionalLight(0xffffff, 0.2);
fillLight.position.set(8, -2, -4);   // 影側から少しだけ当てる
scene.add(fillLight);


const hemi = new THREE.HemisphereLight(0xfffefc, 0x404040, 0.25);
scene.add(hemi);


// 画像を読み込む
function loadInitialTexture(imagePath) {
    const textureLoader = new THREE.TextureLoader();
    textureLoader.load(imagePath, function(texture) {
        // テクスチャが正しく読み込まれた後にシーンを更新
        updateTexture(texture);
    },null , function(error) {
        // テクスチャ読み込み時のエラー処理
        console.error('テクスチャの読み込みに失敗しました:', error);
    });
}

updateSceneWithNewTexture(scene);
loadInitialTexture(DEFAULT_TEXTURE)

document.addEventListener('dragover', function(event) {
    event.preventDefault();
}, false);

document.addEventListener('drop', function(event) {
    event.preventDefault();
    let file = event.dataTransfer.files[0];
    handleFile(file);
}, false);

document.getElementById('fileInput').addEventListener('change', function(event) {
    event.preventDefault();
    if (!event.target.files || event.target.files.length === 0) {
        return; // ファイルが選択されていない場合、ここで処理を終了
    }
    let file = event.target.files[0];
    handleFile(file);
});



function handleFile(file) {
    const reader = new FileReader();
    reader.onload = function(event) {
        let dataUri = event.target.result;
        loadInitialTexture(dataUri)
    };
    reader.readAsDataURL(file);
}

// ===== 炎ゆらめき設定（根元固定版） =====
const FLAME_FLICKER_CONFIG = {
  rotation: {
    amplitude: 0.12,  // 炎の傾きの大きさ（ラジアン）
    speed: 3.0        // 回転揺らぎの速さ
  },
  scale: {
    amplitude: 0.10,  // 炎の伸び縮みの大きさ
    speed: 4.0        // 伸び縮みの速さ
  }
};


function updateFlameFlicker() {
  const t = performance.now() * 0.002;

  candles.forEach(candleGroup => {
    // createCandleGroup で追加した flameGroup を取得
    const flameGroup = candleGroup.children.find(ch => ch.type === "Group");
    if (!flameGroup) return;

    const offset = flameGroup.userData.timeOffset || 0;

    const rotCfg = FLAME_FLICKER_CONFIG.rotation;
    const scaleCfg = FLAME_FLICKER_CONFIG.scale;

    // 🔥 回転で「根元を支点に」揺らす
    const rot = Math.sin(t * rotCfg.speed + offset) * rotCfg.amplitude;
    const rot2 = Math.cos(t * rotCfg.speed * 1.3 + offset) * rotCfg.amplitude * 0.7;

    flameGroup.rotation.x = rot;
    flameGroup.rotation.z = rot2;

    // スケールの呼吸（高さだけ伸び縮み）
    const sY = 1 + Math.sin(t * scaleCfg.speed + offset) * scaleCfg.amplitude;
    const sXZ = 1 - Math.sin(t * scaleCfg.speed + offset) * (scaleCfg.amplitude * 0.4);

    flameGroup.scale.set(sXZ, sY, sXZ);

    // ✅ position は一切触らないので、根元は動かない
  });
}

function setCakeTheme(type) {
  const theme = CAKE_THEMES[type];
  if (!theme) {
    console.warn('Unknown cake theme:', type);
    return;
  }

  currentCakeType = type;
  CAKE_COLOR = theme.cakeColor;
  CREAM_COLOR = theme.creamColor;

  // 既存メッシュを撤去してから作り直す
  if (cakeMesh) {
    scene.remove(cakeMesh);
  }
  ornaments.forEach(o => scene.remove(o));
  creams.forEach(c => scene.remove(c));
  candles.forEach(c => scene.remove(c));

  ornaments = [];
  creams = [];
  candles = [];

  // ケーキとトッピングを再生成
  updateSceneWithNewTexture(scene);
  if (texture) {
    updateTexture(texture); // 既に読み込んでいる画像があれば再適用
  }
}

function setCandleCount(n) {
  n = Math.max(0, Math.min(n, CANDLE_SETTINGS.max)); // 0〜max に制限
  CANDLE_SETTINGS.count = n;

  // 既存のローソクを全部消す
  candles.forEach(c => scene.remove(c));
  candles = [];

  // 再配置（ケーキ再生成は不要）
  positionOrnamentsOnCake();
}


document.getElementById('backgroundColorPicker').addEventListener('change', function() {
  changeBackground();
});
function changeBackground() {
  let newColor = document.getElementById('backgroundColorPicker').value;
  scene.background = new THREE.Color(newColor);
}



// レンダリングループ
function animate() {
    requestAnimationFrame(animate);

  controls.update();

  updateFlameFlicker();  // ← 揺らぎ処理追加

  renderer.render(scene, camera);
}
animate();
const cakeTypeSelect = document.getElementById('cakeType');
if (cakeTypeSelect) {
  cakeTypeSelect.addEventListener('change', (event) => {
    const type = event.target.value;
    setCakeTheme(type);
  });
}
const candleSlider = document.getElementById("candleInput");
const candleValue = document.getElementById("candleValue");

candleSlider.addEventListener("input", e => {
  const n = parseInt(e.target.value, 10);
  candleValue.textContent = n;
  setCandleCount(n);
});
// 背景初期値（今の好みに合わせて）
const INITIAL_BG_COLOR = '#00ff00';

// Three.js の初期背景も合わせておく
scene.background = new THREE.Color(INITIAL_BG_COLOR);

