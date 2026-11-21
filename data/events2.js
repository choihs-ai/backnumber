// 주간 이벤트 2: 주장·세트피스·해외 생활·대표팀·말년.
(function (root) {
  const D = (root.DATA = root.DATA || {});
  const E = (D.EVENTS = D.EVENTS || []);
  const add = (...list) => list.forEach((e) => E.push(e));

  // ── 고교
  add(
    {
      id: 'fitness_test', w: 2, when: (G, X) => X.school,
      title: '체력 측정',
      text: () => '분기 체력 측정 날이다. 셔틀런에서 꼴찌를 하면 일주일 동안 공을 못 만진다는 규칙이 있다.',
      choices: [
        { label: '전력으로 뛴다', go: (G, X) => { X.attr(G.p.pos === 'GK' ? 'one' : 'spd', 0.8); X.fat(10); return '숨이 넘어갈 것 같았는데 3등을 했다.'; } },
        { label: '페이스를 조절한다', go: (G, X) => { X.fat(-4); return X.chance(0.3) ? (X.trust(-3), '중간에 걸었다가 감독님한테 딱 걸렸다.') : '무난하게 통과했다.'; } },
      ],
    },
    {
      id: 'transfer_ace', w: 2, when: (G, X) => X.school && G.p.grade <= 2,
      title: '전학 온 에이스',
      text: () => '다른 학교에서 같은 포지션 에이스가 전학을 왔다. 첫 훈련부터 실력이 눈에 띈다.',
      choices: [
        { label: '같이 남아서 훈련하자고 한다', go: (G, X) => { X.main(0.8); X.mental(1); return '경쟁자이자 훈련 파트너가 생겼다.'; } },
        { label: '말 없이 경쟁한다', go: (G, X) => { G.season.spot += 1.5; X.mental(2); return '주전 경쟁이 조금 더 빡빡해졌다.'; } },
      ],
    },
    {
      id: 'school_trip', w: 1, when: (G, X) => X.school && G.p.grade === 2,
      title: '수학여행',
      text: () => '수학여행이 주말 리그 경기와 겹쳤다. 감독님은 알아서 하라고 했다.',
      choices: [
        { label: '수학여행에 간다', go: (G, X) => { X.mental(3); X.fat(-10); return '친구들과 밤새 떠들었다. 오랜만에 축구 생각이 안 났다.'; } },
        { label: '경기에 남는다', go: (G, X) => { X.trust(5); return '사진으로만 본 수학여행. 대신 감독님 수첩에 별표가 하나 늘었다.'; } },
      ],
    },
    {
      id: 'local_paper', w: 2, when: (G, X) => X.school && G.season.goals + G.season.assists >= 3,
      title: '지역 신문',
      text: () => '지역 신문 기자가 인터뷰를 하자고 연락했다. "고교 축구 유망주" 코너라고 한다.',
      choices: [
        { label: '응한다', go: (G, X) => { X.pop(5); return '신문에 실린 내 사진은 생각보다 어색했다.'; } },
        { label: '아직 이르다고 사양한다', go: (G, X) => { X.mental(1); X.trust(1); return '감독님이 잘했다고 했다.'; } },
      ],
    },
    {
      id: 'school_coach_change', w: 1, when: (G, X) => X.school && G.week >= 3,
      title: '고교 감독 교체',
      text: () => '축구부 감독님이 다른 학교로 옮긴다. 새 감독은 체력 훈련을 중시한다는 소문이다.',
      choices: [
        { label: '새 감독 스타일에 맞춘다', go: (G, X) => { G.p.trust = 50; X.attr(G.p.pos === 'GK' ? 'air' : 'phy', 0.8); X.fat(8); return '첫 주부터 산을 뛰었다.'; } },
        { label: '떠나는 감독님께 인사드린다', go: (G, X) => { G.p.trust = 48; X.mental(3); return '"어디 가서든 지금처럼만 해라." 그 말이 오래 남았다.'; } },
      ],
    },
    {
      id: 'yearbook', w: 1, when: (G, X) => X.school && G.p.grade === 3 && G.week >= 8,
      title: '졸업 앨범',
      text: () => '졸업 앨범 촬영 날. 장래 희망 칸을 채워야 한다.',
      choices: [
        { label: '"국가대표"라고 쓴다', go: (G, X) => { X.mental(2); return '친구들이 웃었다. 나는 진지했다.'; } },
        { label: '"발롱도르"라고 쓴다', go: (G, X) => { X.pop(2); X.mental(1); return '선생님이 사진을 찍어 갔다.'; } },
      ],
    },
  );

  // ── 프로 공통
  add(
    {
      id: 'chant', w: 2, when: (G, X) => X.pro && G.p.pop >= 25 && G.season.goals >= 3,
      title: '응원가',
      text: () => '서포터즈가 내 응원가를 만들었다. 다음 홈 경기부터 부른다고 한다.',
      choices: [
        { label: 'SNS에 고맙다고 올린다', go: (G, X) => { X.pop(4); X.mental(2); return '응원가 영상이 하루 만에 10만 회를 넘었다.'; } },
        { label: '경기장에서 골로 답한다', go: (G, X) => { X.mental(3); return '부담이 조금 생겼다. 좋은 부담이다.'; } },
      ],
    },
    {
      id: 'bus_breakdown', w: 1, when: (G, X) => X.pro && !X.abroad,
      title: '원정 버스 고장',
      text: () => '원정 가는 고속도로에서 구단 버스가 멈췄다. 경기까지 네 시간.',
      choices: [
        { label: '동료들과 노래 부르며 기다린다', go: (G, X) => { X.trust(2); X.mental(1); return '버스 안이 노래방이 됐다. 그날 팀 분위기는 최고였다.'; } },
        { label: '갓길에서 스트레칭을 한다', go: (G, X) => { X.fat(-4); return '지나가던 차들이 경적을 울렸다.'; } },
      ],
    },
    {
      id: 'senior_farewell', w: 1, when: (G, X) => X.pro && X.age <= 25,
      title: '선배의 은퇴식',
      text: () => '팀의 레전드 선배가 은퇴식을 한다. 마지막 경기 전에 라커룸에서 한마디 해 달라고 부탁받았다.',
      choices: [
        { label: '준비해 온 말을 한다', go: (G, X) => { X.trust(3); X.mental(2); return '말하다가 목이 멨다. 선배가 웃으며 등을 두드렸다.'; } },
        { label: '짧게 "고생하셨습니다"', go: (G, X) => { X.mental(1); return '짧았지만 다들 고개를 끄덕였다.'; } },
      ],
    },
    {
      id: 'roommate', w: 2, when: (G, X) => X.pro && X.age <= 24,
      title: '룸메이트',
      text: () => '원정 숙소 룸메이트가 밤마다 게임을 한다. 키보드 소리에 잠이 안 온다.',
      choices: [
        { label: '같이 한다', go: (G, X) => { X.trust(1); X.fat(8); return '새벽 세 시까지 했다. 다음 날 다리가 무거웠다.'; } },
        { label: '정중하게 말한다', go: (G, X) => { X.fat(-4); return '룸메이트가 미안하다며 이어폰을 꼈다.'; } },
        { label: '방을 바꿔 달라고 한다', go: (G, X) => { X.fat(-6); X.trust(-1); return '구단 직원이 귀찮은 표정을 지었다.'; } },
      ],
    },
    {
      id: 'documentary', w: 1, when: (G, X) => X.pro && G.p.pop >= 30,
      title: '다큐멘터리 촬영',
      text: () => '구단 다큐멘터리 제작진이 일주일 동안 나를 따라다니고 싶다고 한다.',
      choices: [
        { label: '허락한다', go: (G, X) => { X.pop(7); X.fat(5); return '카메라가 집 안까지 들어왔다. 편집본이 궁금하다.'; } },
        { label: '훈련장 안에서만 찍자고 한다', go: (G, X) => { X.pop(3); return '적당한 선을 지켰다.'; } },
      ],
    },
    {
      id: 'shirt_sales', w: 1, when: (G, X) => X.pro && G.p.pop >= 45,
      title: '유니폼 판매 1위',
      text: () => '이번 달 구단 유니폼 판매 1위가 내 이름이라고 한다. 구단이 축하 영상을 찍자고 한다.',
      choices: [
        { label: '찍는다', go: (G, X) => { X.pop(4); return '팬들이 내 등번호를 입은 사진을 보내기 시작했다.'; } },
        { label: '동료들 덕분이라고 한다', go: (G, X) => { X.trust(3); return '라커룸에서 동료들이 놀렸다. 기분 좋은 놀림이었다.'; } },
      ],
    },
    {
      id: 'referee', w: 2, repeat: true, when: (G, X) => X.pro && G.season.ratings.length >= 3,
      title: '판정 논란',
      text: () => '지난 경기 결정적인 장면에서 오심이 있었다. 기자들이 내 의견을 묻는다.',
      choices: [
        { label: '"판정도 경기의 일부"', go: (G, X) => { X.mental(1); return '무난하게 넘어갔다.'; } },
        { label: '솔직하게 비판한다', go: (G, X) => X.chance(0.4) ? (X.pop(3), X.trust(-2), '연맹에서 벌금 고지서가 날아왔다.') : (X.pop(4), '팬들이 속 시원하다고 했다.') },
      ],
    },
    {
      id: 'home_boos', w: 3, repeat: true, when: (G, X) => X.pro && X.recentAvg !== null && X.recentAvg < 6.3,
      title: '홈 팬들의 야유',
      text: () => '교체되어 나갈 때 홈 관중석에서 야유가 나왔다.',
      choices: [
        { label: '손뼉 치며 나간다', go: (G, X) => { X.pop(2); X.mental(1); return '야유가 박수로 바뀌었다. 조금.'; } },
        { label: '고개를 숙이고 나간다', go: (G, X) => { X.mental(-2); return '그날 밤 잠을 못 잤다.'; } },
        { label: '귀를 막는 세리머니를 준비한다', go: (G, X) => { G.p.flags.provoke = true; X.mental(2); return '다음에 골을 넣으면 하려고 한다.'; } },
      ],
    },
    {
      id: 'injured_friend', w: 1, when: (G, X) => X.pro,
      title: '동료의 큰 부상',
      text: () => '친한 동료가 십자인대가 끊어졌다. 시즌 아웃이다.',
      choices: [
        { label: '병원에 찾아간다', go: (G, X) => { X.trust(2); X.mental(1); return '동료는 웃으면서 "내 몫까지 뛰어"라고 했다.'; } },
        { label: '골 세리머니로 응원한다', go: (G, X) => { X.pop(3); return '다음 골을 넣으면 그 친구 등번호를 손으로 그리기로 했다.'; } },
      ],
    },
    {
      id: 'volunteer', w: 1, when: (G, X) => X.pro,
      title: '연고지 봉사',
      text: () => '구단 선수단이 연고지 복지관 봉사 활동을 간다. 자율 참가다.',
      choices: [
        { label: '참가한다', go: (G, X) => { X.pop(3); X.mental(1); X.fat(3); return '할머니 한 분이 손을 꼭 잡아 주셨다.'; } },
        { label: '휴식을 택한다', go: (G, X) => { X.fat(-5); return '조용히 쉬었다.'; } },
      ],
    },
    {
      id: 'bonus_talk', w: 1, when: (G, X) => X.pro && X.seasonAvg >= 7.2,
      title: '보너스 조항',
      text: () => '에이전트가 다음 계약 때 득점 보너스 조항을 넣자고 한다.',
      choices: [
        { label: '좋다', go: (G, X) => { X.mental(1); G.p.flags.agent = true; return '이적 시장에서 더 공격적으로 움직이게 된다.'; } },
        { label: '돈 얘기는 시즌 끝나고', go: (G, X) => { X.trust(2); return '지금은 경기만 생각하기로 했다.'; } },
      ],
    },
  );

  // ── 주장
  add(
    {
      id: 'cap_speech', w: 3, repeat: true, when: (G) => G.p.flags.captain && G.week >= 4,
      title: '주장의 한마디',
      text: () => '연패 중이다. 경기 전 라커룸이 조용하다. 다들 나를 본다.',
      choices: [
        { label: '목소리를 높인다', go: (G, X) => { X.trust(3); X.mental(2); return '"고개 들어. 우리 이렇게 약한 팀 아니잖아." 몇몇이 주먹을 쥐었다.'; } },
        { label: '한 명씩 어깨를 두드린다', go: (G, X) => { X.trust(2); X.mental(1); return '말보다 손이 나았다.'; } },
        { label: '말 대신 먼저 뛰어나간다', go: (G, X) => { X.mental(3); return '터널을 가장 먼저 빠져나갔다.'; } },
      ],
    },
    {
      id: 'cap_conflict', w: 2, when: (G) => G.p.flags.captain,
      title: '라커룸 갈등',
      text: () => '고참 둘이 출전 문제로 크게 다퉜다. 감독은 주장인 나에게 정리하라고 한다.',
      choices: [
        { label: '둘을 따로 불러 이야기한다', go: (G, X) => X.chance(0.65) ? (X.trust(5), '둘이 악수했다. 감독이 고맙다고 했다.') : (X.trust(-2), '한 명이 내 말을 안 들었다.') },
        { label: '팀 전체 미팅을 연다', go: (G, X) => { X.trust(3); X.fat(3); return '세 시간짜리 미팅. 다들 지쳤지만 공기는 맑아졌다.'; } },
      ],
    },
    {
      id: 'cap_rookie', w: 2, when: (G, X) => G.p.flags.captain && X.age >= 26,
      title: '신인 멘토',
      text: () => '고교를 막 졸업한 신인이 들어왔다. 예전 내 모습 같다.',
      choices: [
        { label: '훈련 끝나고 따로 봐 준다', go: (G, X) => { X.fat(5); X.mental(2); X.trust(2); return '신인이 매일 10분 일찍 나오기 시작했다.'; } },
        { label: '알아서 크게 둔다', go: () => '나도 그렇게 컸다.' },
      ],
    },
    {
      id: 'cap_fans', w: 1, when: (G, X) => G.p.flags.captain && X.pro,
      title: '팬들의 항의',
      text: () => '성적 부진에 화난 팬들이 훈련장 앞에 모였다. 주장이 나와서 이야기하라고 한다.',
      choices: [
        { label: '나가서 고개 숙인다', go: (G, X) => { X.pop(4); X.mental(1); return '"다음 경기 보고 판단해 주세요." 팬들이 조금씩 흩어졌다.'; } },
        { label: '구단에 맡긴다', go: (G, X) => { X.pop(-3); return '주장이 숨었다는 기사가 났다.'; } },
      ],
    },
  );

  // ── 세트피스
  add(
    {
      id: 'fk_bet', w: 2, when: (G, X) => X.pro && G.p.pos !== 'GK',
      title: '프리킥 내기',
      text: () => '훈련 끝나고 동료들이 프리킥 내기를 하자고 한다. 진 사람이 저녁을 산다.',
      choices: [
        { label: '끼어든다', go: (G, X) => { G.p.sp = Math.min(99, (G.p.sp || 45) + 1.2); return X.chance(0.5) ? '골대 구석에 꽂았다. 저녁은 공짜.' : '벽에만 맞혔다. 저녁 값이 꽤 나왔다.'; } },
        { label: '구경만 한다', go: (G, X) => { X.fat(-3); return '구경하는 것도 공부다.'; } },
      ],
    },
    {
      id: 'pk_trauma', w: 3, when: (G, X) => X.pro && G.p.flags.taker,
      title: '페널티킥 실축의 기억',
      text: () => '지난번 페널티킥 실축 장면이 자꾸 떠오른다. 다음에도 찰 수 있을까.',
      choices: [
        { label: '매일 50개씩 찬다', go: (G, X) => { G.p.sp = Math.min(99, (G.p.sp || 45) + 1.5); X.fat(4); return '공이 발에 다시 붙기 시작했다.'; } },
        { label: '키커를 내려놓는다', go: (G, X) => { G.p.flags.taker = false; X.mental(2); return '부담을 덜었다. 다른 데 집중하기로 했다.'; } },
      ],
    },
    {
      id: 'taker_rival', w: 2, when: (G, X) => X.pro && (G.p.sp || 45) >= 60 && !G.p.flags.taker,
      title: '전담 키커 경쟁',
      text: () => '프리킥 전담 키커가 이적했다. 코치가 나와 다른 선수 중에 고르겠다고 한다.',
      choices: [
        { label: '연습에서 보여 준다', go: (G, X) => X.chance(0.55) ? (G.p.flags.taker = true, '10개 중 6개를 넣었다. 전담 키커가 됐다.') : '4개밖에 못 넣었다. 다음 기회를 노린다.' },
        { label: '양보한다', go: (G, X) => { X.trust(2); return '팀에 더 잘 차는 선수가 있었다.'; } },
      ],
    },
  );

  // ── 해외
  add(
    {
      id: 'local_press', w: 2, repeat: true, when: (G, X) => X.abroad && X.recentAvg !== null && X.recentAvg < 6.5,
      title: '현지 언론의 혹평',
      text: () => '현지 신문이 내게 평점 3점을 주며 "아시아 마케팅용 영입"이라고 썼다.',
      choices: [
        { label: '번역해서 라커에 붙인다', go: (G, X) => { X.mental(3); return '매일 아침 그 기사를 보고 훈련장에 들어간다.'; } },
        { label: '안 읽는다', go: (G, X) => { X.mental(1); return '휴대폰에서 스포츠 앱을 지웠다.'; } },
      ],
    },
    {
      id: 'local_praise', w: 2, when: (G, X) => X.abroad && X.seasonAvg >= 7.2,
      title: '현지 팬들의 환호',
      text: () => '시장에서 장을 보는데 상인이 내 이름을 부르며 과일을 공짜로 줬다.',
      choices: [
        { label: '같이 사진을 찍는다', go: (G, X) => { X.pop(3); X.mental(2); return '그 사진이 시장 입구에 걸렸다.'; } },
        { label: '고맙다고 현지어로 말한다', go: (G, X) => { X.trust(1); X.mental(2); return '발음이 웃겼는지 상인이 크게 웃었다.'; } },
      ],
    },
    {
      id: 'abuse_crowd', w: 1, when: (G, X) => X.abroad,
      title: '관중석의 차별 발언',
      text: () => '원정 경기 중 관중석에서 나를 겨냥한 차별적인 구호가 들렸다.',
      choices: [
        { label: '주심에게 알린다', go: (G, X) => { X.mental(1); X.pop(4); return '경기가 잠시 멈췄다. 상대 구단이 징계를 받았다. 동료들이 내 곁에 섰다.'; } },
        { label: '경기로 답한다', go: (G, X) => { X.mental(2); return '이를 악물고 끝까지 뛰었다. 경기 뒤 구단이 공식 항의했다.'; } },
      ],
    },
    {
      id: 'cold_winter', w: 1, when: (G, X) => X.abroad && G.week >= 4 && G.week <= 8,
      title: '낯선 겨울',
      text: () => '영하 10도. 이런 추위에서 공을 차 본 적이 없다.',
      choices: [
        { label: '두꺼운 내의를 입는다', go: (G, X) => { X.fat(-3); return '동료들이 "한국식 패딩"이라고 놀렸다.'; } },
        { label: '그냥 적응한다', go: (G, X) => X.chance(0.2) ? (X.injure(1), '감기에 걸렸다. 한 주 쉰다.') : (X.mental(1), '몸이 금방 적응했다.') },
      ],
    },
    {
      id: 'korean_teammate', w: 1, when: (G, X) => X.abroad,
      title: '같은 리그의 한국 선수',
      text: () => '같은 리그에서 뛰는 한국 선수가 경기 끝나고 밥을 먹자고 연락했다.',
      choices: [
        { label: '만난다', go: (G, X) => { X.mental(3); return '오랜만에 한국말로 실컷 떠들었다.'; } },
        { label: '다음에 보자고 한다', go: (G, X) => { X.fat(-3); return '피곤했다. 다음엔 꼭.'; } },
      ],
    },
    {
      id: 'local_tv', w: 1, when: (G, X) => X.abroad && G.p.pop >= 35,
      title: '현지 TV 토크쇼',
      text: () => '현지 TV 토크쇼에서 섭외가 왔다. 생방송이다.',
      choices: [
        { label: '나간다', go: (G, X) => X.chance(0.6) ? (X.pop(6), '현지어로 농담을 했는데 크게 터졌다.') : (X.pop(1), X.mental(-1), '긴장해서 말을 더듬었다.') },
        { label: '정중히 거절한다', go: () => '조용히 지냈다.' },
      ],
    },
    {
      id: 'house_hunt', w: 1, when: (G, X) => X.abroad && G.p.flags.joinedYear >= G.year,
      title: '집 구하기',
      text: () => '호텔 생활이 길어진다. 훈련장 근처와 시내 중에 집을 골라야 한다.',
      choices: [
        { label: '훈련장 근처 조용한 동네', go: (G, X) => { X.fat(-5); return '창밖으로 양 떼가 보인다.'; } },
        { label: '시내 아파트', go: (G, X) => { X.mental(2); return '카페와 식당이 가까워서 덜 외롭다.'; } },
      ],
    },
  );

  // ── 대표팀
  add(
    {
      id: 'nat_coach_change', w: 1, when: (G) => G.p.intl.caps >= 5,
      title: '대표팀 감독 교체',
      text: () => '대표팀 감독이 바뀌었다. 새 감독은 소속팀에서 뛰는 시간을 가장 중요하게 본다고 한다.',
      choices: [
        { label: '소속팀에서 더 보여 준다', go: (G, X) => { X.mental(2); return '다음 소집 명단이 기다려진다.'; } },
        { label: '인터뷰에서 기대를 말한다', go: (G, X) => { X.pop(2); return '"새 감독님 축구가 기대됩니다." 무난했다.'; } },
      ],
    },
    {
      id: 'nat_captain', w: 2, when: (G, X) => G.p.intl.caps >= 30 && X.age >= 26 && !G.p.flags.natCaptain,
      title: '대표팀 주장',
      text: () => '대표팀 감독이 주장 완장을 맡아 달라고 했다.',
      choices: [
        { label: '맡는다', go: (G, X) => { G.p.flags.natCaptain = true; X.pop(8); X.mental(3); return '태극 마크 위에 완장을 찼다.'; } },
        { label: '선배에게 양보한다', go: (G, X) => { X.mental(1); return '"아직은 형이 해야죠." 선배가 웃었다.'; } },
      ],
    },
    {
      id: 'jetlag', w: 2, repeat: true, when: (G, X) => X.abroad && G.season.called && [3, 7, 10].includes(G.week + 1),
      title: '장거리 비행',
      text: () => '다음 주 대표팀 소집. 열네 시간 비행이다.',
      choices: [
        { label: '비행기에서 잠만 잔다', go: (G, X) => { X.fat(-4); return '착륙하자마자 훈련장으로 갔다.'; } },
        { label: '영상을 보며 상대를 분석한다', go: (G, X) => { G.p.flags.videoBonus = 2; X.fat(4); return '상대 수비수 습관 몇 개를 찾았다.'; } },
      ],
    },
    {
      id: 'nat_expect', w: 2, when: (G, X) => G.p.intl.caps >= 10 && G.p.pop >= 40,
      title: '국민의 기대',
      text: () => '대표팀 경기 전날, 포털 메인에 내 사진과 함께 "에이스의 어깨"라는 기사가 걸렸다.',
      choices: [
        { label: '부담을 즐긴다', go: (G, X) => { X.mental(2); X.pop(2); return '이런 날을 위해 뛰어 왔다.'; } },
        { label: '휴대폰을 끈다', go: (G, X) => { X.mental(1); return '숙소에서 일찍 잤다.'; } },
      ],
    },
    {
      id: 'intl_retire', w: 2, when: (G, X) => X.age >= 32 && G.p.intl.caps >= 40 && !G.p.flags.intlRetired,
      title: '대표팀 은퇴',
      text: () => '서른둘. 대표팀 은퇴를 고민할 나이라는 기사가 나왔다.',
      choices: [
        { label: '대표팀 은퇴를 선언한다', go: (G, X) => { G.p.flags.intlRetired = true; X.fat(-10); X.pop(5); return '마지막 A매치에서 관중들이 내 이름을 불렀다. 이제 소속팀에만 집중한다.'; } },
        { label: '불러 주면 간다', go: (G, X) => { X.mental(2); return '"태극 마크는 내가 내려놓는 게 아니다."'; } },
      ],
    },
  );

  // ── 몸과 마음
  add(
    {
      id: 'insomnia', w: 2, when: (G, X) => G.p.fatigue >= 50 && X.pro,
      title: '불면',
      text: () => '경기 끝나고 새벽 네 시까지 잠이 안 온다. 일주일째다.',
      choices: [
        { label: '수면 클리닉에 간다', go: (G, X) => { X.fat(-10); return '처방받은 대로 했더니 조금씩 잠이 왔다.'; } },
        { label: '밤에 혼자 뛰러 나간다', go: (G, X) => { X.fat(6); X.mental(1); return '지쳐서 잠들었다. 해결책은 아니다.'; } },
      ],
    },
    {
      id: 'meditation', w: 1, when: (G, X) => X.pro,
      title: '명상 수업',
      text: () => '팀 심리 코치가 경기 전 호흡법을 가르쳐 준다고 한다.',
      choices: [
        { label: '진지하게 배운다', go: (G, X) => { X.mental(3); return '페널티킥 앞에서도 심장이 덜 뛴다.'; } },
        { label: '졸다가 나온다', go: (G, X) => { X.fat(-3); return '잠은 잘 잤다.'; } },
      ],
    },
    {
      id: 'breakthrough', w: 2, when: (G, X) => X.pro && X.recentAvg !== null && X.recentAvg >= 7.6,
      title: '감이 왔다',
      text: () => '요즘 공이 발에 붙는다. 뭘 해도 된다.',
      choices: [
        { label: '이 감각을 몸에 새긴다', go: (G, X) => { X.main(0.8); X.mental(2); return '훈련 영상을 다시 보며 무엇이 달라졌는지 적었다.'; } },
        { label: '들뜨지 않는다', go: (G, X) => { X.mental(3); return '좋을 때일수록 조심.'; } },
      ],
    },
    {
      id: 'diet', w: 1, when: (G, X) => X.pro && X.age >= 24,
      title: '식단 관리',
      text: () => '구단 영양사가 체지방을 2% 줄이자고 한다.',
      choices: [
        { label: '철저히 따른다', go: (G, X) => { X.attr(G.p.pos === 'GK' ? 'one' : 'spd', 0.6); X.mental(-1); return '치킨을 끊었다. 괴로웠다.'; } },
        { label: '적당히 한다', go: () => '일주일에 한 번은 먹기로 했다.' },
      ],
    },
  );

  // ── 말년
  add(
    {
      id: 'coach_license', w: 2, when: (G, X) => X.age >= 30 && !G.p.flags.license,
      title: '지도자 자격증',
      text: () => '협회에서 현역 선수 대상 지도자 자격증 과정을 연다. 비시즌 주말마다다.',
      choices: [
        { label: '신청한다', go: (G, X) => { G.p.flags.license = true; X.fat(4); X.mental(2); return '전술 노트가 한 권씩 늘어난다. 은퇴 후가 조금 덜 두렵다.'; } },
        { label: '아직은 선수에 집중한다', go: (G, X) => { X.mental(1); return '나중에 해도 늦지 않다.'; } },
      ],
    },
    {
      id: 'home_return', w: 3, when: (G, X) => X.abroad && X.age >= 30,
      title: '친정팀의 연락',
      text: () => '처음 프로 생활을 시작한 K리그 구단 단장이 직접 연락해 왔다. 언제든 돌아오라고.',
      choices: [
        { label: '마음이 흔들린다', go: (G, X) => { G.p.flags.homeReturn = true; return '다음 여름 이적 시장에 친정팀 제안이 들어온다.'; } },
        { label: '아직 유럽에서 할 게 남았다', go: (G, X) => { X.mental(2); return '단장은 기다리겠다고 했다.'; } },
      ],
    },
    {
      id: 'last_season', w: 3, when: (G, X) => X.age >= 34 && G.week <= 3,
      title: '마지막 시즌일까',
      text: () => '프리시즌 첫 훈련. 어린 선수들 사이에서 숨이 먼저 찬다.',
      choices: [
        { label: '마지막이라고 생각하고 뛴다', go: (G, X) => { X.mental(4); X.fat(5); return '한 경기 한 경기가 소중해졌다.'; } },
        { label: '아직 2~3년은 더 한다', go: (G, X) => { X.mental(1); return '몸 관리를 더 철저히 하기로 했다.'; } },
      ],
    },
    {
      id: 'young_star', w: 2, when: (G, X) => X.age >= 31 && X.pro,
      title: '나를 보고 자란 후배',
      text: () => '신인 하나가 어릴 때 내 경기를 보며 축구를 시작했다고 했다.',
      choices: [
        { label: '등번호에 사인해 준다', go: (G, X) => { X.mental(3); return '나도 언젠가 누군가의 시작이었다.'; } },
        { label: '훈련장에서 혼쭐을 낸다', go: (G, X) => { X.trust(2); X.mental(1); return '후배가 웃으면서 다시 덤볐다.'; } },
      ],
    },
  );
})(typeof window !== 'undefined' ? window : globalThis);
