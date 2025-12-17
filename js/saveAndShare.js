// js/saveAndShare.js
import { state } from './state.js';
import { getAllElements } from './utils.js';
import { renderCanvas } from './canvasRenderer.js';

// 이미지 렌더링을 위한 공통 함수 추출 (코드 중복 제거)
function renderTextToCanvas(tempCtx, scaleX, scaleY, textElement) {
  tempCtx.save();

  // 위치를 원본 비율에 맞게 정확히 변환
  tempCtx.translate(textElement.x * scaleX, textElement.y * scaleY);

  tempCtx.rotate((textElement.rotation * Math.PI) / 180);
  tempCtx.globalAlpha = textElement.opacity;

  // 폰트 크기도 비율에 맞게 정확히 스케일링
  const fontSize = textElement.size * scaleX; // X축 비율로 통일
  tempCtx.font = `${fontSize}px "${textElement.fontFamily}"`;
  tempCtx.fillStyle = textElement.color;
  tempCtx.textBaseline = 'top';

  const scaledSpacing = (textElement.letterSpacing || 0) * scaleX;
  if (textElement.direction === 'vertical') {
    for (let i = 0; i < textElement.text.length; i++) {
      tempCtx.fillText(textElement.text[i], 0, i * (fontSize + scaledSpacing));
    }
  } else {
    if (scaledSpacing) {
      let xPos = 0;
      for (let i = 0; i < textElement.text.length; i++) {
        tempCtx.fillText(textElement.text[i], xPos, 0);
        xPos += tempCtx.measureText(textElement.text[i]).width + scaledSpacing;
      }
    } else {
      tempCtx.fillText(textElement.text, 0, 0);
    }
  }
  tempCtx.restore();
}

// 스티커 렌더링 함수
function renderStickerToCanvas(tempCtx, scaleX, scaleY, stickerElement) {
  if (stickerElement.image && stickerElement.image.complete) {
    tempCtx.save();

    // 스티커 중심점으로 이동 (캔버스 렌더링과 동일)
    tempCtx.translate(stickerElement.x * scaleX, stickerElement.y * scaleY);

    // 회전 적용
    tempCtx.rotate((stickerElement.rotation * Math.PI) / 180);

    // 투명도 적용
    tempCtx.globalAlpha = stickerElement.opacity;

    // 색상 필터 적용 (스티커에 colorFilter 속성이 있을 경우)
    if (stickerElement.colorFilter && stickerElement.colorFilter.filter) {
      tempCtx.filter = stickerElement.colorFilter.filter;
    }

    const scaledWidth = stickerElement.width * scaleX;
    const scaledHeight = stickerElement.height * scaleY;

    if (stickerElement.color) {
      // 색상이 지정된 경우 (offscreen canvas를 사용하여 tinting - 원본 해상도 유지)
      const offscreenCanvas = document.createElement('canvas');
      offscreenCanvas.width = stickerElement.image.width;
      offscreenCanvas.height = stickerElement.image.height;
      const offCtx = offscreenCanvas.getContext('2d');

      // 1. 원본 이미지 그리기
      offCtx.drawImage(stickerElement.image, 0, 0);

      // 2. 소스 그리기 모드로 색상 입히기
      offCtx.globalCompositeOperation = 'source-in';
      offCtx.fillStyle = stickerElement.color;
      offCtx.fillRect(0, 0, offscreenCanvas.width, offscreenCanvas.height);

      // 3. 틴트된 이미지를 스케일 맞춰 그리기
      tempCtx.drawImage(
        offscreenCanvas,
        -scaledWidth / 2,
        -scaledHeight / 2,
        scaledWidth,
        scaledHeight
      );
    } else {
      // 일반 스티커 그리기
      tempCtx.drawImage(
        stickerElement.image,
        -scaledWidth / 2,
        -scaledHeight / 2,
        scaledWidth,
        scaledHeight
      );
    }

    // filter 초기화
    tempCtx.filter = 'none';

    tempCtx.restore();
  }
}

// 공통 캔버스 생성 함수
function createTempCanvas() {
  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = state.originalWidth;
  tempCanvas.height = state.originalHeight;
  const tempCtx = tempCanvas.getContext('2d');
  tempCtx.drawImage(state.img, 0, 0, state.originalWidth, state.originalHeight);

  const scaleX = state.originalWidth / state.canvasWidth;
  const scaleY = state.originalHeight / state.canvasHeight;

  // 모든 요소를 z-index 순서대로 렌더링
  const allElements = getAllElements();

  allElements.forEach(item => {
    if (item.type === 'sticker') {
      renderStickerToCanvas(tempCtx, scaleX, scaleY, item.element);
    } else if (item.type === 'text') {
      renderTextToCanvas(tempCtx, scaleX, scaleY, item.element);
    }
  });

  return { tempCanvas, scaleX, scaleY };
}

export function initSaveAndShare() {
  document.getElementById('saveImageBtn').addEventListener('click', () => {
    const { tempCanvas } = createTempCanvas();

    let mimeType = 'image/jpeg';
    let fileExtension = 'jpg';
    if (state.originalFileExt === 'png') {
      mimeType = 'image/png';
      fileExtension = 'png';
    } else if (state.originalFileExt === 'jpg' || state.originalFileExt === 'jpeg') {
      mimeType = 'image/jpeg';
      fileExtension = state.originalFileExt;
    }
    const quality = fileExtension === 'png' ? 1.0 : 0.92;
    const dataUrl = tempCanvas.toDataURL(mimeType, quality);

    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    if (isIOS) {
      const downloadWindow = window.open('');
      if (downloadWindow) {
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
        alert('팝업이 차단되었습니다. 브라우저 설정에서 팝업을 허용해주세요.');
      }
    } else {
      const link = document.createElement('a');
      link.download = `${state.originalFileName}-edited.${fileExtension}`;
      link.href = dataUrl;
      link.click();
    }
  });

  document.getElementById('shareImageBtn').addEventListener('click', async () => {
    if (!navigator.share) {
      alert('죄송합니다. 이 브라우저에서는 공유 기능을 지원하지 않습니다.');
      return;
    }
    try {
      const { tempCanvas } = createTempCanvas();

      let mimeType = 'image/jpeg';
      let fileExtension = 'jpg';
      if (state.originalFileExt === 'png') {
        mimeType = 'image/png';
        fileExtension = 'png';
      } else if (state.originalFileExt === 'jpg' || state.originalFileExt === 'jpeg') {
        fileExtension = state.originalFileExt;
      }
      const quality = fileExtension === 'png' ? 1.0 : 1.0;
      const blob = await new Promise(resolve => tempCanvas.toBlob(resolve, mimeType, quality));
      const file = new File([blob], `${state.originalFileName}-edited.${fileExtension}`, { type: mimeType });

      await navigator.share({
        title: '페이블리 이미지',
        text: '텍스트가 추가된 이미지를 공유합니다.',
        files: [file]
      });
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('공유 중 오류 발생:', error);
        alert('이미지 공유 중 문제가 발생했습니다.');
      }
    }
  });
}