// 스티커 컨트롤 모듈
import { state } from './state.js';
import { renderCanvas } from './canvasRenderer.js';

class StickerControls {
  constructor() {
    this.popup = null;
    this.sizeSlider = null;
    this.rotationSlider = null;
    this.opacitySlider = null;
    this.deleteBtn = null;
    this.closeBtn = null;
    this.currentSticker = null;
    this.isFollowingSticker = true; // 기본적으로 true, 슬라이더 조정 중에만 false
  }

  init() {
    this.popup = document.getElementById('stickerEditPopup');
    this.colorPicker = document.getElementById('stickerColor'); // 색상 선택기
    this.sizeSlider = document.getElementById('stickerSize');
    this.rotationSlider = document.getElementById('stickerRotation');
    this.opacitySlider = document.getElementById('stickerOpacity');
    this.deleteBtn = document.getElementById('deleteStickerBtn');
    this.closeBtn = document.getElementById('closeStickerEditBtn');

    this.bindEvents();
    this.bindScrollEvents();
  }

  bindScrollEvents() {
    // 스크롤 시 팝업 위치 업데이트 (슬라이더 조정 중이 아닐 때만)
    this.scrollHandler = () => {
      if (this.currentSticker && this.isFollowingSticker && this.popup && !this.popup.classList.contains('hidden')) {
        this.positionModalNearSticker(this.currentSticker);
      }
    };
    
    // 스크롤 이벤트 등록 (throttle 적용)
    let scrollTimeout;
    window.addEventListener('scroll', () => {
      if (scrollTimeout) {
        clearTimeout(scrollTimeout);
      }
      scrollTimeout = setTimeout(this.scrollHandler, 16); // ~60fps
    });

    // 윈도우 리사이즈 시에도 위치 업데이트
    window.addEventListener('resize', () => {
      if (this.currentSticker && this.popup && !this.popup.classList.contains('hidden')) {
        this.positionModalNearSticker(this.currentSticker);
      }
    });
  }

  bindEvents() {
    if (!this.popup) return;

    // 색상 변경 지원
    if (this.colorPicker) {
      this.colorPicker.addEventListener('input', (e) => {
        this.updateStickerColor(e.target.value);
      });
    }

    // 크기 조정
    this.sizeSlider.addEventListener('mousedown', () => {
      this.isFollowingSticker = false; // 조정 중에는 고정
    });
    
    this.sizeSlider.addEventListener('mouseup', () => {
      this.isFollowingSticker = true; // 조정 완료 후 다시 따라다니기
    });
    
    this.sizeSlider.addEventListener('input', (e) => {
      if (!this.currentSticker) return;
      
      // 슬라이더 값(1-100)을 실제 크기(10-1000px)로 변환
      const sliderValue = parseInt(e.target.value);
      const targetSize = sliderValue * 10; // 1-100을 10-1000으로 변환
      const originalWidth = this.currentSticker.image.width;
      const originalHeight = this.currentSticker.image.height;
      
      // 원본 이미지의 비율을 유지하면서 크기 조정
      const aspectRatio = originalWidth / originalHeight;
      if (aspectRatio >= 1) {
        // 가로가 더 긴 경우
        this.currentSticker.width = targetSize;
        this.currentSticker.height = targetSize / aspectRatio;
      } else {
        // 세로가 더 긴 경우
        this.currentSticker.height = targetSize;
        this.currentSticker.width = targetSize * aspectRatio;
      }
      
      // 수치 표시 업데이트 (슬라이더 값 그대로 표시)
      const stickerSizeValue = document.getElementById('stickerSizeValue');
      if (stickerSizeValue) {
        stickerSizeValue.textContent = sliderValue;
      }
      
      renderCanvas();
    });

    // 회전 조정
    this.rotationSlider.addEventListener('mousedown', () => {
      this.isFollowingSticker = false; // 조정 중에는 고정
    });
    
    this.rotationSlider.addEventListener('mouseup', () => {
      this.isFollowingSticker = true; // 조정 완료 후 다시 따라다니기
    });
    
    this.rotationSlider.addEventListener('input', (e) => {
      if (!this.currentSticker) return;
      
      this.currentSticker.rotation = parseInt(e.target.value);
      
      // 수치 표시 업데이트
      const stickerRotationValue = document.getElementById('stickerRotationValue');
      if (stickerRotationValue) {
        stickerRotationValue.textContent = e.target.value + '°';
      }
      
      renderCanvas();
    });

    // 불투명도 조정
    this.opacitySlider.addEventListener('mousedown', () => {
      this.isFollowingSticker = false; // 조정 중에는 고정
    });
    
    this.opacitySlider.addEventListener('mouseup', () => {
      this.isFollowingSticker = true; // 조정 완료 후 다시 따라다니기
    });
    
    this.opacitySlider.addEventListener('input', (e) => {
      if (!this.currentSticker) return;
      
      this.currentSticker.opacity = parseInt(e.target.value) / 100;
      
      // 수치 표시 업데이트
      const stickerOpacityValue = document.getElementById('stickerOpacityValue');
      if (stickerOpacityValue) {
        stickerOpacityValue.textContent = e.target.value;
      }
      
      renderCanvas();
    });

    // 터치 이벤트도 동일하게 처리 (모바일 지원)
    [this.sizeSlider, this.rotationSlider, this.opacitySlider].forEach(slider => {
      slider.addEventListener('touchstart', () => {
        this.isFollowingSticker = false;
      });
      
      slider.addEventListener('touchend', () => {
        this.isFollowingSticker = true;
      });
    });

    // 삭제 버튼
    this.deleteBtn.addEventListener('click', () => {
      this.deleteSticker();
    });

    // 완료 버튼
    this.closeBtn.addEventListener('click', () => {
      this.hidePopup();
    });

    // 팝업 외부 클릭시 닫기
    this.popup.addEventListener('click', (e) => {
      if (e.target === this.popup) {
        this.hidePopup();
      }
    });
  }

