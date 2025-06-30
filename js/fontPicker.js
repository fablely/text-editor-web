// js/fontPicker.js
import { state } from './state.js';
import { renderCanvas } from './canvasRenderer.js';
import { updateModalControls } from './canvasRenderer.js';

// 전역 변수 선언을 최적화
let currentFontSelector = null; 
let selectedFontIndex = 0;
let fontOptions = [];
let fontPickerModal, fontPickerWheel, cancelFontPicker, confirmFontPicker;

// 이벤트 리스너 참조 저장 (메모리 누수 방지)
const eventListeners = {
  cancelFontPicker: null,
  confirmFontPicker: null,
  fontPickerWheel: null
};

export function initFontPicker() {
  // 요소 참조를 한 번만 저장 (DOM 조회 최소화)
  fontPickerModal = document.getElementById('fontPickerModal');
  fontPickerWheel = document.getElementById('fontPickerWheel');
  cancelFontPicker = document.getElementById('cancelFontPicker');
  confirmFontPicker = document.getElementById('confirmFontPicker');
  
  // 모바일 환경에서 폰트 선택기 초기화
  const isMobile = window.innerWidth <= 768;

  // 새로운 모달 폰트 선택기 요소
  const modalFontSelector = document.getElementById('modalFontSelector');
  const modalFontDisplay = document.getElementById('modalFontDisplay');
  const hiddenModalFontFamily = document.getElementById('modalFontFamily');

  // 폰트 패밀리 선택기
  const fontSelectors = [
    { 
      selector: document.getElementById('fontFamily'),
      display: null,
      type: 'main'
    },
    {
      selector: hiddenModalFontFamily,
      display: modalFontDisplay,
      type: 'modal'
    }
  ];

  // 이벤트 리스너 설정 - 모바일과 데스크톱 모두 지원
  const mainFontSelector = document.getElementById('fontFamily');
  
  if (isMobile) {
    // 모바일: 커스텀 폰트 피커 사용
    const mainSelectorHandler = function(e) {
      e.preventDefault();
      openFontPicker(fontSelectors[0]);
      return false;
    };
    
    mainFontSelector.addEventListener('click', mainSelectorHandler);
    mainFontSelector.addEventListener('focus', function(e) {
      e.preventDefault();
      this.blur();
    });
    
    mainFontSelector.addEventListener('touchstart', mainSelectorHandler, { passive: false });
  } else {
    // 데스크톱: 일반 select change 이벤트 사용
    mainFontSelector.addEventListener('change', function(e) {
      console.log('Desktop font change:', e.target.value); // 디버깅 로그
      if (state.selectedText) {
        state.selectedText.fontFamily = e.target.value;
        // 모달 폰트 선택기도 동기화
        hiddenModalFontFamily.value = e.target.value;
        if (modalFontDisplay) {
          const option = Array.from(mainFontSelector.options).find(opt => opt.value === e.target.value);
          if (option) {
            modalFontDisplay.textContent = option.textContent;
            modalFontDisplay.style.fontFamily = e.target.value;
          }
        }
        renderCanvas();
      }
    });
  }

  // 모달 폰트 선택기 이벤트 설정
  modalFontSelector.addEventListener('click', function() {
    openFontPicker(fontSelectors[1]);
  });

  // 이벤트 리스너 중앙 관리 (중복 등록 방지)
  if (eventListeners.cancelFontPicker) {
    cancelFontPicker.removeEventListener('click', eventListeners.cancelFontPicker);
  }
  
  eventListeners.cancelFontPicker = () => {
    closeFontPicker();
  };
  
  cancelFontPicker.addEventListener('click', eventListeners.cancelFontPicker);

  if (eventListeners.confirmFontPicker) {
    confirmFontPicker.removeEventListener('click', eventListeners.confirmFontPicker);
  }
  
  eventListeners.confirmFontPicker = () => {
    applyFontSelection();
    closeFontPicker();
  };
  
  confirmFontPicker.addEventListener('click', eventListeners.confirmFontPicker);

  // 폰트 옵션 클릭 이벤트 - 이벤트 위임 사용
  if (eventListeners.fontPickerWheel) {
    fontPickerWheel.removeEventListener('click', eventListeners.fontPickerWheel);
  }
  
  eventListeners.fontPickerWheel = (e) => {
    if (e.target.classList.contains('font-option')) {
      const options = fontPickerWheel.querySelectorAll('.font-option');
      options.forEach(opt => opt.classList.remove('selected'));
      
      e.target.classList.add('selected');
      selectedFontIndex = parseInt(e.target.dataset.index);
      
      // 스크롤 위치 조정 - 메모리 최적화 위해 여기서만 직접 계산
      const optionHeight = 40;
      fontPickerWheel.scrollTop = selectedFontIndex * optionHeight;
    }
  };
  
  fontPickerWheel.addEventListener('click', eventListeners.fontPickerWheel);

  // 디바운스 최적화된 스크롤 이벤트
  fontPickerWheel.addEventListener('scroll', debounce(updateSelectedFont, 50));

  // 마우스 휠 이벤트를 직접 처리하여 더 정밀한 제어
  fontPickerWheel.addEventListener('wheel', function(e) {
    e.preventDefault();
    
    const optionHeight = 40;
    const currentScrollTop = fontPickerWheel.scrollTop;
    const wheelDirection = e.deltaY > 0 ? 1 : -1;
    
    // 한 번에 하나의 옵션만큼만 스크롤
    const newScrollTop = currentScrollTop + (wheelDirection * optionHeight);
    
    // 스크롤 범위 제한
    const maxScrollTop = fontPickerWheel.scrollHeight - fontPickerWheel.clientHeight;
    const limitedScrollTop = Math.max(0, Math.min(newScrollTop, maxScrollTop));
    
    fontPickerWheel.scrollTop = limitedScrollTop;
  }, { passive: false });

  // 초기 모달 폰트 디스플레이 설정
  updateFontDisplay();

  // 터치 이벤트 최적화
  fontPickerModal.addEventListener('touchmove', function(e) {
    e.stopPropagation();
  }, { passive: false });

  fontPickerWheel.addEventListener('touchmove', function(e) {
    // 스크롤 허용
  }, { passive: true });
}

