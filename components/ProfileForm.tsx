'use client';

import { useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { updateProfile, withdrawAccount, type Profile } from '@/lib/account-actions';
import { openAddressSearch } from '@/lib/address-search';
import PushNotificationToggle from './PushNotificationToggle';

export default function ProfileForm({ profile }: { profile: Profile }) {
  const router = useRouter();
  const [name, setName] = useState(profile.name);
  const [phone, setPhone] = useState(profile.phone ?? '');
  const [marketingLookbook, setMarketingLookbook] = useState(profile.marketingLookbook);
  const [marketingPromotion, setMarketingPromotion] = useState(profile.marketingPromotion);
  const [marketingDaily, setMarketingDaily] = useState(profile.marketingDaily);
  const [newPassword, setNewPassword] = useState('');
  const [pending, startTransition] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  const [phoneFocused, setPhoneFocused] = useState(false);

  // 피팅 정보
  const [showFitting, setShowFitting] = useState(false);
  const [heightCm, setHeightCm] = useState(profile.heightCm?.toString() ?? '');
  const [topSize, setTopSize] = useState(profile.topSize ?? '');
  const [waistCm, setWaistCm] = useState(profile.waistCm?.toString() ?? '');
  const [shoeSize, setShoeSize] = useState(profile.shoeSize ?? '');

  // 배송 정보
  const [showDelivery, setShowDelivery] = useState(false);
  const [deliveryAddress, setDeliveryAddress] = useState(profile.deliveryAddress ?? '');
  const [deliveryJibun, setDeliveryJibun] = useState(profile.deliveryJibun ?? '');
  const [deliveryDetailAddress, setDeliveryDetailAddress] = useState(profile.deliveryDetailAddress ?? '');
  const [workplace, setWorkplace] = useState(profile.workplace ?? '');
  const [deliveryPhone, setDeliveryPhone] = useState(profile.deliveryPhone ?? '');
  const [returnAddress, setReturnAddress] = useState(profile.returnAddress ?? '');
  const [returnJibun, setReturnJibun] = useState(profile.returnJibun ?? '');
  const [returnDetailAddress, setReturnDetailAddress] = useState(profile.returnDetailAddress ?? '');
  const [entrancePassword, setEntrancePassword] = useState(profile.entrancePassword ?? '');
  const [returnEntrancePassword, setReturnEntrancePassword] = useState(profile.returnEntrancePassword ?? '');
  const [sameAsDelivery, setSameAsDelivery] = useState(false);
  const [sameEntrance, setSameEntrance] = useState(false);

  // 공동현관 비밀번호도 동일하면, 배송 장소 값이 바뀔 때마다 회수 장소도 함께 따라간다.
  useEffect(() => {
    if (sameEntrance) setReturnEntrancePassword(entrancePassword);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sameEntrance, entrancePassword]);

  // 회수 장소가 배송 장소와 동일하면, 배송 장소가 바뀔 때마다 함께 따라간다.
  useEffect(() => {
    if (sameAsDelivery) {
      setReturnAddress(deliveryAddress);
      setReturnJibun(deliveryJibun);
      setReturnDetailAddress(deliveryDetailAddress);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sameAsDelivery, deliveryAddress, deliveryJibun, deliveryDetailAddress]);

  const [showWithdraw, setShowWithdraw] = useState(false);
  const [wdPassword, setWdPassword] = useState('');
  const [wdErr, setWdErr] = useState<string | null>(null);
  const [wdBlocked, setWdBlocked] = useState<string | null>(null);

  function save() {
    setErr(null); setOk(false);
    startTransition(async () => {
      const res = await updateProfile({
        name, phone, marketingLookbook, marketingPromotion, marketingDaily,
        newPassword: newPassword || undefined,
        heightCm, topSize, waistCm, shoeSize,
        deliveryAddress, deliveryJibun, deliveryDetailAddress, entrancePassword,
        returnAddress, returnJibun, returnDetailAddress, returnEntrancePassword,
        deliveryPhone, workplace,
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
          <label>비밀번호</label>
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
          <input
            className="pf-input pf-edit pf-tight pf-w5 pf-center"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div className="pf-row pf-phone-row">
          <label>전화번호</label>
          <input
            className="pf-input pf-edit pf-tight pf-w13"
            placeholder="010-0000-0000"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            onFocus={() => setPhoneFocused(true)}
            onBlur={() => setPhoneFocused(false)}
          />
          {phoneFocused && <div className="pf-phone-hint">-없이 01000000000</div>}
        </div>

        <button type="button" className="cta ghost optional-toggle" onClick={() => setShowFitting((v) => !v)} style={{ marginTop: 14 }}>
          {showFitting ? '피팅 정보 접기' : '피팅 정보 입력하기'}
        </button>
        {showFitting && (
          <div className="optional-panel">
            <input className="field" placeholder="키 (cm)" type="number" value={heightCm} onChange={(e) => setHeightCm(e.target.value)} />
            <input className="field" placeholder="상의 사이즈 (예: S, M, 66)" value={topSize} onChange={(e) => setTopSize(e.target.value)} />
            <input className="field" placeholder="허리 (cm)" type="number" value={waistCm} onChange={(e) => setWaistCm(e.target.value)} />
            <input className="field" placeholder="구두 사이즈 (예: 245)" value={shoeSize} onChange={(e) => setShoeSize(e.target.value)} />
          </div>
        )}

        <button type="button" className="cta ghost optional-toggle" onClick={() => setShowDelivery((v) => !v)}>
          {showDelivery ? '배송 정보 접기' : '배송 정보 입력하기'}
        </button>
        {showDelivery && (
          <div className="optional-panel">
            <div className="addr-row">
              <input className="field" placeholder="배송지 주소" value={deliveryAddress} onChange={(e) => setDeliveryAddress(e.target.value)} />
              <button
                type="button"
                className="cta ghost addr-btn"
                onClick={() => openAddressSearch((r) => { setDeliveryAddress(r.roadAddress); setDeliveryJibun(r.jibunAddress); })}
              >주소 검색</button>
            </div>
            {deliveryJibun && <div className="addr-jibun">지번 주소: {deliveryJibun}</div>}
            <input className="field" placeholder="세부 주소 (건물명, 호수)" value={deliveryDetailAddress} onChange={(e) => setDeliveryDetailAddress(e.target.value)} />
            <input className="field" placeholder="공동현관 비밀번호(자유출입시 미기재)" value={entrancePassword} onChange={(e) => setEntrancePassword(e.target.value)} />

            <div className="addr-row" style={{ marginTop: 14 }}>
              <input className="field" placeholder="회수지 주소" value={returnAddress} disabled={sameAsDelivery} onChange={(e) => setReturnAddress(e.target.value)} />
              <button
                type="button"
                className="cta ghost addr-btn"
                disabled={sameAsDelivery}
                onClick={() => openAddressSearch((r) => { setReturnAddress(r.roadAddress); setReturnJibun(r.jibunAddress); })}
              >주소 검색</button>
            </div>
            {returnJibun && <div className="addr-jibun">지번 주소: {returnJibun}</div>}
            <input className="field" placeholder="세부 주소 (건물명, 호수)" value={returnDetailAddress} disabled={sameAsDelivery} onChange={(e) => setReturnDetailAddress(e.target.value)} />
            <input
              className="field"
              placeholder="공동현관 비밀번호(자유출입시 미기재)"
              value={returnEntrancePassword}
              disabled={sameEntrance}
              onChange={(e) => setReturnEntrancePassword(e.target.value)}
            />
            <label className="agree-row">
              <input type="checkbox" checked={sameAsDelivery} onChange={(e) => setSameAsDelivery(e.target.checked)} />
              <span>배송지 주소와 동일</span>
            </label>
            <label className="agree-row">
              <input type="checkbox" checked={sameEntrance} onChange={(e) => setSameEntrance(e.target.checked)} />
              <span>공동현관 비밀번호 동일</span>
            </label>
            <input className="field" style={{ marginTop: 14 }} placeholder="전화번호 (-없이 01000000000)" value={deliveryPhone} onChange={(e) => setDeliveryPhone(e.target.value)} />
            <input className="field" style={{ marginTop: 14 }} placeholder="근무지로 배송회수(상호명 입력)" value={workplace} onChange={(e) => setWorkplace(e.target.value)} />
          </div>
        )}

        <div className="field-section" style={{ marginTop: 14 }}>마케팅 정보 수신 동의</div>
        <label className="agree-row">
          <input type="checkbox" checked={marketingLookbook} onChange={(e) => setMarketingLookbook(e.target.checked)} />
          <span>신규 룩북 소식</span>
        </label>
        <label className="agree-row">
          <input type="checkbox" checked={marketingPromotion} onChange={(e) => setMarketingPromotion(e.target.checked)} />
          <span>할인·이벤트 프로모션</span>
        </label>
        <label className="agree-row">
          <input type="checkbox" checked={marketingDaily} onChange={(e) => setMarketingDaily(e.target.checked)} />
          <span>데일리 코디 추천</span>
        </label>

        <PushNotificationToggle />

        {/* 정보 항목이 늘어나도 탈퇴하기는 항상 맨 아래에 위치 */}
        <div className="pf-foot">
          <a className="pf-withdraw" onClick={openWithdraw}>탈퇴하기</a>
        </div>

        {err && <div className="hint err">{err}</div>}
        {ok && <div className="hint" style={{ color: 'var(--sage)' }}>저장되었습니다.</div>}
        <button className="cta" disabled={pending} onClick={save}>수정하기</button>
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
