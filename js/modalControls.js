// js/modalControls.js
import { state } from './state.js';
import { renderCanvas, positionModalNearText } from './canvasRenderer.js';

export function initModalControls() {
  const modal = document.getElementById('textControlModal');
  
  // 모든 입력 요소를 효율적으로 처리하기 위한 설정
  const controlConfigs = [
    { id: 'modalTextContent', prop: 'text', event: 'input', parser: v => v },
    { id: 'modalFontFamily', prop: 'fontFamily', event: 'change', parser: v => v }, // change 이벤트 사용
    { id: 'modalFontSize', prop: 'size', event: 'input', parser: v => parseInt(v, 10), valueId: 'modalFontSizeValue' },
    { id: 'modalFontColor', prop: 'color', event: 'input', parser: v => v },
    { id: 'modalOpacity', prop: 'opacity', event: 'input', parser: v => parseFloat(v), valueId: 'modalOpacityValue', format: v => v.toFixed(1) },
    { id: 'modalLetterSpacing', prop: 'letterSpacing', event: 'input', parser: v => parseFloat(v), valueId: 'modalLetterSpacingValue', format: v => v.toFixed(1) },
    { id: 'modalRotation', prop: 'rotation', event: 'input', parser: v => parseFloat(v), valueId: 'modalRotationValue', format: v => v + '°' },
    { id: 'modalTextDirection', prop: 'direction', event: 'change', parser: v => v } // change 이벤트 사용
  ];
  
  // 스크롤 이벤트 처리 (텍스트 모달 위치 업데이트)
  let scrollTimeout;
  const scrollHandler = () => {
    if (state.selectedText && !modal.classList.contains('hidden')) {
      positionModalNearText(state.selectedText);
    }
  };
  
  window.addEventListener('scroll', () => {
    if (scrollTimeout) {
      clearTimeout(scrollTimeout);
    }
    scrollTimeout = setTimeout(scrollHandler, 16); // ~60fps
  });

  // 윈도우 리사이즈 시에도 위치 업데이트
  window.addEventListener('resize', () => {
    if (state.selectedText && !modal.classList.contains('hidden')) {
      positionModalNearText(state.selectedText);
    }
  });
  
  // 이벤트 리스너 등록을 최적화
  controlConfigs.forEach(config => {
    const element = document.getElementById(config.id);
    if (!element) {
      console.warn(`Modal Controls - Element not found: ${config.id}`);
      return;
    }
    
    console.log(`Modal Controls - Registering ${config.event} event for ${config.id}`);
    
    element.addEventListener(config.event, e => {
      if (!state.selectedText) {
        console.log('Modal Controls - No selected text, ignoring event');
        return;
      }
      
      console.log(`Modal Controls - ${config.prop} event triggered:`, e.target.value);
      console.log('Modal Controls - Current selected text:', state.selectedText);
      
      // 불필요한 렌더링 방지를 위해 값 변경 검사
      const newValue = config.parser(e.target.value);
      if (state.selectedText[config.prop] !== newValue) {
        console.log(`Modal Controls - ${config.prop} changing from:`, state.selectedText[config.prop], 'to:', newValue);
        state.selectedText[config.prop] = newValue;
        
        // 수치 표시 업데이트
        if (config.valueId) {
          const valueElement = document.getElementById(config.valueId);
          if (valueElement) {
            const displayValue = config.format ? config.format(newValue) : newValue;
            valueElement.textContent = displayValue;
          }
        }
        
        renderCanvas();
        
        // 변경사항을 로깅 (디버깅용)
        if (config.prop === 'fontFamily') {
          console.log('Font changed to:', e.target.value);
        } else if (config.prop === 'size') {
          console.log('Size changed to:', e.target.value);
        } else if (config.prop === 'direction') {
          console.log('Modal Controls - Direction changed to:', e.target.value);
          console.log('Modal Controls - Selected text direction updated:', state.selectedText.direction);
        }
      }
    });
  });

  // 방향 변경을 위한 이벤트 리스너
  const modalDirectionInput = document.getElementById('modalTextDirection');
  if (modalDirectionInput) {
    modalDirectionInput.addEventListener('change', (e) => {
      console.log('Modal Controls - Direction change listener triggered:', e.target.value);
      
      // state.selectedText가 없을 때는 전역에서 찾아보기
      let targetText = state.selectedText;
      if (!targetText && state.textObjects && state.textObjects.length > 0) {
        // 가장 최근에 추가된 텍스트를 대상으로 설정
        targetText = state.textObjects[state.textObjects.length - 1];
        state.selectedText = targetText;
        console.log('Modal Controls - Found and set selectedText:', targetText);
      }
      
      if (targetText) {
        targetText.direction = e.target.value;
        console.log('Modal Controls - Updated selectedText.direction to:', targetText.direction);
        renderCanvas();
      } else {
        console.warn('Modal Controls - No text available to update direction');
      }
    });
  }

  // 특수 버튼 이벤트 처리
  document.getElementById('modalCenterBtn').addEventListener('click', () => {
    const t = state.selectedText;
    if (t) {
      // 텍스트 너비 계산
      const { ctx } = state;
      ctx.save();
      ctx.font = `${t.size}px "${t.fontFamily}"`;
      const spacing = t.letterSpacing || 0;
      let textWidth;
      if (t.direction === 'vertical') {
        textWidth = t.size;
      } else if (spacing) {
        textWidth = t.text.split('').reduce((sum, ch) => sum + ctx.measureText(ch).width + spacing, 0) - spacing;
      } else {
        textWidth = ctx.measureText(t.text).width;
      }
      ctx.restore();

      // 중앙 정렬 (텍스트 너비 고려)
      t.x = Math.round(state.canvasWidth / 2 - textWidth / 2);
      renderCanvas();
      positionModalNearText(t);
    }
  });

  document.getElementById('modalDeleteBtn').addEventListener('click', () => {
    if (state.selectedElement) {
      if (state.selectedElementType === 'text') {
        state.textObjects = state.textObjects.filter(t => t !== state.selectedElement);
        state.selectedText = null;
      } else if (state.selectedElementType === 'sticker') {
        state.stickers = state.stickers.filter(s => s !== state.selectedElement);
      }
      
      state.selectedElement = null;
      state.selectedElementType = null;
      modal.classList.add('hidden');
      renderCanvas();
    }
  });

  document.getElementById('modalCloseBtn').addEventListener('click', () => {
    modal.classList.add('hidden');
    state.selectedText = null;
    state.selectedElement = null;
    state.selectedElementType = null;
    renderCanvas();
  });

  // 이벤트 위임을 사용하여 모달 외부 클릭 처리 최적화
  document.addEventListener('mousedown', e => {
    // 폰트 피커 모달도 텍스트 편집 모달의 일부로 간주
    const fontPickerModal = document.getElementById('fontPickerModal');
    const isClickInsideFontPicker = fontPickerModal && fontPickerModal.contains(e.target);
    
    if (!modal.classList.contains('hidden') && 
        !modal.contains(e.target) && 
        !isClickInsideFontPicker &&
        e.target !== state.canvas) {
      modal.classList.add('hidden');
      state.selectedText = null;
      state.selectedElement = null;
      state.selectedElementType = null;
      renderCanvas();
    }
  });
}