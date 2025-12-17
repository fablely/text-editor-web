// js/utils.js
import { state } from './state.js';

export function getEventPos(e) {
  const rect = state.canvas.getBoundingClientRect();
  if (e.touches && e.touches.length > 0) {
    return {
      x: e.touches[0].clientX - rect.left,
      y: e.touches[0].clientY - rect.top
    };
  } else {
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  }
}

// 다음 사용할 z-index 값을 반환하는 공통 함수
export function getNextZIndex() {
  let maxZIndex = 0;
  
  // 텍스트 객체들의 최대 z-index 찾기
  state.textObjects.forEach(text => {
    if (text.zIndex !== undefined && text.zIndex > maxZIndex) {
      maxZIndex = text.zIndex;
    }
  });
  
  // 스티커들의 최대 z-index 찾기
  state.stickers.forEach(sticker => {
    if (sticker.zIndex !== undefined && sticker.zIndex > maxZIndex) {
      maxZIndex = sticker.zIndex;
    }
  });
  
  return maxZIndex + 1;
}

// 모든 요소들을 하나의 배열로 통합하여 레이어 순서 관리하는 공통 함수
export function getAllElements() {
  const allElements = [];
  
  // 텍스트 객체들 추가
  state.textObjects.forEach((text, index) => {
    allElements.push({
      type: 'text',
      element: text,
      originalIndex: index
    });
  });
  
  // 스티커들 추가
  state.stickers.forEach((sticker, index) => {
    allElements.push({
      type: 'sticker',
      element: sticker,
      originalIndex: index
    });
  });
  
  // z-index로 정렬 (없으면 기본값 0)
  allElements.sort((a, b) => {
    const aZIndex = a.element.zIndex || 0;
    const bZIndex = b.element.zIndex || 0;
    return aZIndex - bZIndex;
  });
  
  return allElements;
}