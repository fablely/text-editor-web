// js/canvasRenderer.js
import { state } from './state.js';
import { getAllElements } from './layerControls.js';

export function renderCanvas() {
  const { ctx, canvas, img, canvasScale } = state;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  // 배경 이미지 그리기
  if (img.src) {
    const w = canvas.width / canvasScale;
    const h = canvas.height / canvasScale;
    ctx.drawImage(img, 0, 0, w, h);
  }
  
  // 모든 요소를 z-index 순서로 정렬하여 렌더링
  const allElements = getAllElements();
  
  allElements.forEach(item => {
    if (item.type === 'sticker') {
      renderSticker(item.element);
    } else if (item.type === 'text') {
      renderText(item.element);
    }
  });
}

// 스티커 렌더링 함수
function renderSticker(sticker) {
  const { ctx } = state;
  
  ctx.save();
  ctx.translate(sticker.x, sticker.y);
  ctx.rotate((sticker.rotation * Math.PI) / 180);
  ctx.globalAlpha = sticker.opacity;
  
  // 스티커 그리기 (중앙 정렬)
  ctx.drawImage(
    sticker.image,
    -sticker.width / 2,
    -sticker.height / 2,
    sticker.width,
    sticker.height
  );
  
  // 선택된 스티커에 테두리 효과 적용
  if (sticker === state.selectedElement) {
    const padding = 8;
    
    // 반투명 배경
    ctx.globalAlpha = 0.15;
    ctx.fillStyle = '#59b4ad';
    ctx.beginPath();
    ctx.roundRect(
      -sticker.width / 2 - padding,
      -sticker.height / 2 - padding,
      sticker.width + padding * 2,
      sticker.height + padding * 2,
      4
    );
    ctx.fill();
        
        // 테두리
        ctx.globalAlpha = 0.9;
        ctx.strokeStyle = '#59b4ad';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(
          -sticker.width / 2 - padding,
          -sticker.height / 2 - padding,
          sticker.width + padding * 2,
          sticker.height + padding * 2,
          4
        );
        ctx.stroke();
        
        // 크기 조정 핸들 (모서리)
        const cornerSize = 8;
        ctx.fillStyle = 'white';
        ctx.strokeStyle = '#59b4ad';
        ctx.lineWidth = 2;
        
        const corners = [
          { x: -sticker.width / 2 - padding, y: -sticker.height / 2 - padding, type: 'nw' },
          { x: sticker.width / 2 + padding, y: -sticker.height / 2 - padding, type: 'ne' },
          { x: -sticker.width / 2 - padding, y: sticker.height / 2 + padding, type: 'sw' },
          { x: sticker.width / 2 + padding, y: sticker.height / 2 + padding, type: 'se' }
        ];
        
        corners.forEach(corner => {
          ctx.beginPath();
          ctx.rect(corner.x - cornerSize/2, corner.y - cornerSize/2, cornerSize, cornerSize);
          ctx.fill();
          ctx.stroke();
        });
      }
      
      ctx.restore();
    });
  }
  
  // 텍스트 렌더링
  textObjects.forEach(t => {
    ctx.save();
    ctx.translate(t.x, t.y);
    ctx.rotate((t.rotation * Math.PI) / 180);
    ctx.globalAlpha = t.opacity;
    ctx.font = `${t.size}px ${t.font}`;
    ctx.textBaseline = 'top';
    ctx.fillStyle = t.color;

    const spacing = t.letterSpacing || 0;
    if (t.direction === 'vertical') {
      t.text.split('').forEach((ch, i) => {
        ctx.fillText(ch, 0, i * (t.size + spacing));
      });
    } else {
      if (spacing) {
        let xPos = 0;
        t.text.split('').forEach(ch => {
          ctx.fillText(ch, xPos, 0);
          xPos += ctx.measureText(ch).width + spacing;
        });
      } else {
        ctx.fillText(t.text, 0, 0);
      }
    }

    // 선택된 텍스트에 고급스러운 테두리 효과 적용
    if (t === state.selectedText) {
      let textWidth = t.direction === 'vertical'
        ? t.size
        : ctx.measureText(t.text).width + spacing * (t.text.length - 1);
      let textHeight = t.direction === 'vertical'
        ? t.text.length * (t.size + spacing)
        : t.size;
      
      // 패딩 추가 (더 작은 값으로 조정)
      const padding = Math.max(4, t.size * 0.08); // 패딩 값 축소
      
      // 반투명 배경 그리기
      ctx.globalAlpha = 0.15;
      ctx.fillStyle = '#59b4ad';
      ctx.beginPath();
      ctx.roundRect(-padding, -padding, textWidth + padding*2, textHeight + padding*2, padding/2);
      ctx.fill();
      
      // 테두리 그리기
      ctx.globalAlpha = 0.9;
      ctx.strokeStyle = '#59b4ad';
      ctx.lineWidth = 1.5; // 테두리 두께 약간 감소
      ctx.beginPath();
      ctx.roundRect(-padding, -padding, textWidth + padding*2, textHeight + padding*2, padding/2);
      ctx.stroke();
      
      // 모서리 포인트 그리기 (더 작게 조정)
      const cornerSize = Math.max(4, t.size * 0.07); // 모서리 크기 축소
      ctx.fillStyle = 'white';
      ctx.strokeStyle = '#59b4ad';
      ctx.lineWidth = 1; // 모서리 테두리 두께 감소
      
      // 코너 포인트를 텍스트 모서리에 더 가깝게 배치
      [
        [-padding/2, -padding/2], // 왼쪽 위
        [textWidth + padding/2, -padding/2], // 오른쪽 위
        [-padding/2, textHeight + padding/2], // 왼쪽 아래
        [textWidth + padding/2, textHeight + padding/2] // 오른쪽 아래
      ].forEach(([x, y]) => {
        ctx.beginPath();
        ctx.arc(x, y, cornerSize, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      });
    }
    ctx.restore();
  });
}

