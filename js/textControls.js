// js/textControls.js
import { state } from './state.js';
import { renderCanvas, positionModalNearText, updateModalControls } from './canvasRenderer.js';

// 다음 사용할 z-index 값을 반환
function getNextZIndex() {
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

export function initTextControls() {
  const txtInput = document.getElementById('textInput');

  document.getElementById('addTextBtn').addEventListener('click', () => {
    if (!txtInput.value.trim()) {
      alert('텍스트를 입력해주세요');
      return;
    }

    // 배경 이미지가 업로드되지 않았을 때 팝업 표시
    if (!state.isImageLoaded) {
      const imageRequiredPopup = document.getElementById('imageRequiredPopup');
      imageRequiredPopup.classList.remove('hidden');
      return;
    }
    
    const newText = {
      text: txtInput.value,
      x: 50,
      y: 80,
      fontFamily: 'sans-serif', // 기본 글꼴
      size: 36, // 기본 크기
      color: '#ffffff', // 기본 색상
      opacity: 1, // 기본 불투명도
      rotation: 0, // 기본 회전
      direction: 'horizontal', // 기본 방향
      letterSpacing: 0, // 기본 자간
      zIndex: getNextZIndex() // 새로운 z-index 할당
    };
    
    console.log('텍스트 추가:', newText); // 디버깅 로그 추가
    state.textObjects.push(newText);
    renderCanvas();
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => {
      state.selectedText = newText;
      // 첫 모달 오픈 시 삭제 버튼 동작을 위해 선택 요소 설정
      state.selectedElement = newText;
      state.selectedElementType = 'text';
      updateModalControls(newText);
      positionModalNearText(newText);      
      document.getElementById('textControlModal').classList.remove('hidden');
      renderCanvas();
    }, 500);
  });

  // 텍스트 입력 이벤트 (모달에서만 사용)
  txtInput.addEventListener('input', () => {
    if (!state.selectedText) return;
    state.selectedText.text = txtInput.value;
    renderCanvas();
  });

  // 이미지 업로드 요구 팝업 확인 버튼 이벤트
  document.getElementById('imageRequiredConfirmBtn').addEventListener('click', () => {
    const imageRequiredPopup = document.getElementById('imageRequiredPopup');
    imageRequiredPopup.classList.add('hidden');
  });
}