  showPopup(sticker) {
    if (!this.popup || !sticker) return;

    this.currentSticker = sticker;
    
    // 현재 스티커 값으로 슬라이더 초기화
    const currentPixelSize = Math.round(Math.max(sticker.width, sticker.height));
    const currentSize = Math.round(currentPixelSize / 10); // 픽셀 크기를 슬라이더 값(1-100)으로 변환
    const currentRotation = Math.round(sticker.rotation || 0);
    const currentOpacity = Math.round((sticker.opacity || 1) * 100);

    this.sizeSlider.value = currentSize;
    this.rotationSlider.value = currentRotation;
    this.opacitySlider.value = currentOpacity;

    // 색상 선택기 초기화 (SVG 스티커인 경우만)
    if (this.colorPicker) {
      const isSvgSticker = sticker.image && sticker.image.src && 
        (sticker.image.src.endsWith('.svg') || sticker.image.src.includes('data:image/svg+xml'));
      
      if (isSvgSticker) {
        // SVG 스티커인 경우 색상 선택기 표시 및 현재 색상 설정
        this.colorPicker.style.display = 'block';
        // 기본 색상을 검은색으로 설정 (실제 SVG에서 색상을 추출하는 것은 복잡하므로)
        if (sticker.currentColor) {
          this.colorPicker.value = sticker.currentColor;
        } else {
          this.colorPicker.value = '#000000'; // 기본 검은색
        }
        
        // 색상 선택기 라벨 표시
        const colorLabel = this.colorPicker.parentElement?.querySelector('label');
        if (colorLabel) colorLabel.style.display = 'block';
      } else {
        // PNG 스티커인 경우 색상 선택기 숨김
        this.colorPicker.style.display = 'none';
        const colorLabel = this.colorPicker.parentElement?.querySelector('label');
        if (colorLabel) colorLabel.style.display = 'none';
      }
    }

    // 수치 표시 초기화
    const stickerSizeValue = document.getElementById('stickerSizeValue');
    const stickerRotationValue = document.getElementById('stickerRotationValue');
    const stickerOpacityValue = document.getElementById('stickerOpacityValue');
    
    if (stickerSizeValue) stickerSizeValue.textContent = currentSize;
    if (stickerRotationValue) stickerRotationValue.textContent = currentRotation + '°';
    if (stickerOpacityValue) stickerOpacityValue.textContent = currentOpacity;

    // 팝업을 스티커 근처에 위치시키기
    this.positionModalNearSticker(sticker);

    // 팝업 표시
    this.popup.classList.remove('hidden');
    
    // 슬라이더 조정이 끝난 후 모달이 스티커를 따라다닐 수 있도록 플래그 설정
    this.isFollowingSticker = true;
    
    console.log('스티커 편집 팝업 표시:', sticker);
  }

