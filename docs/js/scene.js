// scene.js

// ケーキ関連のグローバル
let ornaments = [];
let creams    = [];
let candles   = [];
let edgeCreams = [];   // ★ 追加：ケーキのふち用クリーム
let cakeMesh  = null;
let texture   = null;

// グリッドをリングごとに分解
function getRings(rows, cols) {
  const rings = [];
  let top = 0;
  let bottom = rows - 1;
  let left = 0;
  let right = cols - 1;

  while (top <= bottom && left <= right) {
    const ring = [];

    for (let c = left; c <= right; c++) {
      ring.push({ row: top, col: c });
    }
    for (let r = top + 1; r <= bottom - 1; r++) {
      if (right >= left) ring.push({ row: r, col: right });
    }
    if (bottom > top) {
      for (let c = right; c >= left; c--) {
        ring.push({ row: bottom, col: c });
      }
    }
    if (right > left) {
      for (let r = bottom - 1; r >= top + 1; r--) {
        ring.push({ row: r, col: left });
      }
    }

    rings.push(ring);
    top++; bottom--; left++; right--;
  }

  return rings;
}

function createCreamMesh(height, radius) {
  const group = new THREE.Group();

  const creamMaterial = new THREE.MeshStandardMaterial({
    color: CREAM_COLOR,
    roughness: 0.9,
    metalness: 0.0,
  });

  // ===== 1. 基準となる“標準クリーム”の形を作る =====
  // 基準サイズ（この形をあとでスケールする）
  const BASE_HEIGHT = 1.0;
  const BASE_RADIUS = 1.0;

  // 上：基準サイズの円錐
  const coneGeo = new THREE.ConeGeometry(BASE_RADIUS, BASE_HEIGHT, 16);
  const cone = new THREE.Mesh(coneGeo, creamMaterial);
  group.add(cone);

  // 下：基準サイズのつぶれ球
  const SPHERE_RADIUS_RATIO   = 0.9;  // 球の半径は円錐より少し小さく
  const SPHERE_FLATTEN_Y      = 0.9;  // 縦潰し具合（外側で良かった値）
  const SPHERE_OVERLAP_RATIO  = 0.9;  // 円錐にどれくらい重ねるか

  const baseRadius = BASE_RADIUS * SPHERE_RADIUS_RATIO;
  const sphereGeo  = new THREE.SphereGeometry(baseRadius, 20, 20);
  const sphere     = new THREE.Mesh(sphereGeo, creamMaterial);

  // つぶし具合
  sphere.scale.set(1, SPHERE_FLATTEN_Y, 1);

  const sphereHalfHeight = baseRadius * SPHERE_FLATTEN_Y;
  const overlap          = sphereHalfHeight * SPHERE_OVERLAP_RATIO;

  // 円錐の底（-BASE_HEIGHT/2）あたりに少し重ねて接続
  sphere.position.y = -BASE_HEIGHT / 2 - sphereHalfHeight + overlap;

  group.add(sphere);

  // ===== 2. リングごとの height / radius に合わせてスケール =====
  // XZ は半径に合わせる
  const scaleXZ = radius / BASE_RADIUS;
  // Y は高さに合わせる
  const scaleY  = height / BASE_HEIGHT;

  group.scale.set(scaleXZ, scaleY, scaleXZ);

  return group;
}


// ケーキ本体 + オーナメント生成
function updateSceneWithNewTexture(scene) {
  ornaments = [];
  creams    = [];

  const cakeGeometry = new THREE.CylinderGeometry(CAKE_RADIUS, CAKE_RADIUS, CAKE_HEIGHT, 32);
  const cakeMaterial = new THREE.MeshStandardMaterial({
    color: CAKE_COLOR,
    roughness: 0.92,
    metalness: 0.0,
  });
  cakeMesh = new THREE.Mesh(cakeGeometry, cakeMaterial);
  scene.add(cakeMesh);

  for (let row = 0; row < GRID_ROWS; row++) {
    for (let col = 0; col < GRID_COLS; col++) {
      const size =
        ( (row + 1 )=== (GRID_ROWS + 1) / 2 && (col + 1 )=== (GRID_COLS + 1)/ 2)
          ? 2 : 0.8;
      const geo = new THREE.PlaneGeometry(size, size);
      const mat = new THREE.MeshBasicMaterial({
        side: THREE.DoubleSide,
        alphaTest: 0.5,
        transparent: true,
      });
      const ornament = new THREE.Mesh(geo, mat);

      const index = row * GRID_COLS + col;
      ornaments[index] = ornament;
      scene.add(ornaments[index]);
    }
  }

  positionOrnamentsOnCake();
}

