// js/main.js
import { initPopup } from './popup.js';
import { loadFonts, fontsLoadedPromise, fontFiles } from './fontLoader.js';
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

document.addEventListener('DOMContentLoaded', async () => {
  initPopup();
  
  // 에디터의 기본 구성요소를 먼저 초기화
  initImageLoader();
  
  // 상태 표시를 위한 요소 생성
  const statusContainer = document.createElement('div');
  statusContainer.id = 'fontLoadStatus';
  statusContainer.className = 'status-toast';
  document.body.appendChild(statusContainer);
  
  // 상태 메시지 표시 함수
  const showStatus = (message, duration = 2000) => {
    statusContainer.innerHTML = `<span class="status-icon">✓</span> ${message}`;
    statusContainer.classList.add('show');
    setTimeout(() => {
      statusContainer.classList.remove('show');
    }, duration);
  };
  
  // 모든 기본 기능을 폰트 로드와 상관없이 일단 초기화
  // 폰트 로딩 시작
  const fontLoadingPromise = loadFonts();
  
  // 모든 기본 UI 컴포넌트 먼저 초기화
  initTextControls();
  initModalControls();
  initDragAndDrop();
  initSaveAndShare();
  initFontPicker();
  
  // 전역 접근을 위해 다른 객체들도 노출
  window.state = (await import('./state.js')).state;
  window.renderCanvas = (await import('./canvasRenderer.js')).renderCanvas;
  
  // 새로운 기능 초기화
  modeControls.init();
  await stickerLoader.init();
  stickerControls.init();
  
  // 레이어 순서 조정 기능 초기화
  initLayerControls();
  
  // 최소 1초 후에 "에디터 사용 가능" 메시지 표시
  setTimeout(() => {
    showStatus('에디터를 사용할 수 있습니다');
  }, 1000);
  
  try {
    // fontLoader.js에서 자체 타임아웃 처리하므로 별도 타임아웃 불필요
    const loadedFonts = await fontLoadingPromise;
    
    if (loadedFonts.length > 1) { // 기본 폰트 외에 다른 폰트도 로드됨
      showStatus(`${loadedFonts.length - 1}개 폰트가 로드되었습니다`, 2000);
      console.log(`폰트 로드 성공: ${loadedFonts.length - 1}/${fontFiles.length}개`);
    } else {
      // 폰트 로딩이 제대로 안된 경우 사용자에게 알림
      console.warn('폰트 로드 실패 - 기본 폰트만 사용 가능');
      showStatus('기본 폰트만 사용 가능합니다', 3000);
    }
    
    console.log('에디터 초기화 완료');
    
  } catch (error) {
    console.error('초기화 중 오류 발생:', error);
    showStatus('일부 기능이 제한될 수 있습니다', 3000);
  }
});