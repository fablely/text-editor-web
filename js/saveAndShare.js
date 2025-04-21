// js/saveAndShare.js
import { state } from './state.js';
import { renderCanvas } from './canvasRenderer.js';

export function initSaveAndShare() {
  document.getElementById('saveImageBtn').addEventListener('click', () => {
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = state.originalWidth;
    tempCanvas.height = state.originalHeight;
    const tempCtx = tempCanvas.getContext('2d');
    tempCtx.drawImage(state.img, 0, 0, state.originalWidth, state.originalHeight);

    state.textObjects.forEach(t => {
      tempCtx.save();
      
      // 위치 계산 수정: Y축 위치가 올바르게 변환되도록 보정
      const scaleX = state.originalWidth / state.canvasWidth;
      const scaleY = state.originalHeight / state.canvasHeight;
      
      // 수정된 변환: 텍스트 위치를 원본 비율에 맞게 정확히 변환
      tempCtx.translate(
        t.x * scaleX,
        t.y * scaleY
      );
      
      tempCtx.rotate((t.rotation * Math.PI) / 180);
      tempCtx.globalAlpha = t.opacity;
      
      // 폰트 크기도 비율에 맞게 정확히 스케일링
      const fontSize = t.size * scaleX; // X축 비율로 통일 또는 (scaleX + scaleY)/2 사용 가능
      tempCtx.font = `${fontSize}px ${t.font}`;
      tempCtx.fillStyle = t.color;
      tempCtx.textBaseline = 'top';

      const scaledSpacing = (t.letterSpacing || 0) * scaleX;
      if (t.direction === 'vertical') {
        for (let i = 0; i < t.text.length; i++) {
          tempCtx.fillText(
            t.text[i],
            0,
            i * (fontSize + scaledSpacing)
          );
        }
      } else {
        if (scaledSpacing) {
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
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = state.originalWidth;
      tempCanvas.height = state.originalHeight;
      const tempCtx = tempCanvas.getContext('2d');
      tempCtx.drawImage(state.img, 0, 0, state.originalWidth, state.originalHeight);

      state.textObjects.forEach(t => {
        tempCtx.save();
        
        // 위치 계산 수정: Y축 위치가 올바르게 변환되도록 보정
        const scaleX = state.originalWidth / state.canvasWidth;
        const scaleY = state.originalHeight / state.canvasHeight;
        
        // 수정된 변환: 텍스트 위치를 원본 비율에 맞게 정확히 변환
        tempCtx.translate(
          t.x * scaleX,
          t.y * scaleY
        );
        
        tempCtx.rotate((t.rotation * Math.PI) / 180);
        tempCtx.globalAlpha = t.opacity;
        
        // 폰트 크기도 비율에 맞게 정확히 스케일링
        const fontSize = t.size * scaleX; // X축 비율로 통일
        tempCtx.font = `${fontSize}px ${t.font}`;
        tempCtx.fillStyle = t.color;
        tempCtx.textBaseline = 'top';

        const scaledSpacing = (t.letterSpacing || 0) * scaleX;
        if (t.direction === 'vertical') {
          for (let i = 0; i < t.text.length; i++) {
            tempCtx.fillText(
              t.text[i],
              0,
              i * (fontSize + scaledSpacing)
            );
          }
        } else {
          if (scaledSpacing) {
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