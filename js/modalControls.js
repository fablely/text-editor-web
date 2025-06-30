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

  // 방향 변경을 위한 별도 이벤트 리스너 (백업용)
  const modalDirectionInput = document.getElementById('modalTextDirection');
  if (modalDirectionInput) {
    modalDirectionInput.addEventListener('change', (e) => {
      console.log('Modal Controls - Backup direction change listener triggered:', e.target.value);
      
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
    const centerBtn = document.getElementById('centerTextBtn');
    if (centerBtn) {
      centerBtn.click();
      if (state.selectedText) positionModalNearText(state.selectedText);
    }
  });

  document.getElementById('modalDeleteBtn').addEventListener('click', () => {
    const deleteBtn = document.getElementById('deleteTextBtn');
    if (deleteBtn) {
      deleteBtn.click();
      modal.classList.add('hidden');
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
    if (!modal.classList.contains('hidden') && 
        !modal.contains(e.target) && 
        e.target !== state.canvas) {
      modal.classList.add('hidden');
      state.selectedText = null;
      state.selectedElement = null;
      state.selectedElementType = null;
      renderCanvas();
    }
  });
}