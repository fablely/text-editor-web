// js/textControls.js
import { state } from './state.js';
import { renderCanvas, positionModalNearText, updateModalControls } from './canvasRenderer.js';

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

    // 선택된 폰트 확인 및 기본값 설정
    const selectedFont = fontFamily.value || 'sans-serif';
    
    const newText = {
      text: txtInput.value,
      x: 50,
      y: 80,
      font: selectedFont,
      size: parseInt(fontSize.value, 10) || 36,
      color: fontColor.value || '#ffffff',
      opacity: parseFloat(opacity.value) || 1,
      rotation: parseFloat(rotation.value) || 0,
      direction: textDirection.value || 'horizontal',
      letterSpacing: parseFloat(letterSpacing.value) || 0
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

  [txtInput, fontFamily, fontSize, fontColor, opacity, rotation, textDirection, letterSpacing].forEach(input => {
    input.addEventListener('input', () => {
      if (!state.selectedText) return;
      Object.assign(state.selectedText, {
        text: txtInput.value,
        font: fontFamily.value,
        size: parseInt(fontSize.value, 10),
        color: fontColor.value,
        opacity: parseFloat(opacity.value),
        rotation: parseFloat(rotation.value),
        direction: textDirection.value,
        letterSpacing: parseFloat(letterSpacing.value)
      });
      renderCanvas();
    });
  });

  document.getElementById('deleteTextBtn').addEventListener('click', () => {
    if (state.selectedText) {
      state.textObjects = state.textObjects.filter(t => t !== state.selectedText);
      state.selectedText = null;
      renderCanvas();
    }
  });

  document.getElementById('centerTextBtn').addEventListener('click', () => {
    if (!state.selectedText) return;
    const canvasCenterX = (state.canvas.width / state.canvasScale) / 2;
    state.ctx.font = `${state.selectedText.size}px ${state.selectedText.font}`;

    let textWidth = state.selectedText.direction === 'vertical'
      ? state.selectedText.size
      : state.ctx.measureText(state.selectedText.text).width + (state.selectedText.letterSpacing || 0) * (state.selectedText.text.length - 1);

    state.selectedText.x = canvasCenterX - textWidth / 2;
    renderCanvas();
  });
}