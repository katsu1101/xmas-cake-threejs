// config.js

// ===== グリッド・ケーキ基本設定 =====
const GRID_ROWS = 5;
const GRID_COLS = 5;
const ORNAMENTS_COUNT = GRID_ROWS * GRID_COLS;

const CAKE_HEIGHT = 1.0;
const CAKE_RADIUS = 3;
const DEFAULT_TEXTURE = 'default_texture.png';

// 背景初期値
const INITIAL_BG_COLOR = '#00ff00';

// ===== ケーキテーマ設定 =====
const CAKE_THEMES = {
  cream: {
    cakeColor: 0xfdfbf7,
    creamColor: 0xffffff,
  },
  strawberry: {
    cakeColor: 0xffc4d6,
    creamColor: 0xffe1ec,
  },
  chocolate: {
    cakeColor: 0x3a1e0e,
    creamColor: 0x7a4a28,
  },
  matcha: {
    cakeColor: 0x486b2a,
    creamColor: 0xf6f3e9,
  },
};

// 現在のケーキ種類と色
let currentCakeType = 'strawberry';
let CAKE_COLOR  = CAKE_THEMES[currentCakeType].cakeColor;
let CREAM_COLOR = CAKE_THEMES[currentCakeType].creamColor;

// ===== ローソク設定 =====
const CANDLE_SETTINGS = {
  count: 0,
  max: 100,
};
const CANDLE_COLOR = 0xffffff;

// ===== ライト設定 =====
const LIGHT_CONFIG = {
  ambient: {
    color: 0xffffff,
    intensity: 0.05,
  },
  key: {
    color: 0xfff8e8,
    intensity: 0.75,
    position: { x: -10, y: 14, z: 8 },
    angle: Math.PI / 5,
    penumbra: 0.4,
    targetY: 0.8,
  },
  fill: {
    color: 0xffffff,
    intensity: 0.2,
    position: { x: 8, y: -2, z: -4 },
  },
  hemi: {
    skyColor: 0xfffefc,
    groundColor: 0x404040,
    intensity: 0.25,
  },
};

// ===== 炎ゆらめき設定 =====
const FLAME_FLICKER_CONFIG = {
  rotation: {
    amplitude: 0.12,
    speed: 3.0,
  },
  scale: {
    amplitude: 0.10,
    speed: 4.0,
  },
};

// ===== ストレージ用キー =====
const SETTINGS_STORAGE_KEY = 'xmas_cake_settings_v1';

// IndexedDB 用
const TEXTURE_DB_NAME    = 'xmasCakeDB';
const TEXTURE_DB_VERSION = 1;
const TEXTURE_STORE_NAME = 'textures';
const TEXTURE_DB_KEY     = 'currentTexture';

// ===== クリーム形状設定 =====
// 縁どりクリーム設定
const EDGE_CREAM_COUNT        = 100;          // 何個並べるか
const EDGE_CREAM_RING_OFFSET  = 0.08;        // ケーキのふちからのオフセット
const EDGE_CREAM_HEIGHT       = 0.10;        // 縁クリームの高さ
const EDGE_CREAM_RADIUS       = 0.12;        // 縁クリームの半径
