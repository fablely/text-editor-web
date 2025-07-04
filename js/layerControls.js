// js/layerControls.js
import { state } from './state.js';
import { getAllElements } from './utils.js';
import { renderCanvas } from './canvasRenderer.js';

// z-index 초기화 (기존 요소들에 z-index가 없는 경우)
export function initializeZIndexes() {
  let zIndex = 0;
  
  // 텍스트 객체들에 z-index 할당
  state.textObjects.forEach(text => {
    if (text.zIndex === undefined) {
      text.zIndex = zIndex++;
    }
  });
  
  // 스티커들에 z-index 할당
  state.stickers.forEach(sticker => {
    if (sticker.zIndex === undefined) {
      sticker.zIndex = zIndex++;
    }
  });
}

// 선택된 요소의 레이어 순서를 찾기
function findElementLayerIndex(element, elementType) {
  const allElements = getAllElements();
  return allElements.findIndex(item => 
    item.type === elementType && item.element === element
  );
}

// 맨 앞으로 이동
export function bringToFront(element, elementType) {
  const allElements = getAllElements();
  const maxZIndex = Math.max(...allElements.map(item => item.element.zIndex || 0));
  element.zIndex = maxZIndex + 1;
  renderCanvas();
}

// 앞으로 이동
export function bringForward(element, elementType) {
  const allElements = getAllElements();
  const currentIndex = findElementLayerIndex(element, elementType);
  
  if (currentIndex < allElements.length - 1) {
    const nextElement = allElements[currentIndex + 1];
    const tempZIndex = element.zIndex;
    element.zIndex = nextElement.element.zIndex;
    nextElement.element.zIndex = tempZIndex;
    renderCanvas();
  }
}

// 뒤로 이동
export function sendBackward(element, elementType) {
  const allElements = getAllElements();
  const currentIndex = findElementLayerIndex(element, elementType);
  
  if (currentIndex > 0) {
    const prevElement = allElements[currentIndex - 1];
    const tempZIndex = element.zIndex;
    element.zIndex = prevElement.element.zIndex;
    prevElement.element.zIndex = tempZIndex;
    renderCanvas();
  }
}

// 맨 뒤로 이동
export function sendToBack(element, elementType) {
  const allElements = getAllElements();
  const minZIndex = Math.min(...allElements.map(item => item.element.zIndex || 0));
  element.zIndex = minZIndex - 1;
  renderCanvas();
}

// 레이어 순서 조정 버튼 이벤트 리스너 초기화
export function initLayerControls() {
  // z-index 초기화
  initializeZIndexes();
  
  // 텍스트 편집 모달의 레이어 버튼들
  document.getElementById('modalBringToFrontBtn')?.addEventListener('click', () => {
    if (state.selectedText) {
      bringToFront(state.selectedText, 'text');
    }
  });
  
  document.getElementById('modalBringForwardBtn')?.addEventListener('click', () => {
    if (state.selectedText) {
      bringForward(state.selectedText, 'text');
    }
  });
  
  document.getElementById('modalSendBackwardBtn')?.addEventListener('click', () => {
    if (state.selectedText) {
      sendBackward(state.selectedText, 'text');
    }
  });
  
  document.getElementById('modalSendToBackBtn')?.addEventListener('click', () => {
    if (state.selectedText) {
      sendToBack(state.selectedText, 'text');
    }
  });
  
  // 스티커 편집 모달의 레이어 버튼들
  document.getElementById('stickerBringToFrontBtn')?.addEventListener('click', () => {
    if (state.selectedElement && state.selectedElementType === 'sticker') {
      bringToFront(state.selectedElement, 'sticker');
    }
  });
  
  document.getElementById('stickerBringForwardBtn')?.addEventListener('click', () => {
    if (state.selectedElement && state.selectedElementType === 'sticker') {
      bringForward(state.selectedElement, 'sticker');
    }
  });
  
  document.getElementById('stickerSendBackwardBtn')?.addEventListener('click', () => {
    if (state.selectedElement && state.selectedElementType === 'sticker') {
      sendBackward(state.selectedElement, 'sticker');
    }
  });
  
  document.getElementById('stickerSendToBackBtn')?.addEventListener('click', () => {
    if (state.selectedElement && state.selectedElementType === 'sticker') {
      sendToBack(state.selectedElement, 'sticker');
    }
  });
}
