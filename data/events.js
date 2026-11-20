// 주간 이벤트. when(G, X)가 참일 때만 나온다. 선택지 go()는 결과 문장을 돌려준다.
// X는 js/sim/events.js의 도우미 (능력치·신뢰·인기 조절 등).
(function (root) {
  const D = (root.DATA = root.DATA || {});

  D.EVENTS = [
    // ── 고교
    {
      id: 'dawn_training', w: 3, when: (G, X) => X.school,
      title: '새벽 훈련',
      text: () => '감독님이 새벽 6시 개인 훈련에 나올 사람을 찾는다. 나오면 따로 봐 주겠다고 한다.',
      choices: [
        { label: '나간다', go: (G, X) => { X.main(1.2); X.fat(12); X.trust(4); return '일주일 내내 새벽에 나갔다. 다리는 무거운데 감독님 눈빛이 달라졌다.'; } },
        { label: '잠이 더 중요하다', go: (G, X) => { X.fat(-8); X.trust(-2); return '푹 잤다. 몸은 가벼운데 감독님이 출석부를 한 번 훑어봤다.'; } },
      ],
    },
    {
      id: 'exam', w: 3, when: (G, X) => X.school,
      title: '기말고사',
      text: () => '기말고사 주간이다. 담임 선생님이 이번엔 꼭 공부도 하라고 했다.',
      choices: [
        { label: '시험공부를 한다', go: (G, X) => { X.mental(2); X.fat(-10); return '시험은 그럭저럭 봤다. 머리를 쓰니 오히려 축구 생각이 정리됐다.'; } },
        { label: '운동장에 남는다', go: (G, X) => { X.main(0.8); X.mental(-1); X.trust(2); return '성적표는 보여 줄 수 없는 수준이 됐다. 대신 왼발 감각이 올라왔다.'; } },
      ],
    },
    {
      id: 'senior_bully', w: 2, when: (G, X) => X.school && G.p.grade === 1,
      title: '선배의 텃세',
      text: () => '3학년 선배가 공 줍기와 짐 나르기를 1학년에게만 시킨다. 오늘은 유독 심하다.',
      choices: [
        { label: '참는다', go: (G, X) => { X.mental(2); return '이를 악물고 참았다. 내년엔 저렇게 안 하겠다고 다짐했다.'; } },
        { label: '정면으로 말한다', go: (G, X) => X.chance(0.5)
          ? (X.trust(4), X.pop(3), '선배가 잠깐 노려보더니 웃었다. "배짱은 있네." 그 뒤로 패스가 오기 시작했다.')
          : (X.trust(-4), X.mental(-1), '분위기가 험악해졌다. 감독님이 둘 다 불러서 혼냈다.') },
      ],
    },
    {
      id: 'scout_rumor', w: 3, when: (G, X) => X.school && G.p.grade >= 2,
      title: '스카우트가 온다',
      text: () => '이번 주말 경기에 프로 구단 스카우트가 온다는 소문이 돌았다.',
      choices: [
        { label: '평소대로 한다', go: (G, X) => { X.mental(2); return '평소대로 했다. 긴장을 안 하는 것도 실력이라는 걸 알았다.'; } },
        { label: '이번 주는 무리해서라도 보여 준다', go: (G, X) => X.chance(0.5)
          ? (X.main(1), X.pop(4), '추가 훈련이 통했다. 스카우트 수첩에 내 이름이 적히는 걸 봤다.')
          : (X.fat(20), '너무 몰아붙였다. 경기 날 다리가 무거웠다.') },
      ],
    },
    {
      id: 'rival_youth_call', w: 2, when: (G, X) => X.school && !X.rivalGone,
      title: '라이벌 소식',
      text: (G) => `${G.p.rival.name}이(가) 연령별 대표팀 상비군에 뽑혔다는 기사가 떴다.`,
      choices: [
        { label: '자극받아 훈련량을 늘린다', go: (G, X) => { X.main(1); X.fat(10); return '밤마다 혼자 운동장을 돌았다. 지기 싫었다.'; } },
        { label: '내 갈 길을 간다', go: (G, X) => { X.mental(2); return '비교는 그만하기로 했다. 마음이 한결 가벼웠다.'; } },
      ],
    },
    {
      id: 'parents', w: 2, when: (G, X) => X.school,
      title: '부모님과의 대화',
      text: () => '저녁 식탁에서 부모님이 조심스럽게 말을 꺼냈다. 공부 쪽도 한 번 생각해 보라고.',
      choices: [
        { label: '축구로 증명하겠다고 말한다', go: (G, X) => { X.mental(3); return '한참 말이 없던 아버지가 축구화를 새로 사 주겠다고 했다.'; } },
        { label: '고민해 보겠다고 한다', go: (G, X) => { X.mental(-2); return '방에 들어와서 한참 천장만 봤다.'; } },
      ],
    },
    {
      id: 'captain', w: 2, when: (G, X) => X.school && G.p.grade === 3 && G.p.trust >= 55,
      title: '주장 추천',
      text: () => '동기들이 나를 주장으로 추천했다. 감독님도 생각해 보라고 했다.',
      choices: [
        { label: '맡는다', go: (G, X) => { X.trust(6); X.fat(4); X.mental(2); return '완장을 찼다. 해야 할 말이 많아졌다.'; } },
        { label: '경기에만 집중하겠다', go: (G, X) => { X.mental(1); return '정중하게 사양했다. 감독님은 고개를 끄덕였다.'; } },
      ],
    },
    {
      id: 'u17_camp', w: 3, when: (G, X) => X.school && X.ovr >= 54,
      title: '연령별 대표 상비군',
      text: () => 'U-17 대표팀 상비군 소집 연락이 왔다. 학교 리그 일정과 겹친다.',
      choices: [
        { label: '대표팀 훈련에 간다', go: (G, X) => { X.pop(6); X.main(1.2); X.fat(10); G.p.intl.youthCaps++; return '처음으로 태극 마크가 달린 훈련복을 입었다. 수준이 달랐다.'; } },
        { label: '학교 대회를 지킨다', go: (G, X) => { X.trust(6); return '감독님이 어깨를 두드렸다. 팀은 나를 믿게 됐다.'; } },
      ],
    },
    {
      id: 'viral_clip', w: 2, when: (G, X) => X.school && G.season.goals >= 3,
      title: '하이라이트 영상',
      text: () => '누가 찍은 내 골 영상이 SNS에서 퍼지고 있다. 조회수가 계속 오른다.',
      choices: [
        { label: '계정을 키워 본다', go: (G, X) => { X.pop(8); if (X.chance(0.2)) { X.mental(-2); return '팔로워가 늘었다. 악플도 같이 늘었다.'; } return '팔로워가 금방 천 명을 넘었다.'; } },
        { label: '조용히 넘어간다', go: (G, X) => { X.mental(1); return '휴대폰을 내려놓고 공을 찼다.'; } },
      ],
    },
    {
      id: 'torn_boots', w: 1, when: (G, X) => X.school,
      title: '찢어진 축구화',
      text: () => '축구화 옆이 찢어졌다. 새로 사기엔 이번 달 용돈이 빠듯하다.',
      choices: [
        { label: '용돈을 털어 산다', go: (G, X) => { X.mental(1); return '새 축구화는 발에 착 감겼다. 지갑은 텅 비었다.'; } },
        { label: '테이프로 감고 버틴다', go: (G, X) => X.chance(0.2) ? (X.injure(1), '경기 중에 발목이 꺾였다. 한 주 쉬어야 한다.') : (X.mental(2), '테이프 축구화로 골을 넣었다. 이 신발은 못 버리겠다.') },
      ],
    },

    // ── 프로 공통
    {
      id: 'coach_sacked', w: 2, repeat: true, when: (G, X) => X.pro && G.week >= 3 && G.week <= 10,
      title: '감독 경질',
      text: (G, X) => `${X.clubName}이(가) 성적 부진을 이유로 감독을 경질했다. 다음 주에 새 감독이 온다.`,
      choices: [
        { label: '첫 훈련부터 눈도장을 찍는다', go: (G, X) => { G.p.trust = 50; X.trust(8); X.fat(12); return '새 감독이 첫날 내 이름을 외웠다.'; } },
        { label: '평소대로 한다', go: (G, X) => { G.p.trust = 50; return '모든 선수가 같은 출발선에 섰다.'; } },
      ],
    },
    {
      id: 'big_signing', w: 2, repeat: true, when: (G, X) => X.pro && X.ovr <= G.season.spot + 2 && G.week <= 9,
      title: '경쟁자 영입',
      text: (G, X) => `${X.clubName}이(가) 내 포지션에 국가대표급 선수를 영입했다. 기자들이 내 자리를 걱정하는 기사를 썼다.`,
      choices: [
        { label: '경쟁에서 이기겠다', go: (G, X) => { G.season.spot += 3; X.mental(3); return '훈련장 공기가 달라졌다. 매일이 시험이다.'; } },
        { label: '임대를 요청한다', go: (G, X) => { G.season.spot += 3; G.p.flags.wantLoan = true; X.trust(-3); return '에이전트에게 임대처를 알아봐 달라고 했다.'; } },
      ],
    },
    {
      id: 'rival_same_club', w: 2, when: (G, X) => X.pro && !X.rivalGone && G.p.rival.ovr >= X.ovr - 6 && !X.abroad,
      onShow: (G) => { G.p.rival.club = G.p.club; },
      title: '라이벌과 한 팀',
      text: (G) => `고교 시절 라이벌 ${G.p.rival.name}이(가) 우리 팀으로 이적해 왔다. 기자들이 둘의 경쟁 구도를 기사로 쓰기 시작했다.`,
      choices: [
        { label: '"좋은 경쟁이 될 것 같다"', go: (G, X) => { X.trust(5); X.mental(1); return '악수하는 사진이 기사 1면에 실렸다.'; } },
        { label: '"제 자리는 제가 지킵니다"', go: (G, X) => { X.pop(8); X.mental(2); G.season.spot += 1; return '인터뷰가 화제가 됐다. 이제 진짜 지면 안 된다.'; } },
        { label: '인터뷰를 거절한다', go: () => '말 대신 훈련장에 먼저 나갔다.' },
      ],
    },
    {
      id: 'agent', w: 2, when: (G, X) => X.pro && X.age >= 20,
      title: '에이전트 제안',
      text: () => '유럽 쪽 인맥이 넓다는 에이전트가 연락해 왔다. 지금 에이전트와 계약이 1년 남았다.',
      choices: [
        { label: '새 에이전트와 일한다', go: (G, X) => { G.p.flags.agent = true; return '다음 이적 시장에서 더 많은 구단이 내 영상을 받게 된다.'; } },
        { label: '지금 에이전트를 믿는다', go: (G, X) => { X.mental(2); return '처음부터 함께한 사람이다. 의리를 지켰다.'; } },
      ],
    },
    {
      id: 'saudi_money', w: 2, when: (G, X) => X.pro && X.age >= 26 && X.ovr >= 70,
      title: '중동의 거액 제의',
      text: () => '사우디 구단이 지금 연봉의 다섯 배를 제시했다는 소식이 에이전트를 통해 들어왔다.',
      choices: [
        { label: '들어 보기나 하자', go: (G, X) => { G.p.flags.saudi = true; return '다음 이적 시장 제안 목록에 사우디 구단이 올라온다.'; } },
        { label: '돈보다 커리어', go: (G, X) => { X.pop(3); X.trust(3); return '구단 팬들이 SNS에 내 사진을 올리며 고마워했다.'; } },
      ],
    },
    {
      id: 'controversy', w: 4, repeat: true, when: (G, X) => X.pro && G.p.flags.pendingControversy,
      title: 'SNS 논란',
      text: () => '예전에 올린 게시물 하나가 캡처돼 퍼지고 있다. 맥락이 잘린 채로.',
      choices: [
        { label: '짧게 사과문을 올린다', go: (G, X) => { G.p.flags.pendingControversy = false; X.pop(-3); X.trust(2); return '사과문을 올리자 금방 잠잠해졌다.'; } },
        { label: '무대응', go: (G, X) => { G.p.flags.pendingControversy = false; return X.chance(0.5) ? (X.pop(-6), '며칠 더 시끄러웠다.') : '다른 이슈에 묻혀 금방 잊혔다.'; } },
        { label: '정면으로 해명한다', go: (G, X) => { G.p.flags.pendingControversy = false; return X.chance(0.5) ? (X.pop(4), '해명 영상이 오히려 호감을 샀다.') : (X.pop(-10), X.mental(-2), '해명이 또 다른 논란이 됐다.'); } },
      ],
    },
    {
      id: 'fan_signing', w: 2, repeat: true, when: (G, X) => X.pro && G.p.pop >= 10,
      title: '팬 사인회',
      text: () => '구단이 이번 주 팬 사인회에 나를 넣었다. 훈련 끝나고 바로다.',
      choices: [
        { label: '간다', go: (G, X) => { X.pop(4); X.fat(4); return '줄이 생각보다 길었다. 내 이름이 적힌 유니폼을 입은 아이도 있었다.'; } },
        { label: '컨디션 관리가 먼저', go: (G, X) => { X.fat(-5); return '구단 직원이 서운한 표정을 지었다.'; } },
      ],
    },
    {
      id: 'slump', w: 4, repeat: true, when: (G, X) => X.pro && X.recentAvg !== null && X.recentAvg < 6.4,
      title: '슬럼프',
      text: () => '최근 경기마다 뭔가 하나씩 어긋난다. 댓글 창은 열어 보지 않기로 했다.',
      choices: [
        { label: '내 경기 영상을 처음부터 다시 본다', go: (G, X) => { X.mental(3); G.p.flags.videoBonus = 2; return '안 보이던 습관이 보였다. 다음 경기에서 바로 고쳐 볼 생각이다.'; } },
        { label: '심리 상담을 받는다', go: (G, X) => { X.mental(2); X.fat(-10); return '이야기를 하고 나니 어깨가 조금 내려갔다.'; } },
        { label: '더 많이 뛰어서 털어 낸다', go: (G, X) => { X.main(0.8); X.fat(15); return '땀을 흘리는 동안만큼은 아무 생각이 안 났다.'; } },
      ],
    },
    {
      id: 'tight_hamstring', w: 4, repeat: true, when: (G, X) => G.p.fatigue >= 60 && G.p.injury === 0,
      title: '뻐근한 햄스트링',
      text: () => '허벅지 뒤쪽이 묵직하다. 의료진은 아직 괜찮다고 하는데 느낌이 좋지 않다.',
      choices: [
        { label: '이번 주는 쉬겠다고 말한다', go: (G, X) => { X.fat(-25); X.trust(-3); return '감독님은 아쉬워했지만 한 주를 쉬었다.'; } },
        { label: '참고 뛴다', go: (G, X) => X.chance(0.3) ? (X.injure(3), '경기 중에 뭔가 끊어지는 느낌이 났다. 3주 결장.') : (X.trust(2), '버텼다. 운이 좋았다.') },
      ],
    },
    {
      id: 'wedding', w: 1, when: (G, X) => X.pro,
      title: '가족 결혼식',
      text: () => '형의 결혼식이 원정 경기 전날 지방에서 있다.',
      choices: [
        { label: '다녀온다', go: (G, X) => { X.mental(3); X.fat(-4); return '오랜만에 가족들이 다 모였다. 축사는 짧게 했다.'; } },
        { label: '팀 훈련에 남는다', go: (G, X) => { X.trust(2); X.mental(-1); return '영상으로 축하 인사를 보냈다.'; } },
      ],
    },
    {
      id: 'mentor', w: 2, when: (G, X) => X.pro && X.age <= 22,
      title: '베테랑의 조언',
      text: () => '팀 최고참 선배가 훈련 끝나고 남아서 같이 해 보자고 했다.',
      choices: [
        { label: '매일 남는다', go: (G, X) => { X.main(1.5); X.fat(8); X.mental(2); return '선배는 말이 적었다. 대신 공을 어디에 둬야 하는지 보여 줬다.'; } },
        { label: '감사 인사만 한다', go: (G, X) => { X.mental(1); return '선배는 웃으며 언제든 말하라고 했다.'; } },
      ],
    },
    {
      id: 'position_change', w: 2, when: (G, X) => X.pro && G.p.pos !== 'GK',
      title: '역할 변경',
      text: (G) => ({ FW: '감독이 측면에서 시작해 안으로 파고드는 역할을 맡아 보라고 한다.', MF: '감독이 한 칸 내려와서 빌드업을 맡으라고 한다.', DF: '감독이 풀백처럼 높이 올라가 공격에 가담하라고 한다.' })[G.p.pos],
      choices: [
        { label: '해 본다', go: (G, X) => { X.trust(6); X.attr(G.p.pos === 'FW' ? 'dri' : G.p.pos === 'MF' ? 'pas' : 'spd', 1.2); return '어색했지만 감독은 만족했다.'; } },
        { label: '원래 자리가 편하다고 말한다', go: (G, X) => { X.trust(-5); return '감독의 표정이 굳었다.'; } },
      ],
    },
    {
      id: 'penalty_taker', w: 2, when: (G, X) => X.pro && (G.p.pos === 'FW' || G.p.pos === 'MF') && G.p.trust >= 60,
      title: '페널티 키커',
      text: () => '주전 페널티 키커가 다쳤다. 감독이 누가 찰 거냐고 묻는다.',
      choices: [
        { label: '제가 차겠습니다', go: (G, X) => { X.mental(2); X.pop(2); G.p.attrs[G.p.pos === 'GK' ? 'kic' : 'sho'] += 0.5; return '훈련 끝나고 매일 페널티킥 50개를 찼다.'; } },
        { label: '선배에게 양보한다', go: (G, X) => { X.trust(2); return '팀이 먼저다.'; } },
      ],
    },
    {
      id: 'renew_early', w: 2, when: (G, X) => X.pro && X.seasonAvg >= 7.0 && G.p.contract <= 2,
      title: '재계약 제안',
      text: (G, X) => `${X.clubName}이(가) 계약 연장을 제안했다. 연봉도 올려 주겠다고 한다.`,
      choices: [
        { label: '사인한다', go: (G, X) => { G.p.contract += 2; X.trust(5); return '사인하는 사진이 구단 SNS에 올라갔다.'; } },
        { label: '시즌 끝나고 이야기하자', go: (G, X) => { X.pop(2); G.p.flags.agent = true; return '시장에서 내 가치를 확인해 보기로 했다.'; } },
      ],
    },
    {
      id: 'national_snub', w: 2, when: (G, X) => X.pro && X.ovr >= 69 && !G.season.called && G.week >= 4,
      title: '대표팀 명단 제외',
      text: () => '대표팀 명단이 발표됐다. 내 이름은 없었다.',
      choices: [
        { label: '묵묵히 경기로 보여 준다', go: (G, X) => { X.mental(3); return '다음 명단 발표까지 남은 경기를 셌다.'; } },
        { label: '인터뷰에서 아쉬움을 말한다', go: (G, X) => { X.pop(3); return X.chance(0.4) ? (G.p.flags.surpriseCall = true, '기사가 크게 났다. 협회가 다음 소집 때 보자고 했다는 소문이 돈다.') : '기사가 크게 났다. 반응은 반반이었다.'; } },
      ],
    },
    {
      id: 'youth_clinic', w: 1, when: (G, X) => X.pro,
      title: '유소년 축구교실',
      text: () => '구단이 지역 유소년 축구교실에 재능기부를 해 달라고 부탁했다.',
      choices: [
        { label: '간다', go: (G, X) => { X.pop(5); X.fat(4); X.mental(1); return '아이들이 내 등번호를 외치며 따라다녔다.'; } },
        { label: '이번엔 쉰다', go: () => '다음에 꼭 가겠다고 했다.' },
      ],
    },
    {
      id: 'derby_talk', w: 2, repeat: true, when: (G, X) => X.pro && G.p.pop >= 15,
      title: '상대의 도발',
      text: () => '다음 상대 팀 공격수가 인터뷰에서 내 이름을 콕 집어 도발했다.',
      choices: [
        { label: '받아친다', go: (G, X) => { X.pop(4); X.mental(-1); return '"경기장에서 보자." 기사 제목이 됐다.'; } },
        { label: '무시한다', go: (G, X) => { X.mental(2); return '대답 대신 웃었다.'; } },
      ],
    },
    {
      id: 'early_return', w: 5, repeat: true, when: (G) => G.p.injury >= 2,
      title: '조기 복귀',
      text: () => '의료진이 계획보다 빨리 복귀할 수 있다고 한다. 다만 재발 위험이 있다.',
      choices: [
        { label: '빨리 돌아간다', go: (G, X) => { G.p.injury = 0; return X.chance(0.35) ? (X.injure(4), '복귀 첫 훈련에서 같은 곳이 다시 아팠다. 4주 더.') : '무사히 돌아왔다. 감각이 살아 있었다.'; } },
        { label: '완전히 나을 때까지 기다린다', go: (G, X) => { X.mental(1); return '조급해하지 않기로 했다.'; } },
      ],
    },
    {
      id: 'snow', w: 1, when: (G, X) => X.pro && !X.abroad,
      title: '폭설',
      text: () => '폭설로 훈련장이 문을 닫았다. 실내 체육관만 쓸 수 있다.',
      choices: [{ label: '근력 운동을 한다', go: (G, X) => { X.attr(G.p.pos === 'GK' ? 'air' : 'phy', 0.6); X.fat(-8); return '오랜만에 웨이트만 했다.'; } }],
    },

    // ── 해외
    {
      id: 'language', w: 3, when: (G, X) => X.abroad && !G.p.flags.lang,
      title: '언어 수업',
      text: () => '구단이 현지어 개인 교습을 붙여 준다고 한다. 일주일에 세 번.',
      choices: [
        { label: '열심히 배운다', go: (G, X) => { G.p.flags.lang = true; X.trust(6); X.fat(4); return '라커룸 농담을 처음으로 알아들었다.'; } },
        { label: '통역에 기댄다', go: (G, X) => { X.trust(-2); return '훈련 중 지시를 한 박자 늦게 알아듣는다.'; } },
      ],
    },
    {
      id: 'homesick', w: 2, when: (G, X) => X.abroad,
      title: '향수병',
      text: () => '밤이 길다. 김치찌개 생각이 난다.',
      choices: [
        { label: '가족을 초대한다', go: (G, X) => { X.mental(3); return '엄마가 반찬을 한가득 들고 왔다.'; } },
        { label: '혼자 버틴다', go: (G, X) => X.chance(0.3) ? (X.main(1), '외로움을 훈련으로 바꿨다.') : (X.mental(-2), '버티는 게 생각보다 힘들었다.') },
      ],
    },
    {
      id: 'chef', w: 2, when: (G, X) => X.abroad && !G.p.flags.chef,
      title: '식단',
      text: () => '현지 음식이 영 안 맞는다. 체중이 2kg 빠졌다.',
      choices: [
        { label: '한식 요리사를 구한다', go: (G, X) => { G.p.flags.chef = true; X.attr(G.p.pos === 'GK' ? 'air' : 'phy', 0.6); X.fat(-10); return '밥심이 돌아왔다.'; } },
        { label: '현지 식단에 적응한다', go: (G, X) => { X.trust(2); return '구단 영양사가 반가워했다.'; } },
      ],
    },
    {
      id: 'training_clash', w: 2, repeat: true, when: (G, X) => X.pro,
      title: '훈련장 충돌',
      text: () => '미니 게임 중에 동료와 거친 태클을 주고받았다. 서로 언성이 높아졌다.',
      choices: [
        { label: '먼저 손을 내민다', go: (G, X) => { X.trust(3); return '저녁에 같이 밥을 먹었다. 생각보다 괜찮은 녀석이었다.'; } },
        { label: '물러서지 않는다', go: (G, X) => { X.pop(2); X.trust(-4); return '감독이 둘을 불러 벌금을 매겼다.'; } },
      ],
    },

    // ── 병역
    {
      id: 'sangmu_early', w: 3, when: (G, X) => X.pro && !X.abroad && !G.p.exempt && !G.p.militaryDone && !G.p.military && X.age >= 22 && X.age <= 26 && !G.p.flags.enlistNow,
      title: '상무 지원',
      text: () => '상무 지원 기간이다. 지금 다녀오면 전성기 전에 병역을 끝낼 수 있다.',
      choices: [
        { label: '지원한다', go: (G, X) => { G.p.flags.enlistNow = true; return '시즌이 끝나면 입대한다. 마음이 오히려 편해졌다.'; } },
        { label: '아시안게임에 걸어 본다', go: (G, X) => { X.mental(2); return '면제를 받을 기회는 많지 않다. 그래도 걸어 보기로 했다.'; } },
      ],
    },
    {
      id: 'military_deadline', w: 4, when: (G, X) => !G.p.exempt && !G.p.militaryDone && !G.p.military && X.age === 26,
      title: '병역 기한',
      text: () => '병역 기한이 1년 남았다. 이번 시즌이 끝나고 한 시즌 안에 면제를 받지 못하면 입대해야 한다.',
      choices: [
        { label: '마음을 다잡는다', go: (G, X) => { X.mental(3); return '남은 기회를 세어 봤다. 많지 않다.'; } },
        { label: '그냥 이번에 다녀온다', go: (G, X) => { G.p.flags.enlistNow = true; return '시즌이 끝나면 입대하기로 했다.'; } },
      ],
    },

    // ── 커리어 단계
    {
      id: 'ballon_buzz', w: 3, when: (G, X) => X.pro && X.level >= 0.9 && G.season.goals >= 12 && G.week >= 7,
      title: '발롱도르 후보설',
      text: () => '외신에서 내 이름을 발롱도르 후보로 거론하기 시작했다.',
      choices: [
        { label: '의식하지 않는다', go: (G, X) => { X.mental(3); return '한 경기씩만 생각하기로 했다.'; } },
        { label: '인터뷰에서 욕심을 드러낸다', go: (G, X) => { X.pop(6); return '"받을 자격이 있다고 생각한다." 기사가 전 세계로 퍼졌다.'; } },
      ],
    },
    {
      id: 'legacy_number', w: 2, when: (G, X) => X.pro && X.ovr >= G.season.spot && !X.iconic,
      title: '물려받는 등번호',
      text: (G, X) => `은퇴를 앞둔 선배가 자기 등번호 ${X.iconicNo}번을 내게 물려주고 싶다고 했다.`,
      choices: [
        { label: '받는다', go: (G, X) => { G.p.squadNo = X.iconicNo; X.pop(3); return `다음 경기부터 ${X.iconicNo}번을 단다.`; } },
        { label: '지금 번호가 좋다', go: () => '이 번호로 이름을 알리겠다고 했다.' },
      ],
    },
    {
      id: 'sponsor', w: 2, when: (G, X) => X.pro && G.p.pop >= 30,
      title: '광고 촬영',
      text: () => '스포츠 브랜드가 광고 모델 제안을 해 왔다. 촬영은 이틀.',
      choices: [
        { label: '찍는다', go: (G, X) => { X.pop(6); X.fat(6); return '버스 정류장마다 내 얼굴이 붙었다.'; } },
        { label: '시즌 중엔 안 한다', go: (G, X) => { X.trust(2); return '감독이 그 얘기를 듣고 고개를 끄덕였다.'; } },
      ],
    },
    {
      id: 'wonderkid', w: 2, when: (G, X) => X.pro && X.age <= 20 && G.season.goals + G.season.assists >= 4,
      title: '"한국 축구의 미래"',
      text: () => '스포츠 신문 1면에 "한국 축구의 미래"라는 제목으로 내 사진이 실렸다.',
      choices: [
        { label: '담담하게 넘긴다', go: (G, X) => { X.mental(2); return '신문은 부모님 방에 걸렸다.'; } },
        { label: '들뜬다', go: (G, X) => { X.pop(5); X.mental(-2); return '한동안 잠이 잘 안 왔다.'; } },
      ],
    },
    {
      id: 'aging_body', w: 3, when: (G, X) => X.age >= 31 && !G.p.flags.bodyCare,
      title: '느려지는 회복',
      text: () => '경기 다음 날 일어나는 게 예전 같지 않다.',
      choices: [
        { label: '식단과 수면을 철저히 관리한다', go: (G, X) => { G.p.flags.bodyCare = true; return '술을 끊고 밤 10시에 잤다. 하락 속도가 줄어든다.'; } },
        { label: '하던 대로 한다', go: (G, X) => { X.fat(10); return '몸이 보내는 신호를 모른 척했다.'; } },
      ],
    },
    {
      id: 'retire_question', w: 2, when: (G, X) => X.age >= 34,
      title: '은퇴 질문',
      text: () => '기자회견에서 은퇴 계획을 묻는 질문이 나왔다.',
      choices: [
        { label: '"아직 멀었습니다"', go: (G, X) => { X.mental(2); return '기자들이 웃었다. 나도 웃었다.'; } },
        { label: '"고민하고 있습니다"', go: (G, X) => { X.pop(3); return '다음 날 은퇴설 기사가 쏟아졌다.'; } },
      ],
    },
    {
      id: 'rival_moves', w: 2, when: (G, X) => X.pro && !X.rivalGone && G.p.rival.ovr >= 72,
      title: '라이벌의 이적',
      text: (G, X) => `${G.p.rival.name}이(가) ${X.rivalClub}(으)로 이적한다는 기사가 떴다.`,
      choices: [
        { label: '자극받는다', go: (G, X) => { X.main(0.8); X.fat(6); return '그날 밤 혼자 슈팅 100개를 찼다.'; } },
        { label: '축하 문자를 보낸다', go: (G, X) => { X.mental(2); return '"너도 곧 와." 답장이 왔다.'; } },
      ],
    },
    {
      id: 'press', w: 1, when: (G, X) => X.pro && G.p.trust >= 55,
      title: '대표 인터뷰',
      text: () => '감독 대신 경기 전 기자회견에 나가 달라는 부탁을 받았다.',
      choices: [
        { label: '팀 이야기를 한다', go: (G, X) => { X.trust(4); return '"우리는 준비가 됐습니다." 무난했다.'; } },
        { label: '짧게 끝낸다', go: () => '3분 만에 끝났다. 기록적이었다.' },
      ],
    },
    {
      id: 'night_out', w: 2, when: (G, X) => X.pro && X.age <= 25,
      title: '밤 약속',
      text: () => '경기 없는 주말 밤. 동료들이 같이 나가자고 한다.',
      choices: [
        { label: '따라간다', go: (G, X) => { X.fat(12); return X.chance(0.35) ? (X.pop(-5), X.trust(-3), '다음 날 아침 사진이 기사로 났다.') : (X.trust(2), '동료들과 한결 가까워졌다.'); } },
        { label: '숙소에 남는다', go: (G, X) => { X.mental(1); X.fat(-4); return '일찍 잤다.'; } },
      ],
    },
    {
      id: 'gk_kick', w: 2, when: (G, X) => G.p.pos === 'GK' && X.pro,
      title: '골키퍼 코치의 숙제',
      text: () => '골키퍼 코치가 이번 달 과제를 두 개 내밀었다. 하나만 고르라고 한다.',
      choices: [
        { label: '롱킥 정확도', go: (G, X) => { X.attr('kic', 1.4); return '하프라인 너머 동료 발밑으로 공이 떨어지기 시작했다.'; } },
        { label: '반사 신경 훈련', go: (G, X) => { X.attr('ref', 1.2); return '테니스공 세 개를 동시에 받는 훈련을 했다.'; } },
      ],
    },
    {
      id: 'df_shape', w: 2, when: (G, X) => G.p.pos === 'DF' && X.pro,
      title: '수비 조직 훈련',
      text: () => '수비 코치가 라인 조율을 누가 맡을지 정하자고 했다.',
      choices: [
        { label: '내가 라인을 이끈다', go: (G, X) => { X.trust(4); X.attr('def', 0.8); return '목이 쉬도록 소리쳤다.'; } },
        { label: '1대1 수비만 판다', go: (G, X) => { X.attr('def', 1.3); return '공격수 한 명만 보고 따라붙는 훈련을 반복했다.'; } },
      ],
    },
    {
      id: 'fw_finish', w: 2, when: (G, X) => G.p.pos === 'FW',
      title: '마무리 훈련',
      text: (G) => `${G.p.foot === 'L' ? '오른발' : '왼발'}이 약하다는 지적을 받았다.`,
      choices: [
        { label: '약한 발만 찬다', go: (G, X) => { X.attr('sho', 1.2); return '처음엔 공이 담장을 넘어갔다. 일주일 뒤엔 골문 안으로 들어갔다.'; } },
        { label: '헤더를 연습한다', go: (G, X) => { X.attr('phy', 1.2); return '목이 뻐근할 때까지 크로스를 받았다.'; } },
      ],
    },
    {
      id: 'mf_vision', w: 2, when: (G, X) => G.p.pos === 'MF',
      title: '시야 훈련',
      text: () => '코치가 공을 받기 전에 고개를 몇 번 돌리는지 세고 있었다. 두 번. 부족하다고 한다.',
      choices: [
        { label: '패스 길을 먼저 보는 훈련', go: (G, X) => { X.attr('pas', 1.3); return '받기 전에 네 번씩 고개를 돌렸다.'; } },
        { label: '좁은 공간 탈압박 훈련', go: (G, X) => { X.attr('dri', 1.3); return '세 명이 둘러싸도 공을 지키는 법을 익혔다.'; } },
      ],
    },
  ];
})(typeof window !== 'undefined' ? window : globalThis);