  positionModalNearSticker(sticker) {
    if (!this.popup || !sticker) return;

    const canvas = document.getElementById('canvas');
    if (!canvas) return;

    const canvasRect = canvas.getBoundingClientRect();
    const modalWidth = 280;
    const modalHeight = 160;
    const padding = 10;

    // 캔버스의 실제 디스플레이 크기와 논리적 크기 비율 계산
    const displayWidth = canvasRect.width;
    const displayHeight = canvasRect.height;
    const logicalWidth = state.canvasWidth || (canvas.width / state.canvasScale);
    const logicalHeight = state.canvasHeight || (canvas.height / state.canvasScale);
    
    // 논리적 좌표를 화면 좌표로 변환하는 비율
    const scaleX = displayWidth / logicalWidth;
    const scaleY = displayHeight / logicalHeight;

    // 스티커의 화면상 위치 계산 (스크롤 위치 포함)
    let stickerScreenX = canvasRect.left + (sticker.x * scaleX);
    let stickerScreenY = canvasRect.top + (sticker.y * scaleY);
    
    // 스티커 크기를 화면 좌표로 변환
    const stickerScreenWidth = sticker.width * scaleX;
    const stickerScreenHeight = sticker.height * scaleY;

    // 모달을 스티커 하단 중앙에 배치 (현재 스크롤 위치 기준)
    let modalX = stickerScreenX - modalWidth / 2;
    let modalY = stickerScreenY + stickerScreenHeight / 2 + padding;

    // 현재 뷰포트 정보 (스크롤 고려)
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const scrollY = window.scrollY || window.pageYOffset;

    // 좌우 경계 체크
    if (modalX < padding) {
      modalX = padding;
    } else if (modalX + modalWidth > viewportWidth - padding) {
      modalX = viewportWidth - modalWidth - padding;
    }

    // 아래쪽에 공간이 없으면 위쪽에 배치 (뷰포트 기준)
    if (modalY > scrollY + viewportHeight - modalHeight - padding) {
      modalY = stickerScreenY - stickerScreenHeight / 2 - modalHeight - padding;
    }

    // 위쪽에도 공간이 없으면 스티커 옆에 배치
    if (modalY < scrollY + padding) {
      modalY = stickerScreenY - modalHeight / 2;
      
      // 오른쪽 우선 배치
      modalX = stickerScreenX + stickerScreenWidth / 2 + padding;
      
      // 오른쪽에 공간이 없으면 왼쪽에 배치
      if (modalX + modalWidth > viewportWidth - padding) {
        modalX = stickerScreenX - stickerScreenWidth / 2 - modalWidth - padding;
      }
    }

    // 최종 위치 적용 (절대 위치)
    this.popup.style.position = 'absolute';
    this.popup.style.left = `${Math.max(padding, modalX)}px`;
    this.popup.style.top = `${Math.max(scrollY + padding, modalY)}px`;
    this.popup.style.zIndex = '1000';
  }

  hidePopup() {
    if (!this.popup) return;
    
    this.popup.classList.add('hidden');
    this.currentSticker = null;
    this.isFollowingSticker = true; // 기본값으로 재설정
    
    // 선택 해제
    state.selectedElement = null;
    state.selectedElementType = null;
    renderCanvas();
  }

  deleteSticker() {
    if (!this.currentSticker) return;

    // state에서 스티커 제거
    if (state.stickers) {
      const index = state.stickers.findIndex(s => s.id === this.currentSticker.id);
      if (index !== -1) {
        state.stickers.splice(index, 1);
      }
    }

    // 선택 해제
    state.selectedElement = null;
    state.selectedElementType = null;

    // 팝업 닫기
    this.hidePopup();
    
    // 캔버스 다시 렌더링
    renderCanvas();
    
    console.log('스티커가 삭제되었습니다');
  }

  // 외부에서 스티커 선택 해제 시 호출할 수 있는 메서드
  clearSelection() {
    if (this.currentSticker) {
      this.hidePopup();
    }
  }

