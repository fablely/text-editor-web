// js/fontPicker.js
import { state } from './state.js';
import { renderCanvas } from './canvasRenderer.js';
import { updateModalControls } from './canvasRenderer.js';

// 전역 변수 선언을 최적화
let currentFontSelector = null; 
let selectedFontIndex = 0;
let isUserScrolling = false; // 스크롤 상태 추적
let fontOptions = [
  { value: 'Inter, sans-serif', text: 'Inter' },
  { value: '강원교육모두', text: '강원교육모두' },
  { value: '강원교육새음', text: '강원교육새음' },
  { value: '강원교육현옥샘', text: '강원교육현옥샘' },
  { value: '더페이스샵', text: '더페이스샵' },
  { value: '마포꽃섬', text: '마포꽃섬' },
  { value: '바른히피', text: '바른히피' },
  { value: '배달의민족도현체', text: '배달의민족도현체' },
  { value: '배달의민족연성체', text: '배달의민족연성체' },
  { value: '배달의민족을지로체', text: '배달의민족을지로체' },
  { value: '배달의민족주아체', text: '배달의민족주아체' },
  { value: '배달의민족한나체Air', text: '배달의민족한나체Air' },
  { value: '배달의민족한나체Pro', text: '배달의민족한나체Pro' },
  { value: '빙그레싸만코', text: '빙그레싸만코' },
  { value: '상상토끼꽃길', text: '상상토끼꽃길' },
  { value: '평창평화체', text: '평창평화체' },
  { value: '학교안심여행', text: '학교안심여행' },
  { value: '학교안심우산', text: '학교안심우산' },
  { value: '학교안심우주', text: '학교안심우주' }
];
let fontPickerModal, fontPickerWheel, cancelFontPicker, confirmFontPicker;

// 이벤트 리스너 참조 저장 (메모리 누수 방지)
const eventListeners = {
  cancelFontPicker: null,
  confirmFontPicker: null
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

  // 폰트 패밀리 선택기 - 모달만 사용
  const fontSelectors = [
    {
      selector: hiddenModalFontFamily,
      display: modalFontDisplay,
      type: 'modal'
    }
  ];

  // controls 영역의 fontFamily 요소는 제거되었으므로 모달만 처리
  
  // 모달 폰트 선택기 이벤트 설정
  modalFontSelector.addEventListener('click', function() {
    openFontPicker(fontSelectors[0]);
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

  // 폰트 옵션 선택 - 스크롤 방식만 사용 (클릭/터치 선택 제거)
  // 기존 클릭/터치 이벤트 리스너 제거
  if (eventListeners.fontPickerWheel) {
    fontPickerWheel.removeEventListener('click', eventListeners.fontPickerWheel);
  }
  
  // 스크롤 이벤트만 사용
  let scrollTimeout;
  
  // fontPickerWheel에 클릭 이벤트 완전 차단
  fontPickerWheel.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    return false;
  }, { passive: false });
  
  fontPickerWheel.addEventListener('touchstart', (e) => {
    // 터치 스크롤은 허용하되, 탭 동작은 방지
    e.stopPropagation();
  }, { passive: true });
  
  fontPickerWheel.addEventListener('scroll', function() {
    // 사용자가 스크롤 중임을 표시
    isUserScrolling = true;
    
    // 즉시 선택 항목 하이라이트 (빠른 시각적 반응)
    updateSelectedFontHighlight();
    
    // 스크롤 완료 후 폰트 미리보기 적용 (디바운스)
    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(() => {
      previewFontSelection();
      isUserScrolling = false;
    }, 50); // 50ms로 대폭 줄여서 더 빠른 반응
  }, { passive: true });

  // 초기 모달 폰트 디스플레이 설정
  updateFontDisplay();
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
    
    // 클릭, 터치, 포커스 이벤트 완전 차단
    div.style.pointerEvents = 'none';
    div.style.userSelect = 'none';
    div.tabIndex = -1; // 탭 포커스 방지
    
    // 모든 마우스/터치 이벤트 차단
    div.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }, { passive: false });
    
    div.addEventListener('touchstart', (e) => {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }, { passive: false });
    
    div.addEventListener('touchend', (e) => {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }, { passive: false });
    
    div.addEventListener('mousedown', (e) => {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }, { passive: false });
    
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
    const desired = selectedFontIndex * optionHeight;
    const maxScroll = fontPickerWheel.scrollHeight - fontPickerWheel.clientHeight;
    fontPickerWheel.scrollTop = Math.min(desired, maxScroll);
  }, 50);
}

// 스크롤 완료 후 폰트 미리보기 적용
function updateSelectedFont() {
  // 폰트 미리보기만 적용 (하이라이트는 이미 updateSelectedFontHighlight에서 처리됨)
  previewFontSelection();
}

// 스크롤 시 즉시 하이라이트 업데이트 (시각적 반응만)
function updateSelectedFontHighlight() {
  const fontPickerWheel = document.getElementById('fontPickerWheel');
  const options = fontPickerWheel.querySelectorAll('.font-option');
  const optionHeight = 40;
  const scrollTop = fontPickerWheel.scrollTop;
  const maxScroll = fontPickerWheel.scrollHeight - fontPickerWheel.clientHeight;
  
  // 스크롤 위치에 따라 중앙에 있는 옵션 찾기
  let centerIndex;
  if (scrollTop >= maxScroll) {
    centerIndex = options.length - 1;
  } else {
    centerIndex = Math.round(scrollTop / optionHeight);
  }
  
  // 범위 검사 및 하이라이트만 업데이트
  if (centerIndex >= 0 && centerIndex < options.length) {
    // 이전 선택 항목 클래스 제거
    options.forEach(opt => opt.classList.remove('selected'));
    
    // 새 선택 항목에 클래스 추가
    options[centerIndex].classList.add('selected');
    selectedFontIndex = centerIndex;
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
    
    // 모달 폰트 선택기 동기화
    document.getElementById('modalFontFamily').value = fontOptions[selectedFontIndex].value;
    const modalFontDisplay = document.getElementById('modalFontDisplay');
    if (modalFontDisplay) {
      modalFontDisplay.textContent = fontOptions[selectedFontIndex].text;
      modalFontDisplay.style.fontFamily = fontOptions[selectedFontIndex].value;
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
    
    // 모달 폰트 선택기 동기화
    document.getElementById('modalFontFamily').value = fontOptions[selectedFontIndex].value;
    document.getElementById('modalFontDisplay').textContent = fontOptions[selectedFontIndex].text;
    document.getElementById('modalFontDisplay').style.fontFamily = fontOptions[selectedFontIndex].value;
    
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
    const option = fontOptions.find(opt => opt.value === fontValue);
    
    if (option) {
      modalFontDisplay.textContent = option.text;
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
