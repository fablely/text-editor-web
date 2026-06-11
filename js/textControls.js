// js/textControls.js
import { state } from './state.js';
import { getNextZIndex, isMobile } from './utils.js';
import { renderCanvas, positionModalNearText, updateModalControls } from './canvasRenderer.js';
import { pushHistory } from './history.js';
import { log, warn } from './logger.js';

// 모바일 전용 포커스 함수
function focusTextInputMobile(input) {
  if (!input) return;

  if (!isMobile()) {
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
            if (success) log(`모바일 포커스 성공 (방법 ${index + 1})`);
          });
        } else if (result) {
          log(`모바일 포커스 성공 (방법 ${index + 1})`);
        }
      } catch (e) {
        warn(`모바일 포커스 방법 ${index + 1} 실패:`, e);
      }
    }, index * 100);
  });
}

export function initTextControls() {
  const textInput = document.getElementById('textInput');
  const clearBtn = document.getElementById('clearTextBtn');
  const countEl = document.getElementById('textInputCount');
  const maxLen = parseInt(textInput.getAttribute('maxlength'), 10) || 100;

  // 글자수 표시 + 지우기 버튼 노출 상태 동기화
  function updateInputState() {
    const len = textInput.value.length;
    if (countEl) {
      countEl.textContent = `${len} / ${maxLen}`;
      countEl.classList.toggle('limit', len >= maxLen);
    }
    if (clearBtn) {
      clearBtn.classList.toggle('hidden', len === 0);
    }
  }

  textInput.addEventListener('input', updateInputState);

  // 지우기(×) 버튼
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      textInput.value = '';
      updateInputState();
      focusTextInputMobile(textInput);
    });
  }

  updateInputState();

  // 입력 검증 실패 시 흔들림 애니메이션 종료 후 클래스 제거
  textInput.addEventListener('animationend', () => textInput.classList.remove('shake'));

  document.getElementById('addTextBtn').addEventListener('click', () => {
    if (!textInput.value.trim()) {
      // 차단형 alert 대신 비차단 시각 피드백(흔들림) + 포커스
      textInput.classList.remove('shake');
      void textInput.offsetWidth; // 리플로우로 애니메이션 재시작 보장
      textInput.classList.add('shake');
      focusTextInputMobile(textInput);
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
      strokeWidth: 0, // 외곽선 두께(0=없음)
      strokeColor: '#000000', // 외곽선 색
      shadow: false, // 그림자
      zIndex: getNextZIndex() // 새로운 z-index 할당
    };
    
    log('텍스트 추가:', newText);
    state.textObjects.push(newText);
    
    // 텍스트 입력창 비우기
    textInput.value = '';
    updateInputState();

    // 모바일에서 입력 직후 가상 키보드를 닫아 결과(캔버스)가 바로 보이도록
    if (isMobile()) {
      textInput.blur();
    }

    renderCanvas();
    pushHistory();
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