// 폰트 선택기 닫기 - 코드 중복 제거
function closeFontPicker() {
  fontPickerModal.classList.add('hidden');
  fontPickerModal.classList.remove('visible');
  document.body.classList.remove('no-scroll');
}

// 폰트 선택기 열기
function openFontPicker(selectorObj) {
  currentFontSelector = selectorObj;
  const fontPickerModal = document.getElementById('fontPickerModal');
  const fontPickerWheel = document.getElementById('fontPickerWheel');
  
  // 본문 스크롤 방지
  document.body.classList.add('no-scroll');
  
  // 기존 옵션 제거
  fontPickerWheel.innerHTML = '';
  
  const selector = selectorObj.selector;
  
  // 폰트 옵션 가져오기 (메인 폰트 선택기에서 옵션 가져옴)
  const mainSelector = document.getElementById('fontFamily');
  fontOptions = Array.from(mainSelector.options).map(option => {
    return {
      value: option.value,
      text: option.textContent
    };
  });

  // 현재 선택된 값 찾기
  selectedFontIndex = fontOptions.findIndex(option => option.value === selector.value);
  if (selectedFontIndex === -1) selectedFontIndex = 0;
  
  // 옵션 요소 추가
  fontOptions.forEach((option, index) => {
    const div = document.createElement('div');
    div.className = 'font-option';
    if (index === selectedFontIndex) div.classList.add('selected');
    div.textContent = option.text;
    div.style.fontFamily = option.value;
    div.dataset.index = index;
    fontPickerWheel.appendChild(div);
  });

  // 모달 표시
  fontPickerModal.classList.remove('hidden');
  
  // 약간의 지연 후 visible 클래스 추가 (트랜지션 효과를 위해)
  setTimeout(() => {
    fontPickerModal.classList.add('visible');
  }, 10);

  // 현재 선택된 폰트로 스크롤
  setTimeout(() => {
    const optionHeight = 40; // font-option의 높이
    fontPickerWheel.scrollTop = selectedFontIndex * optionHeight;
  }, 50);
}

// 스크롤 위치에 따라 선택된 폰트 업데이트
function updateSelectedFont() {
  const fontPickerWheel = document.getElementById('fontPickerWheel');
  const options = fontPickerWheel.querySelectorAll('.font-option');
  const optionHeight = 40; // font-option의 높이
  const scrollTop = fontPickerWheel.scrollTop;
  
  // 스크롤 위치에 따라 중앙에 있는 옵션 찾기 (정확한 위치 계산)
  // 가이드라인과 정확히 일치하도록 계산 (80px 패딩 고려)
  const centerIndex = Math.floor((scrollTop + optionHeight / 2) / optionHeight);
  
  // 범위 검사
  if (centerIndex >= 0 && centerIndex < options.length) {
    // 이전 선택 항목 클래스 제거
    options.forEach(opt => opt.classList.remove('selected'));
    
    // 새 선택 항목에 클래스 추가
    options[centerIndex].classList.add('selected');
    selectedFontIndex = centerIndex;
    
    // 폰트 변경을 즉시 미리보기로 적용 (실시간 업데이트)
    previewFontSelection();
  }
}