  // SVG 스티커 색상 업데이트
  async updateStickerColor(color) {
    if (!this.currentSticker) return;
    
    // SVG 스티커가 아닌 경우 처리하지 않음
    if (!this.currentSticker.image || !this.currentSticker.image.src || 
        (!this.currentSticker.image.src.endsWith('.svg') && 
         !this.currentSticker.image.src.includes('data:image/svg+xml'))) {
      console.log('SVG가 아닌 스티커는 색상 변경이 불가능합니다.');
      return;
    }
    
    try {
      // 색상 변경 중임을 표시 (중복 호출 방지)
      if (this.currentSticker.isColorChanging) {
        console.log('색상 변경 중입니다. 잠시 기다려주세요.');
        return;
      }
      this.currentSticker.isColorChanging = true;
      
      // 원본 SVG 문자열 가져오기 (첫 호출 시만)
      if (!this.currentSticker.svgString) {
        let svgContent = '';
        try {
          if (this.currentSticker.image.src.startsWith('data:image/svg+xml')) {
            // data URL에서 SVG 추출
            const dataUrl = this.currentSticker.image.src;
            if (dataUrl.includes(',')) {
              const dataPart = dataUrl.split(',')[1];
              try {
                // URL 인코딩된 경우 시도
                svgContent = decodeURIComponent(dataPart);
              } catch (e) {
                try {
                  // base64 인코딩된 경우 시도
                  svgContent = decodeURIComponent(escape(atob(dataPart)));
                } catch (e2) {
                  // 직접 사용
                  svgContent = dataPart;
                }
              }
            } else {
              throw new Error('잘못된 data URL 형식');
            }
          } else {
            // 일반 URL에서 SVG 가져오기
            const resp = await fetch(this.currentSticker.image.src);
            if (!resp.ok) {
              throw new Error(`HTTP 오류: ${resp.status}`);
            }
            svgContent = await resp.text();
          }
          
          // SVG 내용 검증
          if (!svgContent || (!svgContent.includes('<svg') && !svgContent.includes('%3Csvg'))) {
            throw new Error('유효하지 않은 SVG 내용');
          }
          
          this.currentSticker.svgString = svgContent;
          console.log('원본 SVG 저장 완료');
          console.log('SVG 내용 미리보기:', svgContent.substring(0, 500));
        } catch (fetchError) {
          console.error('SVG 내용 가져오기 실패:', fetchError);
          this.currentSticker.isColorChanging = false;
          alert('SVG 파일을 읽을 수 없습니다.');
          return;
        }
      }
      
      let svg = this.currentSticker.svgString;
      
      // URL 인코딩된 SVG인 경우 디코딩
      if (svg.includes('%3C')) {
        try {
          svg = decodeURIComponent(svg);
        } catch (e) {
          console.warn('URL 디코딩 실패, 원본 사용');
        }
      }
      
      // SVG 내용 유효성 재검증
      if (!svg.includes('<svg')) {
        console.error('저장된 SVG 내용이 유효하지 않습니다.');
        this.currentSticker.isColorChanging = false;
        alert('SVG 형식이 올바르지 않습니다.');
        return;
      }
      
      // 다양한 SVG 색상 속성들을 모두 변경
      console.log('원본 SVG (변경 전):', svg.substring(0, 300));
      
      svg = svg
        // CSS 클래스 내의 fill 변경 (가장 우선)
        .replace(/(\s*)fill:\s*[^;]+;/gi, `$1fill: ${color};`)
        // CSS 클래스 내의 stroke 변경
        .replace(/(\s*)stroke:\s*[^;]+;/gi, `$1stroke: ${color};`)
        // fill 속성 변경 (none과 transparent 제외)
        .replace(/fill="(?!none|transparent)[^"]*"/gi, `fill="${color}"`)
        .replace(/fill='(?!none|transparent)[^']*'/gi, `fill='${color}'`)
        // stroke 속성도 변경 (선 색상)
        .replace(/stroke="(?!none|transparent)[^"]*"/gi, `stroke="${color}"`)
        .replace(/stroke='(?!none|transparent)[^']*'/gi, `stroke='${color}'`)
        // style 속성 내의 fill 변경
        .replace(/style="([^"]*?)fill:\s*[^;]*([^"]*?)"/gi, `style="$1fill:${color}$2"`)
        .replace(/style='([^']*?)fill:\s*[^;]*([^']*?)'/gi, `style='$1fill:${color}$2'`)
        // style 속성 내의 stroke 변경
        .replace(/style="([^"]*?)stroke:\s*[^;]*([^"]*?)"/gi, `style="$1stroke:${color}$2"`)
        .replace(/style='([^']*?)stroke:\s*[^;]*([^']*?)'/gi, `style='$1stroke:${color}$2'`)
        // fill 속성이 없는 path나 요소에 추가
        .replace(/<(path|circle|rect|polygon|ellipse)(?![^>]*fill=)[^>]*>/gi, (match) => {
          return match.replace('>', ` fill="${color}">`);
        });
      
      console.log('색상 변경된 SVG (변경 후):', svg.substring(0, 300));
      
      // XML 헤더가 없으면 추가 (일부 브라우저에서 필요)
      if (!svg.startsWith('<?xml') && !svg.startsWith('<svg')) {
        svg = '<?xml version="1.0" encoding="UTF-8"?>' + svg;
      }
      
      console.log('SVG 색상 변경 처리 중...');
      
      // 새로운 Image 객체 생성
      const newImage = new Image();
      
      // 타임아웃 설정 (15초)
      const timeoutId = setTimeout(() => {
        console.error('SVG 로드 타임아웃');
        this.currentSticker.isColorChanging = false;
        alert('SVG 로드 시간이 초과되었습니다.');
      }, 15000);
      
      // 이미지 로드 성공 시에만 캔버스 렌더링
      newImage.onload = () => {
        clearTimeout(timeoutId);
        try {
          // 이전 이미지 정보 백업
          const oldImage = this.currentSticker.image;
          
          // 새 이미지로 교체
          this.currentSticker.image = newImage;
          
          // 현재 색상 저장 (다음에 팝업 열 때 사용)
          this.currentSticker.currentColor = color;
          
          // 색상 변경 완료 플래그
          this.currentSticker.isColorChanging = false;
          
          // 캔버스 렌더링 (이미지가 완전히 로드된 후에만)
          renderCanvas();
          
          console.log('SVG 색상 변경 완료:', color);
          
          // 이전 ObjectURL 정리 (메모리 누수 방지)
          if (oldImage && oldImage.src && oldImage.src.startsWith('blob:')) {
            URL.revokeObjectURL(oldImage.src);
          }
        } catch (renderError) {
          console.error('캔버스 렌더링 실패:', renderError);
          this.currentSticker.isColorChanging = false;
        }
      };
      
      // 이미지 로드 실패 시 fallback 처리
      newImage.onerror = (error) => {
        clearTimeout(timeoutId);
        console.error('첫 번째 방법으로 SVG 이미지 로드 실패, fallback 시도 중...');
        
        // fallback: 다양한 방식으로 시도
        const fallbackMethods = [
          // 방법 1: UTF-8 인코딩으로 data URL
          () => {
            const encoded = encodeURIComponent(svg);
            return `data:image/svg+xml;charset=utf-8,${encoded}`;
          },
          // 방법 2: base64 인코딩
          () => {
            try {
              const base64 = btoa(unescape(encodeURIComponent(svg)));
              return `data:image/svg+xml;base64,${base64}`;
            } catch (e) {
              // btoa 실패 시 수동 base64 인코딩
              const base64 = btoa(svg);
              return `data:image/svg+xml;base64,${base64}`;
            }
          },
          // 방법 3: 단순 인코딩 (특수문자 처리)
          () => {
            return `data:image/svg+xml,${svg.replace(/"/g, "'").replace(/#/g, '%23').replace(/</g, '%3C').replace(/>/g, '%3E')}`;
          }
        ];
        
        let methodIndex = 0;
        
        const tryFallback = () => {
          if (methodIndex >= fallbackMethods.length) {
            console.error('모든 fallback 방법이 실패했습니다. 원본 유지합니다.');
            this.currentSticker.isColorChanging = false;
            
            // 원본 스티커 색상을 시각적으로라도 변경하려고 시도
            try {
              // CSS filter를 사용한 색상 변경 시도
              const canvas = document.getElementById('canvas');
              if (canvas) {
                console.log('CSS filter를 사용한 색상 변경을 시도합니다...');
                this.currentSticker.colorFilter = this.getColorFilter(color);
                this.currentSticker.currentColor = color;
                this.currentSticker.isColorChanging = false;
                renderCanvas();
                console.log('CSS filter를 통한 색상 변경 완료');
                return;
              }
            } catch (filterError) {
              console.error('CSS filter 방법도 실패:', filterError);
            }
            
            alert('죄송합니다. 이 SVG 스티커의 색상을 변경할 수 없습니다.');
            return;
          }
          
          try {
            const dataUrl = fallbackMethods[methodIndex]();
            console.log(`Fallback 방법 ${methodIndex + 1} 시도: ${dataUrl.substring(0, 100)}...`);
            const fallbackImage = new Image();
            
            fallbackImage.onload = () => {
              try {
                const oldImage = this.currentSticker.image;
                this.currentSticker.image = fallbackImage;
                this.currentSticker.currentColor = color;
                this.currentSticker.isColorChanging = false;
                renderCanvas();
                console.log(`SVG 색상 변경 완료 (fallback 방법 ${methodIndex + 1}):`, color);
                
                if (oldImage && oldImage.src && oldImage.src.startsWith('blob:')) {
                  URL.revokeObjectURL(oldImage.src);
                }
              } catch (fallbackRenderError) {
                console.error('fallback 렌더링 실패:', fallbackRenderError);
                this.currentSticker.isColorChanging = false;
              }
            };
            
            fallbackImage.onerror = (err) => {
              console.warn(`Fallback 방법 ${methodIndex + 1} 실패:`, err);
              console.log('실패한 data URL:', dataUrl.substring(0, 200));
              methodIndex++;
              setTimeout(tryFallback, 100);
            };
            
            fallbackImage.src = dataUrl;
          } catch (fallbackError) {
            console.error(`Fallback 방법 ${methodIndex + 1} 생성 실패:`, fallbackError);
            methodIndex++;
            setTimeout(tryFallback, 100);
          }
        };
        
        tryFallback();
      };
      
      // 첫 번째 방법: Blob 사용
      try {
        const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        
        newImage.src = url;
        
        // 메모리 누수 방지를 위해 URL 해제 예약
        const cleanup = () => {
          URL.revokeObjectURL(url);
        };
        
        newImage.addEventListener('load', cleanup, { once: true });
        newImage.addEventListener('error', cleanup, { once: true });
        
      } catch (blobError) {
        console.error('Blob 생성 실패, 직접 data URL 사용:', blobError);
        // 직접 data URL 생성
        try {
          const encoded = encodeURIComponent(svg);
          newImage.src = `data:image/svg+xml;charset=utf-8,${encoded}`;
        } catch (dataUrlError) {
          console.error('Data URL 생성도 실패:', dataUrlError);
          this.currentSticker.isColorChanging = false;
          alert('SVG 처리 중 오류가 발생했습니다.');
        }
      }
      
    } catch (error) {
      console.error('SVG 색상 변경 중 오류:', error);
      if (this.currentSticker) {
        this.currentSticker.isColorChanging = false;
      }
      alert('색상 변경 중 오류가 발생했습니다. 다시 시도해 주세요.');
    }
  }

