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

// 모달 컨트롤 요소
const textControlModal = document.getElementById('textControlModal');
const modalFontFamily = document.getElementById('modalFontFamily');
const modalFontSize = document.getElementById('modalFontSize');
const modalFontColor = document.getElementById('modalFontColor');
const modalOpacity = document.getElementById('modalOpacity');         // 추가: 불투명도
const modalLetterSpacing = document.getElementById('modalLetterSpacing'); // 추가: 자간
const modalRotation = document.getElementById('modalRotation');       // 추가: 회전
const modalCenterBtn = document.getElementById('modalCenterBtn');
const modalDeleteBtn = document.getElementById('modalDeleteBtn');
const modalCloseBtn = document.getElementById('modalCloseBtn');

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
  '강원교육모두.ttf',
  '강원교육새음.ttf',
  '학교안심우산.ttf',
  '학교안심우주.ttf',
  '학교안심여행.ttf',
  '상상토끼꽃길.ttf',
  '더페이스샵.ttf',
  '마포꽃섬.ttf',
  '바른히피.ttf',
  '빙그레싸만코.ttf',
  '평창평화체.ttf',
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
  let loadedFonts = []; // 로드된 폰트 이름을 저장할 배열
  
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
        
        // 로드된 폰트 이름 배열에 추가
        loadedFonts.push({
          name: fontName,
          face: loadedFace
        });
        
        loadedCount++;
        statusDiv.textContent = `폰트 로드: ${loadedCount}개 성공, ${failedCount}개 실패`;
        
        // 모든 폰트가 로드된 후 가나다순으로 정렬하여 선택 목록에 추가
        if (loadedCount + failedCount === fontFiles.length) {
          // 가나다순으로 정렬
          loadedFonts.sort((a, b) => a.name.localeCompare(b.name, 'ko'));
          
          // 기존 옵션 제거 (Arial 등 기본 옵션 제외하고 싶다면 이 부분 조정)
          while (fontFamily.options.length > 0) {
            fontFamily.options.remove(0);
          }
          while (modalFontFamily.options.length > 0) {
            modalFontFamily.options.remove(0);
          }
          
          // 정렬된 폰트 추가
          loadedFonts.forEach(font => {
            // 메인 선택기에 추가
            const option = document.createElement('option');
            option.value = font.name;
            option.textContent = font.name;
            option.style.fontFamily = font.name;
            fontFamily.appendChild(option);
            
            // 모달 선택기에 추가
            const modalOption = document.createElement('option');
            modalOption.value = font.name;
            modalOption.textContent = font.name;
            modalOption.style.fontFamily = font.name;
            modalFontFamily.appendChild(modalOption);
          });
          
          // 상태 메시지 업데이트
          statusDiv.textContent = `폰트 로드 완료: ${loadedCount}개`;
          
          // 8초 후 상태 메시지 숨기기
          setTimeout(() => {
            statusDiv.style.display = 'none';
          }, 1800);
        }
        
        console.log(`폰트 ${fontName} 로드 완료`);
      }).catch(function(error) {
        failedCount++;
        statusDiv.textContent = `폰트 로드: ${loadedCount}개 성공, ${failedCount}개 실패`;
        console.error(`폰트 ${fontName} 로드 실패:`, error);
        
        // 모든 폰트 처리가 완료되었는지 확인
        if (loadedCount + failedCount === fontFiles.length) {
          // 정렬 및 목록 생성 로직 실행
          // (위와 동일한 코드가 여기서도 실행되어야 하지만 중복을 피하기 위해 생략)
        }
      });
    } catch (error) {
      failedCount++;
      statusDiv.textContent = `폰트 로드: ${loadedCount}개 성공, ${failedCount}개 실패`;
      console.error(`폰트 로드 중 오류:`, error);
    }
  });
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
      const dpr = window.devicePixelRatio || 1;
    
      const maxWidth = window.innerWidth * 0.9;
      const maxHeight = window.innerHeight * 0.6;
    
      const imgAspect = img.width / img.height;
      const boxAspect = maxWidth / maxHeight;
    
      let drawWidth, drawHeight;
      if (imgAspect > boxAspect) {
        drawWidth = maxWidth;
        drawHeight = maxWidth / imgAspect;
      } else {
        drawHeight = maxHeight;
        drawWidth = maxHeight * imgAspect;
      }
    
      // 고해상도 캔버스 설정
      canvas.width = drawWidth * dpr;
      canvas.height = drawHeight * dpr;
      canvas.style.width = drawWidth + 'px';
      canvas.style.height = drawHeight + 'px';
    
      // 고품질 리샘플링
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); // 캔버스 스케일
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
    
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

// handleStart 함수 수정 - 텍스트 선택 시 모달 표시
function handleStart(e) {
  const { x, y } = getEventPos(e);
  const hit = findTextAtPosition(x, y);
  
  if (hit) {
    selectedText = hit;
    isDragging = true; // 드래그 시작
    dragOffset.x = x - selectedText.x;
    dragOffset.y = y - selectedText.y;
    updateControlsFromText(selectedText);
    
    // 모달 컨트롤 업데이트 및 표시
    updateModalControls(selectedText);
    
    // 이미 모달이 표시되어 있었는지 확인
    const wasHidden = textControlModal.classList.contains('hidden');
    textControlModal.classList.remove('hidden');
    
    // 처음 선택했거나 새 텍스트를 선택한 경우에만 위치 조정
    if (wasHidden) {
      positionModalNearText(selectedText);
    }
    
    renderCanvas(); // 선택 상태 시각적 표시를 위해 렌더링
    e.preventDefault();
  } else {
    // 빈 영역 클릭 시 선택 해제 및 모달 숨김
    selectedText = null;
    textControlModal.classList.add('hidden');
    renderCanvas();
  }
}