// 폰트 선택 미리보기 (실시간 업데이트)
function previewFontSelection() {
  if (!currentFontSelector || selectedFontIndex === -1) return;
  
  const selector = currentFontSelector.selector;
  const display = currentFontSelector.display;
  
  // 선택기 값과 디스플레이 업데이트
  selector.value = fontOptions[selectedFontIndex].value;
  
  if (display) {
    display.textContent = fontOptions[selectedFontIndex].text;
    display.style.fontFamily = fontOptions[selectedFontIndex].value;
  }

  // 선택된 텍스트가 있으면 폰트 변경 적용
  if (state.selectedText) {
    // 새 폰트로 임시 변경
    state.selectedText.fontFamily = fontOptions[selectedFontIndex].value;
    
    // 두 폰트 선택기 동기화
    if (currentFontSelector.type === 'modal') {
      document.getElementById('fontFamily').value = fontOptions[selectedFontIndex].value;
    } else {
      document.getElementById('modalFontFamily').value = fontOptions[selectedFontIndex].value;
      const modalFontDisplay = document.getElementById('modalFontDisplay');
      if (modalFontDisplay) {
        modalFontDisplay.textContent = fontOptions[selectedFontIndex].text;
        modalFontDisplay.style.fontFamily = fontOptions[selectedFontIndex].value;
      }
    }
    
    // 캔버스 다시 그리기
    renderCanvas();
  }
  
  // 콘솔에 로그 출력 (디버깅용)
  console.log(`미리보기 폰트: ${fontOptions[selectedFontIndex].text}`);
}

// 선택된 폰트 적용
function applyFontSelection() {
  if (!currentFontSelector || selectedFontIndex === -1) return;
  
  const selector = currentFontSelector.selector;
  const display = currentFontSelector.display;
  const type = currentFontSelector.type;
  
  // 선택기 값 변경
  selector.value = fontOptions[selectedFontIndex].value;
  
  // 모달의 경우 표시 요소도 업데이트
  if (display) {
    display.textContent = fontOptions[selectedFontIndex].text;
    display.style.fontFamily = fontOptions[selectedFontIndex].value;
  }

  // 선택된 텍스트가 있으면 폰트 변경 적용
  if (state.selectedText) {
    state.selectedText.fontFamily = fontOptions[selectedFontIndex].value;
    
    // 두 폰트 선택기 동기화
    if (type === 'modal') {
      document.getElementById('fontFamily').value = fontOptions[selectedFontIndex].value;
    } else {
      document.getElementById('modalFontFamily').value = fontOptions[selectedFontIndex].value;
      document.getElementById('modalFontDisplay').textContent = fontOptions[selectedFontIndex].text;
      document.getElementById('modalFontDisplay').style.fontFamily = fontOptions[selectedFontIndex].value;
    }
    
    // 캔버스 다시 그리기
    renderCanvas();
    updateModalControls(state.selectedText);
  }

  updateFontDisplay();
  
  // 본문 스크롤 다시 활성화
  document.body.classList.remove('no-scroll');
  
  // 콘솔에 로그 출력 (디버깅용)
  console.log(`최종 선택 폰트: ${fontOptions[selectedFontIndex].text}`);
}

// 모달 폰트 디스플레이 업데이트
function updateFontDisplay() {
  const modalFontFamily = document.getElementById('modalFontFamily');
  const modalFontDisplay = document.getElementById('modalFontDisplay');

  if (modalFontFamily && modalFontDisplay) {
    const fontValue = modalFontFamily.value;
    const mainSelector = document.getElementById('fontFamily');
    const option = Array.from(mainSelector.options).find(opt => opt.value === fontValue);
    
    if (option) {
      modalFontDisplay.textContent = option.textContent;
      modalFontDisplay.style.fontFamily = option.value;
    } else {
      modalFontDisplay.textContent = '기본 글꼴';
      modalFontDisplay.style.fontFamily = 'sans-serif';
    }
  }
}

// 디바운스 함수 - 성능 최적화
function debounce(func, wait) {
  let timeout;
  return function() {
    const context = this;
    const args = arguments;
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      func.apply(context, args);
    }, wait);
  };
}
