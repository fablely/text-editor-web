// js/fontLoader.js
// 폰트는 시작 시 전부 받지 않고, 실제로 필요할 때(미리보기/선택/저장 직전) 1회만 로드합니다.
import { warn, error } from './logger.js';

// 커스텀 폰트 이름 목록 (캔버스 fontFamily == Fonts/<이름>.woff2)
export const fontNames = [
  '강원교육모두',
  '강원교육새음',
  '강원교육현옥샘',
  '더페이스샵',
  '마포꽃섬',
  '바른히피',
  '배달의민족도현체',
  '배달의민족연성체',
  '배달의민족을지로체',
  '배달의민족주아체',
  '배달의민족한나체Air',
  '배달의민족한나체Pro',
  '빙그레싸만코',
  '상상토끼꽃길',
  '평창평화체',
  '학교안심여행',
  '학교안심우산',
  '학교안심우주'
];

// 커스텀 폰트 이름 집합 (멤버십 조회용)
const customFontSet = new Set(fontNames);

// 이름별 로드 Promise 캐시 (중복 네트워크 요청 방지)
const loadingCache = new Map();

// 해당 이름이 별도 다운로드가 필요한 커스텀 폰트인지 여부
export function isCustomFont(name) {
  return customFontSet.has(name);
}

// 폰트 한 개를 보장 로드. 기본/구글 폰트는 즉시 통과.
export function ensureFontLoaded(name) {
  if (!name || !customFontSet.has(name)) {
    // 'sans-serif', 'Inter, sans-serif' 등은 받을 필요 없음
    return Promise.resolve(true);
  }

  if (loadingCache.has(name)) {
    return loadingCache.get(name);
  }

  const promise = (async () => {
    try {
      // woff2만 사용 (모든 현대 브라우저/모바일 지원). ttf 폴백을 두면 일부
      // 브라우저가 원본 ttf까지 추가로 받아버려 오히려 손해이므로 제외.
      const base = encodeURIComponent(name);
      const face = new FontFace(name, `url(./Fonts/${base}.woff2) format('woff2')`);
      await face.load();
      document.fonts.add(face);
      return true;
    } catch (e) {
      warn(`${name} 폰트 로드 실패:`, e && e.message);
      // 실패는 캐시에서 제거하여 다음 시도 때 재요청 가능하도록
      loadingCache.delete(name);
      return false;
    }
  })();

  loadingCache.set(name, promise);
  return promise;
}

// 여러 폰트를 한 번에 보장 로드 (저장/공유 직전 사용)
export function ensureFontsLoaded(names) {
  const unique = [...new Set((names || []).filter(Boolean))];
  return Promise.all(unique.map(ensureFontLoaded));
}
