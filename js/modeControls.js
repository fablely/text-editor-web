// 모드 컨트롤 모듈 (텍스트/스티커 모드 전환)
import { stickerLoader } from './stickerLoader.js';

class ModeControls {
  constructor() {
    this.currentMode = 'text'; // 기본은 텍스트 모드
    this.textModeBtn = null;
    this.stickerModeBtn = null;
    this.textInputArea = null;
    this.stickerInputArea = null;
  }

  init() {
    this.textModeBtn = document.getElementById('textModeBtn');
    this.stickerModeBtn = document.getElementById('stickerModeBtn');
    this.textInputArea = document.getElementById('textInputArea');
    this.stickerInputArea = document.getElementById('stickerInputArea');
    
    this.bindEvents();
    this.setMode('text'); // 초기 모드 설정
  }

  bindEvents() {
    if (this.textModeBtn) {
      this.textModeBtn.addEventListener('click', () => {
        this.setMode('text');
      });
    }
    
    if (this.stickerModeBtn) {
      this.stickerModeBtn.addEventListener('click', () => {
        this.setMode('sticker');
        // 스티커 모드로 변경하면서 바로 스티커 선택 창 열기
        setTimeout(() => {
          stickerLoader.showStickerPicker();
        }, 100); // 모드 변경 후 약간의 딜레이
      });
    }
    
    // 기존 스티커 추가 버튼 이벤트는 제거 (더 이상 필요 없음)
  }

  setMode(mode) {
    this.currentMode = mode;
    
    // 버튼 상태 업데이트
    if (this.textModeBtn && this.stickerModeBtn) {
      this.textModeBtn.classList.toggle('active', mode === 'text');
      this.stickerModeBtn.classList.toggle('active', mode === 'sticker');
    }
    
    // 입력 영역 표시/숨김
    if (this.textInputArea && this.stickerInputArea) {
      this.textInputArea.classList.toggle('hidden', mode !== 'text');
      this.stickerInputArea.classList.toggle('hidden', mode !== 'sticker');
    }
    
    console.log(`모드 변경: ${mode}`);
  }

  getCurrentMode() {
    return this.currentMode;
  }
}

export const modeControls = new ModeControls();
