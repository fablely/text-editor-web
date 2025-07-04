// js/textControls.js
import { state } from './state.js';
import { renderCanvas, positionModalNearText, updateModalControls } from './canvasRenderer.js';

// 모바일 전용 포커스 함수
function focusTextInputMobile(input) {
  if (!input) return;
  
  // 모바일 감지
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
                   window.innerWidth <= 768;
  
  if (!isMobile) {
    // PC에서는 일반 포커스
    input.focus();
    return;
  }
  
  // 여러 방법으로 모바일 포커스 시도
  const focusMethods = [
    // 방법 1: 직접 포커스
    () => {
      input.focus();
      return input === document.activeElement;
    },
    
    // 방법 2: 약간의 지연 후 포커스
    () => {
      return new Promise(resolve => {
        setTimeout(() => {
          input.focus();
          input.click(); // 추가 클릭으로 활성화
          resolve(input === document.activeElement);
        }, 50);
      });
    },
    
    // 방법 3: 스크롤과 함께 포커스
    () => {
      input.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setTimeout(() => {
        input.focus();
      }, 200);
      return true;
    }
  ];
  
  // 각 방법을 순서대로 시도
  focusMethods.forEach((method, index) => {
    setTimeout(() => {
      try {
        const result = method();
        if (result instanceof Promise) {
          result.then(success => {
            if (success) {
              console.log(`모바일 포커스 성공 (방법 ${index + 1})`);
            }
          });
        } else if (result) {
          console.log(`모바일 포커스 성공 (방법 ${index + 1})`);
        }
      } catch (error) {
        console.warn(`모바일 포커스 방법 ${index + 1} 실패:`, error);
      }
    }, index * 100);
  });
}

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
  const textInput = document.getElementById('textInput');

  document.getElementById('addTextBtn').addEventListener('click', () => {
    if (!textInput.value.trim()) {
      alert('텍스트를 입력해주세요');
      // 텍스트가 비어있을 때 입력창에 포커스 (모바일 대응)
      setTimeout(() => {
        focusTextInputMobile(textInput);
      }, 100);
      return;
    }

    // 배경 이미지가 업로드되지 않았을 때 팝업 표시
    if (!state.isImageLoaded) {
      const imageRequiredPopup = document.getElementById('imageRequiredPopup');
      imageRequiredPopup.classList.remove('hidden');
      return;
    }
    
    const newText = {
      text: textInput.value,
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
    
    // 텍스트 입력창 비우기
    textInput.value = '';
    
    renderCanvas();
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    // 추가된 텍스트에 바로 포커스 및 선택 상태로 만들기
    setTimeout(() => {
      state.selectedText = newText;
      state.selectedElement = newText;
      state.selectedElementType = 'text';
      updateModalControls(newText);
      positionModalNearText(newText);      
      document.getElementById('textControlModal').classList.remove('hidden');
      renderCanvas();
    }, 500);
    
  });

  // 텍스트 모드 버튼 클릭 시 텍스트 입력창 포커스
  const textModeBtn = document.getElementById('textModeBtn');
  if (textModeBtn) {
    textModeBtn.addEventListener('click', () => {
      setTimeout(() => {
        focusTextInputMobile(textInput);
      }, 100);
    });
  }

  // Enter 키를 눌렀을 때 텍스트 추가
  textInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      document.getElementById('addTextBtn').click();
    }
  });

  // 이미지 업로드 요구 팝업 확인 버튼 이벤트
  document.getElementById('imageRequiredConfirmBtn').addEventListener('click', () => {
    const imageRequiredPopup = document.getElementById('imageRequiredPopup');
    imageRequiredPopup.classList.add('hidden');
  });
}