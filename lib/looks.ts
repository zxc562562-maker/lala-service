import { unstable_cache } from 'next/cache';
import { supabaseAdmin } from '@lala/shared/lib/supabase/server';
import { getLookImageUrl } from '@lala/shared/lib/storage';

export interface LookImage { url: string }

export interface Look {
  id: string;
  title: string;
  cat: string;   // 성격(occasion)
  desc: string;
  coverUrl: string | null; // 목록 카드용
  images: LookImage[];     // 상세 페이지 갤러리(최대 6장)
  items: string[];         // 구성 상품명(product.name) — 사이즈별 재고 조회는 이 이름 기준으로 이뤄짐
}

export const MAX_LOOK_IMAGES = 6;

interface LookRow {
  id: string; title: string; cat: string; description: string; cover_path: string | null;
  look_image: { path: string; position: number }[];
  look_item: { position: number; product: { name: string } | null }[];
}

function mapLook(r: LookRow): Look {
  const images = [...(r.look_image ?? [])]
    .sort((a, b) => a.position - b.position)
    .map((i) => ({ url: getLookImageUrl(i.path)! }));
  const items = [...(r.look_item ?? [])]
    .sort((a, b) => a.position - b.position)
    .filter((i) => i.product)
    .map((i) => i.product!.name);
  return {
    id: r.id, title: r.title, cat: r.cat, desc: r.description,
    coverUrl: getLookImageUrl(r.cover_path),
    images, items,
  };
}

const LOOK_SELECT = 'id,title,cat,description,cover_path,look_image(path,position),look_item(position,product:product_id(name))';

// 룩 목록도 상품 카탈로그와 마찬가지로 모든 방문자에게 동일한 공개 데이터라 30초 캐시한다
// (queries.ts의 getProducts와 같은 이유 — 동시접속 시 매번 실 DB 조회로 느려지는 걸 방지).
async function fetchLooks(): Promise<Look[]> {
  const sb = supabaseAdmin();
  const { data, error } = await sb.from('look').select(LOOK_SELECT).order('created_at', { ascending: false });
  if (error || !data) return [];
  return (data as unknown as LookRow[]).map(mapLook);
}
export const getLooks = unstable_cache(fetchLooks, ['catalog-looks'], { revalidate: 30 });

async function fetchLook(id: string): Promise<Look | null> {
  const sb = supabaseAdmin();
  const { data, error } = await sb.from('look').select(LOOK_SELECT).eq('id', id).maybeSingle();
  if (error || !data) return null;
  return mapLook(data as unknown as LookRow);
}
export const getLook = unstable_cache(fetchLook, ['catalog-look'], { revalidate: 30 });

/** 상세 페이지 갤러리용 이미지 목록. 갤러리가 비어 있으면 커버 1장으로 대체. */
export function getLookImages(look: Look): LookImage[] {
  if (look.images.length > 0) return look.images;
  return look.coverUrl ? [{ url: look.coverUrl }] : [];
}
