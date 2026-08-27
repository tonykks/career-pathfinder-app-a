/**
 * 고등학생 맞춤형 진로 탐색기 (App A - Gemini)
 * 사전 Research(커리어넷, 고용24, O*NET) 기반 직업 및 매핑 데이터셋
 * (Rule-based 직업별 세부 적합도 가중치 subjectAffinity 포함 - [App A 구현 가정])
 */

// 1. 기본 10개 교과목 및 계열 가중치 매핑 데이터
const SUBJECT_MAPPING = [
  { id: 'korean', name: '국어', category: '표준 교과', primaryDomain: 'humanities', primaryWeight: 1.0, secondaryDomain: 'business', secondaryWeight: 0.5 },
  { id: 'math', name: '수학', category: '표준 교과', primaryDomain: 'engineering', primaryWeight: 1.0, secondaryDomain: 'it', secondaryWeight: 0.5 },
  { id: 'english', name: '영어', category: '표준 교과', primaryDomain: 'humanities', primaryWeight: 1.0, secondaryDomain: 'business', secondaryWeight: 0.5 },
  { id: 'history', name: '한국사', category: '표준 교과', primaryDomain: 'humanities', primaryWeight: 1.0, secondaryDomain: null, secondaryWeight: 0 },
  { id: 'social', name: '사회탐구 (일반사회/지리/윤리/역사)', category: '표준 교과', primaryDomain: 'humanities', primaryWeight: 1.0, secondaryDomain: 'business', secondaryWeight: 0.5 },
  { id: 'science', name: '과학탐구 (물리/화학/생명과학/지구과학)', category: '표준 교과', primaryDomain: 'engineering', primaryWeight: 1.0, secondaryDomain: 'medical', secondaryWeight: 0.5 },
  { id: 'info', name: '정보 / 코딩', category: '표준 교과', primaryDomain: 'it', primaryWeight: 1.0, secondaryDomain: null, secondaryWeight: 0 },
  { id: 'tech', name: '기술 · 가정', category: '표준 교과', primaryDomain: 'engineering', primaryWeight: 0.5, secondaryDomain: 'it', secondaryWeight: 0.5 },
  { id: 'arts_sports', name: '미술 / 음악 / 체육', category: '표준 교과', primaryDomain: 'arts_sports', primaryWeight: 1.0, secondaryDomain: null, secondaryWeight: 0 },
  { id: 'foreign', name: '제2외국어', category: '표준 교과', primaryDomain: 'humanities', primaryWeight: 0.5, secondaryDomain: null, secondaryWeight: 0 }
];

// 2. 6개 진로 분야(Domain) 정의
const DOMAINS = {
  humanities: { id: 'humanities', name: '인문사회', color: '#3B82F6', icon: '📚' },
  engineering: { id: 'engineering', name: '자연과학 / 공학', color: '#10B981', icon: '🔬' },
  it: { id: 'it', name: 'IT / 소프트웨어', color: '#6366F1', icon: '💻' },
  arts_sports: { id: 'arts_sports', name: '예체능', color: '#EC4899', icon: '🎨' },
  medical: { id: 'medical', name: '의약 / 바이오', color: '#06B6D4', icon: '🩺' },
  business: { id: 'business', name: '경영 / 경제', color: '#F59E0B', icon: '📊' }
};

