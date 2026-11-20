// 가상 인물 이름. 실존 선수 이름은 쓰지 않는다.
(function (root) {
  const D = (root.DATA = root.DATA || {});
  D.NAMES = {
    krFamily: ['김', '이', '박', '최', '정', '강', '조', '윤', '장', '임', '한', '오', '서', '신', '권', '황', '안', '송', '전', '홍', '유', '고', '문', '양', '손', '배', '백', '허', '남', '심', '노', '하', '곽', '성', '차', '주', '우', '구', '민', '진'],
    krGiven: ['도윤', '서준', '하준', '시우', '지호', '은찬', '건우', '우진', '선우', '민재', '현우', '지훈', '준서', '유찬', '태윤', '승민', '재원', '동하', '시원', '정우', '한결', '이안', '윤재', '태오', '규민', '수호', '로운', '지환', '성빈', '다온', '찬희', '경민', '대현', '상혁', '연우', '주원', '해찬', '재희', '온유', '태건'],
    // 발롱도르 후보·상대 선수용
    world: {
      ES: [['Iker', 'Javi', 'Marc', 'Dani', 'Pau', 'Unai', 'Álvaro'], ['Ortega', 'Llorente', 'Soler', 'Navas', 'Ibarra', 'Rojas', 'Campos']],
      EN: [['Callum', 'Reece', 'Archie', 'Mason', 'Ollie', 'Harvey', 'Tyler'], ['Whitlock', 'Barnes', 'Ashford', 'Pryce', 'Hollins', 'Draycott', 'Fenwick']],
      FR: [['Théo', 'Lilian', 'Moussa', 'Enzo', 'Rayan', 'Malo', 'Yanis'], ['Diallo', 'Laurent', 'Mercier', 'Moreau', 'Fofana', 'Girard', 'Traoré']],
      BR: [['Danilo', 'Rafinho', 'Gabriel', 'Wesley', 'Lucas', 'Matheus', 'Caio'], ['Souza', 'Andrade', 'Ferreira', 'Pinheiro', 'Barbosa', 'Teixeira', 'Lima']],
      AR: [['Thiago', 'Nico', 'Facundo', 'Ezequiel', 'Valentín', 'Bruno', 'Mateo'], ['Paredes', 'Acosta', 'Medina', 'Villalba', 'Correa', 'Sosa', 'Quiroga']],
      DE: [['Florian', 'Jonas', 'Lukas', 'Leon', 'Niklas', 'Paul', 'Felix'], ['Brandt', 'Hofmann', 'Krüger', 'Lange', 'Schäfer', 'Vogt', 'Weber']],
      PT: [['João', 'Rúben', 'Diogo', 'Tiago', 'Gonçalo', 'Nuno', 'Rafael'], ['Silva', 'Carvalho', 'Moutinho', 'Lopes', 'Pires', 'Antunes', 'Rocha']],
      IT: [['Federico', 'Lorenzo', 'Matteo', 'Sandro', 'Davide', 'Gianluca', 'Nicolò'], ['Bianchi', 'Esposito', 'Ricci', 'Marchetti', 'Conti', 'Galli', 'Ferraro']],
      NL: [['Daan', 'Sem', 'Bram', 'Stijn', 'Xavi', 'Teun', 'Ruben'], ['de Vries', 'Bakker', 'Visser', 'Jansen', 'Kuipers', 'Smit', 'Mulder']],
      NO: [['Eirik', 'Martin', 'Sander', 'Oscar', 'Jens'], ['Solberg', 'Hauge', 'Lindvik', 'Moe', 'Bakken']],
      NG: [['Victor', 'Samuel', 'Ademola', 'Chidi', 'Femi'], ['Okafor', 'Adeyemi', 'Nwosu', 'Balogun', 'Eze']],
      JP: [['Haruto', 'Sota', 'Ritsu', 'Daichi', 'Kaito', 'Ao'], ['Ishikawa', 'Fujii', 'Nakano', 'Sano', 'Tanaka', 'Morishita']],
    },
  };
})(typeof window !== 'undefined' ? window : globalThis);
