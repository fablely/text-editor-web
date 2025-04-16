const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const imageLoader = document.getElementById('imageLoader');

const textInput = document.getElementById('textInput');
const fontFamily = document.getElementById('fontFamily');
const fontSize = document.getElementById('fontSize');
const fontColor = document.getElementById('fontColor');
const opacity = document.getElementById('opacity');
const rotation = document.getElementById('rotation');
const textDirection = document.getElementById('textDirection');
const letterSpacing = document.getElementById('letterSpacing'); // 자간 요소 추가

const deleteTextBtn = document.getElementById('deleteTextBtn');
const saveImageBtn = document.getElementById('saveImageBtn');
const centerTextBtn = document.getElementById('centerTextBtn'); // 중앙 정렬 버튼 요소 추가

let img = new Image();
let textObjects = [];
let selectedText = null;
let dragOffset = { x: 0, y: 0 };
let isDragging = false; // 드래그 상태 추적 변수 추가
let originalFileName = ""; // 원본 파일명 저장
let originalFileExt = "jpg"; // 원본 파일 확장자, 기본값 jpg

// Fonts 폴더 내의 폰트 파일 목록 정의 (확장자 포함)
const fontFiles = [
  '강원교육현옥샘.ttf',
  '학교안심우산.ttf',
  '학교안심우주.ttf',
  '학교안심여행.ttf',
  // 추가 폰트 파일들...
];

// 페이지 로드 시 폰트 로드
window.addEventListener('DOMContentLoaded', function() {
  // 폰트 로드 상태를 표시할 요소 생성
  const statusDiv = document.createElement('div');
  statusDiv.id = 'fontLoadStatus';
  statusDiv.style.fontSize = '12px';
  statusDiv.style.color = '#666';
  statusDiv.style.marginTop = '5px';
  
  // fontFamily 선택기 아래에 상태 표시 삽입
  fontFamily.parentNode.insertAdjacentElement('afterend', statusDiv);
  
  statusDiv.textContent = "폰트 로드 중...";
  
  let loadedCount = 0;
  let failedCount = 0;
  
  // Fonts 폴더의 폰트 자동 로드
  fontFiles.forEach(fontFile => {
    try {
      // 파일명에서 확장자 제거하여 폰트 이름으로 사용
      const fontName = fontFile.replace(/\.[^/.]+$/, "");
      
      // 폰트 URL 생성 (URL 인코딩 적용)
      const fontUrl = `./Fonts/${encodeURIComponent(fontFile)}`;
      
      // 동적 폰트 스타일 생성
      const fontFace = new FontFace(fontName, `url(${fontUrl})`);
      
      // 폰트 로드
      fontFace.load().then(function(loadedFace) {
        // 문서에 폰트 추가
        document.fonts.add(loadedFace);
        
        // 폰트 선택 목록에 추가
        const option = document.createElement('option');
        option.value = fontName;
        option.textContent = fontName;
        
        // 폰트 미리보기 적용
        option.style.fontFamily = fontName;
        
        fontFamily.appendChild(option);
        
        loadedCount++;
        statusDiv.textContent = `폰트 로드: ${loadedCount}개 성공, ${failedCount}개 실패`;
        
        console.log(`폰트 ${fontName} 로드 완료`);
      }).catch(function(error) {
        failedCount++;
        statusDiv.textContent = `폰트 로드: ${loadedCount}개 성공, ${failedCount}개 실패`;
        console.error(`폰트 ${fontName} 로드 실패:`, error);
      });
    } catch (error) {
      failedCount++;
      statusDiv.textContent = `폰트 로드: ${loadedCount}개 성공, ${failedCount}개 실패`;
      console.error(`폰트 로드 중 오류:`, error);
    }
  });
  
  // 8초 후 상태 메시지 숨기기
  setTimeout(() => {
    statusDiv.style.display = 'none';
  }, 8000);
});

