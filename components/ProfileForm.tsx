'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { updateProfile, withdrawAccount, type Profile } from '@/lib/account-actions';
import { signOut } from '@/lib/actions';
import PushNotificationToggle from './PushNotificationToggle';
import DeliveryInfoForm from './DeliveryInfoForm';
import { formatPhone } from '@/lib/phone-format';

export default function ProfileForm({ profile }: { profile: Profile }) {
  const router = useRouter();
  const [phone, setPhone] = useState(profile.phone ?? '');
  const [marketingLookbook, setMarketingLookbook] = useState(profile.marketingLookbook);
  const [marketingPromotion, setMarketingPromotion] = useState(profile.marketingPromotion);
  const [marketingDaily, setMarketingDaily] = useState(profile.marketingDaily);
  const [newPassword, setNewPassword] = useState('');
  const [pending, startTransition] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  const [phoneFocused, setPhoneFocused] = useState(false);

  const [showWithdraw, setShowWithdraw] = useState(false);
  const [wdPassword, setWdPassword] = useState('');
  const [wdErr, setWdErr] = useState<string | null>(null);
  const [wdBlocked, setWdBlocked] = useState<string | null>(null);

  function save() {
    setErr(null); setOk(false);
    startTransition(async () => {
      const res = await updateProfile({
        name: profile.name, phone, marketingLookbook, marketingPromotion, marketingDaily,
        newPassword: newPassword || undefined,
        // 배송 정보는 DeliveryInfoForm이 별도로 저장하므로, 여기서도 마찬가지로 기존 값 그대로 같이 전송
        deliveryAddress: profile.deliveryAddress ?? undefined,
        deliveryJibun: profile.deliveryJibun ?? undefined,
        deliveryDetailAddress: profile.deliveryDetailAddress ?? undefined,
        entrancePassword: profile.entrancePassword ?? undefined,
        returnAddress: profile.returnAddress ?? undefined,
        returnJibun: profile.returnJibun ?? undefined,
        returnDetailAddress: profile.returnDetailAddress ?? undefined,
        returnEntrancePassword: profile.returnEntrancePassword ?? undefined,
        deliveryPhone: profile.deliveryPhone ?? undefined,
        workplace: profile.workplace ?? undefined,
        deliveryInStore: profile.deliveryInStore,
        returnInStore: profile.returnInStore,
      });
      if (res.ok) { setOk(true); setNewPassword(''); }
      else setErr(res.reason ?? '저장에 실패했습니다.');
    });
  }

  function openWithdraw() {
    setWdErr(null); setWdBlocked(null); setWdPassword('');
    setShowWithdraw(true);
  }

  function confirmWithdraw() {
    setWdErr(null);
    startTransition(async () => {
      const res = await withdrawAccount(wdPassword);
      if (res.ok) { router.push('/'); return; }
      if (res.blockedByDispute) setWdBlocked(res.reason);
      else setWdErr(res.reason);
    });
  }

  return (
    <section className="detail">
      <div className="pf-form">
        <div className="pf-row">
          <label>아이디</label>
          <input className="pf-input" value={profile.username} disabled />
        </div>
        <div className="pf-row">
          <span className="pf-label-with-hint">
            <label>비밀번호</label>
            <span className="pf-pw-hint">10자 이상 · 2종류 조합</span>
          </span>
          <input
            className="pf-input pf-edit pf-tight pf-w16"
            type="password"
            placeholder="변경 시에만 입력"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
        </div>
        <div className="pf-row">
          <label>이름</label>
          <input className="pf-input pf-tight pf-w5 pf-center" value={profile.name} disabled />
        </div>
        <div className="pf-row pf-phone-row">
          <label>전화번호</label>
          <input
            className="pf-input pf-edit pf-tight pf-w13"
            placeholder="010-0000-0000"
            value={formatPhone(phone)}
            onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 11))}
            onFocus={() => setPhoneFocused(true)}
            onBlur={() => setPhoneFocused(false)}
          />
          {phoneFocused && <div className="pf-phone-hint">-없이 01000000000</div>}
        </div>

        <div style={{ marginTop: 14 }}>
          <DeliveryInfoForm profile={profile} autoSelectMode={false} showPickupOption={false} />
        </div>

        <PushNotificationToggle />

        <label className="pf-row" style={{ marginTop: 14, borderBottom: 'none', cursor: 'pointer' }}>
          <span className="field-section pf-row-label-marketing-fit" style={{ margin: 0 }}>마케팅 정보 수신 동의</span>
          <span className="ios-toggle">
            <input
              type="checkbox"
              checked={marketingLookbook && marketingPromotion && marketingDaily}
              onChange={(e) => {
                setMarketingLookbook(e.target.checked);
                setMarketingPromotion(e.target.checked);
                setMarketingDaily(e.target.checked);
              }}
            />
            <span className="ios-slider" />
          </span>
        </label>
        <label className="pf-row" style={{ borderBottom: 'none', cursor: 'pointer' }}>
          <span className="pf-row-label pf-row-label-marketing-fit">룩북 업로드 소식</span>
          <span className="ios-toggle">
            <input type="checkbox" checked={marketingLookbook} onChange={(e) => setMarketingLookbook(e.target.checked)} />
            <span className="ios-slider" />
          </span>
        </label>
        <label className="pf-row" style={{ borderBottom: 'none', cursor: 'pointer' }}>
          <span className="pf-row-label pf-row-label-marketing-fit">프로모션(할인·이벤트) 소식</span>
          <span className="ios-toggle">
            <input type="checkbox" checked={marketingPromotion} onChange={(e) => setMarketingPromotion(e.target.checked)} />
            <span className="ios-slider" />
          </span>
        </label>
        <label className="pf-row" style={{ borderBottom: 'none', cursor: 'pointer' }}>
          <span className="pf-row-label pf-row-label-marketing-fit">데일리 코디 추천</span>
          <span className="ios-toggle">
            <input type="checkbox" checked={marketingDaily} onChange={(e) => setMarketingDaily(e.target.checked)} />
            <span className="ios-slider" />
          </span>
        </label>

        {/* 정보 항목이 늘어나도 로그아웃·탈퇴하기는 항상 맨 아래에 위치 */}
        <div className="pf-foot">
          <a className="pf-withdraw" onClick={() => startTransition(async () => { await signOut(); })}>로그아웃</a>
          <a className="pf-withdraw" onClick={openWithdraw}>탈퇴하기</a>
        </div>

        {err && <div className="hint err">{err}</div>}
        {ok && <div className="hint" style={{ color: 'var(--sage)' }}>저장되었습니다.</div>}
        <button className="cta cta-fit" disabled={pending} onClick={save}>수정하기</button>
      </div>

      {showWithdraw && (
        <div className="wd-ov" onClick={(e) => e.target === e.currentTarget && setShowWithdraw(false)}>
          <div className="wd-box">
            {wdBlocked ? (
              <>
                <div className="wd-title">탈퇴할 수 없어요</div>
                <p className="wd-desc">{wdBlocked}</p>
                <div className="wd-btns">
                  <button className="cta" style={{ width: '100%' }} onClick={() => setShowWithdraw(false)}>확인</button>
                </div>
              </>
            ) : (
              <>
                <div className="wd-title">탈퇴하기</div>
                <p className="wd-desc">계정을 삭제하려면 현재 비밀번호를 입력해주세요.<br />탈퇴 후에는 되돌릴 수 없습니다.</p>
                <input
                  className="pf-input pf-edit"
                  type="password"
                  placeholder="현재 비밀번호"
                  style={{ width: '100%', textAlign: 'left', padding: '10px 12px' }}
                  value={wdPassword}
                  onChange={(e) => setWdPassword(e.target.value)}
                  autoFocus
                />
                {wdErr && <div className="hint err">{wdErr}</div>}
                <div className="wd-btns">
                  <button className="cta ghost" onClick={() => setShowWithdraw(false)}>취소</button>
                  <button className="cta" disabled={pending} onClick={confirmWithdraw}>탈퇴하기</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
