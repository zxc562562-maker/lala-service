const won = (n: number) => n.toLocaleString('ko-KR') + '원';

export default function GuidePage() {
  return (
    <section className="guide-page">
      <div className="guide-hero">
        <span className="eyebrow">Guide</span>
        <h1 className="guide-title">이용안내</h1>
        <p className="guide-sub">가입부터 반납까지, Lala를 이용하는 전체 흐름을 정리했어요.</p>
      </div>

      <div className="guide-phase">
        <div className="field-section guide-phase-label">1. 처음 한 번 — 멤버십 가입</div>
        <div className="guide-flow-row">
          <span className="guide-chip">회원가입</span><span className="guide-arrow">→</span>
          <span className="guide-chip">가입비 결제</span><span className="guide-arrow">→</span>
          <span className="guide-chip">승인 대기</span><span className="guide-arrow">→</span>
          <span className="guide-chip">승인 완료</span>
        </div>
      </div>
      <div className="guide-phase">
        <div className="field-section guide-phase-label">2. 빌릴 때마다 — 예약 사이클</div>
        <div className="guide-flow-row">
          <span className="guide-chip">룩 둘러보기</span><span className="guide-arrow">→</span>
          <span className="guide-chip">예약</span><span className="guide-arrow">→</span>
          <span className="guide-chip">배송 정보</span><span className="guide-arrow">→</span>
          <span className="guide-chip">결제</span><span className="guide-arrow">→</span>
          <span className="guide-chip">배송</span><span className="guide-arrow">→</span>
          <span className="guide-chip">착용</span><span className="guide-arrow">→</span>
          <span className="guide-chip">반납</span>
        </div>
      </div>
      <p className="guide-note">멤버십 승인은 한 번만 받으면 되고, 이후에는 마음에 드는 룩이 생길 때마다 예약 사이클을 반복하시면 돼요.</p>

      <section className="guide-section">
        <div className="guide-section-eyebrow"><span className="guide-num">01</span><span className="eyebrow">가입 · 승인</span></div>
        <h2 className="guide-h2">가입하고 멤버가 되기</h2>
        <p className="guide-lede">Lala는 승인제 멤버십으로 운영돼요. 가입 신청 후 가입비를 결제하면, 디렉터·슈퍼바이저의 승인을 거쳐 정식 멤버가 됩니다.</p>
        <ol className="guide-steps">
          <li><span className="guide-dot">1</span><span>이름·전화번호 인증 후 원하는 ID·비밀번호로 <b>회원가입</b>을 진행해요.</span></li>
          <li><span className="guide-dot">2</span><span>가입 직후 <b>멤버십 가입비</b> 결제 화면으로 이동해요.</span></li>
          <li><span className="guide-dot">3</span><span>결제가 완료되면 계정 상태가 <b>승인 대기</b>로 바뀌어요.</span></li>
          <li><span className="guide-dot">4</span><span>디렉터·슈퍼바이저가 확인 후 <b>승인</b>하면, 모든 기능을 이용할 수 있어요.</span></li>
        </ol>
        <div className="guide-card">
          <div className="guide-card-label">가입비</div>
          <p>멤버십 가입비는 {won(100000)}이며, 가입 시 한 번만 결제해요.</p>
        </div>
      </section>

      <section className="guide-section">
        <div className="guide-section-eyebrow"><span className="guide-num">02</span><span className="eyebrow">룩북</span></div>
        <h2 className="guide-h2">룩북 둘러보기</h2>
        <p className="guide-lede">세 가지 방식으로 룩을 둘러볼 수 있어요. 화면 상단 아이콘으로 언제든 전환할 수 있습니다.</p>
        <div className="summary">
          <div className="row"><span>한 개씩 보기</span><span>룩 하나씩 크게</span></div>
          <div className="row"><span>여러 개 한번에 보기</span><span>여러 룩을 격자로</span></div>
          <div className="row"><span>전체 상품 보기</span><span>낱개 상품 · 카테고리 필터</span></div>
        </div>
        <p style={{ marginTop: 14 }}>가입 전에는 일부 룩만 미리보기로 볼 수 있고, 멤버십 승인 후에는 전체 룩과 상품을 모두 볼 수 있어요.</p>
      </section>

      <section className="guide-section">
        <div className="guide-section-eyebrow"><span className="guide-num">03</span><span className="eyebrow">예약</span></div>
        <h2 className="guide-h2">사이즈 고르고 예약하기</h2>
        <ol className="guide-steps">
          <li><span className="guide-dot">1</span><span>마음에 드는 상품의 <b>사이즈</b>를 고르고 <b>담기</b>를 누르면 카트에 담겨요.</span></li>
          <li><span className="guide-dot">2</span><span>카트에서 달력을 열어 <b>예약일과 반납일</b>을 선택해요. 이미 대여 중이거나 휴무일인 날짜는 고를 수 없어요.</span></li>
        </ol>
        <div className="guide-card">
          <div className="guide-card-label">요금 계산</div>
          <p>실제 청구되는 대여일수는 휴무일을 뺀 날짜만 계산돼요. 예를 들어 토요일에 받아 월요일에 반납하고 일요일이 휴무라면, 하루 치만 청구됩니다.</p>
        </div>
        <div className="guide-card">
          <div className="guide-card-label">세탁 여유일</div>
          <p>반납 다음 날은 세탁을 위해 하루 비워두기 때문에, 다른 회원이 곧바로 예약할 수 없어요.</p>
        </div>
      </section>

      <section className="guide-section">
        <div className="guide-section-eyebrow"><span className="guide-num">04</span><span className="eyebrow">배송 정보</span></div>
        <h2 className="guide-h2">받을 곳 입력하기</h2>
        <p className="guide-lede"><b style={{ color: 'var(--espresso)' }}>집으로 받기</b> 또는 <b>근무지로 받기</b> 중 하나를 골라 주소를 입력할 수 있어요.</p>
        <ol className="guide-steps">
          <li><span className="guide-dot">1</span><span>집 또는 근무지 주소, 상세 주소, 연락처를 입력해요.</span></li>
          <li><span className="guide-dot">2</span><span>자주 쓰는 주소는 <b>기본 배송지 등록</b>이나 <b>즐겨찾기 추가</b>로 저장해두면, 다음부터 알약 하나로 바로 불러올 수 있어요.</span></li>
          <li><span className="guide-dot">3</span><span>회수(반납) 장소는 기본적으로 배송지와 동일해요. 다르게 회수받고 싶을 때만 토글을 끄고 별도로 입력하세요.</span></li>
        </ol>
        <div className="guide-card">
          <div className="guide-card-label">회수 주소, 몰라도 괜찮아요</div>
          <p>회수 장소가 아직 불분명하다면 비워두셔도 돼요. 결제·저장에는 영향이 없고, 카카오톡 채널로 안내해주시면 확인 후 진행해드려요.</p>
        </div>
      </section>

      <section className="guide-section">
        <div className="guide-section-eyebrow"><span className="guide-num">05</span><span className="eyebrow">결제</span></div>
        <h2 className="guide-h2">결제하기</h2>
        <ol className="guide-steps">
          <li><span className="guide-dot">1</span><span><b>배송 방법</b>(직배송·퀵배송·택배)을 선택해요. 한 번 고르면 다음 주문 때도 자동으로 기억해서 불러와요.</span></li>
          <li><span className="guide-dot">2</span><span>배송받을 <b>시간대</b>를 오후 3시~8시 사이 1시간 단위로 선택해요.</span></li>
          <li><span className="guide-dot">3</span><span>결제 금액을 확인하고 <b>토스페이먼츠</b>로 결제를 진행해요.</span></li>
        </ol>
        <div className="summary">
          <div className="row"><span>렌탈비용</span><span>일일 요금 × 청구일수</span></div>
          <div className="row"><span>보증금</span><span>{won(50000)}</span></div>
        </div>
        <p style={{ marginTop: 14, fontSize: 12.5, color: 'var(--muted)' }}>보증금은 반납 검수를 마친 뒤 문제가 없으면 그대로 돌려드려요.</p>
      </section>

      <section className="guide-section">
        <div className="guide-section-eyebrow"><span className="guide-num">06</span><span className="eyebrow">내 렌탈</span></div>
        <h2 className="guide-h2">배송 현황 확인하기</h2>
        <p className="guide-lede"><b style={{ color: 'var(--espresso)' }}>내 렌탈</b>에서 주문이 어느 단계에 있는지 실시간으로 확인할 수 있어요.</p>
        <div className="guide-stagepills">
          <span className="resv-status">주문결제</span><span className="guide-stagesep">→</span>
          <span className="resv-status">상품검수중</span><span className="guide-stagesep">→</span>
          <span className="resv-status">배송대기중</span><span className="guide-stagesep">→</span>
          <span className="resv-status">배송중</span><span className="guide-stagesep">→</span>
          <span className="resv-status">배송완료</span><span className="guide-stagesep">→</span>
          <span className="resv-status">반납검수중</span><span className="guide-stagesep">→</span>
          <span className="resv-status">완료</span>
        </div>
        <p style={{ marginTop: 16 }}>간혹 검수 중 오염·손상이 발견되거나 오배송이 확인되면, 아래처럼 문제 상태와 저희 쪽 대응 안내가 함께 표시돼요.</p>
        <div className="guide-stagepills">
          <span className="resv-status resv-problem">상품검수중 오염, 손상 확인</span>
          <span className="resv-status resv-problem">오배송</span>
          <span className="resv-status resv-problem">반납검수중 오염, 손상 확인</span>
        </div>
      </section>

      <section className="guide-section">
        <div className="guide-section-eyebrow"><span className="guide-num">07</span><span className="eyebrow">반납</span></div>
        <h2 className="guide-h2">반납하기</h2>
        <p>반납일이 되면 등록해두신 회수 주소로 저희가 직접 방문해 회수해요. 별도로 챙기실 건 없고, 상품만 그대로 두시면 됩니다.</p>
        <p>회수가 끝나고 검수까지 마치면 주문 상태가 <b style={{ color: 'var(--espresso)' }}>완료</b>로 바뀌고, 보증금도 함께 정산돼요.</p>
      </section>

      <section className="guide-section">
        <div className="guide-section-eyebrow"><span className="guide-num">08</span><span className="eyebrow">취소 · 환불</span></div>
        <h2 className="guide-h2">취소하고 환불받기</h2>
        <p className="guide-lede"><b style={{ color: 'var(--espresso)' }}>내 렌탈</b> 화면에서 해당 주문의 <b style={{ color: 'var(--espresso)' }}>주문취소</b> 알약으로 직접 취소를 신청할 수 있어요.</p>
        <div className="summary">
          <div className="row"><span>렌탈 결제(대여료)</span><span>배송 전까지 전액 환불</span></div>
          <div className="row"><span>멤버십 가입비</span><span>승인 거절 시에만 전액 환불</span></div>
          <div className="row"><span>보증금</span><span>반납 검수 후 문제없으면 환불</span></div>
        </div>
        <div className="guide-card warn">
          <div className="guide-card-label">배송이 시작되면 취소할 수 없어요</div>
          <p>주문 상태가 &ldquo;배송중&rdquo;으로 바뀐 이후에는 이 화면에서 취소·환불을 신청할 수 없어요. 그 전까지(주문결제·상품검수중·배송대기중)는 언제든 취소하고 전액 환불받을 수 있습니다.</p>
        </div>
      </section>

      <section className="guide-section">
        <div className="guide-section-eyebrow"><span className="guide-num">09</span><span className="eyebrow">탈퇴</span></div>
        <h2 className="guide-h2">탈퇴하기</h2>
        <p><b>내 정보 &gt; 탈퇴하기</b>에서 비밀번호 확인 후 진행할 수 있어요.</p>
        <div className="guide-card warn">
          <div className="guide-card-label">탈퇴가 제한되는 경우</div>
          <p>해결되지 않은 분쟁(이의제기) 중인 주문이 있으면 탈퇴할 수 없어요. 먼저 해당 건을 해결해주세요.</p>
        </div>
        <p style={{ marginTop: 14, fontSize: 12.5, color: 'var(--muted)' }}>탈퇴하면 이름·연락처 등 개인정보는 즉시 삭제되지만, 결제·예약 기록은 법적 보관 의무에 따라 일정 기간 남아있어요.</p>
      </section>

      <section className="guide-section" style={{ borderBottom: 'none' }}>
        <div className="guide-section-eyebrow"><span className="eyebrow">자주 묻는 질문</span></div>
        <h2 className="guide-h2">FAQ</h2>
        <div className="guide-faq-item">
          <div className="guide-faq-q"><span className="q">Q.</span>정기적으로 매달 빌려 입고 싶어요.</div>
          <div className="guide-faq-a">월 정기구독을 원하시면 카카오톡 채널로 문의해 주세요.</div>
        </div>
        <div className="guide-faq-item">
          <div className="guide-faq-q"><span className="q">Q.</span>SNS 계정으로 간편 가입할 수 있나요?</div>
          <div className="guide-faq-a">카카오·네이버·구글·페이스북 간편가입은 현재 준비 중이에요. 지금은 ID로 가입해주세요.</div>
        </div>
        <div className="guide-faq-item">
          <div className="guide-faq-q"><span className="q">Q.</span>예약한 기간 중간에 휴무일이 껴 있어요.</div>
          <div className="guide-faq-a">휴무일에는 배송·반납이 이뤄지지 않을 뿐, 상품을 계속 보유하실 수 있어요. 요금도 휴무일은 빼고 계산돼요.</div>
        </div>
      </section>
    </section>
  );
}
