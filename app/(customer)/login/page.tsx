'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { supabaseBrowser } from '@lala/shared/lib/supabase/client';
import { idToAuthEmail } from '@/lib/username';
import { getMyAccess } from '@lala/shared/lib/roles-actions';

function LoginForm() {
  const params = useSearchParams();
  const next = params.get('next') || '/looks';
  const [id, setId] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [snsMsg, setSnsMsg] = useState<string | null>(null);

  function snsMock(provider: string) {
    setSnsMsg(`${provider} 간편로그인은 준비 중이에요. 곧 지원할 예정입니다.`);
  }

  async function submit() {
    setErr(null);
    if (!id || !password) { setErr('ID와 비밀번호를 입력해주세요.'); return; }
    setBusy(true);

    // 자동로그인 여부를 미들웨어도 알 수 있도록 마커 쿠키를 남긴다.
    // 끈 경우(0): 세션 쿠키(브라우저/앱 종료 시 삭제)로 남겨 미들웨어가 인증 쿠키의 영속성을 제거하게 함.
    // 켠 경우: 이전에 꺼둔 값이 남아있지 않도록 마커 자체를 지운다.
    if (!rememberMe) document.cookie = 'lala_remember=0; path=/';
    else document.cookie = 'lala_remember=; path=/; max-age=0';

    const sb = supabaseBrowser({ rememberMe });
    // ID를 내부 전용 가상 이메일로 변환해 Supabase Auth에 넘긴다.
    const { error } = await sb.auth.signInWithPassword({ email: idToAuthEmail(id), password });
    if (error) { setBusy(false); setErr('ID 또는 비밀번호가 올바르지 않습니다.'); return; }

    const access = await getMyAccess();
    // router.push + router.refresh를 연달아 호출하면 화면 전환이 멈추는 경우가 있어(재현됨),
    // 로그인 직후처럼 헤더 등 인증 상태가 바뀌는 시점엔 전체 페이지 이동으로 확실하게 전환한다.
    if (access?.status === 'unpaid') window.location.href = '/membership';
    else if (access?.status === 'pending') window.location.href = '/pending';
    else window.location.href = next;
  }

  return (
    <div className="auth">
      <div className="sns-row">
        <button className="sns-btn sns-kakao" onClick={() => snsMock('카카오')}>카카오로 로그인</button>
        <button className="sns-btn sns-naver" onClick={() => snsMock('네이버')}>네이버로 로그인</button>
        <button className="sns-btn sns-google" onClick={() => snsMock('구글')}>구글로 로그인</button>
        <button className="sns-btn sns-facebook" onClick={() => snsMock('페이스북')}>페이스북으로 로그인</button>
      </div>
      {snsMsg && <div className="hint">{snsMsg}</div>}
      <div className="or-divider"><span>또는 ID로 로그인</span></div>

      <div className="auth-form">
        <input className="field" placeholder="ID" value={id} onChange={(e) => setId(e.target.value)} />
        <input className="field" type="password" placeholder="비밀번호" value={password} onChange={(e) => setPassword(e.target.value)} />
        <label className="remember-row">
          <span>자동로그인</span>
          <span className="ios-toggle">
            <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} />
            <span className="ios-slider" />
          </span>
        </label>
        {err && <div className="hint err">{err}</div>}
        <button className="cta" disabled={busy} onClick={submit}>{busy ? '확인 중…' : '로그인'}</button>
      </div>

      <div className="auth-alt">
        계정이 없으신가요? <Link href={`/signup?next=${encodeURIComponent(next)}`}>가입하기</Link>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
