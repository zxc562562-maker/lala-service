'use server';

import { supabaseAdmin } from '@lala/shared/lib/supabase/server';
import { idToAuthEmail } from '@lala/shared/lib/username';

/**
 * ID(가상 이메일) 기반 회원가입.
 * Supabase 대시보드의 "Confirm email" 설정 위치/여부와 무관하게 동작하도록,
 * 클라이언트의 auth.signUp() 대신 관리자 API(auth.admin.createUser)로 계정을
 * 만들면서 email_confirm:true 를 명시해 "이미 확인된 이메일"로 생성한다.
 * (가상 이메일이라 어차피 실제 확인 메일을 받을 수 없기 때문)
 */
export async function createAccountById(
  id: string,
  password: string,
  name: string,
  phone: string,
): Promise<{ ok: true } | { ok: false; reason: string }> {
  const sb = supabaseAdmin();
  const { error } = await sb.auth.admin.createUser({
    email: idToAuthEmail(id),
    password,
    email_confirm: true, // 확인 절차 없이 즉시 확정 처리
    user_metadata: { name, phone, username: id },
  });
  if (error) {
    if (/already registered|already exists|duplicate/i.test(error.message)) {
      return { ok: false, reason: '이미 사용 중인 ID입니다.' };
    }
    return { ok: false, reason: error.message };
  }
  return { ok: true };
}
