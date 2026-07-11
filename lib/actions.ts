'use server';

import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { supabaseServer } from './supabase/server';

/** 로그아웃 (헤더의 form action으로 호출) */
export async function signOut() {
  const sb = supabaseServer();
  await sb.auth.signOut();
  cookies().delete('lala_remember');
  redirect('/');
}