export function positionModalNearText(textObj) {
  const canvasRect = state.canvas.getBoundingClientRect();
  const modalWidth = 280;
  const textScreenX = canvasRect.left + textObj.x;
  const textScreenY = canvasRect.top + textObj.y;

  state.ctx.font = `${textObj.size}px ${textObj.font}`;
  let textWidth, textHeight;
  if (textObj.direction === 'vertical') {
    textWidth = textObj.size;
    textHeight = textObj.text.length * textObj.size;
  } else {
    textWidth = state.ctx.measureText(textObj.text).width;
    textHeight = textObj.size;
  }

  let modalX = textScreenX + textWidth / 2 - modalWidth / 2;
  let modalY = textScreenY + textHeight + 20;
  if (modalX < 10) modalX = 10;
  if (modalX + modalWidth > window.innerWidth - 10) {
    modalX = window.innerWidth - modalWidth - 10;
  }

  const modal = document.getElementById('textControlModal');
  modal.style.left = `${modalX}px`;
  modal.style.top = `${modalY}px`;
}

export function updateModalControls(textObj) {
  document.getElementById('modalTextContent').value = textObj.text;
  document.getElementById('modalFontFamily').value = textObj.font;
  
  // 모달 폰트 디스플레이 업데이트
  const modalFontDisplay = document.getElementById('modalFontDisplay');
  if (modalFontDisplay) {
    const fontFamily = document.getElementById('fontFamily');
    const option = Array.from(fontFamily.options).find(opt => opt.value === textObj.font);
    if (option) {
      modalFontDisplay.textContent = option.textContent;
      modalFontDisplay.style.fontFamily = option.value;
    }
  }
  
  document.getElementById('modalFontSize').value = textObj.size;
  document.getElementById('modalFontColor').value = textObj.color;
  document.getElementById('modalOpacity').value = textObj.opacity;
  document.getElementById('modalLetterSpacing').value = textObj.letterSpacing || 0;
  document.getElementById('modalRotation').value = textObj.rotation;
  document.getElementById('modalTextDirection').value = textObj.direction;
  
  // 수치 표시 업데이트
  const modalFontSizeValue = document.getElementById('modalFontSizeValue');
  if (modalFontSizeValue) {
    modalFontSizeValue.textContent = textObj.size;
  }
  
  const modalOpacityValue = document.getElementById('modalOpacityValue');
  if (modalOpacityValue) {
    modalOpacityValue.textContent = textObj.opacity.toFixed(1);
  }
  
  const modalLetterSpacingValue = document.getElementById('modalLetterSpacingValue');
  if (modalLetterSpacingValue) {
    modalLetterSpacingValue.textContent = (textObj.letterSpacing || 0).toFixed(1);
  }
  
  const modalRotationValue = document.getElementById('modalRotationValue');
  if (modalRotationValue) {
    modalRotationValue.textContent = textObj.rotation + '°';
  }
}