imageLoader.addEventListener('change', function (e) {
  const file = e.target.files[0];
  if (!file) return;
  
  // 파일명과 확장자 추출
  const fileName = file.name;
  originalFileName = fileName.substring(0, fileName.lastIndexOf('.')) || fileName;
  originalFileExt = fileName.split('.').pop().toLowerCase();
  
  const reader = new FileReader();
  reader.onload = function (event) {
    img.onload = function () {
      // 원본 이미지 크기 저장
      const originalWidth = img.width;
      const originalHeight = img.height;
      
      // 캔버스 컨테이너 크기 가져오기
      const canvasWrapper = document.querySelector('.canvas-wrapper');
      const maxWidth = canvasWrapper.clientWidth;
      const maxHeight = window.innerHeight * 0.7; // 화면 높이의 70% 정도로 제한
      
      // 이미지 비율 유지하며 캔버스 크기 조정
      const aspectRatio = originalWidth / originalHeight;
      
      let canvasWidth, canvasHeight;
      
      if (originalWidth / originalHeight > maxWidth / maxHeight) {
        // 이미지가 더 가로로 넓은 경우
        canvasWidth = maxWidth;
        canvasHeight = canvasWidth / aspectRatio;
      } else {
        // 이미지가 더 세로로 긴 경우
        canvasHeight = maxHeight;
        canvasWidth = canvasHeight * aspectRatio;
      }
      
      // 캔버스 크기 설정
      canvas.width = canvasWidth;
      canvas.height = canvasHeight;
      
      // CSS 스타일 설정
      canvas.style.width = '100%';
      canvas.style.height = 'auto';
      
      renderCanvas();
      
      // 저장 시 원본 크기로 복원
      saveImageBtn.addEventListener('click', () => {
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = originalWidth;
        tempCanvas.height = originalHeight;
        const tempCtx = tempCanvas.getContext('2d');
        
        // 원본 이미지 그리기
        tempCtx.drawImage(img, 0, 0, originalWidth, originalHeight);
        
        // 텍스트 객체 그리기 (크기 비율 조정)
        textObjects.forEach(t => {
          tempCtx.save();
          tempCtx.translate(
            t.x * (originalWidth / canvasWidth), 
            t.y * (originalHeight / canvasHeight)
          );
          tempCtx.rotate((t.rotation * Math.PI) / 180);
          tempCtx.globalAlpha = t.opacity;
          tempCtx.font = `${t.size * (originalWidth / canvasWidth)}px ${t.font}`;
          tempCtx.fillStyle = t.color;
          
          const scaledSpacing = (t.letterSpacing || 0) * (originalWidth / canvasWidth);
          
          if (t.direction === 'vertical') {
            for (let i = 0; i < t.text.length; i++) {
              tempCtx.fillText(
                t.text[i], 
                0, 
                i * (t.size + scaledSpacing) * (originalWidth / canvasWidth)
              );
            }
          } else {
            if (scaledSpacing !== 0) {
              let xPos = 0;
              for (let i = 0; i < t.text.length; i++) {
                tempCtx.fillText(t.text[i], xPos, 0);
                xPos += tempCtx.measureText(t.text[i]).width + scaledSpacing;
              }
            } else {
              tempCtx.fillText(t.text, 0, 0);
            }
          }
          
          tempCtx.restore();
        });
        
        // 이미지 형식 결정 (jpg, jpeg -> image/jpeg, png -> image/png, 기타 -> image/jpeg)
        let mimeType = "image/jpeg"; // 기본값
        let fileExtension = "jpg";
        
        if (originalFileExt === "png") {
          mimeType = "image/png";
          fileExtension = "png";
        } else if (originalFileExt === "jpg" || originalFileExt === "jpeg") {
          mimeType = "image/jpeg";
          fileExtension = originalFileExt;
        }
        
        const link = document.createElement('a');
        link.download = `${originalFileName}-edited.${fileExtension}`;
        
        // JPEG 품질 설정 (PNG는 무손실이므로 품질 설정 불필요)
        const quality = fileExtension === "png" ? 1.0 : 0.92;
        link.href = tempCanvas.toDataURL(mimeType, quality);
        
        link.click();
      });
    };
    img.src = event.target.result;
  };
  reader.readAsDataURL(file);
});

