'use client';

// 카카오(다음) 우편번호 서비스 — API 키 없이 무료로 사용 가능.
// https://postcode.map.kakao.com/guide
const SCRIPT_SRC = 'https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js';

declare global {
  interface Window {
    daum?: {
      Postcode: new (options: {
        oncomplete: (data: { roadAddress: string; jibunAddress: string; address: string; zonecode: string }) => void;
        width?: string | number;
        height?: string | number;
      }) => { embed: (el: HTMLElement) => void };
    };
  }
}

let loadingPromise: Promise<void> | null = null;

function loadDaumPostcodeScript(): Promise<void> {
  if (typeof window !== 'undefined' && window.daum?.Postcode) return Promise.resolve();
  if (loadingPromise) return loadingPromise;
  loadingPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = SCRIPT_SRC;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('주소 검색 스크립트를 불러오지 못했습니다.'));
    document.head.appendChild(script);
  });
  return loadingPromise;
}

export interface AddressResult {
  roadAddress: string;
  jibunAddress: string;
  zonecode: string;
}

/**
 * 주소 검색 레이어를 연다. `window.open()` 팝업 창 대신 현재 페이지 위 오버레이에 위젯을
 * 직접 삽입(embed)한다 — 모바일 브라우저·인앱 웹뷰의 팝업 차단으로 검색창 자체가 아예
 * 안 뜨던 문제를 원천적으로 피하기 위함.
 */
export async function openAddressSearch(onSelect: (result: AddressResult) => void) {
  try {
    await loadDaumPostcodeScript();
  } catch {
    alert('주소 검색 서비스를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.');
    return;
  }
  if (!window.daum?.Postcode) return;

  const overlay = document.createElement('div');
  overlay.style.cssText = 'position:fixed;inset:0;z-index:1000;background:rgba(28,22,17,.45);display:flex;align-items:center;justify-content:center;padding:24px;';

  const box = document.createElement('div');
  box.style.cssText = 'position:relative;width:100%;max-width:420px;height:min(560px,80vh);background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 20px 50px rgba(0,0,0,.3);';

  const closeBtn = document.createElement('button');
  closeBtn.textContent = '✕';
  closeBtn.setAttribute('aria-label', '닫기');
  closeBtn.style.cssText = 'position:absolute;top:6px;right:8px;z-index:1;border:none;background:none;font-size:18px;line-height:1;color:#8B8085;cursor:pointer;padding:6px;';

  const layer = document.createElement('div');
  layer.style.cssText = 'width:100%;height:100%;';

  box.appendChild(closeBtn);
  box.appendChild(layer);
  overlay.appendChild(box);
  document.body.appendChild(overlay);

  function cleanup() {
    overlay.remove();
  }
  closeBtn.onclick = cleanup;
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) cleanup();
  });

  new window.daum.Postcode({
    oncomplete: (data) => {
      // 지번 주소·우편번호가 빈 값으로 오는 문제를 진단하기 위해 원본 응답을 콘솔에 남긴다.
      // (문제 재현 시 브라우저 개발자도구 콘솔에서 실제 API 응답 형태를 바로 확인 가능)
      console.log('[Lala] 주소 검색 원본 응답:', data);
      onSelect({
        roadAddress: data.roadAddress || data.address,
        jibunAddress: data.jibunAddress || '',
        zonecode: data.zonecode || '',
      });
      cleanup();
    },
  }).embed(layer);
}