// 선택된 텍스트에 따라 모달 위치 조정
function positionModalNearText(textObj) {
  const canvasRect = canvas.getBoundingClientRect();
  const modalWidth = 280; // 모달 너비
  
  // 텍스트 위치를 화면 좌표로 변환
  const textScreenX = canvasRect.left + textObj.x;
  const textScreenY = canvasRect.top + textObj.y;
  
  // 텍스트 크기 계산
  ctx.font = `${textObj.size}px ${textObj.font}`;
  let textWidth, textHeight;
  
  if (textObj.direction === 'vertical') {
    textWidth = textObj.size;
    textHeight = textObj.text.length * textObj.size;
  } else {
    textWidth = ctx.measureText(textObj.text).width;
    textHeight = textObj.size;
  }
  
  // 모달 위치 계산 (텍스트 중앙 아래)
  let modalX = textScreenX + textWidth/2 - modalWidth/2;
  let modalY = textScreenY + textHeight + 20; // 텍스트 아래 20px 간격
  
  // 화면 경계 확인
  if (modalX < 10) modalX = 10;
  if (modalX + modalWidth > window.innerWidth - 10)
    modalX = window.innerWidth - modalWidth - 10;
  
  // 위치 적용
  textControlModal.style.left = `${modalX}px`;
  textControlModal.style.top = `${modalY}px`;
}

// 모달 컨트롤 값 업데이트
function updateModalControls(textObj) {
  modalFontFamily.value = textObj.font;
  modalFontSize.value = textObj.size;
  modalFontColor.value = textObj.color;
  modalOpacity.value = textObj.opacity;               // 추가: 불투명도
  modalLetterSpacing.value = textObj.letterSpacing || 0;  // 추가: 자간
  modalRotation.value = textObj.rotation;             // 추가: 회전
}

// 텍스트 이동 시 모달도 함께 이동
function handleMove(e) {
  if (!selectedText || !isDragging) return; // 드래그 중일 때만 이동
  const { x, y } = getEventPos(e);
  selectedText.x = x - dragOffset.x;
  selectedText.y = y - dragOffset.y;
  
  // 텍스트 드래그 시에만 모달 위치도 업데이트
  if (!textControlModal.classList.contains('hidden')) {
    positionModalNearText(selectedText);
  }
  
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

// 모달 컨트롤 이벤트 리스너
modalFontFamily.addEventListener('change', () => {
  if (!selectedText) return;
  selectedText.font = modalFontFamily.value;
  fontFamily.value = modalFontFamily.value;
  renderCanvas();
  // 모달 위치 조정 코드 제거
});

modalFontSize.addEventListener('input', () => {
  if (!selectedText) return;
  selectedText.size = parseInt(modalFontSize.value, 10);
  fontSize.value = modalFontSize.value;
  renderCanvas();
  // 모달 위치 조정 코드 제거 - 더 이상 위치 업데이트하지 않음
});

modalFontColor.addEventListener('input', () => {
  if (!selectedText) return;
  selectedText.color = modalFontColor.value;
  fontColor.value = modalFontColor.value;
  renderCanvas();
});

// 추가: 불투명도 이벤트 리스너
modalOpacity.addEventListener('input', () => {
  if (!selectedText) return;
  selectedText.opacity = parseFloat(modalOpacity.value);
  opacity.value = modalOpacity.value;
  renderCanvas();
});

// 추가: 자간 이벤트 리스너
modalLetterSpacing.addEventListener('input', () => {
  if (!selectedText) return;
  selectedText.letterSpacing = parseFloat(modalLetterSpacing.value);
  letterSpacing.value = modalLetterSpacing.value;
  renderCanvas();
});

// 추가: 회전 이벤트 리스너
modalRotation.addEventListener('input', () => {
  if (!selectedText) return;
  selectedText.rotation = parseFloat(modalRotation.value);
  rotation.value = modalRotation.value;
  renderCanvas();
  // 모달 위치 조정 코드 제거
});

modalCenterBtn.addEventListener('click', () => {
  if (!selectedText) return;
  
  // 기존 중앙 정렬 코드와 동일
  const canvasCenterX = canvas.width / 2;
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
  
  selectedText.x = canvasCenterX - textWidth / 2;
  
  renderCanvas();
  positionModalNearText(selectedText); // 위치 변경 후 모달 위치 조정
});

modalDeleteBtn.addEventListener('click', () => {
  if (!selectedText) return;
  textObjects = textObjects.filter(t => t !== selectedText);
  selectedText = null;
  textControlModal.classList.add('hidden');
  renderCanvas();
});

modalCloseBtn.addEventListener('click', () => {
  textControlModal.classList.add('hidden');
});

// 캔버스 외부 클릭 시 모달 닫기
document.addEventListener('mousedown', (e) => {
  if (!textControlModal.contains(e.target) && e.target !== canvas) {
    textControlModal.classList.add('hidden');
  }
});

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
    // iOS 디바이스에서는 새 창에 이미지 표시
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
            </style>
          </head>
          <body>
            <div class="instruction">
              <h3>이미지 저장 방법</h3>
              <p>아래 이미지를 길게 터치한 후 "이미지 저장"을 선택하세요.</p>
            </div>
            <img src="${dataUrl}" alt="편집된 이미지">
          </body>
        </html>
      `);
    } else {
      alert('팝업이 차단되었습니다. 브라우저 설정에서 팝업을 허용하거나 다른 브라우저에서 시도해주세요.');
    }
  } else {
    // 다른 기기에서는 기존 방식 사용
    const link = document.createElement('a');
    link.download = `${originalFileName}-edited.${fileExtension}`;
    link.href = dataUrl;
    link.click();
  }
});