document.getElementById('addTextBtn').addEventListener('click', function () {
  const newText = {
    text: textInput.value,
    x: 50,
    y: 80,
    font: fontFamily.value,
    size: parseInt(fontSize.value, 10),
    color: fontColor.value,
    opacity: parseFloat(opacity.value),
    rotation: parseFloat(rotation.value),
    direction: textDirection.value,
    letterSpacing: parseFloat(letterSpacing.value) // 자간 속성 추가
  };

  textObjects.push(newText);
  renderCanvas();
});

// 선택된 텍스트의 속성을 컨트롤에 표시하는 함수
function updateControlsFromText(t) {
  textInput.value = t.text;
  fontFamily.value = t.font;
  fontSize.value = t.size;
  fontColor.value = t.color;
  opacity.value = t.opacity;
  rotation.value = t.rotation;
  textDirection.value = t.direction;
  letterSpacing.value = t.letterSpacing || 0; // 자간 설정
}

// 컨트롤 변경 시 선택된 텍스트에 적용
[textInput, fontFamily, fontSize, fontColor, opacity, rotation, textDirection, letterSpacing].forEach(input => {
  input.addEventListener('input', () => {
    if (!selectedText) return; // 선택된 텍스트가 없으면 무시
    selectedText.text = textInput.value;
    selectedText.font = fontFamily.value;
    selectedText.size = parseInt(fontSize.value, 10);
    selectedText.color = fontColor.value;
    selectedText.opacity = parseFloat(opacity.value);
    selectedText.rotation = parseFloat(rotation.value);
    selectedText.direction = textDirection.value;
    selectedText.letterSpacing = parseFloat(letterSpacing.value);

    renderCanvas(); // 변경 사항을 반영하여 캔버스 다시 렌더링
  });
});

deleteTextBtn.addEventListener('click', () => {
  if (selectedText) {
    textObjects = textObjects.filter(t => t !== selectedText);
    selectedText = null;
    renderCanvas();
  }
});

// 텍스트 좌우 중앙 정렬 버튼 이벤트 리스너 수정
centerTextBtn.addEventListener('click', () => {
  if (!selectedText) return; // 선택된 텍스트가 없으면 무시
  
  // 캔버스 가로 중앙 좌표 계산
  const canvasCenterX = canvas.width / 2;
  
  // 텍스트 너비 계산
  ctx.font = `${selectedText.size}px ${selectedText.font}`;
  
  let textWidth;
  
  if (selectedText.direction === 'vertical') {
    textWidth = selectedText.size;
  } else {
    if (selectedText.letterSpacing !== 0) {
      textWidth = 0;
      for (let i = 0; i < selectedText.text.length; i++) {
        textWidth += ctx.measureText(selectedText.text[i]).width;
      }
      textWidth += (selectedText.text.length - 1) * selectedText.letterSpacing;
    } else {
      textWidth = ctx.measureText(selectedText.text).width;
    }
  }
  
  // 텍스트 X 위치만 조정 (좌우 중앙 정렬), Y 위치는 유지
  selectedText.x = canvasCenterX - textWidth / 2;
  
  renderCanvas();
});

function getEventPos(e) {
  const rect = canvas.getBoundingClientRect();
  if (e.touches && e.touches.length > 0) {
    return {
      x: e.touches[0].clientX - rect.left,
      y: e.touches[0].clientY - rect.top
    };
  } else {
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  }
}

// handleStart 함수 수정 - 빈 영역 클릭 시에만 선택 해제
function handleStart(e) {
  const { x, y } = getEventPos(e);
  const hit = findTextAtPosition(x, y);
  
  if (hit) {
    selectedText = hit;
    isDragging = true; // 드래그 시작
    dragOffset.x = x - selectedText.x;
    dragOffset.y = y - selectedText.y;
    updateControlsFromText(selectedText);
    renderCanvas(); // 선택 상태 시각적 표시를 위해 렌더링
    e.preventDefault();
  } else {
    // 빈 영역 클릭 시 선택 해제
    selectedText = null;
    renderCanvas();
  }
}

