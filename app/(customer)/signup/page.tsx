'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { supabaseBrowser } from '@lala/shared/lib/supabase/client';
import { registerMembership, isUsernameAvailable } from '@lala/shared/lib/roles-actions';
import { createAccountById } from '@/lib/auth-actions';
import { idToAuthEmail, isValidUsername, isValidPassword } from '@/lib/username';
import { TERMS_OF_SERVICE, PRIVACY_POLICY, MARKETING_CONSENT_DETAIL } from '@/lib/legal-content';
import { checkPhoneVerifyRateLimit } from '@/lib/phone-verify-actions';

function SignupForm() {
  const next = useSearchParams().get('next') || '/';
  const [id, setId] = useState('');
  const [idChecked, setIdChecked] = useState(false);
  const [idAvailable, setIdAvailable] = useState<boolean | null>(null);
  const [idCheckMsg, setIdCheckMsg] = useState<string | null>(null);
  const [idChecking, setIdChecking] = useState(false);
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [legalOpen, setLegalOpen] = useState<'terms' | 'privacy' | 'marketing' | null>(null);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [agreePrivacy, setAgreePrivacy] = useState(false);
  const [agreeMarketing, setAgreeMarketing] = useState(false);
  const agreeAll = agreeTerms && agreePrivacy && agreeMarketing;
  function toggleAgreeAll(checked: boolean) {
    setAgreeTerms(checked); setAgreePrivacy(checked); setAgreeMarketing(checked);
  }
  const [busy, setBusy] = useState(false);
  const [showMarketingNudge, setShowMarketingNudge] = useState(false);
  const [marketingNudgeShown, setMarketingNudgeShown] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [snsMsg, setSnsMsg] = useState<string | null>(null);

  const [codeSent, setCodeSent] = useState(false);
  const [code, setCode] = useState('');
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [phoneStatus, setPhoneStatus] = useState<string | null>(null);

  function snsMock(provider: string) {
    setSnsMsg(`${provider} 간편가입은 준비 중이에요. 곧 지원할 예정입니다.`);
  }
  async function checkId() {
    if (!isValidUsername(id)) { setIdCheckMsg('ID는 영문/숫자 6~20자로 입력해주세요.'); setIdAvailable(false); setIdChecked(false); return; }
    setIdChecking(true);
    const available = await isUsernameAvailable(id);
    setIdChecking(false);
    setIdChecked(true);
    setIdAvailable(available);
    setIdCheckMsg(available ? '사용 가능한 ID입니다.' : '이미 사용 중인 ID입니다.');
  }
  async function requestPhoneCode() {
    if (!phone.trim()) { setPhoneStatus('전화번호를 먼저 입력해주세요.'); return; }

    // 어뷰징 방지: 같은 번호로 하루 5회까지만 시도 허용 (실제 인증 벤더 호출 전에 반드시 통과해야 함)
    const guard = await checkPhoneVerifyRateLimit(phone);
    if (!guard.ok) { setPhoneStatus(guard.reason); return; }

    // TODO: 여기서 실제 본인인증 벤더(예: 포트원 통합인증) API를 호출해 카카오/네이버 등으로 인증 요청.
    // 지금은 UI 흉내 단계 — 벤더 연동 시 이 자리를 교체.
    setCodeSent(true);
    setPhoneStatus('인증번호를 보냈어요. (데모: 아무 번호나 입력해도 확인됩니다)');
  }
  function confirmPhoneCode() {
    if (!code.trim()) { setPhoneStatus('인증번호를 입력해주세요.'); return; }
    setPhoneVerified(true);
    setCodeSent(false);
    setPhoneStatus(null);
  }

  async function submit() {
    setErr(null); setMsg(null);
    if (!id || !password || !name) { setErr('ID, 비밀번호, 이름은 필수입니다.'); return; }
    if (!isValidUsername(id)) { setErr('ID는 영문/숫자 6~20자로 입력해주세요.'); return; }
    if (!idChecked || idAvailable !== true) { setErr('ID 중복확인을 먼저 해주세요.'); return; }
    if (!isValidPassword(password)) { setErr('비밀번호는 영문/숫자/특수문자 중 2가지 이상을 조합해 10자 이상 입력해주세요.'); return; }
    if (password !== password2) { setErr('비밀번호가 서로 일치하지 않습니다.'); return; }
    if (!agreeTerms || !agreePrivacy) { setErr('이용약관과 개인정보 수집·이용에 동의해주세요.'); return; }

    // 마케팅 미동의 상태로 처음 제출하면, 한 번만 혜택 안내 팝업을 보여준다(강제 아님 — 거절해도 가입은 그대로 진행됨).
    if (!agreeMarketing && !marketingNudgeShown) {
      setShowMarketingNudge(true);
      return;
    }
    await proceedSignup(agreeMarketing);
  }

  async function proceedSignup(marketingOverride?: boolean) {
    const finalMarketing = marketingOverride ?? agreeMarketing;
    setBusy(true);

    // 서버에서 한 번 더 확인(그 사이 다른 사람이 선점했을 가능성 대비)
    const available = await isUsernameAvailable(id);
    if (!available) { setBusy(false); setIdChecked(false); setIdAvailable(false); setErr('방금 다른 분이 이 ID를 사용했어요. 다시 확인해주세요.'); return; }

    // 서버에서 이메일 확인 절차 없이 계정을 바로 확정 생성 (Confirm email 설정과 무관하게 동작)
    const created = await createAccountById(id, password, name, phone);
    if (!created.ok) { setBusy(false); setErr(created.reason); return; }

    const sb = supabaseBrowser();
    const { error } = await sb.auth.signInWithPassword({ email: idToAuthEmail(id), password });
    if (error) {
      setBusy(false);
      setErr('계정은 생성됐지만 로그인에 실패했습니다. 로그인 화면에서 다시 시도해주세요.');
      return;
    }

    const reg = await registerMembership({
      username: id,
      marketingConsent: finalMarketing,
    });
    setBusy(false);
    if (!reg.ok) { setErr(reg.reason ?? '가입 처리 중 오류가 발생했습니다.'); return; }
    // router.push + router.refresh를 연달아 호출하면 화면 전환이 멈추는 경우가 있어(재현됨),
    // 가입 직후처럼 인증 상태가 바뀌는 시점엔 전체 페이지 이동으로 확실하게 전환한다.
    window.location.href = '/membership';
  }

  return (
    <div className="auth">
      <div className="eyebrow">계정 만들기</div>
      <p className="auth-sub auth-sub-nowrap">가입 후 디렉터·슈퍼바이저의 승인을 거쳐 이용할 수 있어요.</p>

      <div className="sns-row">
        <button className="sns-btn sns-kakao" onClick={() => snsMock('카카오')}>카카오로 시작하기</button>
        <button className="sns-btn sns-naver" onClick={() => snsMock('네이버')}>네이버로 시작하기</button>
        <button className="sns-btn sns-google" onClick={() => snsMock('구글')}>구글로 시작하기</button>
        <button className="sns-btn sns-facebook" onClick={() => snsMock('페이스북')}>페이스북으로 시작하기</button>
      </div>
      {snsMsg && <div className="hint">{snsMsg}</div>}
      <div className="or-divider"><span>또는 ID로 가입</span></div>

      <div className="auth-form">
        <div className="field-section">필수 정보</div>
        <input className="field" placeholder="이름" value={name} onChange={(e) => setName(e.target.value)} />

        <div className="phone-row">
          <input
            className="field"
            placeholder="전화번호 (-없이 01000000000)"
            value={phone}
            disabled={phoneVerified}
            onChange={(e) => setPhone(e.target.value)}
          />
          {!phoneVerified && (
            <button className="cta ghost phone-btn" onClick={requestPhoneCode}>{codeSent ? '재전송' : '인증요청'}</button>
          )}
        </div>
        {codeSent && !phoneVerified && (
          <div className="phone-code-row">
            <input className="field" placeholder="인증번호 6자리" value={code} onChange={(e) => setCode(e.target.value)} />
            <button className="cta ghost phone-btn" onClick={confirmPhoneCode}>확인</button>
          </div>
        )}
        {phoneVerified && <div className="hint"><span className="verify-ok">✓ 인증완료</span></div>}
        {!phoneVerified && phoneStatus && <div className="hint">{phoneStatus}</div>}

        <div className="phone-row">
          <input
            className="field"
            placeholder="ID (영문/숫자 6~20자)"
            value={id}
            onChange={(e) => { setId(e.target.value); setIdChecked(false); setIdAvailable(null); setIdCheckMsg(null); }}
          />
          <button type="button" className="cta ghost phone-btn" disabled={idChecking} onClick={checkId}>중복확인</button>
        </div>
        {idCheckMsg && <div className="hint">{idAvailable ? <span className="verify-ok">{idCheckMsg}</span> : <span style={{ color: 'var(--wine)' }}>{idCheckMsg}</span>}</div>}
        <input className="field" type="password" placeholder="비밀번호" value={password} onChange={(e) => setPassword(e.target.value)} />
        <div className="hint pw-rule">영어 대소문자, 숫자, 특수문자 중 2가지 이상 조합, 10자 이상</div>
        <input className="field" type="password" placeholder="비밀번호 확인" value={password2} onChange={(e) => setPassword2(e.target.value)} />

        <label className="agree-all-row">
          <input type="checkbox" checked={agreeAll} onChange={(e) => toggleAgreeAll(e.target.checked)} />
          <span>
            <strong>약관 전체 동의</strong>
            <small>이용약관, 개인정보 수집·이용,<br />마케팅 정보 수신에 모두 동의합니다</small>
          </span>
        </label>

        <label className="agree-row agree-row-sub">
          <input type="checkbox" checked={agreeTerms} onChange={(e) => setAgreeTerms(e.target.checked)} />
          <span>(필수) 이용약관에 동의합니다</span>
          <a className="agree-view" onClick={(e) => { e.preventDefault(); setLegalOpen('terms'); }}>보기</a>
        </label>
        <label className="agree-row agree-row-sub">
          <input type="checkbox" checked={agreePrivacy} onChange={(e) => setAgreePrivacy(e.target.checked)} />
          <span>(필수) 개인정보 수집·이용에 동의합니다</span>
          <a className="agree-view" onClick={(e) => { e.preventDefault(); setLegalOpen('privacy'); }}>보기</a>
        </label>
        <label className="agree-row agree-row-sub">
          <input type="checkbox" checked={agreeMarketing} onChange={(e) => setAgreeMarketing(e.target.checked)} />
          <span>(선택) 마케팅 정보 수신에 동의합니다</span>
          <a className="agree-view" onClick={(e) => { e.preventDefault(); setLegalOpen('marketing'); }}>보기</a>
        </label>

        {err && <div className="hint err">{err}</div>}
        {msg && <div className="hint" style={{ color: 'var(--sage)' }}>{msg}</div>}
        <button className="cta" disabled={busy} onClick={submit}>{busy ? '처리 중…' : '멤버십 결제 후 가입하기'}</button>
      </div>

      <div className="auth-alt">
        이미 계정이 있으신가요? <Link href={`/login?next=${encodeURIComponent(next)}`}>로그인</Link>
      </div>

      {legalOpen && (
        <div className="wd-ov" onClick={(e) => e.target === e.currentTarget && setLegalOpen(null)}>
          <div className="legal-box">
            <div className="legal-title">
              {legalOpen === 'terms' ? '이용약관' : legalOpen === 'privacy' ? '개인정보 수집·이용 동의' : '마케팅 정보 수신 동의'}
            </div>
            <div className="legal-body">
              {legalOpen === 'terms' ? TERMS_OF_SERVICE : legalOpen === 'privacy' ? PRIVACY_POLICY : MARKETING_CONSENT_DETAIL}
            </div>
            <button className="cta" style={{ width: '100%' }} onClick={() => setLegalOpen(null)}>닫기</button>
          </div>
        </div>
      )}

      {showMarketingNudge && (
        <div className="wd-ov">
          <div className="wd-box">
            <div className="wd-title">잠깐만요!</div>
            <p className="wd-desc">
              마케팅 수신을 동의하시면 룩북 업로드, 프로모션, 데일리 코디 추천 등<br />남들보다 먼저 소식을 받아보실 수 있어요 :)
            </p>
            <div className="wd-btns">
              <button
                className="cta ghost"
                onClick={() => { setMarketingNudgeShown(true); setShowMarketingNudge(false); proceedSignup(false); }}
              >
                괜찮아요, 계속 가입
              </button>
              <button
                className="cta"
                onClick={() => { setAgreeMarketing(true); setMarketingNudgeShown(true); setShowMarketingNudge(false); proceedSignup(true); }}
              >
                동의하고 소식 받기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={null}>
      <SignupForm />
    </Suspense>
  );
}