  // CSS filter를 사용한 색상 변경 (fallback 방법)
  getColorFilter(targetColor) {
    // 헥스 색상을 RGB로 변환
    const hex = targetColor.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16) / 255;
    const g = parseInt(hex.substr(2, 2), 16) / 255;
    const b = parseInt(hex.substr(4, 2), 16) / 255;
    
    // 색상 필터 조합 생성
    // 이는 완벽하지 않지만 기본적인 색상 변경 효과를 제공
    const brightness = Math.max(r, g, b);
    const hue = this.rgbToHue(r, g, b);
    const saturation = this.getSaturation(r, g, b);
    
    return {
      filter: `hue-rotate(${hue}deg) saturate(${saturation * 100}%) brightness(${brightness * 100}%)`,
      targetColor: targetColor
    };
  }
  
  // RGB를 Hue로 변환
  rgbToHue(r, g, b) {
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const diff = max - min;
    
    if (diff === 0) return 0;
    
    let hue = 0;
    if (max === r) {
      hue = ((g - b) / diff) % 6;
    } else if (max === g) {
      hue = (b - r) / diff + 2;
    } else {
      hue = (r - g) / diff + 4;
    }
    
    return Math.round(hue * 60);
  }
  
  // 채도 계산
  getSaturation(r, g, b) {
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const diff = max - min;
    
    if (max === 0) return 0;
    return diff / max;
  }
}

export const stickerControls = new StickerControls();