export function updateControlsFromText(textObj) {
  document.getElementById('textInput').value = textObj.text;
  document.getElementById('fontFamily').value = textObj.font;
  document.getElementById('fontSize').value = textObj.size;
  document.getElementById('fontColor').value = textObj.color;
  document.getElementById('opacity').value = textObj.opacity;
  document.getElementById('rotation').value = textObj.rotation;
  document.getElementById('textDirection').value = textObj.direction;
  document.getElementById('letterSpacing').value = textObj.letterSpacing || 0;
}

export function findTextAtPosition(x, y) {
  for (let i = state.textObjects.length - 1; i >= 0; i--) {
    const t = state.textObjects[i];
    state.ctx.save();
    state.ctx.font = `${t.size}px ${t.font}`;
    state.ctx.textBaseline = 'top';

    let textWidth, textHeight;
    const spacing = t.letterSpacing || 0;
    
    if (t.direction === 'vertical') {
      textWidth = t.size;
      textHeight = t.text.length * (t.size + spacing);
    } else {
      textWidth = state.ctx.measureText(t.text).width + spacing * (t.text.length - 1);
      textHeight = t.size;
    }
    
    // 패딩 추가 (선택 영역을 조금 더 넓게 인식하기 위함)
    const padding = Math.max(8, t.size * 0.15);
    textWidth += padding * 2;
    textHeight += padding * 2;

    const dx = x - t.x + padding; // 패딩만큼 보정
    const dy = y - t.y + padding; // 패딩만큼 보정
    const angle = (-t.rotation * Math.PI) / 180;
    const rotatedX = dx * Math.cos(angle) - dy * Math.sin(angle);
    const rotatedY = dx * Math.sin(angle) + dy * Math.cos(angle);
    state.ctx.restore();

    if (
      rotatedX >= 0 && rotatedX <= textWidth &&
      rotatedY >= 0 && rotatedY <= textHeight
    ) {
      return t;
    }
  }
  return null;
}

// 스티커 검색 함수 추가
export function findStickerAtPosition(x, y) {
  if (!state.stickers) return null;
  
  for (let i = state.stickers.length - 1; i >= 0; i--) {
    const sticker = state.stickers[i];
    
    const dx = x - sticker.x;
    const dy = y - sticker.y;
    const angle = (-sticker.rotation * Math.PI) / 180;
    const rotatedX = dx * Math.cos(angle) - dy * Math.sin(angle);
    const rotatedY = dx * Math.sin(angle) + dy * Math.cos(angle);

    const halfWidth = sticker.width / 2;
    const halfHeight = sticker.height / 2;
    
    if (
      rotatedX >= -halfWidth && rotatedX <= halfWidth &&
      rotatedY >= -halfHeight && rotatedY <= halfHeight
    ) {
      return sticker;
    }
  }
  return null;
}

// 위치에서 요소 찾기 (텍스트 또는 스티커)
export function findElementAtPosition(x, y) {
  // 스티커를 먼저 확인 (위에 있으므로)
  const sticker = findStickerAtPosition(x, y);
  if (sticker) {
    return { element: sticker, type: 'sticker' };
  }
  
  // 텍스트 확인
  const text = findTextAtPosition(x, y);
  if (text) {
    return { element: text, type: 'text' };
  }
  
  return null;
}

// 스티커의 크기 조정 핸들 감지
export function findStickerResizeHandle(x, y) {
  if (!state.selectedElement || state.selectedElementType !== 'sticker') return null;
  
  const sticker = state.selectedElement;
  const padding = 8;
  const cornerSize = 8;
  
  const corners = [
    { 
      x: sticker.x - sticker.width / 2 - padding, 
      y: sticker.y - sticker.height / 2 - padding, 
      type: 'nw' 
    },
    { 
      x: sticker.x + sticker.width / 2 + padding, 
      y: sticker.y - sticker.height / 2 - padding, 
      type: 'ne' 
    },
    { 
      x: sticker.x - sticker.width / 2 - padding, 
      y: sticker.y + sticker.height / 2 + padding, 
      type: 'sw' 
    },
    { 
      x: sticker.x + sticker.width / 2 + padding, 
      y: sticker.y + sticker.height / 2 + padding, 
      type: 'se' 
    }
  ];
  
  for (const corner of corners) {
    if (
      x >= corner.x - cornerSize / 2 && 
      x <= corner.x + cornerSize / 2 &&
      y >= corner.y - cornerSize / 2 && 
      y <= corner.y + cornerSize / 2
    ) {
      return corner.type;
    }
  }
  
  return null;
}