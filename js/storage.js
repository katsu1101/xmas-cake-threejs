// storage.js

// === IndexedDB (画像) ===
function openTextureDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(TEXTURE_DB_NAME, TEXTURE_DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(TEXTURE_STORE_NAME)) {
        db.createObjectStore(TEXTURE_STORE_NAME);
      }
    };

    request.onsuccess = (event) => resolve(event.target.result);
    request.onerror  = (event) => reject(event.target.error);
  });
}

function saveTextureToIndexedDB(fileBlob) {
  return openTextureDB().then(db => {
    return new Promise((resolve, reject) => {
      const tx    = db.transaction([TEXTURE_STORE_NAME], 'readwrite');
      const store = tx.objectStore(TEXTURE_STORE_NAME);
      const req   = store.put(fileBlob, TEXTURE_DB_KEY);

      req.onsuccess = () => resolve();
      req.onerror   = (event) => reject(event.target.error);
    });
  });
}

function loadTextureFromIndexedDB() {
  return openTextureDB().then(db => {
    return new Promise((resolve, reject) => {
      const tx    = db.transaction([TEXTURE_STORE_NAME], 'readonly');
      const store = tx.objectStore(TEXTURE_STORE_NAME);
      const req   = store.get(TEXTURE_DB_KEY);

      req.onsuccess = () => resolve(req.result || null);
      req.onerror   = (event) => reject(event.target.error);
    });
  });
}

// === 設定保存 (localStorage) ===
function saveSettings() {
  let backgroundColor = INITIAL_BG_COLOR;
  const bgPicker = document.getElementById('backgroundColorPicker');

  if (bgPicker && bgPicker.value) {
    backgroundColor = bgPicker.value;
  } else if (window.scene && scene.background && scene.background.isColor) {
    backgroundColor = '#' + scene.background.getHexString();
  }

  const settings = {
    cakeType: currentCakeType,
    backgroundColor,
    candleCount: CANDLE_SETTINGS.count,
  };

  try {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  } catch (e) {
    console.warn('設定をローカルストレージに保存できませんでした:', e);
  }
}

function loadSettings() {
  const savedJson = localStorage.getItem(SETTINGS_STORAGE_KEY);
  const bgPicker = document.getElementById('backgroundColorPicker');
  const candleInput = document.getElementById('candleInput');
  const candleValue = document.getElementById('candleValue');
  const cakeSelect  = document.getElementById('cakeType');

  if (!savedJson) {
    if (bgPicker)   bgPicker.value = INITIAL_BG_COLOR;
    if (window.scene) {
      scene.background = new THREE.Color(INITIAL_BG_COLOR);
    }

    if (candleInput && candleValue) {
      candleInput.value   = String(CANDLE_SETTINGS.count);
      candleValue.textContent = String(CANDLE_SETTINGS.count);
    }

    if (cakeSelect) {
      cakeSelect.value = currentCakeType;
    }
    return;
  }

  let settings;
  try {
    settings = JSON.parse(savedJson);
  } catch (e) {
    console.warn('保存設定のパースエラー:', e);
    return;
  }

  // 背景色
  if (settings.backgroundColor && window.scene) {
    scene.background = new THREE.Color(settings.backgroundColor);
    if (bgPicker) bgPicker.value = settings.backgroundColor;
  }

  // ケーキタイプ
  if (settings.cakeType && CAKE_THEMES[settings.cakeType]) {
    setCakeTheme(settings.cakeType);
    if (cakeSelect) cakeSelect.value = settings.cakeType;
  }

  // ろうそく
  if (typeof settings.candleCount === 'number') {
    setCandleCount(settings.candleCount);
    if (candleInput) candleInput.value = String(settings.candleCount);
    if (candleValue) candleValue.textContent = String(settings.candleCount);
  }
}
