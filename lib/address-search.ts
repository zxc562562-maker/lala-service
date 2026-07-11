'use client';

// 카카오(다음) 우편번호 서비스 — API 키 없이 무료로 사용 가능.
// https://postcode.map.kakao.com/guide
const SCRIPT_SRC = 'https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js';

declare global {
  interface Window {
    daum?: {
      Postcode: new (options: {
        oncomplete: (data: { roadAddress: string; jibunAddress: string; address: string }) => void;
      }) => { open: () => void };
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
}

/** 주소 검색 팝업을 열고, 선택한 도로명·지번 주소를 onSelect로 전달한다. */
export async function openAddressSearch(onSelect: (result: AddressResult) => void) {
  try {
    await loadDaumPostcodeScript();
  } catch {
    alert('주소 검색 서비스를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.');
    return;
  }
  if (!window.daum?.Postcode) return;
  new window.daum.Postcode({
    oncomplete: (data) => onSelect({
      roadAddress: data.roadAddress || data.address,
      jibunAddress: data.jibunAddress || '',
    }),
  }).open();
}
