# 🎡 무료 룰렛 게임 | 가족과 즐기는 룰렛 게임 (Family Roulette)

<div align="center">

![Family Roulette](https://img.shields.io/badge/Status-Live-brightgreen)
![License](https://img.shields.io/badge/License-MIT-blue)
![Version](https://img.shields.io/badge/Version-1.0.0-orange)

**무료 원판 돌리기로 즐기는 공정하고 재미있는 가족 활동 선택기**

[🎮 라이브 데모](https://family-roulette-two.vercel.app/) • [📖 문서](https://github.com/seungyongko/family-roulette) • [🐛 이슈 리포트](https://github.com/seungyongko/family-roulette/issues)

</div>

---

## ✨ 프로젝트 소개

**무료 룰렛 게임**은 가족들이 함께 할 활동을 공정하게 선택할 수 있는 인터랙티브 웹 애플리케이션입니다. **가족과 즐기는 룰렛 게임**으로 **무료 원판 돌리기**를 통해 특별한 추억을 만들어보세요. 

🎯 **핵심 특징:**
- 🎲 **가중치 기반 공정 추첨**: CSPRNG를 사용한 암호학적으로 안전한 랜덤 선택
- 🎨 **아름다운 SVG 룰렛**: 부드러운 애니메이션과 직관적인 인터페이스
- ✨ **3D 시각 효과**: Three.js 기반 파티클, 조명, 카메라 효과
- 💾 **로컬 저장소**: 브라우저에 설정과 항목 저장
- 📱 **완벽한 반응형**: 모든 디바이스에서 최적화된 경험

---

## 🚀 주요 기능

### 🎯 핵심 기능
- **가중치 기반 선택**: 각 항목별로 다른 확률 설정 가능
- **실시간 룰렛**: 부드러운 회전 애니메이션
- **결과 표시**: 당첨된 항목을 명확하게 표시
- **항목 관리**: 추가, 삭제, 비활성화 기능

### 🎨 시각적 효과
- **파티클 시스템**: 당첨 시 컨페티 효과
- **동적 조명**: 스포트라이트와 앰비언트 라이트
- **카메라 효과**: 승리 시 카메라 흔들림
- **색상 커스터마이징**: 각 항목별 개별 색상 설정

### 🔧 사용자 경험
- **직관적 UI**: 간단하고 명확한 인터페이스
- **로컬 저장**: 설정과 항목이 자동으로 저장
- **접근성**: ARIA 속성과 키보드 네비게이션 지원
- **한국어 최적화**: 한국 사용자를 위한 완벽한 현지화

### 🔍 SEO 최적화
- **메타 태그**: 완벽한 title, description, keywords 설정
- **Open Graph**: SNS 공유 시 풍부한 미리보기
- **Twitter Card**: 트위터 공유 최적화
- **구조화 데이터**: Schema.org JSON-LD 마크업
- **사이트맵**: sitemap.xml과 robots.txt 제공
- **검색 키워드**: "무료 룰렛 게임", "가족과 즐기는 룰렛 게임", "무료 원판 돌리기", "가족 게임", "룰렛 게임", "무료 추첨" 등 포함

---

## 🛠️ 기술 스택

<div align="center">

| 카테고리 | 기술 |
|:--------:|:-----|
| **프론트엔드** | HTML5, CSS3, Vanilla JavaScript (ES6+) |
| **그래픽** | SVG, Three.js |
| **상태 관리** | localStorage |
| **배포** | GitHub Pages, GitHub Actions |
| **언어** | 한국어 (ko) |

</div>

---

## 📁 프로젝트 구조

```
family-roulette/
├── 📄 index.html              # 메인 애플리케이션 페이지
├── 🎨 css/
│   └── styles.css             # 애플리케이션 스타일시트
├── ⚙️ js/
│   ├── app.js                 # 핵심 애플리케이션 로직
│   └── threefx.js             # Three.js 효과 컨트롤러
├── 🚀 .github/
│   └── workflows/
│       └── deploy.yml         # 자동 배포 워크플로우
├── 📖 README.md               # 프로젝트 문서
├── 🔍 SEO.md                  # SEO 최적화 가이드
└── 🎯 .cursorrules            # Cursor 개발 규칙
```

---

## 🚀 시작하기

### 📋 요구사항
- 최신 웹 브라우저 (Chrome 80+, Firefox 75+, Safari 13+)
- ES6+ 모듈 지원
- WebGL 지원 (3D 효과용)

### 🔧 로컬 개발

1. **저장소 클론**
   ```bash
   git clone https://github.com/seungyongko/family-roulette.git
   cd family-roulette
   ```

2. **로컬 서버 실행** (ES 모듈 제한 때문)
   ```bash
   # Python 3 사용
   python3 -m http.server 8000
   
   # 또는 Node.js 사용
   npx serve .
   
   # 또는 PHP 사용
   php -S localhost:8000
   ```

3. **브라우저에서 열기**
   ```
   http://localhost:8000
   ```

### 🌐 배포

이 프로젝트는 **GitHub Actions**를 통해 자동으로 배포됩니다:

- `main` 브랜치에 푸시하면 자동 배포
- `.github/workflows/deploy.yml`에서 배포 프로세스 정의
- 수동 개입 불필요

---

## 🎮 사용법

### 기본 사용
1. **룰렛 회전**: "SPIN!" 버튼 클릭
2. **결과 확인**: 포인터가 가리키는 항목이 당첨
3. **항목 편집**: 우측 패널에서 항목 추가/수정/삭제

### 고급 설정
- **가중치 조정**: 각 항목의 당첨 확률 설정
- **색상 커스터마이징**: 개별 항목 색상 변경
- **항목 비활성화**: 일시적으로 제외할 항목 설정

---

## 🔧 개발 가이드

### 코딩 컨벤션
- **JavaScript**: ES6+ 모듈, camelCase, 한국어 주석
- **CSS**: BEM 방법론, 반응형 우선, CSS 변수 활용
- **HTML**: 시맨틱 마크업, 접근성 고려

### 모듈 구조
- **`app.js`**: 핵심 룰렛 로직, UI 관리, 상태 관리
- **`threefx.js`**: 3D 효과, 파티클 시스템, 애니메이션

### 성능 최적화
- **파티클 개수**: 800개로 최적화
- **애니메이션**: requestAnimationFrame 사용
- **메모리 관리**: 이벤트 리스너 정리

---

## 🌟 기여하기

프로젝트에 기여하고 싶으시다면:

1. **Fork** 저장소
2. **Feature branch** 생성 (`git checkout -b feature/AmazingFeature`)
3. **Commit** 변경사항 (`git commit -m 'Add some AmazingFeature'`)
4. **Push** 브랜치 (`git push origin feature/AmazingFeature`)
5. **Pull Request** 생성

### 🐛 버그 리포트
- [GitHub Issues](https://github.com/seungyongko/family-roulette/issues) 사용
- 상세한 재현 단계와 예상 동작 포함

---

## 🔍 SEO 최적화

### 📊 검색 엔진 최적화 완료
이 프로젝트는 **Google 검색 최적화**를 위해 다음과 같은 SEO 요소들을 완벽하게 구현했습니다:

#### 🏷️ 메타 태그 최적화
- **Title**: "가족 룰렛 게임 | 가족과 함께 즐기는 추억 만들기"
- **Description**: 160자 이내의 매력적인 설명
- **Keywords**: "가족 게임, 룰렛 게임, 무료 추첨, 가족 활동" 등
- **Author**: "가족 룰렛" 명시

#### 🌐 소셜 미디어 최적화
- **Open Graph**: Facebook, KakaoTalk 공유 시 풍부한 미리보기
- **Twitter Card**: 트위터 공유 시 최적화된 카드 표시
- **SNS 이미지**: 공유 시 표시될 썸네일 이미지

#### 🏗️ 구조화 데이터 (Schema.org)
```json
{
  "@type": "Game",
  "name": "가족 룰렛 게임",
  "genre": "가족 게임",
  "isAccessibleForFree": true
}
```

#### 📍 기술적 SEO
- **사이트맵**: `sitemap.xml` 제공
- **Robots.txt**: 검색 엔진 크롤링 가이드
- **Canonical URL**: 중복 콘텐츠 방지
- **한국어 최적화**: `lang="ko"` 및 한국어 메타데이터

### 🎯 검색 키워드 전략
**주요 키워드**: "가족 게임", "룰렛 게임", "무료 추첨", "가족 활동"
**롱테일 키워드**: "가족과 함께 즐기는 게임", "홈파티 게임", "추억 만들기"

### 📈 SEO 성과 예상
- **검색 노출**: "가족 게임" 관련 검색에서 상위 노출
- **클릭률**: 매력적인 메타 설명으로 CTR 향상
- **사용자 경험**: 빠른 로딩과 반응형 디자인으로 Core Web Vitals 점수 향상

---

## 📄 라이선스

이 프로젝트는 **MIT 라이선스** 하에 배포됩니다. 자세한 내용은 [LICENSE](LICENSE) 파일을 참조하세요.

---

## 🙏 감사의 말

- **Three.js** 팀에게 아름다운 3D 라이브러리 제공에 감사
- **SVG** 표준을 만든 W3C에 감사
- **GitHub Pages**와 **GitHub Actions** 팀에게 무료 호스팅과 CI/CD 제공에 감사

---

<div align="center">

**⭐ 이 프로젝트가 도움이 되었다면 스타를 눌러주세요!**

**Made with ❤️ by [Seungyong Ko](https://github.com/seungyongko)**

</div>
