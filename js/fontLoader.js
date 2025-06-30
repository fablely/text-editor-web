// js/fontLoader.js
export const fontFiles = [
  '강원교육모두.ttf',
  '강원교육새음.ttf',
  '강원교육현옥샘.ttf',
  '더페이스샵.ttf',
  '마포꽃섬.ttf',
  '바른히피.ttf',
  '배달의민족도현체.ttf',
  '배달의민족연성체.ttf',
  '배달의민족을지로체.ttf',
  '배달의민족주아체.ttf',
  '배달의민족한나체Air.ttf',
  '배달의민족한나체Pro.ttf',
  '빙그레싸만코.ttf',
  '상상토끼꽃길.ttf',
  '평창평화체.ttf',
  '학교안심여행.ttf',
  '학교안심우산.ttf',
  '학교안심우주.ttf'
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
    
    // 개별 폰트 로딩 - 더 안정적인 방법
    const fontPromises = fontFiles.map((file, index) => {
      const name = file.replace(/\.[^.]+$/, '');
      
      return new Promise((resolveFont) => {
        // 개별 폰트 타임아웃 (2초로 단축)
        const timeoutId = setTimeout(() => {
          failedCount++;
          console.warn(`${name} 폰트 로드 타임아웃`);
          resolveFont(null);
        }, 2000);
        
        try {
          const fontFace = new FontFace(name, `url(./Fonts/${encodeURIComponent(file)})`);
          
          // 폰트 로드 전에 파일 존재 여부 간접 확인
          fontFace.load()
            .then(face => {
              clearTimeout(timeoutId);
              document.fonts.add(face);
              loadedFonts.push({ name, face });
              console.log(`✅ ${name} 폰트 로드 성공`);
              resolveFont(face);
            })
            .catch(error => {
              clearTimeout(timeoutId);
              failedCount++;
              console.warn(`${name} 폰트 로드 실패:`, error.message || '파일을 찾을 수 없음');
              resolveFont(null);
            });
            
        } catch (error) {
          clearTimeout(timeoutId);
          failedCount++;
          console.warn(`${name} 폰트 생성 실패:`, error.message);
          resolveFont(null);
        }
      }).finally(() => {
        loadedCount++;
        const successCount = loadedFonts.length - 1; // 기본 폰트 제외
        statusDiv.textContent = `폰트 로드: ${successCount}개 성공, ${failedCount}개 실패 (${loadedCount}/${fontFiles.length})`;
        
        // 모든 폰트 로드 시도가 완료되면 선택기 업데이트
        if (loadedCount === fontFiles.length) {
          updateFontSelects(loadedFonts, fontFamily, modalFontFamily, statusDiv);
          resolve(loadedFonts);
        }
      });
    });
    
    // 전체 폰트 로딩 제한 시간 (4초로 단축)
    setTimeout(() => {
      if (loadedCount < fontFiles.length) {
        const remainingCount = fontFiles.length - loadedCount;
        failedCount += remainingCount;
        loadedCount = fontFiles.length;
        
        statusDiv.textContent = `폰트 로드: 타임아웃 (${loadedFonts.length - 1}/${fontFiles.length})`;
        updateFontSelects(loadedFonts, fontFamily, modalFontFamily, statusDiv);
        console.warn(`폰트 로딩 전체 타임아웃 - ${remainingCount}개 폰트 로딩 포기`);
        resolve(loadedFonts);
      }
    }, 4000);
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