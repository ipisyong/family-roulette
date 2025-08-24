## 🛠️ SEO 최적화 포인트

### 1. `<title>` 보강

```html
<title>가족 룰렛 게임 | 가족과 함께 즐기는 추억 만들기</title>
```

👉 단순 "가족 룰렛 게임"보다 **검색 키워드 + 부제** 형식이 검색 노출에 더 효과적.

---

### 2. 메타 설명(meta description)

검색결과에 요약으로 뜨기 때문에 꼭 필요.

```html
<meta name="description" content="가족과 함께 즐길 수 있는 무료 룰렛 게임! 추억 만들기, 간단한 미션, 가족 활동을 통해 즐겁게 시간을 보내세요.">
```

---

### 3. Open Graph / SNS 공유 태그

페이스북, 카카오톡, 트위터 공유 시 미리보기 정보 제공.

```html
<meta property="og:title" content="가족 룰렛 게임" />
<meta property="og:description" content="가족과 함께 즐길 수 있는 추억 만들기 룰렛 게임!" />
<meta property="og:type" content="website" />
<meta property="og:url" content="https://example.com" />
<meta property="og:image" content="https://example.com/images/roulette-preview.png" />
```

---

### 4. 트위터 카드(Twitter Card)

```html
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="가족 룰렛 게임">
<meta name="twitter:description" content="가족과 함께 즐기는 특별한 룰렛 게임!">
<meta name="twitter:image" content="https://example.com/images/roulette-preview.png">
```

---

### 5. 키워드 관련

구글은 `meta keywords`는 크게 안 보지만, 콘텐츠에 자연스럽게 키워드를 포함해야 함.

* 예: "가족 게임", "룰렛 게임", "무료 추첨", "가족 활동", "홈파티 게임" 등을 본문과 heading에 녹이기.

---

### 6. 접근성 및 시맨틱 태그

* `<h1>`은 한 번만 사용 (현재 잘 하고 있음 ✅)
* `<h2>` 이하로 **콘텐츠 설명** 강화

  ```html
  <h2>가족과 즐기는 룰렛 게임</h2>
  <p>이 게임은 아이부터 어른까지 모두 즐길 수 있는 가족용 룰렛입니다...</p>
  ```

---

### 7. 구조화 데이터(Schema.org)

검색결과에서 별점, 게임 카테고리 같은 리치 결과를 노리려면 JSON-LD 추가:

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Game",
  "name": "가족 룰렛 게임",
  "description": "가족이 함께 즐길 수 있는 무료 룰렛 게임. 추억 만들기와 가족 활동에 활용 가능.",
  "genre": "가족 게임",
  "author": {
    "@type": "Organization",
    "name": "가족 룰렛"
  },
  "url": "https://example.com"
}
</script>
```

---

### 8. 퍼포먼스 & SEO 연계

* 이미지 ALT 태그 꼭 달기 (`<img alt="룰렛 휠 아이콘">`)
* JS/CSS는 압축 & 지연 로딩 (LCP, CLS 점수 개선 → SEO 반영됨)
* 모바일 최적화는 이미 `<meta viewport>` 설정돼서 괜찮음.

---

💡 추가 팁:
구글 서치 콘솔에 사이트 등록하고, **사이트맵(sitemap.xml) + robots.txt** 세팅하면 훨씬 빨리 인덱싱돼.