// js/main.js
import { initPopup } from './popup.js';
import { loadFonts, fontsLoadedPromise } from './fontLoader.js';
import { initImageLoader } from './imageLoader.js';
import { initTextControls } from './textControls.js';
import { initModalControls } from './modalControls.js';
import { initDragAndDrop } from './dragAndDrop.js';
import { initSaveAndShare } from './saveAndShare.js';
import { initFontPicker } from './fontPicker.js';

document.addEventListener('DOMContentLoaded', async () => {
  initPopup();
  
  // 에디터의 기본 구성요소를 먼저 초기화
  initImageLoader();
  
  // 상태 표시를 위한 요소 생성
  const statusContainer = document.createElement('div');
  statusContainer.id = 'editorStatusContainer';
  statusContainer.style.cssText = 'position:fixed; bottom:20px; right:20px; background:#59b4ad; color:white; padding:10px; border-radius:5px; z-index:1000; opacity:0; transition:opacity 0.3s; pointer-events:none;';
  document.body.appendChild(statusContainer);
  
  // 상태 메시지 표시 함수
  const showStatus = (message, duration = 2000) => {
    statusContainer.textContent = message;
    statusContainer.style.opacity = '1';
    setTimeout(() => {
      statusContainer.style.opacity = '0';
    }, duration);
  };
  
  // 모든 기본 기능을 폰트 로드와 상관없이 일단 초기화
  // 폰트 로딩 시작
  const fontLoadingPromise = loadFonts();
  
  // 폰트 로딩 타임아웃 처리 (10초)
  const fontLoadingTimeout = new Promise((resolve) => {
    setTimeout(() => {
      console.warn('폰트 로드 타임아웃 - 기본 폰트로 진행합니다');
      resolve([{ name: 'sans-serif', face: null }]);
    }, 10000);
  });
  
  // 모든 기본 UI 컴포넌트 먼저 초기화
  initTextControls();
  initModalControls();
  initDragAndDrop();
  initSaveAndShare();
  initFontPicker();
  
  // 최소 1초 후에 "에디터 사용 가능" 메시지 표시
  setTimeout(() => {
    showStatus('에디터를 사용할 수 있습니다');
  }, 1000);
  
  try {
    // Promise.race를 사용하여 타임아웃과 폰트 로딩 중 먼저 완료되는 것을 기다림
    const loadedFonts = await Promise.race([fontLoadingPromise, fontLoadingTimeout]);
    
    if (loadedFonts.length > 1) { // 기본 폰트 외에 다른 폰트도 로드됨
      showStatus('모든 폰트가 로드되었습니다', 2000);
    } else {
      // 폰트 로딩이 제대로 안된 경우 사용자에게 알림
      if (navigator.onLine) {
        console.warn('폰트 로드에 문제가 있습니다. 새로고침을 시도해보세요.');
      } else {
        showStatus('오프라인 상태입니다. 기본 폰트만 사용 가능합니다', 3000);
      }
    }
    
    console.log('에디터 초기화 완료');
    
  } catch (error) {
    console.error('초기화 중 오류 발생:', error);
    showStatus('일부 기능이 제한될 수 있습니다', 3000);
  }
});