// オーナメント ＆ クリーム ＆ ろうそく配置
function positionOrnamentsOnCake() {
  const rings = getRings(GRID_ROWS, GRID_COLS);
  const layersCount = rings.length;

  const outerRadius = CAKE_RADIUS - 0.3;
  const innerRadius = 0.6;
  const radiusStep = layersCount > 1
    ? (outerRadius - innerRadius) / (layersCount - 1)
    : 0;

  const cakeTopY = CAKE_HEIGHT / 2;

  // まず既存のクリームとローソクを全部消す
  creams.forEach(c => scene.remove(c));
  creams = [];
  candles.forEach(c => scene.remove(c));
  candles = [];

  // ★ 縁どりクリームも掃除
  edgeCreams.forEach(c => scene.remove(c));
  edgeCreams = [];

  const candleCount = Math.max(0, Math.min(CANDLE_SETTINGS.count, 100));

  if (layersCount >= 2 && candleCount > 0) {
    const outerRingRadius   = outerRadius;
    const secondRingRadius  = outerRadius - radiusStep;
    const candleRadius      = (outerRingRadius + secondRingRadius) / 2;
    const candleBaseY       = cakeTopY + 0.05;

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
    const count  = ringCells.length;

    const t = (layersCount > 1)
      ? ringIndex / (layersCount - 1)
      : 1;

    const creamHeight = 0.35 + t * 0.5;
    const creamRadius = 0.35 + t * 0.1;
    const ornamentLift = 0.15 + t * 0.2 + (isLast ? 0.7 : 0);

    // 最後のリングが 1 マスだけ → 中央
    if (isLast && count === 1) {
      const cell = ringCells[0];
      const idx = cell.row * GRID_COLS + cell.col;
      const ornament = ornaments[idx];

      const cream = createCreamMesh(creamHeight, creamRadius);
      cream.position.set(0, cakeTopY + creamHeight / 2, 0);
      scene.add(cream);
      creams[idx] = cream;

      ornament.position.set(0, cakeTopY + creamHeight + ornamentLift, 0);
      ornament.lookAt(new THREE.Vector3(0, ornament.position.y, 1));
      return;
    }

    // その他のリング
    const radius = outerRadius - radiusStep * ringIndex;

    const creamOffset = 0.3;
    const creamRingRadius = Math.max(radius - creamOffset, innerRadius * 0.3);

    ringCells.forEach((cell, i) => {
      const idx = cell.row * GRID_COLS + cell.col;
      const ornament = ornaments[idx];

      const angle = (2 * Math.PI * i) / count;

      // パーツ（外側）
      const ornamentX = Math.cos(angle) * radius;
      const ornamentZ = Math.sin(angle) * radius;

      // クリーム（少し内側）
      const creamX = Math.cos(angle) * creamRingRadius;
      const creamZ = Math.sin(angle) * creamRingRadius;

      const cream = createCreamMesh(creamHeight, creamRadius);
      cream.position.set(
        creamX,
        cakeTopY + creamHeight / 2,
        creamZ
      );
      scene.add(cream);
      creams[idx] = cream;

      ornament.position.set(
        ornamentX,
        cakeTopY + creamHeight + ornamentLift,
        ornamentZ
      );
      ornament.lookAt(new THREE.Vector3(
        ornamentX * 2,
        cakeTopY + creamHeight + ornamentLift,
        ornamentZ * 2
      ));
    });
  });
  // ---------- ケーキのふちに小さいクリームを並べる ----------
  const edgeRingRadius = CAKE_RADIUS - EDGE_CREAM_RING_OFFSET;
  const edgeCakeTopY   = CAKE_HEIGHT / 2;   // ケーキの上面

  for (let i = 0; i < EDGE_CREAM_COUNT; i++) {
    const angle = (2 * Math.PI * i) / EDGE_CREAM_COUNT;

    const x = Math.cos(angle) * edgeRingRadius;
    const z = Math.sin(angle) * edgeRingRadius;

    const edgeCream = createCreamMesh(EDGE_CREAM_HEIGHT, EDGE_CREAM_RADIUS);

    // クリームの底がケーキ表面に乗るように
    edgeCream.position.set(x, edgeCakeTopY + EDGE_CREAM_HEIGHT, z);

    scene.add(edgeCream);
    edgeCreams.push(edgeCream);
  }
}