// 3. 대표 직업 15종 데이터셋 (subjectAffinity 가중치 포함)
const JOBS_DATASET = [
  // --- 인문사회 계열 (Humanities) ---
  {
    id: 'lawyer',
    name: '변호사',
    domainId: 'humanities',
    domainName: '인문사회',
    isRepresentativeRef: false,
    subjectAffinity: { social: 2.0, korean: 1.5, history: 1.5, english: 1.0 }, // [App A 구현 가정]
    reasonTemplate: (highSubjects) => `${highSubjects.join(', ')} 과목에 높은 선호를 보인 점은 법률 조문 분석, 논리적 서면 작성 및 인간·사회 현상에 관한 깊은 관심과 연계됩니다.`,
    tasks: '민·형사 소송 대리, 법률 자문, 계약서 검토 및 법적 분쟁 조정을 수행합니다.',
    majors: ['법학과', '행정학과', '자율전공학부'],
    recommendedSubjects: ['화법과 언어', '독서와 작문', '정치와 법', '사회와 문화', '윤리와 사상'],
    officialSource: { name: '커리어넷 변호사 직업정보', url: 'https://www.career.go.kr/cloud/m/job/view?seq=375' },
    onetInfo: { code: '23-1011.00', title: 'Lawyers', riasec: 'ECI' }
  },
  {
    id: 'reporter',
    name: '기자',
    domainId: 'humanities',
    domainName: '인문사회',
    isRepresentativeRef: false,
    subjectAffinity: { korean: 2.0, foreign: 2.0, social: 1.2, english: 1.2 }, // [App A 구현 가정]
    reasonTemplate: (highSubjects) => `${highSubjects.join(', ')} 과목에 높은 점수를 준 점은 취재 내용을 바탕으로 사건을 객관적으로 분석하고 명확한 기사로 전달하는 활동과 잘 부합합니다.`,
    tasks: '사건·사고 취재, 기사 기획 및 작성, 인터뷰 진행, 뉴미디어 콘텐츠 제작을 담당합니다.',
    majors: ['미디어커뮤니케이션학과', '신문방송학과', '국어국문학과', '정치외교학과'],
    recommendedSubjects: ['화법과 언어', '독서와 작문', '사회와 문화', '현대사회와 윤리', '세계사'],
    officialSource: { name: '커리어넷 기자 직업정보', url: 'https://www.career.go.kr/cloud/m/job/view?seq=262' },
    onetInfo: { code: '27-3023.00', title: 'News Analysts, Reporters, and Journalists', riasec: 'AIE' }
  },

  // --- 자연과학 / 공학 계열 (Engineering) ---
  {
    id: 'mech_engineer',
    name: '기계공학기술자',
    domainId: 'engineering',
    domainName: '자연과학 / 공학',
    isRepresentativeRef: true,
    subjectAffinity: { math: 2.0, tech: 2.0, science: 1.5 }, // [App A 구현 가정]
    reasonTemplate: (highSubjects) => `${highSubjects.join(', ')} 과목에 대한 뛰어난 흥미는 역학 원리를 계산하고 역학 구조물을 설계·시행해 신기계를 개발하는 공학 역량과 높은 연관성을 가집니다.`,
    tasks: '기계 장치 및 생산 설비 설계, 재료·성능 검토, 시제품 시험 및 도면 작성, 고장 원인 진단을 수행합니다.',
    majors: ['기계공학과', '기계설계공학과', '생산기계공학과', '제어계측공학과'],
    recommendedSubjects: ['미적분', '기하', '물리학', '화학', '기술·가정', '정보'],
    officialSource: { name: '주니어 커리어넷 기계공학기술자', url: 'https://www.career.go.kr/cloud/jm/job/view?seq=10589' },
    onetInfo: { code: '17-2141.00', title: 'Mechanical Engineers', riasec: 'RIC' }
  },
  {
    id: 'architect',
    name: '건축가 (건축사)',
    domainId: 'engineering',
    domainName: '자연과학 / 공학',
    isRepresentativeRef: false,
    subjectAffinity: { arts_sports: 2.0, math: 1.8, tech: 1.5, science: 1.0 }, // [App A 구현 가정]
    reasonTemplate: (highSubjects) => `${highSubjects.join(', ')} 과목 선호는 구조적 수리 계산과 공간 조형 감각을 종합하여 효율적이고 아름다운 건축물을 계획하는 작업에 적합한 기질을 나타냅니다.`,
    tasks: '건축물 설계 계획 수립, 건축 도면 작성, 시공 현장 감리 및 공간 디자인 자문을 수행합니다.',
    majors: ['건축학과 (5년제)', '건축공학과', '실내건축학과'],
    recommendedSubjects: ['미적분', '기하', '물리학', '미술', '지구과학'],
    officialSource: { name: '커리어넷 건축가 직업정보', url: 'https://www.career.go.kr/cnet/app/base/job/jobView.m?SEQ=1277' },
    onetInfo: { code: '17-1011.00', title: 'Architects, Except Landscape and Naval', riasec: 'RCA' }
  },
  {
    id: 'env_engineer',
    name: '환경공학기술자',
    domainId: 'engineering',
    domainName: '자연과학 / 공학',
    isRepresentativeRef: false,
    subjectAffinity: { science: 2.0, tech: 1.8, math: 1.0 }, // [App A 구현 가정]
    reasonTemplate: (highSubjects) => `${highSubjects.join(', ')} 과목에 관심이 높다면 대기·수질·폐기물 오염 문제를 과학적 설비와 데이터로 해결하는 친환경 공학 분야에 높은 잠재력을 가지고 있습니다.`,
    tasks: '환경 오염 측정 및 분석, 오염 방지 설비 설계·시공, 탄소중립 기술 연구를 담당합니다.',
    majors: ['환경공학과', '환경에너지공학과', '화학공학과', '지구환경과학과'],
    recommendedSubjects: ['화학', '생명과학', '지구과학', '미적분', '환경'],
    officialSource: { name: '커리어넷 환경공학기술자 직업정보', url: 'https://www.career.go.kr/cloud/m/job/view?seq=1080' },
    onetInfo: { code: '17-2081.00', title: 'Environmental Engineers', riasec: 'IRC' }
  },

  // --- IT / 소프트웨어 계열 (IT) ---
  {
    id: 'sw_developer',
    name: '소프트웨어개발자',
    domainId: 'it',
    domainName: 'IT / 소프트웨어',
    isRepresentativeRef: true,
    subjectAffinity: { info: 2.0, english: 1.8, math: 1.0 }, // [App A 구현 가정]
    reasonTemplate: (highSubjects) => `${highSubjects.join(', ')} 과목의 높은 선호도는 논리적 문제 해결 능력과 컴퓨팅 사고력을 바탕으로 알고리즘 및 프로그램을 설계·구현하는 적성과 일치합니다.`,
    tasks: '운영체제 및 응용 소프트웨어 기획·설계, 프로그래밍 코드 작성, 시스템 테스트 및 유지보수를 담당합니다.',
    majors: ['컴퓨터공학과', '소프트웨어공학과', '정보통신공학과', 'AI융합학과'],
    recommendedSubjects: ['정보 / 코딩', '확률과 통계', '미적분', '영어', '물리학'],
    officialSource: { name: '커리어넷 시스템소프트웨어개발자', url: 'https://www.career.go.kr/cloud/m/job/view?seq=834' },
    onetInfo: { code: '15-1252.00', title: 'Software Developers', riasec: 'ICR' }
  },
  {
    id: 'data_scientist',
    name: '데이터과학자',
    domainId: 'it',
    domainName: 'IT / 소프트웨어',
    isRepresentativeRef: true,
    subjectAffinity: { math: 2.0, info: 1.8, science: 1.5 }, // [App A 구현 가정]
    reasonTemplate: (highSubjects) => `${highSubjects.join(', ')} 과목에 호기심이 많은 점은 대용량 비구조화 데이터를 수집·통계 모델링하여 인사이트를 도출하는 가치 창출에 직결됩니다.`,
    tasks: '빅데이터 수집 및 정제, 머신러닝 알고리즘 모델링, 데이터 시각화 및 예측 분석을 수행합니다.',
    majors: ['데이터사이언스학과', '통계학과', '컴퓨터공학과', '산업공학과'],
    recommendedSubjects: ['확률과 통계', '정보 / 코딩', '미적분', '인공지능 수학', '영어'],
    officialSource: { name: '커리어넷 데이터마이너 직업정보', url: 'https://www.career.go.kr/cloud/m/job/view?seq=10051' },
    onetInfo: { code: '15-2051.00', title: 'Data Scientists', riasec: 'ICA' }
  },
  {
    id: 'security_analyst',
    name: '정보보안분석가',
    domainId: 'it',
    domainName: 'IT / 소프트웨어',
    isRepresentativeRef: false,
    subjectAffinity: { english: 2.0, info: 1.5, social: 1.5 }, // [App A 구현 가정]
    reasonTemplate: (highSubjects) => `${highSubjects.join(', ')} 과목에 선호도가 높은 점은 사이버 위협을 모니터링하고 시스템 침해를 예방하는 정교한 컴퓨팅 보안 활동과 신뢰성 있게 연결됩니다.`,
    tasks: '네트워크 보안 체계 수립, 사이버 침해 사고 대응, 모의 침투 테스트 및 암호 기술 적용을 담당합니다.',
    majors: ['정보보호학과', '사이버보안학과', '컴퓨터공학과'],
    recommendedSubjects: ['정보 / 코딩', '확률과 통계', '영어', '정치와 법'],
    officialSource: { name: '커리어넷 정보보호전문가 직업정보', url: 'https://www.career.go.kr/cloud/m/job/view?seq=435' },
    onetInfo: { code: '15-1212.00', title: 'Information Security Analysts', riasec: 'CIR' }
  },

  // --- 예체능 계열 (Arts & Sports) ---
  {
    id: 'graphic_designer',
    name: '그래픽디자이너',
    domainId: 'arts_sports',
    domainName: '예체능',
    isRepresentativeRef: false,
    subjectAffinity: { arts_sports: 2.0, info: 2.0, social: 1.0 }, // [App A 구현 가정]
    reasonTemplate: (highSubjects) => `${highSubjects.join(', ')} 과목을 선호하는 경향은 시각적 이미지를 미학적으로 구성하고 미디어 창작물로 표현하는 예술적 창의성과 이어집니다.`,
    tasks: '광고·시각 매체 시각화, 웹 UI/UX 디자인, 브랜드 캐릭터 및 그래픽 요소 제작을 수행합니다.',
    majors: ['시각디자인학과', '커뮤니케이션디자인학과', '디지털콘텐츠학과'],
    recommendedSubjects: ['미술', '디자인 일반', '정보', '사회와 문화'],
    officialSource: { name: '커리어넷 그래픽디자이너 직업정보', url: 'https://www.career.go.kr/cloud/m/job/view?seq=458' },
    onetInfo: { code: '27-1024.00', title: 'Graphic Designers', riasec: 'ACE' }
  },
  {
    id: 'sports_coach',
    name: '스포츠 코치 / 강사',
    domainId: 'arts_sports',
    domainName: '예체능',
    isRepresentativeRef: false,
    subjectAffinity: { arts_sports: 2.0, science: 2.0, korean: 1.0 }, // [App A 구현 가정]
    reasonTemplate: (highSubjects) => `${highSubjects.join(', ')} 과목에 선호가 높은 학생은 신체 운동 기능을 지도하고 체력 및 건강을 증진하는 역동적인 스포츠 지도 활동에 강점을 보여줍니다.`,
    tasks: '종목별 운동 기술 지도, 체력 훈련 프로그램 기획, 선수 육성 및 안전 관리를 담당합니다.',
    majors: ['체육학과', '스포츠지도학과', '체육교육과', '스포츠의학과'],
    recommendedSubjects: ['체육', '운동과 건강', '생명과학', '심리학'],
    officialSource: { name: '커리어넷 스포츠강사 직업정보', url: 'https://www.career.go.kr/cloud/m/job/view?seq=421' },
    onetInfo: { code: '27-2022.00', title: 'Coaches and Scouts', riasec: 'SER' }
  },

  // --- 의약 / 바이오 계열 (Medical & Bio) ---
  {
    id: 'physician',
    name: '의사 (가정의학과)',
    domainId: 'medical',
    domainName: '의약 / 바이오',
    isRepresentativeRef: true,
    subjectAffinity: { science: 2.0, korean: 2.0, math: 1.0 }, // [App A 구현 가정]
    reasonTemplate: (highSubjects) => `${highSubjects.join(', ')} 과목을 깊이 있게 좋아하는 점은 생명 현상 탐구와 인간 건강증진에 대한 소명의식을 기반으로 환자를 진료하는 의학적 진로에 적합합니다.`,
    tasks: '환자 질병 진찰 및 검사 결과 분석, 치료 방침 결정, 종합적인 예방 의학 치료 지도를 수행합니다.',
    majors: ['의예과 / 의학과 (6년제)', '치의예과'],
    recommendedSubjects: ['생명과학', '화학', '미적분', '윤리와 사상', '영어'],
    officialSource: { name: '커리어넷 전문의사 직업정보', url: 'https://www.career.go.kr/cloud/m/job/view?seq=25' },
    onetInfo: { code: '29-1215.00', title: 'Family Medicine Physicians', riasec: 'SIC' }
  },
  {
    id: 'nurse',
    name: '간호사',
    domainId: 'medical',
    domainName: '의약 / 바이오',
    isRepresentativeRef: false,
    subjectAffinity: { korean: 2.0, english: 2.0, science: 1.5 }, // [App A 구현 가정]
    reasonTemplate: (highSubjects) => `${highSubjects.join(', ')} 과목 선호는 의학적 전문 지식과 공감 및 치료 간호 능력을 바탕으로 환자 쾌유를 돕는 간호 전문직에 훌륭히 부합합니다.`,
    tasks: '의무 진료 보조, 환자 상태 관찰 및 간호 기록, 투약 지도, 건강 상담 및 환자 간호를 담당합니다.',
    majors: ['간호학과 (4년제)'],
    recommendedSubjects: ['생명과학', '화학', '심리학', '화법과 언어', '영어'],
    officialSource: { name: '커리어넷 간호사 직업정보', url: 'https://www.career.go.kr/cloud/m/job/view?seq=354' },
    onetInfo: { code: '29-1141.00', title: 'Registered Nurses', riasec: 'SCI' }
  },
  {
    id: 'biomedical_researcher',
    name: '생명의학연구원',
    domainId: 'medical',
    domainName: '의약 / 바이오',
    isRepresentativeRef: true,
    subjectAffinity: { science: 2.0, math: 2.0, info: 1.5 }, // [App A 구현 가정]
    reasonTemplate: (highSubjects) => `${highSubjects.join(', ')} 과목에 높은 탐구열을 가진 학생은 질병 원인 규명 및 바이오 신약 개발을 탐구하는 생명과학 연구에 뛰어난 잠재력을 지닙니다.`,
    tasks: '유전자 및 세포 실험 연구, 신약 물질 개발, 질병 바이오마커 분석 및 연구 논문 작성을 담당합니다.',
    majors: ['생명공학과', '유전공학과', '생명과학과', '의생명공학과'],
    recommendedSubjects: ['생명과학', '화학', '미적분', '확률과 통계', '영어'],
    officialSource: { name: '커리어넷 유전공학연구원 직업정보', url: 'https://www.career.go.kr/cloud/m/job/view?seq=24' },
    onetInfo: { code: '19-1042.00', title: 'Medical Scientists, Except Epidemiologists', riasec: 'IRC' }
  },

  // --- 경영 / 경제 계열 (Business) ---
  {
    id: 'accountant',
    name: '회계사',
    domainId: 'business',
    domainName: '경영 / 경제',
    isRepresentativeRef: false,
    subjectAffinity: { math: 2.0, social: 2.0, english: 1.0 }, // [App A 구현 가정]
    reasonTemplate: (highSubjects) => `${highSubjects.join(', ')} 과목을 선호하는 성향은 재무 수치를 수집·분석하고 정교하게 감정하여 수치적 정밀성을 기하는 회계 전문 직무에 이상적입니다.`,
    tasks: '기업 재무제표 감사, 세무 신고 대리, 세무 자문 및 회계 감사 보고서 작성을 수행합니다.',
    majors: ['회계학과', '경영학과', '경제학과', '세무학과'],
    recommendedSubjects: ['수학 (대수·확통)', '경제', '경제 수학', '사회와 문화', '영어'],
    officialSource: { name: '커리어넷 회계사 직업정보', url: 'https://www.career.go.kr/cnet/app/base/job/jobView.m?SEQ=206' },
    onetInfo: { code: '13-2011.00', title: 'Accountants and Auditors', riasec: 'CEI' }
  },
  {
    id: 'consultant',
    name: '경영컨설턴트',
    domainId: 'business',
    domainName: '경영 / 경제',
    isRepresentativeRef: false,
    subjectAffinity: { social: 2.0, english: 2.0, korean: 1.5 }, // [App A 구현 가정]
    reasonTemplate: (highSubjects) => `${highSubjects.join(', ')} 과목의 흥미는 기업의 문제를 데이터와 사회 현상으로 분석하여 전략적 솔루션을 도출하는 경영 컨설팅 활동에 뛰어난 연결성을 가집니다.`,
    tasks: '기업 경영 진단, 전략·조직·재무 솔루션 제안, 시장 분석 프로젝트 수행 및 자문을 담당합니다.',
    majors: ['경영학과', '경제학과', '산업공학과', '국제통상학과'],
    recommendedSubjects: ['경제', '사회와 문화', '확률과 통계', '경제 수학', '영어'],
    officialSource: { name: '커리어넷 경영컨설턴트 직업정보', url: 'https://www.career.go.kr/cloud/m/job/view?seq=202' },
    onetInfo: { code: '13-1111.00', title: 'Management Analysts', riasec: 'CIE' }
  }
];
