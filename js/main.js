// js/main.js
import { initPopup } from './popup.js';
import { initImageLoader } from './imageLoader.js';
import { initTextControls } from './textControls.js';
import { initModalControls } from './modalControls.js';
import { initDragAndDrop } from './dragAndDrop.js';
import { initSaveAndShare } from './saveAndShare.js';
import { initFontPicker } from './fontPicker.js';
import { stickerLoader } from './stickerLoader.js';
import { stickerControls } from './stickerControls.js';
import { modeControls } from './modeControls.js';
import { initLayerControls } from './layerControls.js';
import { initHistory } from './history.js';
import { isMobile } from './utils.js';
import { log } from './logger.js';

document.addEventListener('DOMContentLoaded', async () => {
  initPopup();

  const mobile = isMobile();

  // 에디터의 기본 구성요소 초기화
  initImageLoader();

  // 상태 토스트
  const statusContainer = document.createElement('div');
  statusContainer.id = 'fontLoadStatus';
  statusContainer.className = 'status-toast';
  document.body.appendChild(statusContainer);

  const showStatus = (message, duration = 2000) => {
    statusContainer.innerHTML = `<span class="status-icon">✓</span> ${message}`;
    statusContainer.classList.add('show');
    setTimeout(() => {
      statusContainer.classList.remove('show');
    }, duration);
  };

  // 기본 UI 컴포넌트 초기화 (폰트는 지연 로딩하므로 대기 불필요)
  initTextControls();
  initModalControls();
  initDragAndDrop();
  initSaveAndShare();
  initFontPicker();

  // 전역 접근을 위해 노출
  window.state = (await import('./state.js')).state;
  window.renderCanvas = (await import('./canvasRenderer.js')).renderCanvas;

  // 모드/스티커/레이어 기능 초기화
  modeControls.init();
  await stickerLoader.init();
  stickerControls.init();
  initLayerControls();
  initHistory();

  // 모바일에서 사용자 상호작용 후 텍스트 입력 활성화
  if (mobile) {
    document.addEventListener('touchstart', function enableTextInput() {
      const textInput = document.getElementById('textInput');
      if (textInput) {
        textInput.style.pointerEvents = 'auto';
        textInput.removeAttribute('readonly');
      }
      document.removeEventListener('touchstart', enableTextInput);
    }, { once: true, passive: true });
  } else {
    // PC에서만 초기 포커스
    setTimeout(() => {
      const textInput = document.getElementById('textInput');
      if (textInput) textInput.focus();
    }, 100);
  }

  // 에디터 사용 가능 안내
  setTimeout(() => {
    showStatus('에디터를 사용할 수 있습니다');
  }, 600);

  log('에디터 초기화 완료');
});
