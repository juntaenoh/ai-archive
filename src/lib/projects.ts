export type ProjectData = {
  color: string
  label: string
  subtitle: string
  period: string
  role: string
  stack: string[]
  desc: string
  problem: string
  intent: string
  outcome: string
  award: string | null
  link: string | null
  linkLabel: string
  images: string[]
  stats: number[]
}

export const PROJECT_DATA: ProjectData[] = [
  {
    color: '#C0392B',
    label: '수중 협소구역\n무인 탐사잠수정',
    subtitle: 'Underwater ROV for Confined-Area Search',
    period: '2023',
    role: '임베디드 · 프론트엔드',
    stack: ['C++', 'Raspberry Pi', 'Embedded C', 'Servo / Sonar'],
    problem: '수중 조난 사고에서 협소 구역은 기존 장비로 진입이 불가능해 구조에 한계가 있음',
    intent: '가변 프레임으로 크기를 조절하는 잠수정을 만들어 좁은 공간도 진입하고 구조를 지원하고자 함',
    outcome: '기능 구현에 치중하다 기획 의도가 희석됨. 동작하는 잠수정은 완성했지만 실제 구조 시나리오 적용엔 미흡',
    desc: '실종자 탐색용 ROV에 가변 프레임과 음파탐지 레이더를 추가해 협소 구역 탐사 성능을 높인 무인 잠수정. 음파 신호와 서보 데이터를 결합한 레이더 그래픽을 실시간으로 표출.',
    award: '2023 한이음 공모전 동상',
    link: null,
    linkLabel: '',
    images: ['/projects/submarine.png'],
    stats: [0.8, 0.6, 1.0, 0.8, 0.4, 0.4],
  },
  {
    color: '#0891B2',
    label: '해양 오염\n모니터링 탐사함',
    subtitle: 'Marine Pollution Monitoring Vessel',
    period: '2022',
    role: 'PM · 임베디드 · 프론트엔드',
    stack: ['Arduino/ESP', 'C++', 'Firebase', 'Flutter'],
    problem: '항만 기름 유출은 크고 작은 것이 상시 발생하지만 발견이 늦어 오염이 확산되는 구조',
    intent: '탁도 센서를 탑재한 보트가 항만을 자율 순찰하다 기준치 초과 시 GPS 위치와 함께 인근 작업자·관제센터에 즉시 알람 전송 — 신속한 발견과 대처가 핵심',
    outcome: '블루투스 거리 한계로 원거리 전송은 불가. 근거리 순찰 및 오염 감지·알람 기능은 구현 완료',
    desc: '탁도 센서를 탑재한 자율주행 보트로 해양 오염을 실시간 측정하고, 일정 수치 초과 시 GPS 기반 오염 위치를 앱으로 전달하는 저비용 모니터링 시스템.',
    award: '2022 스마트해상물류경진대회 동상',
    link: null,
    linkLabel: '',
    images: ['/projects/ocean.jpg'],
    stats: [0.8, 0.8, 0.6, 0.6, 1.0, 0.8],
  },
  {
    color: '#059669',
    label: '영상깊이 탐색\n스마트 테이블',
    subtitle: 'Remote Haptic Entertainment Table',
    period: '2022',
    role: '기획 · 임베디드 · 프론트엔드 · 하드웨어',
    stack: ['Arduino/ESP', 'C++', 'Firebase', 'Flutter'],
    problem: '물리적 거리를 넘어 촉감을 공유할 수 없음',
    intent: '카메라가 손 위치를 인식하면 테이블 기둥이 그 높이만큼 올라오는 원격 햅틱 시스템. 카메라와 테이블이 멀리 떨어져 있으면 두 사람이 서로의 손 움직임을 촉각으로 느낄 수 있는 엔터테인먼트 테이블',
    outcome: '비전 인식과 테이블 구동은 완성. 수작업 납땜으로 진행해 일부 기둥 오작동',
    desc: '딥러닝 영상 깊이 측정으로 사용자 체형에 맞는 높이를 자동 설정하는 스마트 책상. Flutter 앱에서 블루투스로 데이터를 전송해 모터를 제어.',
    award: null,
    link: null,
    linkLabel: '',
    images: ['/projects/table1.jpg', '/projects/table2.jpg', '/projects/table3_new.jpg'],
    stats: [1.0, 0.4, 1.0, 0.4, 0.4, 1.0],
  },
  {
    color: '#7C3AED',
    label: 'AI 기반\n주차 안내 시스템',
    subtitle: 'AI-Powered Parking Guidance System',
    period: '2022.09 – 2022.11',
    role: '서버 · 임베디드 · 프론트엔드',
    stack: ['Flutter', 'Firebase', 'Python', 'YOLO'],
    problem: '학교 주차장에서 빈 자리가 어디 있는지 몰라 입구부터 끝까지 직접 돌아다녀야 하는 비효율',
    intent: '기존 CCTV 영상을 와핑해 주차 공간을 인식하고 남은 자리 수를 앱으로 전송 — 입구에서 미리 확인하고 바로 이동하는 서비스. ',
    outcome: 'YOLO 기반 실시간 감지 및 앱 연동 구현 완료. 추가 인프라 없이 기존 CCTV만으로 동작',
    desc: 'CCTV 영상을 딥러닝으로 분석해 실시간 주차 공간 현황을 앱으로 제공하는 시스템. 소규모 설치 비용으로 주차장 전체를 커버.',
    award: '캡스톤 디자인 경진대회 동상',
    link: null,
    linkLabel: '',
    images: ['/projects/parking2.jpg', '/projects/parking3.jpg', '/projects/parking4.jpg'],
    stats: [0.6, 0.8, 0.6, 0.8, 1.0, 0.6],
  },
  {
    color: '#EA580C',
    label: '여행기 자동\n기록 어플리케이션',
    subtitle: 'Automatic Travel Journal App',
    period: '2025.07 – 2025.09',
    role: '기획 · 프론트엔드 · 디자인',
    stack: ['Flutter'],
    problem: '여행의 본질은 느끼고 경험하는 것인데, 기록의 귀찮음 때문에 소중한 순간들이 사라짐',
    intent: '기록 장벽을 낮추면 사람들이 충분히 남긴다 — 음성녹음 → STT → AI 감정 추출 → 장소·감정 자동 태깅 → 여행 종료 시 여행기 자동 생성 및 공유',
    outcome: 'App Store 배포 완료. 폴리싱과 운영 멈춘 상태',
    desc: 'GPS/위치 기반으로 방문 장소를 자동 태깅해 사용자 입력 없이 여행기가 완성되는 앱. 4인 팀 프로젝트, App Store 출시.',
    award: null,
    link: 'https://apps.apple.com/kr/app/beezip/id6749936965',
    linkLabel: 'App Store',
    images: ['/projects/beezip.png'],
    stats: [1.0, 1.0, 0.8, 0.6, 1.0, 0.8],
  },
  {
    color: '#DB2777',
    label: '실시간 비전 기반\n운동 코칭',
    subtitle: 'Real-time Vision-Based Exercise Coaching',
    period: '2025',
    role: '기획 · 개발',
    stack: ['Flutter', 'C++', 'CoreML', 'CocoaPods'],
    problem: '기술 전시 직전, 앱에 기술적 차별점이 없었음. 족저압 분석으로 운동을 추천하지만 실제로 따라할 수 없는 단절된 UX',
    intent: '족저압 분석 → 추천 운동 → 실시간 비전 코칭으로 UX 루프를 완성. Flutter·네이티브·웹 멀티플랫폼 지원을 위해 C 라이브러리로 제작 후 각 플랫폼에 브릿지로 연결',
    outcome: '전시회에서 동적인 실시간 시범이 가능해 가장 효과적인 반응을 얻음',
    desc: '비전 데이터로 운동 자세를 실시간 분석해 횟수를 자동 카운팅하는 코칭 기능. 체형·위치 차이를 보정하는 스마트 포즈 분석 알고리즘 설계 및 CocoaPod 배포.',
    award: null,
    link: 'https://cocoapods.org/pods/ExerciseSegmentAPI',
    linkLabel: 'CocoaPods',
    images: ['/projects/coaching1.png', '/projects/coaching2.png', '/projects/coaching3.png'],
    stats: [0.8, 0.8, 0.6, 1.0, 0.8, 1.0],
  },
]

export const RADAR_LABELS = ['재미', '완성도', '창의성', '기술력', '실용성', '노력']
