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
  const fontFamily = document.getElementById('fontFamily');
  const fontSize = document.getElementById('fontSize');
  const fontColor = document.getElementById('fontColor');
  const opacity = document.getElementById('opacity');
  const rotation = document.getElementById('rotation');
  const textDirection = document.getElementById('textDirection');
  const letterSpacing = document.getElementById('letterSpacing');

  // 폼 컨트롤이 준비되었는지 확인
  if (fontFamily.options.length === 0) {
    console.warn('폰트 목록이 아직 로드되지 않았습니다. 기본 글꼴을 추가합니다.');
    const opt = document.createElement('option');
    opt.value = 'sans-serif';
    opt.textContent = '기본 글꼴';
    fontFamily.appendChild(opt);
  }

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

    // 선택된 폰트 확인 및 기본값 설정
    const selectedFont = fontFamily.value || 'sans-serif';
    
    const newText = {
      text: txtInput.value,
      x: 50,
      y: 80,
      fontFamily: selectedFont,
      size: parseInt(fontSize.value, 10) || 36,
      color: fontColor.value || '#ffffff',
      opacity: parseFloat(opacity.value) || 1,
      rotation: parseFloat(rotation.value) || 0,
      direction: textDirection.value || 'horizontal',
      letterSpacing: parseFloat(letterSpacing.value) || 0,
      zIndex: getNextZIndex() // 새로운 z-index 할당
    };
    
    console.log('텍스트 추가:', newText); // 디버깅 로그 추가
    state.textObjects.push(newText);
    renderCanvas();
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => {
      state.selectedText = newText;
      updateModalControls(newText);
      positionModalNearText(newText);      
      document.getElementById('textControlModal').classList.remove('hidden');
      renderCanvas();
    }, 500);
  });

  // 텍스트 입력 이벤트
  txtInput.addEventListener('input', () => {
    if (!state.selectedText) return;
    state.selectedText.text = txtInput.value;
    renderCanvas();
  });

  // 폰트 패밀리 변경 이벤트 (select 요소는 change 이벤트 사용)
  fontFamily.addEventListener('change', () => {
    if (!state.selectedText) return;
    state.selectedText.fontFamily = fontFamily.value;
    console.log('Font changed to:', fontFamily.value); // 디버깅 로그
    renderCanvas();
  });

  // 나머지 컨트롤 이벤트 (input 이벤트 사용)
  [fontSize, fontColor, opacity, rotation, letterSpacing].forEach(input => {
    input.addEventListener('input', () => {
      if (!state.selectedText) return;
      Object.assign(state.selectedText, {
        size: parseInt(fontSize.value, 10),
        color: fontColor.value,
        opacity: parseFloat(opacity.value),
        rotation: parseFloat(rotation.value),
        letterSpacing: parseFloat(letterSpacing.value)
      });
      renderCanvas();
    });
  });

  // 텍스트 방향 변경 이벤트 (select 요소는 change 이벤트 사용)
  textDirection.addEventListener('change', () => {
    if (!state.selectedText) return;
    state.selectedText.direction = textDirection.value;
    renderCanvas();
  });

  document.getElementById('deleteTextBtn').addEventListener('click', () => {
    if (state.selectedElement) {
      if (state.selectedElementType === 'text') {
        state.textObjects = state.textObjects.filter(t => t !== state.selectedElement);
        state.selectedText = null;
      } else if (state.selectedElementType === 'sticker') {
        state.stickers = state.stickers.filter(s => s !== state.selectedElement);
      }
      
      state.selectedElement = null;
      state.selectedElementType = null;
      document.getElementById('textControlModal').classList.add('hidden');
      renderCanvas();
    }
  });

  document.getElementById('centerTextBtn').addEventListener('click', () => {
    if (!state.selectedText) return;
    const canvasCenterX = (state.canvas.width / state.canvasScale) / 2;
    state.ctx.font = `${state.selectedText.size}px "${state.selectedText.fontFamily}"`;

    let textWidth = state.selectedText.direction === 'vertical'
      ? state.selectedText.size
      : state.ctx.measureText(state.selectedText.text).width + (state.selectedText.letterSpacing || 0) * (state.selectedText.text.length - 1);

    state.selectedText.x = canvasCenterX - textWidth / 2;
    renderCanvas();
  });

  // 이미지 업로드 요구 팝업 확인 버튼 이벤트
  document.getElementById('imageRequiredConfirmBtn').addEventListener('click', () => {
    const imageRequiredPopup = document.getElementById('imageRequiredPopup');
    imageRequiredPopup.classList.add('hidden');
  });
}