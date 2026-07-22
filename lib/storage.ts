import 'server-only';
import { supabaseAdmin } from './supabase/server';

const PACKAGING_PHOTO_BUCKET = 'packaging-photos';
const SIGNED_URL_TTL_SECONDS = 60 * 60; // 1시간

/** 패키징 사진 하나의 서명 URL 발급(주문 상세 페이지처럼 한 건만 필요할 때). */
export async function getPackagingPhotoUrl(path: string | null): Promise<string | null> {
  if (!path) return null;
  const sb = supabaseAdmin();
  const { data } = await sb.storage.from(PACKAGING_PHOTO_BUCKET).createSignedUrl(path, SIGNED_URL_TTL_SECONDS);
  return data?.signedUrl ?? null;
}

/** 여러 건의 패키징 사진 서명 URL을 한 번에 발급(관리자 주문 목록처럼 여러 건을 나열할 때). */
export async function getPackagingPhotoUrls(paths: string[]): Promise<Map<string, string>> {
  const result = new Map<string, string>();
  if (paths.length === 0) return result;
  const sb = supabaseAdmin();
  const { data } = await sb.storage.from(PACKAGING_PHOTO_BUCKET).createSignedUrls(paths, SIGNED_URL_TTL_SECONDS);
  for (const item of data ?? []) {
    if (item.signedUrl && item.path) result.set(item.path, item.signedUrl);
  }
  return result;
}

export { PACKAGING_PHOTO_BUCKET };
