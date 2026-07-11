/**
 * Supabase Auth는 이메일(또는 전화번호) 기반으로만 가입/로그인이 된다.
 * "이메일이 아닌 ID"로 가입·로그인하게 하기 위해, 사용자가 고른 ID를
 * 내부적으로만 쓰이는 가상 이메일(実 수신 불가)로 변환해 Auth에 넘긴다.
 * 화면/DB에는 항상 실제 ID만 노출한다.
 */
export const ID_EMAIL_DOMAIN = 'users.lala.internal';

export function isValidUsername(id: string): boolean {
  return /^[a-zA-Z0-9_.]{6,20}$/.test(id);
}

/** 영문/숫자/특수문자 중 2종류 이상 조합 + 10자 이상 */
export function isValidPassword(pw: string): boolean {
  if (pw.length < 10) return false;
  const hasAlpha = /[a-zA-Z]/.test(pw);
  const hasDigit = /[0-9]/.test(pw);
  const hasSpecial = /[^a-zA-Z0-9]/.test(pw);
  return [hasAlpha, hasDigit, hasSpecial].filter(Boolean).length >= 2;
}

/** ID -> Supabase Auth용 가상 이메일 (실제 수신 불가한 내부 전용 도메인) */
export function idToAuthEmail(id: string): string {
  return `${id.toLowerCase()}@${ID_EMAIL_DOMAIN}`;
}
