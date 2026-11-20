// 리그·클럽 데이터. 클럽·리그·대회 명칭의 권리는 각 권리자에게 있다.
// 국내 구단 구성은 2026시즌 기준 (K리그1 12팀, K리그2 17팀). 게임 안에서 승강은 따로 계산하지 않는다.
// 김천 상무는 2026시즌으로 연고 협약이 끝나서 빼고 군 복무 팀은 K리그2의 '상무'로 둔다.
// 색은 대표색 근사치라서 틀린 곳은 여기서 바로 고치면 된다.
// str: 팀 전력(선수 평균 OVR 기준), rep: 명성 1~100
(function (root) {
  const D = (root.DATA = root.DATA || {});

  D.LEAGUES = {
    school: { name: '고교 주말리그', cup: '전국고교축구 왕중왕전', level: 0.1, perWeek: 1, country: 'KR' },
    univ:   { name: 'U리그', cup: '대학축구선수권', level: 0.15, perWeek: 1, country: 'KR' },
    k3:     { name: 'K3리그', cup: '코리아컵', level: 0.2, perWeek: 2, country: 'KR' },
    k2:     { name: 'K리그2', cup: '코리아컵', level: 0.35, perWeek: 3, country: 'KR', topGoals: 15 },
    k1:     { name: 'K리그1', cup: '코리아컵', cont: 'acl', contSlots: 3, level: 0.45, perWeek: 3, country: 'KR', topGoals: 16 },
    j1:     { name: 'J1리그', cup: '천황배', cont: 'acl', contSlots: 3, level: 0.45, perWeek: 3, country: 'JP', topGoals: 17 },
    sa:     { name: '사우디 프로리그', cup: '킹스컵', cont: 'acl', contSlots: 3, level: 0.5, perWeek: 3, country: 'SA', topGoals: 24 },
    be:     { name: '벨기에 프로리그', cup: '벨기에컵', cont: 'ucl', contSlots: 1, level: 0.6, perWeek: 3, country: 'BE', topGoals: 20 },
    nl:     { name: '에레디비시', cup: 'KNVB컵', cont: 'ucl', contSlots: 2, level: 0.7, perWeek: 3, country: 'NL', topGoals: 22 },
    pt:     { name: '프리메이라 리가', cup: '타사 드 포르투갈', cont: 'ucl', contSlots: 2, level: 0.7, perWeek: 3, country: 'PT', topGoals: 22 },
    epl:    { name: '프리미어리그', cup: 'FA컵', cont: 'ucl', contSlots: 4, level: 1.0, perWeek: 3, country: 'EN', topGoals: 24 },
    liga:   { name: '라리가', cup: '코파 델 레이', cont: 'ucl', contSlots: 4, level: 1.0, perWeek: 3, country: 'ES', topGoals: 24 },
    seriea: { name: '세리에 A', cup: '코파 이탈리아', cont: 'ucl', contSlots: 4, level: 1.0, perWeek: 3, country: 'IT', topGoals: 23 },
    bund:   { name: '분데스리가', cup: 'DFB 포칼', cont: 'ucl', contSlots: 4, level: 1.0, perWeek: 3, country: 'DE', topGoals: 25 },
    ligue1: { name: '리그 1', cup: '쿠프 드 프랑스', cont: 'ucl', contSlots: 3, level: 0.9, perWeek: 3, country: 'FR', topGoals: 22 },
  };

  D.CONTINENTAL = {
    acl: { name: 'AFC 챔피언스리그 엘리트', short: 'ACLE' },
    ucl: { name: 'UEFA 챔피언스리그', short: 'UCL' },
  };

  // [id, 이름, 약자, 리그, 전력, 명성, 주색, 보조색, 유니폼 무늬, 배지 모양]
  const RAW = [
    // K리그1 (2026)
    ['jeonbuk', '전북 현대', 'JHM', 'k1', 71, 44, '#13603A', '#E7DB9E', 'solid', 'ring'],
    ['daejeon', '대전하나시티즌', 'DHC', 'k1', 71, 40, '#7A1E3A', '#2E8B57', 'solid', 'band'],
    ['ulsan', '울산 HD', 'UHD', 'k1', 70, 43, '#1F4E9C', '#E9B92E', 'solid', 'band'],
    ['pohang', '포항 스틸러스', 'PHS', 'k1', 69, 40, '#C8352B', '#1E1E1E', 'vstripe', 'stripes'],
    ['seoul', 'FC 서울', 'FCS', 'k1', 69, 42, '#C8352B', '#1E1E1E', 'half', 'half'],
    ['gangwon', '강원FC', 'GWF', 'k1', 67, 33, '#E8742A', '#1E2F5B', 'solid', 'band'],
    ['gwangju', '광주FC', 'GJF', 'k1', 67, 33, '#F1C232', '#C8352B', 'solid', 'ring'],
    ['jeju', '제주SK FC', 'JSK', 'k1', 67, 34, '#E8602C', '#F2EBDD', 'solid', 'diag'],
    ['anyang', 'FC안양', 'FCA', 'k1', 66, 31, '#5B2C83', '#F2EBDD', 'solid', 'band'],
    ['incheon', '인천 유나이티드', 'IUT', 'k1', 66, 33, '#1C3F94', '#1E1E1E', 'vstripe', 'stripes'],
    ['bucheon', '부천FC 1995', 'BCF', 'k1', 65, 29, '#C8352B', '#1E1E1E', 'hstripe', 'band'],
    // K리그2 (2026)
    ['suwonsb', '수원 삼성', 'SSB', 'k2', 65, 38, '#2050A8', '#F2EBDD', 'solid', 'diag'],
    ['daegu', '대구FC', 'DGF', 'k2', 65, 33, '#4FA3D9', '#1E2F5B', 'solid', 'band'],
    ['suwonfc', '수원FC', 'SFC', 'k2', 64, 29, '#C8352B', '#1F3F8F', 'half', 'half'],
    ['eland', '서울 이랜드', 'SEL', 'k2', 63, 27, '#1E2F5B', '#C9A23A', 'solid', 'ring'],
    ['gimpo', '김포FC', 'GPF', 'k2', 62, 22, '#2C7A4B', '#E9B92E', 'solid', 'band'],
    ['busan', '부산 아이파크', 'BIP', 'k2', 63, 28, '#C8352B', '#F2EBDD', 'solid', 'ring'],
    ['seongnam', '성남FC', 'SNF', 'k2', 62, 27, '#1E1E1E', '#F2EBDD', 'solid', 'band'],
    ['jeonnam', '전남 드래곤즈', 'JND', 'k2', 62, 26, '#F2C230', '#1E1E1E', 'solid', 'stripes'],
    ['gyeongnam', '경남FC', 'GNF', 'k2', 61, 24, '#B3262E', '#F2EBDD', 'solid', 'diag'],
    ['chungbuk', '충북청주FC', 'CBC', 'k2', 60, 20, '#2E5AA8', '#E9B92E', 'solid', 'band'],
    ['cheonan', '천안시티FC', 'CAC', 'k2', 60, 20, '#3D8FD1', '#1E2F5B', 'solid', 'ring'],
    ['asan', '충남아산FC', 'CNA', 'k2', 60, 21, '#1F4E9C', '#E9B92E', 'solid', 'half'],
    ['ansan', '안산 그리너스', 'ASG', 'k2', 59, 19, '#3D8C40', '#F2EBDD', 'solid', 'band'],
    ['hwaseong', '화성FC', 'HSF', 'k2', 59, 18, '#E57A1F', '#1E1E1E', 'solid', 'diag'],
    ['gimhae', '김해FC2008', 'GHF', 'k2', 59, 17, '#2B6FB5', '#F2EBDD', 'solid', 'band'],
    ['yongin', '용인FC', 'YIF', 'k2', 60, 18, '#5B2C83', '#E9B92E', 'solid', 'ring'],
    ['paju', '파주 프런티어FC', 'PJF', 'k2', 59, 17, '#1E1E1E', '#C8352B', 'solid', 'half'],
    ['sangmu', '상무 (국군체육부대)', 'SMU', 'k2', 64, 25, '#B3262E', '#1E2F5B', 'solid', 'band'],
    // J1리그
    ['kobe', '비셀 고베', 'VKB', 'j1', 70, 42, '#8E1B2E', '#1E1E1E', 'solid', 'band'],
    ['hiroshima', '산프레체 히로시마', 'SFH', 'j1', 70, 40, '#5B2C83', '#F2EBDD', 'solid', 'ring'],
    ['marinos', '요코하마 F. 마리노스', 'YFM', 'j1', 69, 42, '#1F3F8F', '#F2EBDD', 'solid', 'band'],
    ['kawasaki', '가와사키 프론탈레', 'KFR', 'j1', 69, 40, '#4FA3D9', '#1E1E1E', 'vstripe', 'stripes'],
    ['urawa', '우라와 레즈', 'URR', 'j1', 69, 43, '#C8352B', '#1E1E1E', 'solid', 'half'],
    ['kashima', '가시마 앤틀러스', 'KSA', 'j1', 70, 42, '#8E1B2E', '#1F3F8F', 'solid', 'diag'],
    // 사우디
    ['hilal', '알 힐랄', 'HIL', 'sa', 77, 60, '#1F4E9C', '#F2EBDD', 'solid', 'band'],
    ['nassr', '알 나스르', 'NAS', 'sa', 76, 60, '#F1C232', '#1F3F8F', 'solid', 'ring'],
    ['ittihad', '알 이티하드', 'ITT', 'sa', 76, 57, '#F1C232', '#1E1E1E', 'vstripe', 'stripes'],
    ['ahli', '알 아흘리', 'AHL', 'sa', 75, 55, '#2E8B57', '#F2EBDD', 'solid', 'diag'],
    // 벨기에
    ['brugge', '클뤼프 브뤼헤', 'CBR', 'be', 74, 54, '#1F4E9C', '#1E1E1E', 'vstripe', 'stripes'],
    ['anderlecht', '안더레흐트', 'RSA', 'be', 72, 52, '#5B2C83', '#F2EBDD', 'solid', 'ring'],
    ['genk', '헹크', 'KRC', 'be', 72, 48, '#1F4E9C', '#F2EBDD', 'solid', 'band'],
    ['usg', '위니옹 SG', 'USG', 'be', 72, 46, '#F1C232', '#1F4E9C', 'solid', 'half'],
    // 네덜란드
    ['psv', 'PSV', 'PSV', 'nl', 76, 63, '#C8352B', '#F2EBDD', 'vstripe', 'stripes'],
    ['feyenoord', '페예노르트', 'FEY', 'nl', 75, 62, '#C8352B', '#F2EBDD', 'half', 'half'],
    ['ajax', '아약스', 'AJX', 'nl', 75, 66, '#F2EBDD', '#C8352B', 'solid', 'band'],
    ['az', 'AZ 알크마르', 'AZA', 'nl', 72, 50, '#C8352B', '#F2EBDD', 'solid', 'ring'],
    ['twente', 'FC 트벤테', 'TWE', 'nl', 71, 46, '#C8352B', '#F2EBDD', 'solid', 'diag'],
    // 포르투갈
    ['benfica', '벤피카', 'SLB', 'pt', 78, 70, '#C8352B', '#F2EBDD', 'solid', 'ring'],
    ['porto', 'FC 포르투', 'FCP', 'pt', 78, 69, '#1F4E9C', '#F2EBDD', 'vstripe', 'stripes'],
    ['sporting', '스포르팅 CP', 'SCP', 'pt', 78, 68, '#2E8B57', '#F2EBDD', 'hstripe', 'band'],
    ['braga', 'SC 브라가', 'SCB', 'pt', 74, 52, '#C8352B', '#F2EBDD', 'solid', 'diag'],
    // 프리미어리그
    ['mancity', '맨체스터 시티', 'MCI', 'epl', 86, 93, '#6CABDD', '#F2EBDD', 'solid', 'ring'],
    ['arsenal', '아스널', 'ARS', 'epl', 86, 92, '#C8352B', '#F2EBDD', 'solid', 'band'],
    ['liverpool', '리버풀', 'LIV', 'epl', 86, 94, '#B3262E', '#F2EBDD', 'solid', 'ring'],
    ['chelsea', '첼시', 'CHE', 'epl', 84, 89, '#1F4E9C', '#F2EBDD', 'solid', 'band'],
    ['manutd', '맨체스터 유나이티드', 'MUN', 'epl', 82, 92, '#C8352B', '#1E1E1E', 'solid', 'half'],
    ['spurs', '토트넘 홋스퍼', 'TOT', 'epl', 81, 84, '#F2EBDD', '#1E2F5B', 'solid', 'band'],
    ['newcastle', '뉴캐슬 유나이티드', 'NEW', 'epl', 82, 80, '#1E1E1E', '#F2EBDD', 'vstripe', 'stripes'],
    ['villa', '애스턴 빌라', 'AVL', 'epl', 81, 76, '#7A1E3A', '#6CABDD', 'solid', 'half'],
    ['brighton', '브라이턴', 'BHA', 'epl', 79, 68, '#1F4E9C', '#F2EBDD', 'vstripe', 'stripes'],
    ['palace', '크리스털 팰리스', 'CRY', 'epl', 78, 66, '#1F4E9C', '#C8352B', 'vstripe', 'stripes'],
    // 라리가
    ['realmadrid', '레알 마드리드', 'RMA', 'liga', 88, 99, '#F2EBDD', '#C9A23A', 'solid', 'ring'],
    ['barcelona', 'FC 바르셀로나', 'FCB', 'liga', 87, 97, '#1F3F8F', '#8E1B2E', 'vstripe', 'stripes'],
    ['atletico', '아틀레티코 마드리드', 'ATM', 'liga', 84, 86, '#C8352B', '#F2EBDD', 'vstripe', 'stripes'],
    ['athletic', '아틀레틱 빌바오', 'ATH', 'liga', 80, 72, '#C8352B', '#F2EBDD', 'vstripe', 'stripes'],
    ['sociedad', '레알 소시에다드', 'RSO', 'liga', 79, 70, '#1F4E9C', '#F2EBDD', 'vstripe', 'stripes'],
    ['villarreal', '비야레알', 'VIL', 'liga', 80, 70, '#F1C232', '#1F3F8F', 'solid', 'band'],
    ['betis', '레알 베티스', 'BET', 'liga', 79, 70, '#2E8B57', '#F2EBDD', 'vstripe', 'stripes'],
    ['sevilla', '세비야', 'SEV', 'liga', 78, 74, '#F2EBDD', '#C8352B', 'solid', 'diag'],
    // 세리에 A
    ['inter', '인테르', 'INT', 'seriea', 85, 88, '#1F3F8F', '#1E1E1E', 'vstripe', 'stripes'],
    ['milan', 'AC 밀란', 'MIL', 'seriea', 83, 88, '#C8352B', '#1E1E1E', 'vstripe', 'stripes'],
    ['juventus', '유벤투스', 'JUV', 'seriea', 83, 89, '#1E1E1E', '#F2EBDD', 'vstripe', 'stripes'],
    ['napoli', '나폴리', 'NAP', 'seriea', 83, 82, '#4FA3D9', '#F2EBDD', 'solid', 'ring'],
    ['roma', 'AS 로마', 'ROM', 'seriea', 80, 78, '#8E1B2E', '#F1C232', 'solid', 'band'],
    ['atalanta', '아탈란타', 'ATA', 'seriea', 81, 74, '#1F3F8F', '#1E1E1E', 'vstripe', 'stripes'],
    ['lazio', '라치오', 'LAZ', 'seriea', 79, 72, '#6CABDD', '#F2EBDD', 'solid', 'band'],
    ['fiorentina', '피오렌티나', 'FIO', 'seriea', 78, 70, '#5B2C83', '#F2EBDD', 'solid', 'diag'],
    // 분데스리가
    ['bayern', '바이에른 뮌헨', 'FCB', 'bund', 87, 96, '#C8352B', '#F2EBDD', 'solid', 'ring'],
    ['dortmund', '보루시아 도르트문트', 'BVB', 'bund', 83, 86, '#F1C232', '#1E1E1E', 'solid', 'band'],
    ['leverkusen', '바이어 레버쿠젠', 'B04', 'bund', 83, 80, '#C8352B', '#1E1E1E', 'half', 'half'],
    ['leipzig', 'RB 라이프치히', 'RBL', 'bund', 81, 74, '#F2EBDD', '#C8352B', 'solid', 'band'],
    ['frankfurt', '아인트라흐트 프랑크푸르트', 'SGE', 'bund', 80, 72, '#1E1E1E', '#C8352B', 'solid', 'diag'],
    ['stuttgart', 'VfB 슈투트가르트', 'VFB', 'bund', 79, 70, '#F2EBDD', '#C8352B', 'hstripe', 'band'],
    ['wolfsburg', 'VfL 볼프스부르크', 'WOB', 'bund', 77, 64, '#2E8B57', '#F2EBDD', 'solid', 'ring'],
    ['mainz', '마인츠 05', 'M05', 'bund', 76, 60, '#C8352B', '#F2EBDD', 'solid', 'band'],
    // 리그 1
    ['psg', '파리 생제르맹', 'PSG', 'ligue1', 87, 94, '#1E2F5B', '#C8352B', 'solid', 'ring'],
    ['marseille', '올랭피크 마르세유', 'OM', 'ligue1', 81, 80, '#F2EBDD', '#4FA3D9', 'solid', 'band'],
    ['monaco', 'AS 모나코', 'ASM', 'ligue1', 81, 76, '#C8352B', '#F2EBDD', 'half', 'diag'],
    ['lyon', '올랭피크 리옹', 'OL', 'ligue1', 79, 76, '#F2EBDD', '#1F3F8F', 'solid', 'diag'],
    ['lille', 'LOSC 릴', 'LIL', 'ligue1', 80, 72, '#C8352B', '#1E2F5B', 'solid', 'band'],
    ['nice', 'OGC 니스', 'NIC', 'ligue1', 78, 66, '#C8352B', '#1E1E1E', 'vstripe', 'stripes'],
    ['lens', 'RC 랑스', 'RCL', 'ligue1', 78, 64, '#F1C232', '#C8352B', 'vstripe', 'stripes'],
    ['rennes', '스타드 렌', 'SRF', 'ligue1', 78, 64, '#C8352B', '#1E1E1E', 'solid', 'half'],
  ];

  D.CLUBS = {};
  RAW.forEach(([id, name, short, league, str, rep, c1, c2, pattern, badge]) => {
    D.CLUBS[id] = { id, name, short, league, str, rep, colors: [c1, c2], pattern, badge };
  });

  // 진로용 가상 팀 (고교·대학·K3). 실제 학교·팀 이름이 아니다.
  D.SCHOOLS = [
    ['s_hanbit', '한빛고', 'HBT', '#1F4E9C', '#F2EBDD'],
    ['s_daeseong', '대성고', 'DSG', '#C8352B', '#F2EBDD'],
    ['s_cheongun', '청운고', 'CWG', '#2F6B3A', '#F2EBDD'],
    ['s_seorin', '서린공고', 'SRT', '#1E1E1E', '#E9B92E'],
    ['s_dongbaek', '동백고', 'DBG', '#8E1B2E', '#F2EBDD'],
    ['s_haeam', '해암고', 'HAG', '#4FA3D9', '#1E2F5B'],
  ];
  D.SCHOOLS.forEach(([id, name, short, c1, c2]) => {
    D.CLUBS[id] = { id, name, short, league: 'school', str: 55, rep: 5, colors: [c1, c2], pattern: 'solid', badge: 'band', fake: true };
  });
  D.CLUBS.u_hanguk = { id: 'u_hanguk', name: '한국체육대학 (가상)', short: 'HKU', league: 'univ', str: 59, rep: 8, colors: ['#1E2F5B', '#F2EBDD'], pattern: 'solid', badge: 'ring', fake: true };
  D.CLUBS.u_seonghwa = { id: 'u_seonghwa', name: '성화대학 (가상)', short: 'SHU', league: 'univ', str: 58, rep: 8, colors: ['#2F6B3A', '#E9B92E'], pattern: 'solid', badge: 'band', fake: true };
  D.CLUBS.k3_harbor = { id: 'k3_harbor', name: '항구시민축구단 (가상)', short: 'HBR', league: 'k3', str: 56, rep: 6, colors: ['#1F3F8F', '#F2EBDD'], pattern: 'hstripe', badge: 'band', fake: true };
  D.CLUBS.k3_valley = { id: 'k3_valley', name: '산골FC (가상)', short: 'VLY', league: 'k3', str: 55, rep: 5, colors: ['#2F6B3A', '#F2EBDD'], pattern: 'solid', badge: 'ring', fake: true };

  D.MILITARY_CLUB = 'sangmu';

  D.clubsIn = (league) => Object.values(D.CLUBS).filter((c) => c.league === league);
})(typeof window !== 'undefined' ? window : globalThis);
