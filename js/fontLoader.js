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

export let fontsLoadedPromise;

export function loadFonts() {
  const statusDiv = document.createElement('div');
  statusDiv.id = 'fontLoadStatus';
  statusDiv.style.cssText = 'font-size:12px;color:#666;margin-top:5px;background-color:#f2f2f7;padding:4px 8px;border-radius:4px;text-align:center;';
  const fontFamily = document.getElementById('fontFamily');
  const modalFontFamily = document.getElementById('modalFontFamily');
  
  if (fontFamily && fontFamily.parentNode) {
    fontFamily.parentNode.insertAdjacentElement('afterend', statusDiv);
  }
  
  statusDiv.textContent = '폰트 로드 중...';

  let loadedCount = 0, failedCount = 0;
  const loadedFonts = [];
  
  // 기본 폰트 먼저 추가 (폰트 로딩에 실패해도 기본 기능이 동작하도록)
  loadedFonts.push({ name: 'sans-serif', face: null });

  // Promise로 폰트 로딩 완료 시점을 추적
  fontsLoadedPromise = new Promise((resolve) => {
    // 폰트 파일이 없는 경우를 대비
    if (fontFiles.length === 0) {
      console.log('폰트 파일이 없습니다. 기본 폰트만 사용합니다.');
      updateFontSelects(loadedFonts, fontFamily, modalFontFamily, statusDiv);
      resolve(loadedFonts);
      return;
    }
    
    // 개별 폰트 로딩 제한 시간 설정 (3초)
    const fontPromises = fontFiles.map(file => {
      const name = file.replace(/\.[^.]+$/, '');
      
      return Promise.race([
        new FontFace(name, `url(./Fonts/${encodeURIComponent(file)})`)
          .load()
          .then(face => {
            document.fonts.add(face);
            loadedFonts.push({ name, face });
          }),
        new Promise(resolve => setTimeout(resolve, 3000)) // 개별 폰트 타임아웃
      ])
      .catch(() => { 
        failedCount++; 
        console.warn(`${name} 폰트 로드 실패`);
      })
      .finally(() => {
        loadedCount++;
        statusDiv.textContent = `폰트 로드: ${loadedCount}개 성공, ${failedCount}개 실패`;
        
        // 모든 폰트 로드 시도가 완료되면 선택기 업데이트
        if (loadedCount + failedCount === fontFiles.length) {
          updateFontSelects(loadedFonts, fontFamily, modalFontFamily, statusDiv);
          resolve(loadedFonts);
        }
      });
    });
    
    // 전체 폰트 로딩 제한 시간 (5초)
    setTimeout(() => {
      if (loadedCount + failedCount < fontFiles.length) {
        statusDiv.textContent = `폰트 로드: 일부만 완료됨 (${loadedCount}/${fontFiles.length})`;
        updateFontSelects(loadedFonts, fontFamily, modalFontFamily, statusDiv);
        console.warn('폰트 로딩 타임아웃 - 일부 폰트만 사용 가능합니다');
        resolve(loadedFonts);
      }
    }, 5000);
  });

  // 로딩 중에도 기본 폰트를 추가하여 빈 드롭다운이 안 보이도록 함
  [fontFamily, modalFontFamily].forEach(select => {
    if (select) {
      select.innerHTML = '<option value="sans-serif">기본 글꼴</option>';
    }
  });
  
  return fontsLoadedPromise;
}

// 폰트 선택기 업데이트 함수 (중복 코드 제거)
function updateFontSelects(loadedFonts, fontFamily, modalFontFamily, statusDiv) {
  // 폰트 이름으로 정렬
  loadedFonts.sort((a, b) => a.name.localeCompare(b.name, 'ko'));
  
  // 선택기 업데이트 (존재하는 경우에만)
  [fontFamily, modalFontFamily].forEach(select => {
    if (!select) return;
    
    select.innerHTML = ''; // 기존 옵션 제거
    loadedFonts.forEach(f => {
      const opt = document.createElement('option');
      opt.value = f.name;
      opt.textContent = f.name;
      opt.style.fontFamily = f.name;
      select.append(opt);
    });
  });
  
  // 상태 표시 후 제거
  statusDiv.textContent = `폰트 로드 완료: ${loadedFonts.length - 1}개`;  // 기본 폰트 1개 제외
  setTimeout(() => {
    try {
      statusDiv.remove();
    } catch (e) {
      console.warn('폰트 로드 상태 요소를 제거할 수 없습니다:', e);
    }
  }, 1800);
}