// ろうそくグループ生成
function createCandleGroup() {
  const group = new THREE.Group();

  const bodyHeight = 0.8;
  const bodyRadius = 0.08;
  const bodyGeo = new THREE.CylinderGeometry(bodyRadius, bodyRadius, bodyHeight, 8);
  const bodyMat = new THREE.MeshStandardMaterial({ color: CANDLE_COLOR });
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  body.position.y = bodyHeight / 2;
  group.add(body);

  const flameHeight = 0.25;
  const flameRadius = 0.08;
  const flameGeo = new THREE.ConeGeometry(flameRadius, flameHeight, 8);

  const flameMat = new THREE.MeshStandardMaterial({
    color: 0xff2a00,
    emissive: 0xff0f00,
    emissiveIntensity: 1.4,
    roughness: 0.4,
    metalness: 0.0,
  });

  const flame = new THREE.Mesh(flameGeo, flameMat);
  flame.position.y = flameHeight / 2;

  const flameGroup = new THREE.Group();
  flameGroup.position.y = bodyHeight;
  flameGroup.add(flame);

  group.add(flameGroup);
  flameGroup.userData.timeOffset = Math.random() * 100;

  return group;
}

// テクスチャ分割（5x5）
function updateTexture(newTexture) {
  texture = newTexture;

  const segmentWidth  = 1 / GRID_COLS;
  const segmentHeight = 1 / GRID_ROWS;

  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;

  for (let row = 0; row < GRID_ROWS; row++) {
    for (let col = 0; col < GRID_COLS; col++) {
      const index    = row * GRID_COLS + col;
      const ornament = ornaments[index];
      if (!ornament) continue;

      ornament.material.map = texture;

      const u0 = col * segmentWidth;
      const u1 = (col + 1) * segmentWidth;
      const v0 = row * segmentHeight;
      const v1 = (row + 1) * segmentHeight;

      const uvs = new Float32Array([
        u0, v1,
        u1, v1,
        u0, v0,
        u1, v0,
      ]);

      ornament.geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
      ornament.geometry.attributes.uv.needsUpdate = true;
      ornament.material.needsUpdate = true;
    }
  }
}

// 炎ゆらめき
function updateFlameFlicker() {
  const t = performance.now() * 0.002;

  candles.forEach(candleGroup => {
    const flameGroup = candleGroup.children.find(ch => ch.type === 'Group');
    if (!flameGroup) return;

    const offset = flameGroup.userData.timeOffset || 0;
    const rotCfg   = FLAME_FLICKER_CONFIG.rotation;
    const scaleCfg = FLAME_FLICKER_CONFIG.scale;

    const rot  = Math.sin(t * rotCfg.speed + offset) * rotCfg.amplitude;
    const rot2 = Math.cos(t * rotCfg.speed * 1.3 + offset) * rotCfg.amplitude * 0.7;

    flameGroup.rotation.x = rot;
    flameGroup.rotation.z = rot2;

    const sY  = 1 + Math.sin(t * scaleCfg.speed + offset) * scaleCfg.amplitude;
    const sXZ = 1 - Math.sin(t * scaleCfg.speed + offset) * (scaleCfg.amplitude * 0.4);

    flameGroup.scale.set(sXZ, sY, sXZ);
  });
}

// テーマ変更 / ろうそく本数変更
function setCakeTheme(type) {
  const theme = CAKE_THEMES[type];
  if (!theme) {
    console.warn('Unknown cake theme:', type);
    return;
  }

  currentCakeType = type;
  CAKE_COLOR  = theme.cakeColor;
  CREAM_COLOR = theme.creamColor;

  if (cakeMesh) {
    scene.remove(cakeMesh);
  }
  ornaments.forEach(o => scene.remove(o));
  creams.forEach(c => scene.remove(c));
  candles.forEach(c => scene.remove(c));

  ornaments = [];
  creams    = [];
  candles   = [];

  updateSceneWithNewTexture(scene);
  if (texture) {
    updateTexture(texture);
  }

  saveSettings();
}

function setCandleCount(n) {
  n = Math.max(0, Math.min(n, CANDLE_SETTINGS.max));
  CANDLE_SETTINGS.count = n;

  candles.forEach(c => scene.remove(c));
  candles = [];

  positionOrnamentsOnCake();

  saveSettings();
}
