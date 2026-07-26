'use client';

import { useState, type MouseEvent, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { submitReturnRequest, updateReturnRequest, type ReturnRequestInput } from '@/lib/payments-actions';
import { listAddressBook, type AddressBookEntry } from '@/lib/address-book-actions';
import { openAddressSearch } from '@/lib/address-search';
import { formatPhone } from '@/lib/phone-format';

export interface ReturnRequestFormInitial {
  address: string;
  jibun: string;
  detailAddress: string;
  message: string;
  recipientName: string;
  phone: string;
}

/**
 * 택배 반납접수요청 인라인 패널 — 목록 카드 전체가 <Link>로 감싸여 있어서 이 컴포넌트는
 * AccountOrderCard가 Link "밖"에 형제로 렌더링한다(ReturnTrackingInfo가 쓰던 자리와 동일한 위치).
 * mode='request'면 아직 반납접수요청 전(빈 폼+저장), mode='manage'면 이미 요청한 뒤(읽기전용+수정하기).
 */
export default function ReturnRequestForm({
  orderId, mode, initial, editing, onStartEdit, onCancelEdit, onSaved,
}: {
  orderId: string;
  mode: 'request' | 'manage';
  initial: ReturnRequestFormInitial;
  editing: boolean;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onSaved: () => void;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [err, setErr] = useState<string | null>(null);

  const [address, setAddress] = useState(initial.address);
  const [jibun, setJibun] = useState(initial.jibun);
  const [detailAddress, setDetailAddress] = useState(initial.detailAddress);
  const [message, setMessage] = useState(initial.message);
  const [recipientName, setRecipientName] = useState(initial.recipientName);
  const [phone, setPhone] = useState(initial.phone);

  const [addressBook, setAddressBook] = useState<AddressBookEntry[]>([]);
  const [addressBookLoaded, setAddressBookLoaded] = useState(false);
  const [showBookModal, setShowBookModal] = useState(false);
  const [showNoDefaultModal, setShowNoDefaultModal] = useState(false);
  const homeEntries = addressBook.filter((e) => e.mode === 'home');

  function stop(e: MouseEvent) { e.preventDefault(); e.stopPropagation(); }

  /** 아직 안 불러왔으면 지금 바로 불러온 목록을 리턴(state 갱신은 비동기라 이 클릭 안에서 바로
   * 쓰려면 state가 아니라 반환값을 써야 함 — 그렇지 않으면 처음 클릭했을 때 목록이 비어있는
   * 채로 "기본 배송지가 없어요"가 잘못 뜬다). */
  async function ensureAddressBook(): Promise<AddressBookEntry[]> {
    if (addressBookLoaded) return addressBook;
    const list = await listAddressBook();
    setAddressBookLoaded(true);
    setAddressBook(list);
    return list;
  }

  function fillFromEntry(entry: AddressBookEntry) {
    setAddress(entry.address ?? '');
    setJibun(entry.jibun ?? '');
    setDetailAddress(entry.detailAddress ?? '');
    if (entry.phone) setPhone(entry.phone);
  }

  async function clickDefaultPill(e: MouseEvent) {
    stop(e);
    const list = await ensureAddressBook();
    const def = list.find((a) => a.mode === 'home' && a.isDefault);
    if (def) fillFromEntry(def); else setShowNoDefaultModal(true);
  }

  async function openBookModal(e: MouseEvent) {
    stop(e);
    await ensureAddressBook();
    setShowBookModal(true);
  }

  function cancelEdit(e: MouseEvent) {
    stop(e);
    setAddress(initial.address);
    setJibun(initial.jibun);
    setDetailAddress(initial.detailAddress);
    setMessage(initial.message);
    setRecipientName(initial.recipientName);
    setPhone(initial.phone);
    setErr(null);
    onCancelEdit();
  }

  function save(e: MouseEvent) {
    stop(e);
    setErr(null);
    const input: ReturnRequestInput = { address, jibun, detailAddress, message, recipientName, phone };
    startTransition(async () => {
      const res = mode === 'request' ? await submitReturnRequest(orderId, input) : await updateReturnRequest(orderId, input);
      if (!res.ok) { setErr(res.reason); return; }
      onSaved();
      router.refresh();
    });
  }

  const showForm = mode === 'request' || editing;

  return (
    <div className="resv-group return-request-card" onClick={stop}>
      {mode === 'manage' && !editing ? (
        <>
          <div className="field-section" style={{ margin: 0 }}>반납 정보</div>
          <div className="return-request-view">
            <div className="row"><span>반납 주소</span><span>{[initial.address, initial.detailAddress].filter(Boolean).join(' ') || '-'}</span></div>
            {initial.message && <div className="row"><span>반납 메시지</span><span>{initial.message}</span></div>}
            <div className="row"><span>이름</span><span>{initial.recipientName || '-'}</span></div>
            <div className="row"><span>전화번호</span><span>{initial.phone ? formatPhone(initial.phone) : '-'}</span></div>
          </div>
          <div style={{ textAlign: 'right', marginTop: 10 }}>
            <button type="button" className="cta ghost cta-fit return-request-ghost-btn" onClick={(e) => { stop(e); onStartEdit(); }}>수정하기</button>
          </div>
        </>
      ) : null}

      {showForm && (
        <>
          <div className="field-section-row" style={{ marginTop: 0 }}>
            <div className="field-section" style={{ margin: 0 }}>반납 주소</div>
            <div className="addr-pills">
              <button type="button" className="size-chip pickable" onClick={(e) => void clickDefaultPill(e)}>기본 배송지</button>
              <button type="button" className="size-chip pickable" onClick={(e) => void openBookModal(e)}>즐겨찾기</button>
            </div>
          </div>
          <div className="addr-row">
            <input className="field" placeholder="반납 주소" value={address} onChange={(e) => setAddress(e.target.value)} />
            <button
              type="button"
              className="cta ghost addr-btn"
              onClick={(e) => { stop(e); openAddressSearch((r) => { setAddress(r.roadAddress); setJibun(r.jibunAddress); }); }}
            >주소 검색</button>
          </div>
          {jibun && <div className="addr-jibun return-request-jibun">지번 주소: {jibun}</div>}
          <input className="field" style={{ marginTop: 8 }} placeholder="세부 주소 (건물명, 호수)" value={detailAddress} onChange={(e) => setDetailAddress(e.target.value)} />

          <div className="phone-row" style={{ marginTop: 8, alignItems: 'center' }}>
            <span className="field-section field-section-plain" style={{ margin: 0, flexShrink: 0 }}>반납 메시지</span>
            <input className="field" style={{ textAlign: 'right' }} value={message} onChange={(e) => setMessage(e.target.value)} />
          </div>

          <div className="phone-row" style={{ marginTop: 8, alignItems: 'center' }}>
            <span className="field-section field-section-plain" style={{ margin: 0, flexShrink: 0 }}>이름</span>
            <input
              className="field field-name-fit"
              style={{ textAlign: 'right', marginLeft: 'auto' }}
              value={recipientName}
              onChange={(e) => setRecipientName(e.target.value)}
            />
          </div>

          <div className="phone-row" style={{ marginTop: 8, alignItems: 'center' }}>
            <span className="field-section field-section-plain" style={{ margin: 0, flexShrink: 0 }}>전화번호</span>
            <input
              className="field field-phone-fit"
              style={{ textAlign: 'right', marginLeft: 'auto' }}
              placeholder="010-0000-0000"
              value={formatPhone(phone)}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 11))}
            />
          </div>

          {err && <div className="hint err" style={{ marginTop: 6 }}>{err}</div>}
          <div className="wd-btns wd-btns-fit" style={{ marginTop: 10 }}>
            {mode === 'manage' && (
              <button type="button" className="cta ghost return-request-ghost-btn" disabled={pending} onClick={cancelEdit}>취소</button>
            )}
            <button type="button" className="cta" disabled={pending} onClick={save}>{pending ? '저장 중…' : '저장'}</button>
          </div>
        </>
      )}

      {showBookModal && (
        <div className="wd-ov" onClick={(e) => { stop(e); if (e.target === e.currentTarget) setShowBookModal(false); }}>
          <div className="legal-box">
            <div className="legal-title">즐겨찾기 (자택)</div>
            <div className="legal-body">
              <div className="addr-book-panel">
                {homeEntries.length === 0 && <p className="hint" style={{ margin: 0 }}>저장된 주소가 아직 없어요.</p>}
                {homeEntries.map((e) => (
                  <div className="addr-book-item" key={e.id}>
                    <button
                      type="button"
                      className="addr-book-info"
                      onClick={(ev) => { stop(ev); fillFromEntry(e); setShowBookModal(false); }}
                    >
                      <div className="addr-book-label-row">
                        <span className="addr-book-label-text">{e.label}</span>
                        {e.isDefault && <span className="addr-book-default">기본 배송지</span>}
                      </div>
                      <div className="addr-book-summary">{[e.address, e.detailAddress].filter(Boolean).join(' ') || '(주소 없음)'}</div>
                    </button>
                  </div>
                ))}
              </div>
            </div>
            <button type="button" className="cta" style={{ width: '100%' }} onClick={(e) => { stop(e); setShowBookModal(false); }}>닫기</button>
          </div>
        </div>
      )}

      {showNoDefaultModal && (
        <div className="wd-ov" onClick={(e) => { stop(e); if (e.target === e.currentTarget) setShowNoDefaultModal(false); }}>
          <div className="wd-box">
            <div className="wd-title">기본 배송지가 없어요</div>
            <p className="wd-desc">기본배송지가 등록되어 있지않아요.</p>
            <button type="button" className="cta" style={{ width: '100%' }} onClick={(e) => { stop(e); setShowNoDefaultModal(false); }}>확인</button>
          </div>
        </div>
      )}
    </div>
  );
}
