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
