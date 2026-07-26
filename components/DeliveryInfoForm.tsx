'use client';

import { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { useRouter } from 'next/navigation';
import { updateProfile, type Profile } from '@/lib/account-actions';
import {
  listAddressBook, saveToAddressBook, setDefaultAddressBookEntry, deleteAddressBookEntry,
  updateAddressBookEntry,
  type AddressBookEntry, type DeliveryMode,
} from '@/lib/address-book-actions';
import { openAddressSearch } from '@/lib/address-search';
import { formatPhone } from '@/lib/phone-format';

type Mode = DeliveryMode | null;

function initialMode(profile: Profile): Mode {
  if (profile.deliveryInStore) return 'pickup';
  if (profile.workplace) return 'workplace';
  if (profile.deliveryAddress) return 'home';
  return null;
}

function summarizeEntry(e: AddressBookEntry): string {
  if (e.mode === 'pickup') return '매장 직접 픽업·회수';
  return [e.address, e.detailAddress].filter(Boolean).join(' ') || '(주소 없음)';
}

export interface DeliveryInfoFormHandle {
  save: () => Promise<{ ok: boolean; reason?: string }>;
}

/**
 * 배송지/회수지 입력 섹션 — 내 정보 페이지와 카트 페이지(결제 전)에서 공유해서 쓰는 독립 컴포넌트.
 * "자택으로 받기 / 근무지로 받기 / 직접 픽업·회수하기" 3가지 중 하나를 고르면 그 방식에 맞는
 * 입력란만 아래에 나타난다(서로 배타적 — 한 번에 하나만 선택). 회수지는 항상 배송지와 동일하게
 * 저장한다(직접 픽업·회수는 둘 다 매장에서). 자체 저장 버튼으로 배송 관련 필드만 저장하고
 * (이름/전화번호/마케팅 동의 등 나머지 항목은 profile에서 그대로 가져와 같이 보내 기존 값이
 * 지워지지 않게 함), 저장 성공 시 router.refresh() + onSaved 콜백으로 호출한 쪽에서 최신 데이터를
 * 다시 받아갈 수 있게 한다. ref로 save()를 외부에 노출해 카트 페이지의 "결제하기"처럼 다른
 * 버튼에서 이 폼의 저장을 대신 트리거할 수 있고, 그 경우 showSaveButton={false}로 자체 저장
 * 버튼을 숨긴다.
 *
 * 자택·근무지의 주소/세부주소는 서로 완전히 독립된 state(home 접두사/workplace 접두사)를 쓴다 — 예전엔
 * 하나를 공유해서 모드를 바꾸면 다른 모드에서 입력한 값이 그대로 남아있는 문제가 있었는데,
 * 이제 각 모드가 자기 값만 기억하므로 그런 혼동 자체가 생기지 않는다. 다만 저장(save)은
 * 여전히 "지금 선택된 모드" 하나만 customer 테이블에 반영한다 — 두 모드를 모두 영구 보관하고
 * 싶으면 주소록(이름 붙여 저장)을 쓰면 된다.
 */
const DeliveryInfoForm = forwardRef<DeliveryInfoFormHandle, {
  profile: Profile; onSaved?: () => void; showSaveButton?: boolean; restrictedToHome?: boolean; isParcelDelivery?: boolean;
  showModeButtons?: boolean; autoSelectMode?: boolean; showPickupOption?: boolean;
}>(function DeliveryInfoForm({
  profile, onSaved, showSaveButton = true, restrictedToHome = false, isParcelDelivery = false, showModeButtons = true, autoSelectMode = true,
  showPickupOption = true,
}, ref) {
  const router = useRouter();
  const initMode = initialMode(profile);
  // 패널 열림 상태(mode)는 마지막으로 저장된 배송 방법(집/근무지)을 기본값으로 삼는다 —
  // 회원이 지난번에 집으로 받았으면 집으로 받기 패널을, 근무지로 받았으면 근무지 패널을 미리 열어준다.
  const [mode, setMode] = useState<Mode>(null);

  // 카트에서 퀵배송·택배를 고르면 근무지/직접 픽업·회수는 불가능해져 자택만 남긴다 —
  // 이미 그 모드가 선택돼 있었다면 선택을 풀어 다시 고르게 한다.
  useEffect(() => {
    if (restrictedToHome && (mode === 'workplace' || mode === 'pickup')) setMode(null);
  }, [restrictedToHome, mode]);

  // 이 컴포넌트는 배송 방법이 바뀌어도(직배송↔퀵배송·택배) 언마운트되지 않고 계속 살아있다.
  // 모드 버튼 줄이 숨겨지는 순간엔 선택을 풀어뒀다가(예전에 눌러둔 게 엉뚱하게 남아있는 버그 방지),
  // 다시 나타나는 순간엔 마지막으로 저장된 주소 모드(initMode)를 기본값으로 자동 선택해준다 —
  // 단, 회원이 이미 이번 화면에서 직접 다른 모드를 눌러뒀다면(cur가 null이 아니면) 덮어쓰지 않는다.
  // 내 정보 페이지처럼 그냥 훑어보러 온 화면에선 autoSelectMode=false로 꺼서 셋 다 접혀 있게 둔다
  // (카트 페이지의 결제 흐름에서만 마지막으로 쓴 방법을 미리 열어주는 게 의미가 있음).
  useEffect(() => {
    if (!showModeButtons) { setMode(null); return; }
    if (!autoSelectMode) return;
    const fallback = restrictedToHome ? (initMode === 'home' ? 'home' : null) : initMode;
    setMode((cur) => cur ?? fallback);
  }, [showModeButtons, restrictedToHome, initMode, autoSelectMode]);

  // 퀵배송·택배는 회수(반납 수거)를 별도 장소로 지정할 수 없어 배송지와 항상 동일하게 고정한다.
  useEffect(() => {
    if (restrictedToHome) setSameAsDelivery(true);
  }, [restrictedToHome]);

  // 택배는 무인 수령이 원칙이라 공동현관 비밀번호를 받지 않는다 — 이미 입력해둔 값도 비워 저장되지 않게 함.
  useEffect(() => {
    if (isParcelDelivery) setEntrancePassword('');
  }, [isParcelDelivery]);
  const [pending, setPending] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  // 자택으로 받기 전용 주소 — profile의 배송 정보가 "자택" 모드로 저장된 경우에만 초깃값을 채움
  // (근무지 모드로 저장돼 있었다면 이 컬럼의 값은 근무지 주소였던 것이라 자택 칸엔 넣지 않음).
  const [homeAddress, setHomeAddress] = useState(initMode === 'home' ? profile.deliveryAddress ?? '' : '');
  const [homeJibun, setHomeJibun] = useState(initMode === 'home' ? profile.deliveryJibun ?? '' : '');
  const [homeZonecode, setHomeZonecode] = useState(initMode === 'home' ? profile.deliveryZonecode ?? '' : '');
  const [homeDetailAddress, setHomeDetailAddress] = useState(initMode === 'home' ? profile.deliveryDetailAddress ?? '' : '');
  const [entrancePassword, setEntrancePassword] = useState(profile.entrancePassword ?? '');
  const [deliveryMessage, setDeliveryMessage] = useState(profile.deliveryMessage ?? '');

  // 근무지로 받기 전용 주소 — 위와 대칭
  const [workplaceAddress, setWorkplaceAddress] = useState(initMode === 'workplace' ? profile.deliveryAddress ?? '' : '');
  const [workplaceJibun, setWorkplaceJibun] = useState(initMode === 'workplace' ? profile.deliveryJibun ?? '' : '');
  const [workplaceDetailAddress, setWorkplaceDetailAddress] = useState(initMode === 'workplace' ? profile.deliveryDetailAddress ?? '' : '');
  const [workplace, setWorkplace] = useState(profile.workplace ?? '');

  // 배송 연락처를 아직 따로 저장한 적 없으면(deliveryPhone null) 가입 시 입력한 연락처를 기본값으로 사용
  const [phone, setPhone] = useState(profile.deliveryPhone ?? profile.phone ?? '');
  // 받는 사람(퀵배송·택배 전용) — 주문자와 실제 수령인이 다를 수 있어 별도로 저장, 지정 안 했으면 회원 이름을 기본값으로 사용
  const [recipientName, setRecipientName] = useState(profile.deliveryRecipientName ?? profile.name ?? '');

  // 자택으로 받기 전용: 회수지(주소+공동현관 비밀번호 전부)를 배송지와 다르게 지정하고 싶을 때만
  // 끔(기본은 동일). 끄면 항상 빈 입력란부터 새로 입력하게 함(이전에 켜져 있을 때 값 남아있지 않도록).
  const [sameAsDelivery, setSameAsDelivery] = useState(true);
  const [returnAddress, setReturnAddress] = useState('');
  const [returnJibun, setReturnJibun] = useState('');
  const [returnDetailAddress, setReturnDetailAddress] = useState('');
  const [returnEntrancePassword, setReturnEntrancePassword] = useState('');

  // 근무지로 받기 전용: 회수 근무지가 배송 근무지와 다를 때만 끔(기본은 동일) — 자택 쪽과 동일한 패턴이며
  // 완전히 독립된 state를 씀(자택 회수지와 섞이지 않도록).
  const [sameAsWorkplaceDelivery, setSameAsWorkplaceDelivery] = useState(true);
  const [returnWorkplaceAddress, setReturnWorkplaceAddress] = useState('');
  const [returnWorkplaceJibun, setReturnWorkplaceJibun] = useState('');
  const [returnWorkplaceDetailAddress, setReturnWorkplaceDetailAddress] = useState('');

  // "기본 배송지 등록"/"즐겨찾기 추가" 토글 — 켜면 별칭을 입력받는 팝업이 뜨고, 확인하면 바로
  // 즐겨찾기에 등록된다(토글 자체는 상태를 들고 있지 않고, 팝업이 닫히면 항상 꺼진 상태로 되돌아감).
  // 두 토글이 같은 팝업을 공유하되 registerIsDefault로 기본 배송지 지정 여부만 다르게 저장한다.
  const [registerToggleOn, setRegisterToggleOn] = useState(false);
  const [favoriteToggleOn, setFavoriteToggleOn] = useState(false);
  const [showRegisterDefaultModal, setShowRegisterDefaultModal] = useState(false);
  const [registerTargetMode, setRegisterTargetMode] = useState<'home' | 'workplace' | null>(null);
  const [registerIsDefault, setRegisterIsDefault] = useState(true);
  const [registerLabel, setRegisterLabel] = useState('');
  const [registerMsg, setRegisterMsg] = useState<string | null>(null);
  const [registerPending, setRegisterPending] = useState(false);

  // "기본 배송지" 알약을 눌렀는데 등록된 기본 배송지가 없을 때 띄우는 안내 팝업
  const [showNoDefaultModal, setShowNoDefaultModal] = useState(false);

  // 주소록 — 자택/근무지/회수 주소 각각 독립적으로 관리(회수 주소는 자택과 같은 "자택" 풀을 씀).
  // bookContext는 지금 어느 섹션에서 알약을 눌렀는지를 기억해, 그 섹션에 맞는 모드로 목록을 필터링하고
  // 불러온 값을 어느 입력란에 채울지 정한다.
  const [addressBook, setAddressBook] = useState<AddressBookEntry[]>([]);
  const [showAddressBookModal, setShowAddressBookModal] = useState(false);
  const [bookContext, setBookContext] = useState<'home' | 'workplace' | 'return'>('home');
  const [bookMsg, setBookMsg] = useState<string | null>(null);
  const [bookPending, setBookPending] = useState(false);

  // 주소록 항목 수정
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editJibun, setEditJibun] = useState('');
  const [editZonecode, setEditZonecode] = useState('');
  const [editDetailAddress, setEditDetailAddress] = useState('');
  const [editEntrancePassword, setEditEntrancePassword] = useState('');
  const [editWorkplace, setEditWorkplace] = useState('');
  const [editPhone, setEditPhone] = useState('');

  /** 주소록 항목의 값을 해당 모드 전용 입력란에 채운다(모드 전환은 하지 않음) */
  function applyEntryFields(entry: AddressBookEntry) {
    if (entry.mode === 'home') {
      setHomeAddress(entry.address ?? '');
      setHomeJibun(entry.jibun ?? '');
      setHomeZonecode(entry.zonecode ?? '');
      setHomeDetailAddress(entry.detailAddress ?? '');
      setEntrancePassword(entry.entrancePassword ?? '');
    } else if (entry.mode === 'workplace') {
      setWorkplaceAddress(entry.address ?? '');
      setWorkplaceJibun(entry.jibun ?? '');
      setWorkplaceDetailAddress(entry.detailAddress ?? '');
      setWorkplace(entry.workplace ?? '');
    }
    if (entry.phone) setPhone(entry.phone);
  }

  /** 알약이 눌린 섹션(자택/근무지/회수 주소)에 맞는 주소록 모드를 돌려준다 — 회수 주소는 자택 풀을 재사용 */
  function contextMode(context: 'home' | 'workplace' | 'return'): DeliveryMode {
    return context === 'workplace' ? 'workplace' : 'home';
  }

  /** 주소록 항목을 지금 컨텍스트(자택/근무지/회수 주소)에 맞는 입력란에 채운다 */
  function loadEntryInto(entry: AddressBookEntry, context: 'home' | 'workplace' | 'return') {
    if (context === 'return') {
      setReturnAddress(entry.address ?? '');
      setReturnJibun(entry.jibun ?? '');
      setReturnDetailAddress(entry.detailAddress ?? '');
      setReturnEntrancePassword(entry.entrancePassword ?? '');
      if (entry.phone) setPhone(entry.phone);
    } else {
      applyEntryFields(entry);
    }
    setErr(null); setOk(false);
  }

  useEffect(() => {
    listAddressBook().then((entries) => {
      setAddressBook(entries);
    });
  }, []);

  function currentModeSummary(m: 'home' | 'workplace'): string {
    if (m === 'home') return [homeAddress, homeDetailAddress].filter(Boolean).join(' ') || '(주소 없음)';
    return [workplaceAddress, workplaceDetailAddress].filter(Boolean).join(' ') || '(주소 없음)';
  }

  function openRegisterModal(m: 'home' | 'workplace', asDefault: boolean) {
    setRegisterTargetMode(m);
    setRegisterIsDefault(asDefault);
    setRegisterLabel('');
    setRegisterMsg(null);
    setShowRegisterDefaultModal(true);
  }

  function closeRegisterModal() {
    setShowRegisterDefaultModal(false);
    setRegisterToggleOn(false);
    setFavoriteToggleOn(false);
    setRegisterTargetMode(null);
  }

  async function confirmRegisterDefault() {
    if (!registerLabel.trim()) { setRegisterMsg('별칭을 입력해주세요.'); return; }
    if (!registerTargetMode) return;
    setRegisterPending(true);
    const isHome = registerTargetMode === 'home';
    const res = await saveToAddressBook({
      label: registerLabel,
      mode: registerTargetMode,
      address: isHome ? homeAddress : workplaceAddress,
      jibun: isHome ? homeJibun : workplaceJibun,
      zonecode: isHome ? homeZonecode : undefined,
      detailAddress: isHome ? homeDetailAddress : workplaceDetailAddress,
      entrancePassword: isHome ? entrancePassword : undefined,
      workplace: !isHome ? workplace : undefined,
      phone,
      isDefault: registerIsDefault,
    });
    setRegisterPending(false);
    if (res.ok) {
      setAddressBook(await listAddressBook());
      closeRegisterModal();
    } else {
      setRegisterMsg(res.reason ?? '등록에 실패했습니다.');
    }
  }

  async function makeDefaultEntry(id: string) {
    setBookPending(true);
    await setDefaultAddressBookEntry(id);
    setAddressBook(await listAddressBook());
    setBookPending(false);
  }

  async function removeEntry(id: string) {
    setBookPending(true);
    await deleteAddressBookEntry(id);
    setAddressBook(await listAddressBook());
    setBookPending(false);
  }

  function startEdit(entry: AddressBookEntry) {
    setEditingId(entry.id);
    setEditLabel(entry.label);
    setEditAddress(entry.address ?? '');
    setEditJibun(entry.jibun ?? '');
    setEditZonecode(entry.zonecode ?? '');
    setEditDetailAddress(entry.detailAddress ?? '');
    setEditEntrancePassword(entry.entrancePassword ?? '');
    setEditWorkplace(entry.workplace ?? '');
    setEditPhone(entry.phone ?? '');
    setBookMsg(null);
  }

  function cancelEdit() {
    setEditingId(null);
  }

  async function saveEdit(id: string) {
    if (!editLabel.trim()) { setBookMsg('이름을 입력해주세요.'); return; }
    setBookPending(true);
    const res = await updateAddressBookEntry(id, {
      label: editLabel,
      address: editAddress,
      jibun: editJibun,
      zonecode: editZonecode,
      detailAddress: editDetailAddress,
      entrancePassword: editEntrancePassword,
      workplace: editWorkplace,
      phone: editPhone,
    });
    setBookPending(false);
    if (res.ok) {
      setEditingId(null);
      setBookMsg('수정했어요.');
      setAddressBook(await listAddressBook());
    } else {
      setBookMsg(res.reason ?? '수정에 실패했습니다.');
    }
  }

  /** "기본 배송지" 알약 클릭 — 그 섹션(자택/근무지/회수 주소) 모드의 기본 배송지만 불러온다. 없으면 안내 팝업만 띄움 */
  function clickDefaultPill(context: 'home' | 'workplace' | 'return') {
    const def = addressBook.find((e) => e.mode === contextMode(context) && e.isDefault);
    if (def) {
      loadEntryInto(def, context);
    } else {
      setShowNoDefaultModal(true);
    }
  }

  function openBookModal(context: 'home' | 'workplace' | 'return') {
    setBookContext(context);
    setShowAddressBookModal(true);
  }

  function closeBookModal() {
    setShowAddressBookModal(false);
    setEditingId(null);
  }

  function selectMode(next: Mode) {
    setErr(null); setOk(false);
    setMode((cur) => (cur === next ? null : next));
  }

  async function save(): Promise<{ ok: boolean; reason?: string }> {
    if (!mode) { const reason = '배송 방법을 선택해주세요.'; setErr(reason); setOk(false); return { ok: false, reason }; }
    setErr(null); setOk(false);
    setPending(true);
    try {
      const isHome = mode === 'home';
      const isWorkplace = mode === 'workplace';
      const isPickup = mode === 'pickup';

      const currentAddress = isHome ? homeAddress : isWorkplace ? workplaceAddress : '';
      const currentJibun = isHome ? homeJibun : isWorkplace ? workplaceJibun : '';
      const currentDetail = isHome ? homeDetailAddress : isWorkplace ? workplaceDetailAddress : '';

      const finalAddress = isPickup ? undefined : currentAddress;
      const finalDetail = isPickup ? undefined : currentDetail;
      const finalJibun = isPickup ? undefined : currentJibun;
      const finalEntrance = isHome ? entrancePassword : undefined;
      const finalZonecode = isHome ? homeZonecode : undefined;
      const finalWorkplace = isWorkplace ? workplace : undefined;
      const finalDeliveryMessage = isHome ? deliveryMessage : undefined;

      // "회수 주소/근무지 동일" 껐을 때만 따로 입력한 회수지 사용, 그 외엔 배송지와 전부 동일.
      // 자택·근무지 각각 독립된 회수 state를 쓴다(자택 회수지와 근무지 회수지가 서로 안 섞이도록).
      const useSeparateReturn = (isHome && !sameAsDelivery) || (isWorkplace && !sameAsWorkplaceDelivery);
      const returnSrcAddress = isHome ? returnAddress : returnWorkplaceAddress;
      const returnSrcJibun = isHome ? returnJibun : returnWorkplaceJibun;
      const returnSrcDetail = isHome ? returnDetailAddress : returnWorkplaceDetailAddress;
      // 자택만 회수지에 "공동현관 비밀번호"가 있음(근무지 회수지엔 해당 입력란이 없음)
      const returnSrcEntranceOrLocation = isHome ? returnEntrancePassword : undefined;

      const finalReturnAddress = isPickup ? undefined : (useSeparateReturn ? returnSrcAddress : finalAddress);
      const finalReturnJibun = isPickup ? undefined : (useSeparateReturn ? returnSrcJibun : finalJibun);
      const finalReturnDetail = isPickup ? undefined : (useSeparateReturn ? returnSrcDetail : finalDetail);
      const finalReturnEntrance = useSeparateReturn ? returnSrcEntranceOrLocation : finalEntrance;

      const res = await updateProfile({
        // 이름/전화번호/마케팅 동의는 이 화면에서 편집하지 않으므로 profile의 기존 값 그대로 같이 전송
        name: profile.name,
        phone: profile.phone ?? '',
        marketingLookbook: profile.marketingLookbook,
        marketingPromotion: profile.marketingPromotion,
        marketingDaily: profile.marketingDaily,
        deliveryAddress: finalAddress,
        deliveryJibun: finalJibun,
        deliveryZonecode: finalZonecode,
        deliveryDetailAddress: finalDetail,
        entrancePassword: finalEntrance,
        deliveryMessage: finalDeliveryMessage,
        returnAddress: finalReturnAddress,
        returnJibun: finalReturnJibun,
        returnDetailAddress: finalReturnDetail,
        returnEntrancePassword: finalReturnEntrance,
        deliveryPhone: phone,
        deliveryRecipientName: recipientName,
        workplace: finalWorkplace,
        deliveryInStore: isPickup,
        returnInStore: isPickup,
      });
      if (res.ok) {
        setOk(true);
        router.refresh();
        onSaved?.();
        return { ok: true };
      }
      const reason = res.reason ?? '저장에 실패했습니다.';
      setErr(reason);
      return { ok: false, reason };
    } finally {
      setPending(false);
    }
  }

  useImperativeHandle(ref, () => ({ save }));

  function renderAddressPills(context: 'home' | 'workplace' | 'return') {
    return (
      <div className="addr-pills">
        <button type="button" className="size-chip pickable" onClick={() => clickDefaultPill(context)}>
          {context === 'workplace' ? '기본 근무지' : '기본 배송지'}
        </button>
        <button type="button" className="size-chip pickable" onClick={() => openBookModal(context)}>즐겨찾기</button>
      </div>
    );
  }

  const filteredAddressBook = addressBook.filter((e) => e.mode === contextMode(bookContext));

  const addressBookModal = showAddressBookModal && (
    <div className="wd-ov" onClick={(e) => e.target === e.currentTarget && closeBookModal()}>
      <div className="legal-box">
        <div className="legal-title">즐겨찾기{bookContext === 'workplace' ? ' (근무지)' : ' (자택)'}</div>
        <div className="legal-body">
          <div className="addr-book-panel">
            {filteredAddressBook.length === 0 && <p className="hint" style={{ margin: 0 }}>저장된 주소가 아직 없어요.</p>}
            {filteredAddressBook.map((e) => (
              <div className="addr-book-item" key={e.id}>
                {editingId === e.id ? (
                  <div className="addr-book-edit">
                    <input className="field" placeholder="이름" value={editLabel} onChange={(ev) => setEditLabel(ev.target.value)} />
                    {e.mode !== 'pickup' && (
                      <>
                        <div className="addr-row">
                          <input className="field" placeholder="주소" value={editAddress} onChange={(ev) => setEditAddress(ev.target.value)} />
                          <button
                            type="button"
                            className="cta ghost addr-btn"
                            onClick={() => openAddressSearch((r) => { setEditAddress(r.roadAddress); setEditJibun(r.jibunAddress); setEditZonecode(r.zonecode); })}
                          >주소 검색</button>
                        </div>
                        {(editJibun || editZonecode) && (
                          <div className="addr-jibun">
                            {editJibun ? `지번 주소: ${editJibun}` : ''}{editJibun && editZonecode ? ' · ' : ''}{editZonecode ? `우편번호: ${editZonecode}` : ''}
                          </div>
                        )}
                        <input
                          className="field"
                          placeholder={e.mode === 'home' ? '세부 주소 (건물명, 호수)' : '근무지 상호명 입력'}
                          value={editDetailAddress}
                          onChange={(ev) => setEditDetailAddress(ev.target.value)}
                        />
                      </>
                    )}
                    {e.mode === 'home' && (
                      <input className="field" placeholder="공동현관 비밀번호" value={editEntrancePassword} onChange={(ev) => setEditEntrancePassword(ev.target.value)} />
                    )}
                    {e.mode === 'workplace' && (
                      <input className="field" placeholder="배송 상세 위치" value={editWorkplace} onChange={(ev) => setEditWorkplace(ev.target.value)} />
                    )}
                    <input
                      className="field"
                      placeholder="전화번호"
                      value={formatPhone(editPhone)}
                      onChange={(ev) => setEditPhone(ev.target.value.replace(/\D/g, '').slice(0, 11))}
                    />
                    <div className="addr-book-edit-actions">
                      <button type="button" className="cta ghost addr-book-btn" disabled={bookPending} onClick={cancelEdit}>취소</button>
                      <button type="button" className="cta addr-book-btn" disabled={bookPending} onClick={() => void saveEdit(e.id)}>저장</button>
                    </div>
                  </div>
                ) : (
                  <>
                    <button
                      type="button"
                      className="addr-book-info"
                      onClick={() => { loadEntryInto(e, bookContext); closeBookModal(); }}
                    >
                      <div className="addr-book-label-row">
                        <span className="addr-book-label-text">{e.label}</span>
                        {e.isDefault && <span className="addr-book-default">기본 배송지</span>}
                      </div>
                      <div className="addr-book-summary">{summarizeEntry(e)}</div>
                    </button>
                    <div className="addr-book-actions">
                      {!e.isDefault && (
                        <button type="button" className="size-chip pickable" disabled={bookPending} onClick={() => void makeDefaultEntry(e.id)}>기본 배송지로 변경</button>
                      )}
                      <button type="button" className="addr-book-edit-btn" disabled={bookPending} onClick={() => startEdit(e)} aria-label="수정">
                        <svg viewBox="0 0 24 24" width="13" height="13" aria-hidden="true">
                          <g transform="rotate(45 12 12)">
                            <rect x="9" y="2" width="6" height="4" rx="1" fill="currentColor" opacity="0.55" />
                            <rect x="9" y="6" width="6" height="12" fill="currentColor" />
                            <polygon points="9,18 15,18 12,22" fill="currentColor" />
                          </g>
                        </svg>
                      </button>
                      <button type="button" className="addr-book-del" disabled={bookPending} onClick={() => void removeEntry(e.id)} aria-label="삭제">×</button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
          {bookMsg && <div className="hint">{bookMsg}</div>}
        </div>
        <button className="cta" style={{ width: '100%' }} onClick={closeBookModal}>닫기</button>
      </div>
    </div>
  );

  const registerDefaultModal = showRegisterDefaultModal && (
    <div className="wd-ov" onClick={(e) => e.target === e.currentTarget && closeRegisterModal()}>
      <div className="wd-box">
        <div className="wd-title wd-title-fit">{registerIsDefault ? '기본 배송지로 등록' : '즐겨찾기 추가'}</div>
        <p className="wd-desc">{registerTargetMode && currentModeSummary(registerTargetMode)}</p>
        <input
          className="field"
          placeholder="별칭 (예: 우리집, 회사)"
          value={registerLabel}
          onChange={(e) => setRegisterLabel(e.target.value)}
          autoFocus
        />
        {registerMsg && <div className="hint err">{registerMsg}</div>}
        <div className="wd-btns wd-btns-fit">
          <button className="cta ghost" onClick={closeRegisterModal}>취소</button>
          <button className="cta" disabled={registerPending} onClick={() => void confirmRegisterDefault()}>
            {registerPending ? '등록 중…' : '등록'}
          </button>
        </div>
      </div>
    </div>
  );

  const noDefaultModal = showNoDefaultModal && (
    <div className="wd-ov" onClick={(e) => e.target === e.currentTarget && setShowNoDefaultModal(false)}>
      <div className="wd-box">
        <div className="wd-title">기본 배송지가 없어요</div>
        <p className="wd-desc">기본배송지가 등록되어 있지않아요.</p>
        <button className="cta" style={{ width: '100%' }} onClick={() => setShowNoDefaultModal(false)}>확인</button>
      </div>
    </div>
  );

  const recipientField = restrictedToHome && (
    <div className="phone-row" style={{ marginTop: 8, alignItems: 'center' }}>
      <span className="field-section field-section-plain" style={{ margin: 0, flexShrink: 0 }}>받는 사람</span>
      <input
        className="field"
        style={{ textAlign: 'right' }}
        placeholder="받는 분 성함"
        value={recipientName}
        onChange={(e) => setRecipientName(e.target.value)}
      />
    </div>
  );

  const phoneField = (
    <div className="phone-row" style={{ marginTop: 8, alignItems: 'center' }}>
      <span className="field-section field-section-plain" style={{ margin: 0, flexShrink: 0 }}>전화번호</span>
      <input
        className="field field-phone-fit"
        style={{ textAlign: 'right' }}
        placeholder="010-0000-0000"
        value={formatPhone(phone)}
        onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 11))}
      />
    </div>
  );

  const saveTail = (
    <>
      {err && <div className="hint err">{err}</div>}
      {ok && <div className="hint" style={{ color: 'var(--sage)' }}>저장되었습니다.</div>}
      {showSaveButton && (
        <button type="button" className="cta cta-fit" disabled={pending} onClick={() => void save()} style={{ marginTop: 8 }}>
          {pending ? '저장 중…' : '배송 정보 저장'}
        </button>
      )}
    </>
  );

  // 근무지/직접 픽업·회수는 기존과 동일하게 맨 끝에 받는사람+전화번호+저장 버튼을 붙인다.
  // 자택 모드는 전화번호가 배송 메시지 바로 아래로 올라가므로 footer엔 저장 버튼만 남는다.
  const footer = (
    <>
      {recipientField}
      {phoneField}
      {saveTail}
    </>
  );

  return (
    <>
    {showModeButtons && (
    <div className="delivery-mode-row">
      <button type="button" className={`cta ghost delivery-mode-btn ${mode === 'home' ? 'active' : ''}`} onClick={() => selectMode('home')}>
        집으로 받기
      </button>
      {mode === 'home' && (
        <div className="optional-panel">
          <div className="field-section-row" style={{ marginTop: 0 }}>
            <div className="field-section" style={{ margin: 0 }}>배송 주소</div>
            {renderAddressPills('home')}
          </div>
          <div className="addr-row">
            <input className="field" placeholder="배송 주소" value={homeAddress} onChange={(e) => setHomeAddress(e.target.value)} />
            <button
              type="button"
              className="cta ghost addr-btn"
              onClick={() => openAddressSearch((r) => { setHomeAddress(r.roadAddress); setHomeJibun(r.jibunAddress); setHomeZonecode(r.zonecode); })}
            >주소 검색</button>
          </div>
          {(homeJibun || homeZonecode) && (
            <div className="addr-jibun">
              {homeJibun ? `지번 주소: ${homeJibun}` : ''}{homeJibun && homeZonecode ? ' · ' : ''}{homeZonecode ? `우편번호: ${homeZonecode}` : ''}
            </div>
          )}
          <input className="field" placeholder="세부 주소 (건물명, 호수)" value={homeDetailAddress} onChange={(e) => setHomeDetailAddress(e.target.value)} />

          {!isParcelDelivery && (
            <div className="phone-row" style={{ marginTop: 8, alignItems: 'center' }}>
              <span className="field-section field-section-plain" style={{ margin: 0, flexShrink: 0 }}>공동현관 비밀번호</span>
              <input className="field" style={{ textAlign: 'right' }} placeholder="자유 출입시 미기재" value={entrancePassword} onChange={(e) => setEntrancePassword(e.target.value)} />
            </div>
          )}

          <div className="phone-row" style={{ marginTop: 8, alignItems: 'center' }}>
            <span className="field-section field-section-plain" style={{ margin: 0, flexShrink: 0 }}>배송 메시지</span>
            <input className="field" style={{ textAlign: 'right' }} value={deliveryMessage} onChange={(e) => setDeliveryMessage(e.target.value)} />
          </div>

          {recipientField}
          {phoneField}

          <div className="toggle-group-row" style={{ marginTop: 8 }}>
            <label className="toggle-group-item">
              <span>기본 배송지 등록</span>
              <span className="ios-toggle">
                <input
                  type="checkbox"
                  checked={registerToggleOn}
                  onChange={(e) => { setRegisterToggleOn(e.target.checked); if (e.target.checked) openRegisterModal('home', true); }}
                />
                <span className="ios-slider" />
              </span>
            </label>

            <label className="toggle-group-item">
              <span>즐겨찾기 추가</span>
              <span className="ios-toggle">
                <input
                  type="checkbox"
                  checked={favoriteToggleOn}
                  onChange={(e) => { setFavoriteToggleOn(e.target.checked); if (e.target.checked) openRegisterModal('home', false); }}
                />
                <span className="ios-slider" />
              </span>
            </label>

            {!restrictedToHome && (
              <label className="toggle-group-item">
                <span>반납 주소 동일</span>
                <span className="ios-toggle">
                  <input type="checkbox" checked={sameAsDelivery} onChange={(e) => setSameAsDelivery(e.target.checked)} />
                  <span className="ios-slider" />
                </span>
              </label>
            )}
          </div>

          {!restrictedToHome && !sameAsDelivery && (
            <>
              <p className="hint return-addr-hint" style={{ marginTop: 14 }}>회수 장소가 불분명한 경우에는 비워두시고 카카오톡 채널로 연락 주세요.</p>
              <div className="field-section-row" style={{ marginTop: 0 }}>
                <div className="field-section" style={{ margin: 0 }}>회수 주소</div>
                {renderAddressPills('return')}
              </div>
              <div className="addr-row">
                <input className="field" placeholder="회수 주소" value={returnAddress} onChange={(e) => setReturnAddress(e.target.value)} />
                <button
                  type="button"
                  className="cta ghost addr-btn"
                  onClick={() => openAddressSearch((r) => { setReturnAddress(r.roadAddress); setReturnJibun(r.jibunAddress); })}
                >주소 검색</button>
              </div>
              {returnJibun && <div className="addr-jibun">지번 주소: {returnJibun}</div>}
              <input className="field" placeholder="세부 주소 (건물명, 호수)" value={returnDetailAddress} onChange={(e) => setReturnDetailAddress(e.target.value)} />

              <div className="field-section" style={{ marginTop: 14, marginBottom: 0 }}>공동현관 비밀번호</div>
              <input
                className="field"
                placeholder="공동현관 비밀번호 (자유 출입시 미기재)"
                value={returnEntrancePassword}
                onChange={(e) => setReturnEntrancePassword(e.target.value)}
              />
            </>
          )}

          {saveTail}
        </div>
      )}

      {!restrictedToHome && (
      <button
        type="button"
        className={`cta ghost delivery-mode-btn ${mode === 'workplace' ? 'active' : ''}`}
        onClick={() => selectMode('workplace')}
      >
        근무지로 받기
      </button>
      )}
      {!restrictedToHome && mode === 'workplace' && (
        <div className="optional-panel">
          <div className="field-section-row" style={{ marginTop: 0 }}>
            <div className="field-section" style={{ margin: 0 }}>근무지 주소</div>
            {renderAddressPills('workplace')}
          </div>
          <div className="addr-row">
            <input className="field" placeholder="근무지 주소" value={workplaceAddress} onChange={(e) => setWorkplaceAddress(e.target.value)} />
            <button
              type="button"
              className="cta ghost addr-btn"
              onClick={() => openAddressSearch((r) => { setWorkplaceAddress(r.roadAddress); setWorkplaceJibun(r.jibunAddress); })}
            >주소 검색</button>
          </div>
          {workplaceJibun && <div className="addr-jibun">지번 주소: {workplaceJibun}</div>}
          <input className="field" placeholder="근무지 상호명 입력" value={workplaceDetailAddress} onChange={(e) => setWorkplaceDetailAddress(e.target.value)} />
          <input className="field" style={{ marginTop: 8 }} placeholder="배송 상세 위치 (ex. 대기실 테이블 위, 10번 로커 등)" value={workplace} onChange={(e) => setWorkplace(e.target.value)} />

          {phoneField}

          <div className="toggle-group-row" style={{ marginTop: 8 }}>
            <label className="toggle-group-item">
              <span>기본 근무지 등록</span>
              <span className="ios-toggle">
                <input
                  type="checkbox"
                  checked={registerToggleOn}
                  onChange={(e) => { setRegisterToggleOn(e.target.checked); if (e.target.checked) openRegisterModal('workplace', true); }}
                />
                <span className="ios-slider" />
              </span>
            </label>

            <label className="toggle-group-item">
              <span>즐겨찾기 추가</span>
              <span className="ios-toggle">
                <input
                  type="checkbox"
                  checked={favoriteToggleOn}
                  onChange={(e) => { setFavoriteToggleOn(e.target.checked); if (e.target.checked) openRegisterModal('workplace', false); }}
                />
                <span className="ios-slider" />
              </span>
            </label>

            <label className="toggle-group-item">
              <span>이 근무지에서 회수</span>
              <span className="ios-toggle">
                <input type="checkbox" checked={sameAsWorkplaceDelivery} onChange={(e) => setSameAsWorkplaceDelivery(e.target.checked)} />
                <span className="ios-slider" />
              </span>
            </label>
          </div>

          {!sameAsWorkplaceDelivery && (
            <>
              <p className="hint return-addr-hint" style={{ marginTop: 14 }}>회수 장소가 불분명한 경우에는 비워두시고 카카오톡 채널로 연락 주세요.</p>
              <div className="field-section" style={{ marginTop: 0, marginBottom: 0 }}>회수 주소</div>
              <div className="addr-row">
                <input className="field" placeholder="회수 주소" value={returnWorkplaceAddress} onChange={(e) => setReturnWorkplaceAddress(e.target.value)} />
                <button
                  type="button"
                  className="cta ghost addr-btn"
                  onClick={() => openAddressSearch((r) => { setReturnWorkplaceAddress(r.roadAddress); setReturnWorkplaceJibun(r.jibunAddress); })}
                >주소 검색</button>
              </div>
              {returnWorkplaceJibun && <div className="addr-jibun">지번 주소: {returnWorkplaceJibun}</div>}
              <input
                className="field"
                placeholder="세부 주소 (건물명, 호수)"
                value={returnWorkplaceDetailAddress}
                onChange={(e) => setReturnWorkplaceDetailAddress(e.target.value)}
              />
            </>
          )}

          {saveTail}
        </div>
      )}

      {!restrictedToHome && showPickupOption && (
      <button
        type="button"
        className={`cta ghost delivery-mode-btn ${mode === 'pickup' ? 'active' : ''}`}
        onClick={() => selectMode('pickup')}
      >
        직접 픽업·회수
      </button>
      )}
      {!restrictedToHome && showPickupOption && mode === 'pickup' && (
        <div className="optional-panel">
          <p className="hint" style={{ margin: 0 }}>매장에서 직접 픽업하고 반납도 매장으로 직접 가져다주시면 돼요.</p>
          {footer}
        </div>
      )}

    </div>
    )}
    {addressBookModal}
    {registerDefaultModal}
    {noDefaultModal}
    </>
  );
});

export default DeliveryInfoForm;