function handleMove(e) {
  if (!selectedText || !isDragging) return; // 드래그 중일 때만 이동
  const { x, y } = getEventPos(e);
  selectedText.x = x - dragOffset.x;
  selectedText.y = y - dragOffset.y;
  renderCanvas();
  e.preventDefault();
}

function handleEnd(e) {
  isDragging = false; // 드래그 종료
  // 선택 상태는 유지
}

canvas.addEventListener('mousedown', handleStart);
canvas.addEventListener('mousemove', handleMove);
canvas.addEventListener('mouseup', handleEnd);

canvas.addEventListener('touchstart', handleStart, { passive: false });
canvas.addEventListener('touchmove', handleMove, { passive: false });
canvas.addEventListener('touchend', handleEnd);

function findTextAtPosition(x, y) {
  for (let i = textObjects.length - 1; i >= 0; i--) {
    const t = textObjects[i];

    ctx.save();
    ctx.font = `${t.size}px ${t.font}`;
    ctx.textBaseline = 'top'; // ✅ 렌더링과 동일하게 기준 맞추기

    const textWidth = t.direction === 'vertical'
      ? t.size
      : ctx.measureText(t.text).width;
    const textHeight = t.direction === 'vertical'
      ? t.text.length * t.size
      : t.size;

    const dx = x - t.x;
    const dy = y - t.y;

    const angle = (-t.rotation * Math.PI) / 180;
    const rotatedX = dx * Math.cos(angle) - dy * Math.sin(angle);
    const rotatedY = dx * Math.sin(angle) + dy * Math.cos(angle);

    ctx.restore();

    // ✅ 기준: 0 ~ height (top 기준)
    if (
      rotatedX >= 0 && rotatedX <= textWidth &&
      rotatedY >= 0 && rotatedY <= textHeight
    ) {
      return t;
    }
  }
  return null;
}


function renderCanvas() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  if (img.src) {
    // 이미지를 캔버스 크기에 맞게 그리기
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  }
  
  // 텍스트 그리기 (이하 동일)
  for (const t of textObjects) {
    ctx.save();
    ctx.translate(t.x, t.y);
    ctx.rotate((t.rotation * Math.PI) / 180);
    ctx.globalAlpha = t.opacity;
    
    ctx.font = `${t.size}px ${t.font}`;
    ctx.textBaseline = 'top';
    ctx.fillStyle = t.color;
    
    if (t.direction === 'vertical') {
      // 세로 텍스트 렌더링 (자간 적용)
      const spacing = t.letterSpacing || 0;
      for (let i = 0; i < t.text.length; i++) {
        ctx.fillText(t.text[i], 0, i * (t.size + spacing));
      }
    } else {
      // 가로 텍스트 렌더링 (자간 적용)
      const spacing = t.letterSpacing || 0;
      if (spacing !== 0) {
        // 자간이 있는 경우 글자 하나씩 렌더링
        let xPos = 0;
        for (let i = 0; i < t.text.length; i++) {
          ctx.fillText(t.text[i], xPos, 0);
          // 다음 글자 위치 계산 (글자 너비 + 자간)
          xPos += ctx.measureText(t.text[i]).width + spacing;
        }
      } else {
        // 자간이 없는 경우 일반 렌더링
        ctx.fillText(t.text, 0, 0);
      }
    }
    
    if (t === selectedText) {
      ctx.strokeStyle = 'red';
      ctx.lineWidth = 2;
      
      // 텍스트 너비와 높이 계산 (자간 포함)
      let textWidth, textHeight;
      
      if (t.direction === 'vertical') {
        textWidth = t.size;
        const spacing = t.letterSpacing || 0;
        textHeight = t.text.length * (t.size + spacing);
      } else {
        if (t.letterSpacing !== 0) {
          textWidth = 0;
          for (let i = 0; i < t.text.length; i++) {
            textWidth += ctx.measureText(t.text[i]).width;
          }
          textWidth += (t.text.length - 1) * t.letterSpacing;
        } else {
          textWidth = ctx.measureText(t.text).width;
        }
        textHeight = t.size;
      }
      
      ctx.strokeRect(0, 0, textWidth, textHeight);
    }
    
    ctx.restore();
  }
}

