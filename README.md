# 등번호

고1 벤치에서 시작하는 축구 커리어 시뮬레이션. 서버 없이 브라우저에서 돈다.

## 실행

- 컴퓨터: 폴더에서 `python3 -m http.server` 실행 후 http://localhost:8000
- 아이폰: GitHub Pages에 올리고 사파리에서 열기 → 공유 → 홈 화면에 추가. 처음 한 번 접속하면 그 뒤로는 인터넷 없이 된다.

## 구조

- `data/` 클럽·리그(clubs.js), 이름, 이벤트
- `js/sim/` 시뮬레이션. 화면 코드 없이 Node에서도 돈다. legacy.js는 특성·기록·각성
- `js/pixel/` 도트 그림 (선수 앞·뒤, 미니 피치, 골문 미니게임, 배지, 아이콘, 트로피)
- `js/ui/` 화면과 효과음
- `tools/qa.js` 자동 커리어 테스트: `node tools/qa.js 100 smart`
- `tools/policy.js` 플레이 방식별 결과 비교, `tools/chances.js` 경기 장면 검증, `tools/bench.js` 나이별 벤치 비율, `tools/sanity.js` 숫자·이벤트·세이브 점검, `tools/length.js` 한 판 화면 수
- `assets.html` 도트 에셋 시트

## 직접 넣는 파일

- `sounds/` click, kick, whistle, goal, groan, save, page (.ogg/.mp3/.wav). 없으면 합성음을 쓴다.
- `emblems/클럽ID.png` 있으면 기본 배지 대신 보여 준다. 개인용으로만 쓰고 공개 저장소에는 올리지 않는다.

클럽·리그·대회 명칭의 권리는 각 권리자에게 있다. 등장 선수는 모두 가상 인물이다.
글꼴: 갈무리(Galmuri), SIL Open Font License.
