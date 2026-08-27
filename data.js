/**
 * 고등학생 맞춤형 진로 탐색기 (App A - Gemini)
 * 사전 Research(커리어넷, 고용24, O*NET) 기반 직업 및 매핑 데이터셋
 * (Rule-based 직업별 세부 적합도 가중치 subjectAffinity 포함 - [App A 구현 가정])
 */

// 1. 기본 10개 교과목 및 계열 가중치 매핑 데이터 [App A 구현 가정]
const SUBJECT_MAPPING = [
  { id: 'korean', name: '국어', category: '표준 교과', domainWeights: { humanities: 1.0, medical: 0.5, business: 0.5, arts_sports: 0.5 } },
  { id: 'math', name: '수학', category: '표준 교과', domainWeights: { engineering: 1.0, it: 1.0, business: 1.0, medical: 0.8 } },
  { id: 'english', name: '영어', category: '표준 교과', domainWeights: { humanities: 0.5, business: 0.8, medical: 0.8 } },
  { id: 'history', name: '한국사', category: '표준 교과', domainWeights: { humanities: 1.0 } },
  { id: 'social', name: '사회탐구 (일반사회/지리/윤리/역사)', category: '표준 교과', domainWeights: { humanities: 1.0, business: 1.0 } },
  { id: 'science', name: '과학탐구 (물리/화학/생명과학/지구과학)', category: '표준 교과', domainWeights: { engineering: 1.0, medical: 1.0, it: 0.5 } },
  { id: 'info', name: '정보 / 코딩', category: '표준 교과', domainWeights: { it: 1.0, arts_sports: 0.5, engineering: 0.5 } },
  { id: 'tech', name: '기술 · 가정', category: '표준 교과', domainWeights: { engineering: 1.0, it: 0.5 } },
  { id: 'arts_sports', name: '미술 / 음악 / 체육', category: '표준 교과', domainWeights: { arts_sports: 1.0 } },
  { id: 'foreign', name: '제2외국어', category: '표준 교과', domainWeights: { humanities: 1.0, business: 0.5 } }
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
    officialSource: { name: '커리어넷 직업정보 (변호사)', url: 'https://www.career.go.kr/cnet/front/base/job/jobView.do?seq=374' },
    tasks: '사건 의뢰인의 법률 자문, 민형사 소송 대리 및 법정 변론 수행',
    majors: ['법학과', '공공인재학부', '자율전공학부'],
    recommendedSubjects: ['사회탐구 (일반사회/윤리)', '국어', '한국사'],
    reasonTemplate: (subjects) => `${subjects.join(', ')} 과목의 높은 관심도를 바탕으로 논리적 사고와 법률 해석 능력이 요구되는 변호사 직업에 높은 적합성을 보입니다.`
  },
  {
    id: 'reporter',
    name: '기자',
    domainId: 'humanities',
    domainName: '인문사회',
    isRepresentativeRef: false,
    subjectAffinity: { korean: 2.0, foreign: 2.0, social: 1.2, english: 1.2 }, // [App A 구현 가정]
    officialSource: { name: '고용24 직업정보 (기자)', url: 'https://www.work24.go.kr/wk/r/c/1000/jobPsyExamList.do' },
    tasks: '사회 현상 취재, 기사 작성, 보도 및 다양한 미디어 콘텐츠 기획',
    majors: ['미디어커뮤니케이션학과', '신문방송학과', '국어국문학과'],
    recommendedSubjects: ['국어', '제2외국어', '사회탐구'],
    reasonTemplate: (subjects) => `${subjects.join(', ')} 선호도가 우수하여 취재력, 기사 작성 능력 및 사회 현상 분석이 핵심인 기자 직업에 유의미하게 부합합니다.`
  },

  // --- 자연과학 / 공학 계열 (Engineering) ---
  {
    id: 'mech_engineer',
    name: '기계공학기술자',
    domainId: 'engineering',
    domainName: '자연과학 / 공학',
    isRepresentativeRef: true, // [App A 구현 가정] 대표 참고 직업
    subjectAffinity: { math: 2.0, tech: 2.0, science: 1.5 }, // [App A 구현 가정]
    officialSource: { name: '커리어넷 직업정보 (기계공학기술자)', url: 'https://www.career.go.kr/cnet/front/base/job/jobView.do?seq=152' },
    tasks: '산업용 기계, 로봇, 자동화 설비의 설계·제작·유지보수 및 연구 개발',
    majors: ['기계공학과', '메카트로닉스공학과', '로봇공학과'],
    recommendedSubjects: ['수학 (미적분/기하)', '과학탐구 (물리학)', '기술·가정'],
    reasonTemplate: (subjects) => `${subjects.join(', ')} 과목에 대한 뛰어난 역량이 확인되어 기계 메커니즘 설계와 공학적 문제 해결을 수행하는 기계공학기술자에 적합합니다.`
  },
  {
    id: 'architect',
    name: '건축가',
    domainId: 'engineering',
    domainName: '자연과학 / 공학',
    isRepresentativeRef: false,
    subjectAffinity: { arts_sports: 2.0, math: 1.8, tech: 1.5, science: 1.0 }, // [App A 구현 가정]
    officialSource: { name: 'O*NET SOC (Architects)', url: 'https://www.onetcenter.org/link/summary/17-1011.00' },
    tasks: '건축물 설계, 공간 구조 기획, 시공 도면 작성 및 현장 조율',
    majors: ['건축학과 (5년제)', '건축공학과', '실내건축학과'],
    recommendedSubjects: ['수학', '미술/음악/체육 (미술)', '기술·가정'],
    reasonTemplate: (subjects) => `${subjects.join(', ')} 성향이 잘 조화되어 공간 조형 감각과 공학적 안전 설계를 융합하는 건축가 진로가 크게 추천됩니다.`
  },
  {
    id: 'env_engineer',
    name: '환경공학기술자',
    domainId: 'engineering',
    domainName: '자연과학 / 공학',
    isRepresentativeRef: false,
    subjectAffinity: { science: 2.0, tech: 1.8, math: 1.0 }, // [App A 구현 가정]
    officialSource: { name: '커리어넷 직업정보 (환경공학기술자)', url: 'https://www.career.go.kr/cnet/front/base/job/jobView.do?seq=284' },
    tasks: '수질·대기·폐기물 오염 방지 기술 개발, 환경 영향 평가 및 에코 설비 연구',
    majors: ['환경공학과', '지구환경과학과', '화학공학과'],
    recommendedSubjects: ['과학탐구 (화학/생명과학)', '기술·가정', '수학'],
    reasonTemplate: (subjects) => `${subjects.join(', ')} 선호도가 높아 환경 오염 측정 및 친환경 공학 기술을 연구하는 환경공학기술자에 높은 맞춤도를 보입니다.`
  },

  // --- IT / 소프트웨어 계열 (IT) ---
  {
    id: 'sw_developer',
    name: '시스템소프트웨어개발자',
    domainId: 'it',
    domainName: 'IT / 소프트웨어',
    isRepresentativeRef: true, // [App A 구현 가정] 대표 참고 직업
    subjectAffinity: { info: 2.0, english: 1.8, math: 1.0 }, // [App A 구현 가정]
    officialSource: { name: '고용24 직업정보 (소프트웨어개발자)', url: 'https://www.work24.go.kr/wk/r/c/1000/jobPsyExamList.do' },
    tasks: '운영체제, 웹/앱 애플리케이션 프로그래밍, 코딩 및 시스템 아키텍처 설계',
    majors: ['컴퓨터공학과', '소프트웨어학과', '정보통신공학과'],
    recommendedSubjects: ['정보/코딩', '수학 (수학II/인공지능수학)', '영어'],
    reasonTemplate: (subjects) => `${subjects.join(', ')} 분야의 강점이 두드러져 소프트웨어 설계 및 인공지능/프로그래밍을 담당하는 개발자 직업에 가장 부합합니다.`
  },
  {
    id: 'data_scientist',
    name: '데이터과학자',
    domainId: 'it',
    domainName: 'IT / 소프트웨어',
    isRepresentativeRef: true, // [App A 구현 가정] 대표 참고 직업
    subjectAffinity: { math: 2.0, info: 1.8, science: 1.5 }, // [App A 구현 가정]
    officialSource: { name: 'O*NET SOC (Data Scientists)', url: 'https://www.onetcenter.org/link/summary/15-2051.00' },
    tasks: '빅데이터 수집, 통계 모델링, 머신러닝 알고리즘 개발 및 데이터 기반 인사이트 도출',
    majors: ['데이터사이언스학과', '통계학과', 'AI응용학과'],
    recommendedSubjects: ['수학 (확률과통계)', '정보/코딩', '과학탐구'],
    reasonTemplate: (subjects) => `${subjects.join(', ')} 과목의 우수한 점수를 바탕으로 수리적 통계 분석과 빅데이터 모델링을 수행하는 데이터과학자 진로가 적극 추천됩니다.`
  },
  {
    id: 'security_analyst',
    name: '정보보안전문가',
    domainId: 'it',
    domainName: 'IT / 소프트웨어',
    isRepresentativeRef: false,
    subjectAffinity: { english: 2.0, info: 1.5, social: 1.5 }, // [App A 구현 가정]
    officialSource: { name: '커리어넷 직업정보 (정보보안전문가)', url: 'https://www.career.go.kr/cnet/front/base/job/jobView.do?seq=412' },
    tasks: '사이버 침해 사고 대응, 암호 알고리즘 분석, 네트워크 해킹 방어 및 보안 솔루션 구축',
    majors: ['정보보안학과', '사이버보안학과', '컴퓨터공학과'],
    recommendedSubjects: ['정보/코딩', '영어', '사회탐구'],
    reasonTemplate: (subjects) => `${subjects.join(', ')} 과목 관심도가 높아 시스템 암호학 및 네트워크 방어 체계를 연구하는 정보보안전문가에 매우 적합합니다.`
  },

  // --- 예체능 계열 (Arts & Sports) ---
  {
    id: 'graphic_designer',
    name: '시각디자이너',
    domainId: 'arts_sports',
    domainName: '예체능',
    isRepresentativeRef: false,
    subjectAffinity: { arts_sports: 2.0, info: 2.0, social: 1.0 }, // [App A 구현 가정]
    officialSource: { name: '커리어넷 직업정보 (시각디자이너)', url: 'https://www.career.go.kr/cnet/front/base/job/jobView.do?seq=215' },
    tasks: '포스터, 브랜드 로고, UI/UX 디지탈 그래픽 그래픽 제작 및 디자인 컨셉 기획',
    majors: ['시각디자인학과', '커뮤니케이션디자인학과', '미디어디자인학과'],
    recommendedSubjects: ['미술/음악/체육', '정보/코딩', '사회탐구'],
    reasonTemplate: (subjects) => `${subjects.join(', ')} 분야의 표현력과 그래픽 활용 능력이 돋보여 비주얼 감각을 시각 매체로 구현하는 디자이너 진로와 일치합니다.`
  },
  {
    id: 'sports_coach',
    name: '스포츠지도사',
    domainId: 'arts_sports',
    domainName: '예체능',
    isRepresentativeRef: false,
    subjectAffinity: { arts_sports: 2.0, science: 2.0, korean: 1.0 }, // [App A 구현 가정]
    officialSource: { name: '고용24 직업정보 (스포츠지도사)', url: 'https://www.work24.go.kr/wk/r/c/1000/jobPsyExamList.do' },
    tasks: '운동선수 및 일반인의 신체 훈련 지도, 스포츠 기술 코칭, 체력 트레이닝',
    majors: ['체육학과', '스포츠과학과', '사회체육학과'],
    recommendedSubjects: ['미술/음악/체육 (체육)', '과학탐구 (생명과학)', '국어'],
    reasonTemplate: (subjects) => `${subjects.join(', ')} 과목 선호도가 반영되어 운동 생리학과 실전 코칭 기술을 결합하는 스포츠지도사에 뛰어난 적합도를 보여줍니다.`
  },

  // --- 의약 / 바이오 계열 (Medical) ---
  {
    id: 'physician',
    name: '가정의학과 전문의',
    domainId: 'medical',
    domainName: '의약 / 바이오',
    isRepresentativeRef: true, // [App A 구현 가정] 대표 참고 직업
    subjectAffinity: { science: 2.0, korean: 2.0, math: 1.0 }, // [App A 구현 가정]
    officialSource: { name: 'O*NET SOC (Physicians, Family)', url: 'https://www.onetcenter.org/link/summary/29-1215.00' },
    tasks: '환자 질병 진단, 처방, 종합 의료 상담 및 예방 의학적 건강 관리',
    majors: ['의예과 (의학과)', '치의학과', '한의예과'],
    recommendedSubjects: ['과학탐구 (생명과학/화학)', '수학', '국어'],
    reasonTemplate: (subjects) => `${subjects.join(', ')} 분야의 강점이 검증되어 인체 생리학 및 종합 임상 의학을 진료하는 의사/전문의 직업에 높은 부합도를 나타냅니다.`
  },
  {
    id: 'nurse',
    name: '간호사',
    domainId: 'medical',
    domainName: '의약 / 바이오',
    isRepresentativeRef: false,
    subjectAffinity: { korean: 2.0, english: 2.0, science: 1.5 }, // [App A 구현 가정]
    officialSource: { name: '커리어넷 직업정보 (간호사)', url: 'https://www.career.go.kr/cnet/front/base/job/jobView.do?seq=112' },
    tasks: '입원 및 외래 환자 간호, 의사 진료 보조, 투약 처리 및 환자 상태 모니터링',
    majors: ['간호학과'],
    recommendedSubjects: ['과학탐구 (생명과학)', '영어', '국어'],
    reasonTemplate: (subjects) => `${subjects.join(', ')} 과목에 높은 흥미를 보여 환자 케어와 전문 의학적 간호 서비스를 제공하는 간호사 직업에 유의미하게 연관됩니다.`
  },
  {
    id: 'biomedical_researcher',
    name: '유전공학연구원',
    domainId: 'medical',
    domainName: '의약 / 바이오',
    isRepresentativeRef: true, // [App A 구현 가정] 대표 참고 직업
    subjectAffinity: { science: 2.0, math: 2.0, info: 1.5 }, // [App A 구현 가정]
    officialSource: { name: '커리어넷 직업정보 (유전공학연구원)', url: 'https://www.career.go.kr/cnet/front/base/job/jobView.do?seq=325' },
    tasks: 'DNA/RNA 유전자 분석, 신약 후보 물질 탐색, 세포 공학 연구 및 바이오 기술 개발',
    majors: ['생명공학과', '유전공학과', '바이오시스템공학과'],
    recommendedSubjects: ['과학탐구 (생명과학/화학)', '수학', '정보/코딩'],
    reasonTemplate: (subjects) => `${subjects.join(', ')} 과목 점수가 우수하여 첨단 바이오 신약 및 유전자 분자 세포를 연구하는 유전공학연구원 진로가 강하게 추천됩니다.`
  },

  // --- 경영 / 경제 계열 (Business) ---
  {
    id: 'accountant',
    name: '공인회계사',
    domainId: 'business',
    domainName: '경영 / 경제',
    isRepresentativeRef: false,
    subjectAffinity: { math: 2.0, social: 2.0, english: 1.0 }, // [App A 구현 가정]
    officialSource: { name: '커리어넷 직업정보 (공인회계사)', url: 'https://www.career.go.kr/cnet/front/base/job/jobView.do?seq=098' },
    tasks: '기업 재무제표 감사, 세무 대리, 회계 자문 및 기업 가치 평가',
    majors: ['경영학과', '회계학과', '세무학과'],
    recommendedSubjects: ['수학 (확률과통계)', '사회탐구 (경제)', '영어'],
    reasonTemplate: (subjects) => `${subjects.join(', ')} 성향이 탁월하여 수리적 정확성과 수치 데이터 재무 감사를 전담하는 회계사에 높은 적합성을 나타냅니다.`
  },
  {
    id: 'consultant',
    name: '경영컨설턴트',
    domainId: 'business',
    domainName: '경영 / 경제',
    isRepresentativeRef: false,
    subjectAffinity: { social: 2.0, english: 2.0, korean: 1.5 }, // [App A 구현 가정]
    officialSource: { name: '고용24 직업정보 (경영컨설턴트)', url: 'https://www.work24.go.kr/wk/r/c/1000/jobPsyExamList.do' },
    tasks: '기업 경영 전략 수립, 조직 문제 진단, 마케팅 전략 수립 및 경영 효율화 자문',
    majors: ['경영학과', '경제학과', '산업공학과'],
    recommendedSubjects: ['사회탐구 (경제/일반사회)', '영어', '국어'],
    reasonTemplate: (subjects) => `${subjects.join(', ')} 선호도가 높아 기업 환경을 분석하고 전략적 해결책을 제안하는 경영컨설턴트 진로가 매우 적합합니다.`
  }
];