// 이미지 저장 버튼 이벤트 핸들러 수정
saveImageBtn.addEventListener('click', () => {
  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = originalWidth;
  tempCanvas.height = originalHeight;
  const tempCtx = tempCanvas.getContext('2d');
  
  // 원본 이미지 그리기
  tempCtx.drawImage(img, 0, 0, originalWidth, originalHeight);
  
  // 텍스트 객체 그리기 (크기 비율 조정)
  textObjects.forEach(t => {
    tempCtx.save();
    tempCtx.translate(
      t.x * (originalWidth / canvasWidth), 
      t.y * (originalHeight / canvasHeight)
    );
    tempCtx.rotate((t.rotation * Math.PI) / 180);
    tempCtx.globalAlpha = t.opacity;
    tempCtx.font = `${t.size * (originalWidth / canvasWidth)}px ${t.font}`;
    tempCtx.fillStyle = t.color;
    
    const scaledSpacing = (t.letterSpacing || 0) * (originalWidth / canvasWidth);
    
    if (t.direction === 'vertical') {
      for (let i = 0; i < t.text.length; i++) {
        tempCtx.fillText(
          t.text[i], 
          0, 
          i * (t.size + scaledSpacing) * (originalWidth / canvasWidth)
        );
      }
    } else {
      if (scaledSpacing !== 0) {
        let xPos = 0;
        for (let i = 0; i < t.text.length; i++) {
          tempCtx.fillText(t.text[i], xPos, 0);
          xPos += tempCtx.measureText(t.text[i]).width + scaledSpacing;
        }
      } else {
        tempCtx.fillText(t.text, 0, 0);
      }
    }
    
    tempCtx.restore();
  });
  
  // 이미지 형식 결정 (jpg, jpeg -> image/jpeg, png -> image/png, 기타 -> image/jpeg)
  let mimeType = "image/jpeg"; // 기본값
  let fileExtension = "jpg";
  
  if (originalFileExt === "png") {
    mimeType = "image/png";
    fileExtension = "png";
  } else if (originalFileExt === "jpg" || originalFileExt === "jpeg") {
    mimeType = "image/jpeg";
    fileExtension = originalFileExt;
  }
  
  // JPEG 품질 설정 (PNG는 무손실이므로 품질 설정 불필요)
  const quality = fileExtension === "png" ? 1.0 : 0.92;
  const dataUrl = tempCanvas.toDataURL(mimeType, quality);
  
  // iOS 디바이스 체크
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || 
               (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  
  if (isIOS) {
    // iOS에서 공유 API를 지원하는지 확인
    if (navigator.share) {
      // 캔버스를 Blob으로 변환
      tempCanvas.toBlob(async (blob) => {
        try {
          // 파일 객체 생성
          const file = new File([blob], `${originalFileName}-edited.${fileExtension}`, { 
            type: mimeType 
          });
          
          // 공유 API 사용
          await navigator.share({
            title: '편집된 이미지',
            files: [file]
          });
          
          console.log('공유 성공');
        } catch (error) {
          console.error('공유 실패:', error);
          // 공유 실패 시 기존 방식으로 폴백
          showIOSDownloadPage(dataUrl);
        }
      }, mimeType, quality);
    } else {
      // 공유 API가 지원되지 않는 경우 기존 방식 사용
      showIOSDownloadPage(dataUrl);
    }
  } else {
    // 다른 기기에서는 기존 방식 사용
    const link = document.createElement('a');
    link.download = `${originalFileName}-edited.${fileExtension}`;
    link.href = dataUrl;
    link.click();
  }
});

// iOS용 다운로드 페이지 표시 함수
function showIOSDownloadPage(dataUrl) {
  const downloadWindow = window.open('');
  if (downloadWindow) {
    // 다운로드 안내 메시지와 함께 이미지 표시
    downloadWindow.document.write(`
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>이미지 저장</title>
          <style>
            body { font-family: -apple-system, sans-serif; text-align: center; padding: 20px; }
            img { max-width: 100%; height: auto; margin: 15px auto; display: block; }
            .instruction { color: #333; background: #f8f8f8; padding: 15px; border-radius: 10px; margin-bottom: 20px; }
            .step { margin-bottom: 10px; text-align: left; }
            .highlight { color: #007aff; font-weight: bold; }
            .btn { background: #007aff; color: white; border: none; padding: 10px 15px; 
                  border-radius: 10px; font-size: 16px; margin: 10px 0; }
          </style>
        </head>
        <body>
          <div class="instruction">
            <h3>이미지를 사진 앱에 저장하기</h3>
            <div class="step">1. 아래 이미지를 <span class="highlight">길게 터치</span>하세요.</div>
            <div class="step">2. 메뉴에서 <span class="highlight">"이미지 저장"</span> 또는 <span class="highlight">"Add to Photos"</span>를 선택하세요.</div>
            <div class="step">* 선택지에 사진 앱이 없다면 "<span class="highlight">More...</span>"를 눌러 추가 옵션을 확인하세요.</div>
          </div>
          <img src="${dataUrl}" alt="편집된 이미지" id="downloadImage">
        </body>
      </html>
    `);
  } else {
    alert('팝업이 차단되었습니다. 브라우저 설정에서 팝업을 허용하거나 다른 브라우저에서 시도해주세요.');
  }
}

// iOS에서 텍스트 입력 시 확대 방지
document.addEventListener('DOMContentLoaded', function() {
  // 모든 폼 요소에 대해 확대 방지 적용
  const formElements = document.querySelectorAll('input, select, textarea');
  
  formElements.forEach(el => {
    // 포커스 시 확대 방지를 위한 처리
    el.addEventListener('focus', function(e) {
      // 300ms 지연 후 페이지 확대 복원 시도
      setTimeout(function() {
        // 뷰포트 메타 태그 강제 갱신
        const viewport = document.querySelector('meta[name="viewport"]');
        if (viewport) {
          viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no');
        }
        
        // iOS에서 텍스트 입력 중 확대 방지를 위한 추가 처리
        document.body.style.webkitTextSizeAdjust = '100%';
        document.body.style.textSizeAdjust = '100%';
      }, 300);
    });
    
    // 필요시 블러 이벤트에서도 처리
    el.addEventListener('blur', function() {
      document.body.style.webkitTextSizeAdjust = '';
      document.body.style.textSizeAdjust = '';
    });
  });
  
  // 확대 제스처(pinch/zoom) 방지
  document.addEventListener('gesturestart', function(e) {
    e.preventDefault();
    return false;
  }, { passive: false });
  
  document.addEventListener('gesturechange', function(e) {
    e.preventDefault();
    return false;
  }, { passive: false });
  
  document.addEventListener('gestureend', function(e) {
    e.preventDefault();
    return false;
  }, { passive: false });
  
  // 더블탭 확대 방지
  let lastTouchEnd = 0;
  document.addEventListener('touchend', function(e) {
    const now = Date.now();
    if (now - lastTouchEnd < 300) {
      e.preventDefault();
    }
    lastTouchEnd = now;
  }, { passive: false });
  
  // iOS 13+ 에서 포커스 시 확대 방지를 위한 추가 처리
  document.addEventListener('touchstart', function(e) {
    if (e.touches.length > 1) {
      e.preventDefault(); // 멀티터치 방지
    }
  }, { passive: false });
});

