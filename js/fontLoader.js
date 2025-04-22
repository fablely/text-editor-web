// js/fontLoader.js
export const fontFiles = [
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
  '배달의민족연성체.ttf',
  '배달의민족도현.ttf',
  '배달의민족을지로체.ttf',
  '배달의민족한나체Air.ttf',
  '배달의민족한나체Pro.ttf',
  '배달의민족주아체.ttf',
  '평창평화체.ttf'
];

// 폰트 로드 완료를 추적하기 위한 Promise 추가
export let fontsLoadedPromise;

export function loadFonts() {
  const statusDiv = document.createElement('div');
  statusDiv.id = 'fontLoadStatus';
  statusDiv.style.cssText = 'font-size:12px;color:#666;margin-top:5px;';
  const fontFamily = document.getElementById('fontFamily');
  const modalFontFamily = document.getElementById('modalFontFamily');
  fontFamily.parentNode.insertAdjacentElement('afterend', statusDiv);
  statusDiv.textContent = '폰트 로드 중...';

  let loadedCount = 0, failedCount = 0;
  const loadedFonts = [];

  // Promise로 폰트 로딩 완료 시점을 추적
  fontsLoadedPromise = new Promise((resolve) => {
    const promises = fontFiles.map(file => {
      const name = file.replace(/\.[^.]+$/, '');
      return new FontFace(name, `url(./Fonts/${encodeURIComponent(file)})`)
        .load()
        .then(face => {
          document.fonts.add(face);
          loadedFonts.push({ name, face });
        })
        .catch(() => { failedCount++; })
        .finally(() => {
          loadedCount++;
          statusDiv.textContent = `폰트 로드: ${loadedCount}개 성공, ${failedCount}개 실패`;
          if (loadedCount + failedCount === fontFiles.length) {
            loadedFonts.sort((a, b) => a.name.localeCompare(b.name, 'ko'));
            [fontFamily, modalFontFamily].forEach(select => {
              select.innerHTML = '';
              loadedFonts.forEach(f => {
                const opt = document.createElement('option');
                opt.value = f.name;
                opt.textContent = f.name;
                opt.style.fontFamily = f.name;
                select.append(opt);
              });
            });
            statusDiv.textContent = `폰트 로드 완료: ${loadedFonts.length}개`;
            setTimeout(() => statusDiv.remove(), 1800);
            
            // 모든 폰트 로딩 완료 후 resolve 호출
            resolve(loadedFonts);
          }
        });
    });
    
    // 모든 폰트가 실패해도 UI가 동작할 수 있도록 Promise.all 대신 일정 시간 후 resolve
    setTimeout(() => {
      if (loadedCount + failedCount < fontFiles.length) {
        console.warn('일부 폰트 로딩 타임아웃 발생');
        resolve(loadedFonts);
      }
    }, 5000);
  });

  // 로딩 중에도 기본 폰트를 추가하여 빈 드롭다운이 안 보이도록 함
  [fontFamily, modalFontFamily].forEach(select => {
    select.innerHTML = '<option value="sans-serif">기본 글꼴</option>';
  });
  
  return fontsLoadedPromise;
}