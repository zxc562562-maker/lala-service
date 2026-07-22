'use server';

import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { supabaseServer } from '@lala/shared/lib/supabase/server';

/** 로그아웃 (헤더의 form action으로 호출) */
export async function signOut() {
  const sb = await supabaseServer();
  await sb.auth.signOut();
  (await cookies()).delete('lala_remember');
  redirect('/');
}
