// js/main.js
import { initPopup } from './popup.js';
import { loadFonts, fontsLoadedPromise } from './fontLoader.js';
import { initImageLoader } from './imageLoader.js';
import { initTextControls } from './textControls.js';
import { initModalControls } from './modalControls.js';
import { initDragAndDrop } from './dragAndDrop.js';
import { initSaveAndShare } from './saveAndShare.js';
import { initFontPicker } from './fontPicker.js'; // 새로운 import 추가

document.addEventListener('DOMContentLoaded', async () => {
  initPopup();
  
  // 폰트를 먼저 로드하고, 로딩이 완료된 후에 다른 요소를 초기화
  const fontsPromise = loadFonts();
  
  // 폰트 로드와 상관없이 미리 초기화할 수 있는 항목
  initImageLoader();
  
  try {
    // 폰트 로딩이 완료될 때까지 대기
    await fontsPromise;
    console.log('폰트 로드 완료 후 컨트롤 초기화');
    
    // 폰트에 의존적인 컨트롤들은 폰트 로드 후 초기화
    initTextControls();
    initModalControls();
    initDragAndDrop();
    initSaveAndShare();
    initFontPicker(); // 폰트 피커 초기화 추가
    
    // 모든 컨트롤이 활성화되었음을 알림
    console.log('모든 컨트롤 초기화 완료');
    
    // 선택적으로 사용자에게 알림
    const statusElem = document.createElement('div');
    statusElem.style.cssText = 'position:fixed; bottom:20px; right:20px; background:#59b4ad; color:white; padding:10px; border-radius:5px; z-index:1000; opacity:0; transition:opacity 0.3s;';
    statusElem.textContent = '에디터가 준비되었습니다';
    document.body.appendChild(statusElem);
    
    setTimeout(() => {
      statusElem.style.opacity = '1';
      setTimeout(() => {
        statusElem.style.opacity = '0';
        setTimeout(() => statusElem.remove(), 300);
      }, 2000);
    }, 100);
    
  } catch (error) {
    console.error('폰트 로드 중 오류 발생:', error);
    // 폰트 로드에 실패해도 기본 기능은 동작하도록 함
    initTextControls();
    initModalControls();
    initDragAndDrop();
    initSaveAndShare();
    initFontPicker(); // 폰트 피커 초기화 추가
  }
});