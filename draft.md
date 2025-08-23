---

# 폴더 구조

```
family-roulette/
  index.html
  css/
    styles.css
  js/
    app.js
    threefx.js
  .github/
    workflows/
      deploy.yml
  README.md
```

---

# 1) three.js 연출 토글 포함 프로토타입

## index.html

```html
<!doctype html>
<html lang="ko">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>가족 룰렛 게임</title>
  <link rel="stylesheet" href="css/styles.css" />
  <!-- three.js ESM (버전 고정 추천) -->
  <script type="module">
    // 사전 로드 검증용(콘솔 경고 억제)
    // 실제 로직은 js/threefx.js에서 import 함
  </script>
</head>
<body>
  <header class="app-header">
    <h1>🎡 가족 룰렛</h1>
    <div class="toggles">
      <label title="3D 파티클/조명/카메라 연출">
        <input id="fx-toggle" type="checkbox" />
        3D 연출(three.js)
      </label>
      <label title="세그먼트 경계 통과 시 효과음">
        <input id="tick-toggle" type="checkbox" checked />
        틱 사운드
      </label>
    </div>
  </header>

  <main class="layout">
    <!-- 룰렛 뷰 -->
    <section class="stage">
      <!-- three.js 캔버스가 여기에 오버레이됨 -->
      <div id="three-overlay"></div>

      <!-- 포인터 -->
      <div class="pointer" aria-hidden="true"></div>

      <!-- SVG 룰렛 -->
      <svg id="wheel" width="520" height="520" viewBox="0 0 520 520" role="img" aria-label="룰렛 휠">
        <!-- 동적 세그먼트 -->
      </svg>

      <button id="spin-btn" class="primary">SPIN!</button>
      <div id="result" class="result" aria-live="polite"></div>
    </section>

    <!-- 편집 & 프리셋 -->
    <aside class="panel">
      <h2>아이템 편집</h2>
      <div class="controls">
        <button id="add-item">항목 추가</button>
        <button id="reset-defaults">기본값으로</button>
        <button id="clear-inactive">비활성 항목 제거</button>
      </div>
      <table class="items">
        <thead>
          <tr>
            <th>이름</th><th>가중치</th><th>색상</th><th>활성</th><th></th>
          </tr>
        </thead>
        <tbody id="items-tbody"><!-- 동적 --></tbody>
      </table>
      <p class="hint">모든 변경사항은 자동 저장됩니다(localStorage).</p>

      <details class="fx-options">
        <summary>3D 연출 옵션</summary>
        <label><input type="checkbox" id="fx-lights" checked /> 조명 펄스</label>
        <label><input type="checkbox" id="fx-particles" checked /> 파티클(컨페티)</label>
        <label><input type="checkbox" id="fx-camera" checked /> 카메라 흔들림</label>
      </details>
    </aside>
  </main>

  <footer class="app-footer">
    <small>© 2025 가족 룰렛 · 공정한 CSPRNG 기반 추첨 · GitHub Pages 배포</small>
  </footer>

  <script type="module" src="js/app.js"></script>
</body>
</html>
```

## css/styles.css

```css
:root{
  --bg:#0b0f14;
  --panel:#141a22;
  --line:#202835;
  --text:#e8eef7;
  --muted:#9fb0c3;
  --accent:#4ec1ff;
  --accent-2:#9cff6d;
}
*{box-sizing:border-box}
html,body{height:100%}
body{
  margin:0; background:radial-gradient(1200px 600px at 30% -10%, #162237, #0b0f14);
  color:var(--text); font-family:ui-sans-serif,system-ui,Segoe UI,Apple SD Gothic Neo,Apple Color Emoji,Arial,Helvetica,sans-serif;
}
.app-header, .app-footer{
  display:flex; align-items:center; justify-content:space-between;
  padding:12px 16px; border-bottom:1px solid var(--line);
}
.app-footer{border-top:1px solid var(--line); border-bottom:none; justify-content:center}
h1{font-size:22px; margin:0}
.toggles label{margin-right:14px; font-size:14px; color:var(--muted)}
.layout{
  display:grid; grid-template-columns: 1fr 360px; gap:18px; padding:18px; align-items:start;
}
.stage{
  position:relative; display:flex; flex-direction:column; align-items:center; justify-content:center;
  min-height:620px; border:1px solid var(--line); border-radius:12px; background:linear-gradient(180deg,#0f1623,#0b0f14);
  overflow:hidden;
}
#three-overlay{
  position:absolute; inset:0; pointer-events:none; z-index:1; /* SVG 위 3D 렌더 */
}
.pointer{
  position:absolute; top:38px; width:0; height:0; z-index:2;
  border-left:14px solid transparent; border-right:14px solid transparent; border-bottom:22px solid #fff;
  filter: drop-shadow(0 0 8px rgba(255,255,255,.6));
}
#wheel{
  width:520px; height:520px; border-radius:50%; background: radial-gradient(60% 60% at 50% 45%, #0c1421, #060a10);
  border:2px solid #2c374a; box-shadow: inset 0 0 60px rgba(0,0,0,.6), 0 0 120px rgba(78,193,255,.1);
  transform: rotate(0deg);
}
#spin-btn{
  margin-top:18px; padding:12px 22px; font-size:18px; border-radius:999px; border:1px solid #2f3a4c; background:#101828; color:#fff; cursor:pointer;
  box-shadow: 0 0 0 0 rgba(78,193,255,.0);
  transition: box-shadow .3s ease, transform .06s ease;
}
#spin-btn:hover{ box-shadow: 0 0 0 8px rgba(78,193,255,.08) }
#spin-btn:active{ transform: translateY(1px) }
.result{ margin-top:10px; min-height:28px; color:var(--accent-2); font-weight:600; letter-spacing:0.2px }

.panel{
  position:sticky; top:12px; background:var(--panel); border:1px solid var(--line); border-radius:12px; padding:14px;
}
.panel h2{margin:6px 0 12px}
.controls{display:flex; gap:8px; margin-bottom:12px}
.controls button{
  border:1px solid #2f3a4c; background:#121a25; color:#cfe2ff; padding:8px 10px; border-radius:8px; cursor:pointer; font-size:13px;
}
.items{width:100%; border-collapse:collapse; font-size:13px}
.items th, .items td{border-bottom:1px solid #223048; padding:8px 6px; text-align:left}
.items input[type="text"]{width:100%}
.items input[type="number"]{width:72px}
.items input[type="color"]{width:36px; height:28px; padding:0; border:none; background:transparent}
.items td:last-child{width:34px}
.hint{color:var(--muted); font-size:12px; margin-top:8px}

.fx-options{margin-top:12px; color:var(--muted)}
.fx-options summary{cursor:pointer}

@media (max-width: 980px){
  .layout{ grid-template-columns: 1fr; }
}
```

## js/app.js

```javascript
// 공정 추첨 + SVG 룰렛 + three.js 연출 토글
import { ThreeFX } from './threefx.js';

const wheelEl = document.getElementById('wheel');
const spinBtn = document.getElementById('spin-btn');
const resultEl = document.getElementById('result');
const itemsTbody = document.getElementById('items-tbody');
const addItemBtn = document.getElementById('add-item');
const resetBtn = document.getElementById('reset-defaults');
const clearInactiveBtn = document.getElementById('clear-inactive');
const fxToggle = document.getElementById('fx-toggle');
const tickToggle = document.getElementById('tick-toggle');

const fxLights = document.getElementById('fx-lights');
const fxParticles = document.getElementById('fx-particles');
const fxCamera = document.getElementById('fx-camera');

const STORAGE_KEY = 'family_roulette_items_v1';
let rotating = false;
let currentRotation = 0;

// 기본 프리셋(가족 활동 아이템)
const DEFAULT_ITEMS = [
  { name:'피자 데이', weight:1, color:'#ff7675', active:true },
  { name:'영화(가족 선택)', weight:1, color:'#74b9ff', active:true },
  { name:'보드게임', weight:1, color:'#ffeaa7', active:true },
  { name:'아이스크림', weight:1, color:'#a29bfe', active:true },
  { name:'야외 산책', weight:1, color:'#55efc4', active:true },
  { name:'책 읽기 시간', weight:1, color:'#fab1a0', active:true },
  { name:'노래방', weight:1, color:'#fd79a8', active:true },
  { name:'와일드카드(당첨자 선택)', weight:1, color:'#81ecec', active:true }
];

function loadItems(){
  const raw = localStorage.getItem(STORAGE_KEY);
  if(!raw) return DEFAULT_ITEMS.slice();
  try{ const parsed = JSON.parse(raw); if(Array.isArray(parsed) && parsed.length) return parsed; }catch(e){}
  return DEFAULT_ITEMS.slice();
}
let items = loadItems();

function saveItems(){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

function toRadians(deg){ return (deg * Math.PI) / 180; }
function toDegrees(rad){ return (rad * 180) / Math.PI; }

// SVG path 유틸
function polarToXY(cx, cy, r, angle){
  return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
}

function arcPath(cx, cy, r, startAngle, endAngle){
  const start = polarToXY(cx, cy, r, startAngle);
  const end = polarToXY(cx, cy, r, endAngle);
  const largeArc = (endAngle - startAngle) % (Math.PI * 2) > Math.PI ? 1 : 0;
  return `M ${cx} ${cy} L ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 1 ${end.x} ${end.y} Z`;
}

// 세그먼트 계산
function computeSegments(list){
  const actives = list.filter(it => it.active && it.weight > 0);
  const total = actives.reduce((s,it)=>s+it.weight, 0);
  let acc = -Math.PI/2; // 12시 방향 기준 시작
  const segs = [];
  for(const it of actives){
    const angle = (it.weight / total) * Math.PI * 2;
    const start = acc;
    const end = acc + angle;
    const mid = (start + end) / 2;
    segs.push({ item: it, start, end, mid });
    acc = end;
  }
  return segs;
}

function renderWheel(){
  wheelEl.innerHTML = '';
  const cx = 260, cy = 260, r = 250;
  const segs = computeSegments(items);

  for(const seg of segs){
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', arcPath(cx, cy, r, seg.start, seg.end));
    path.setAttribute('fill', seg.item.color || '#888');
    path.setAttribute('stroke', 'rgba(0,0,0,0.25)');
    path.setAttribute('stroke-width', '1');
    wheelEl.appendChild(path);

    // 라벨
    const labelAngle = seg.mid;
    const labelR = r * 0.62;
    const pos = polarToXY(cx, cy, labelR, labelAngle);
    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    text.setAttribute('x', pos.x);
    text.setAttribute('y', pos.y);
    text.setAttribute('dominant-baseline', 'middle');
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('font-size', '14');
    text.setAttribute('fill', '#0b0f14');
    text.setAttribute('transform', `rotate(${toDegrees(labelAngle)} ${pos.x} ${pos.y})`);
    text.textContent = seg.item.name;
    wheelEl.appendChild(text);
  }

  // 중앙 허브
  const hub = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
  hub.setAttribute('cx', cx);
  hub.setAttribute('cy', cy);
  hub.setAttribute('r', 32);
  hub.setAttribute('fill', '#fff');
  hub.setAttribute('stroke', '#223048');
  hub.setAttribute('stroke-width','3');
  wheelEl.appendChild(hub);
}

// 공정 난수: crypto 기반 [0,1)
function secureRandom(){
  const arr = new Uint32Array(1);
  crypto.getRandomValues(arr);
  return arr[0] / 4294967296; // 2^32
}

// 가중치 기반 인덱스 선택
function pickIndex(list){
  const actives = list.filter(i=>i.active && i.weight>0);
  const total = actives.reduce((s,it)=>s+it.weight,0);
  if(total <= 0 || actives.length === 0) return null;
  let t = secureRandom() * total;
  for(let i=0;i<actives.length;i++){
    t -= actives[i].weight;
    if(t <= 0) return actives[i];
  }
  return actives[actives.length-1];
}

// 오디오 틱 사운드
let audioCtx = null;
function tick(){
  if(!tickToggle.checked) return;
  if(!audioCtx) audioCtx = new AudioContext();
  const o = audioCtx.createOscillator();
  const g = audioCtx.createGain();
  o.connect(g); g.connect(audioCtx.destination);
  o.type = 'square'; o.frequency.value = 1200 + Math.random()*200;
  g.gain.value = 0.04;
  o.start();
  setTimeout(()=>{ o.stop(); }, 35);
}

// 회전 애니메이션 상태 측정용
let rafId = null;
let segBoundaries = []; // [deg...]
function setupBoundaries(){
  const segs = computeSegments(items);
  segBoundaries = segs.map(s => ((toDegrees(s.start) % 360) + 360) % 360);
  segBoundaries.sort((a,b)=>a-b);
}

// 현재 회전각(deg) 얻기
function getRotationDeg(){
  const st = getComputedStyle(wheelEl).transform;
  // matrix(a,b,c,d,e,f) 또는 matrix3d(...)
  // 단순화: currentRotation 값을 기준값으로 사용
  return currentRotation;
}

// three.js FX
const fx = new ThreeFX(document.getElementById('three-overlay'));
fx.setOptions({ lights: fxLights.checked, particles: fxParticles.checked, camera: fxCamera.checked });

fxToggle.addEventListener('change', ()=>{
  if(fxToggle.checked){
    fx.start();
  }else{
    fx.stop();
  }
});
fxLights.addEventListener('change', ()=> fx.setOptions({ lights: fxLights.checked }));
fxParticles.addEventListener('change', ()=> fx.setOptions({ particles: fxParticles.checked }));
fxCamera.addEventListener('change', ()=> fx.setOptions({ camera: fxCamera.checked }));

// 스핀
function spin(){
  if(rotating) return;
  const segs = computeSegments(items);
  if(segs.length === 0){ alert('활성화된 항목이 없습니다. 편집 패널에서 항목을 추가/활성화 해주세요.'); return; }

  const chosenItem = pickIndex(items);
  if(!chosenItem){ alert('추첨할 항목이 없습니다.'); return; }
  const chosenSeg = segs.find(s => s.item === chosenItem);
  const midDeg = (toDegrees(chosenSeg.mid) + 360) % 360;

  // 포인터는 화면 상단(12시, -90deg 기준). 휠 회전을 mid를 12시에 오도록.
  // 최종 회전 = 추가 회전(6~10바퀴) + (90 - midDeg)
  const extraSpins = 6 + Math.floor(secureRandom()*4); // 6~9
  const target = extraSpins*360 + (90 - midDeg);

  // 틱 사운드 검출을 위한 경계셋
  setupBoundaries();

  // 텐션 업: FX 예열
  if(fxToggle.checked){
    fx.tension();
  }

  rotating = true;
  resultEl.textContent = '...';
  wheelEl.style.transition = 'transform 6.2s cubic-bezier(0.12, 0, 0.13, 1)';
  const nextRotation = currentRotation + target;
  wheelEl.style.transform = `rotate(${nextRotation}deg)`;

  // 틱 사운드(세그먼트 경계 통과 시)
  const startTime = performance.now();
  const duration = 6200;
  const startRot = currentRotation;
  const endRot = nextRotation;
  let lastTickedBoundary = -1;

  function loop(now){
    const t = Math.min(1, (now - startTime)/duration);
    // easeOutCubic-bezier 근사(시각적으로 충분)
    const eased = 1 - Math.pow(1 - t, 3);
    const angle = startRot + (endRot - startRot)*eased;
    currentRotation = angle; // 관측 상태 업데이트

    // 경계 체크(모듈로 360으로 증가 방향 가정)
    const norm = ((angle % 360) + 360) % 360;
    for(let i=0;i<segBoundaries.length;i++){
      const boundary = segBoundaries[i];
      // 경계 근처 통과(±1.5deg)
      const diff = Math.abs(((norm - boundary + 540) % 360) - 180);
      if(diff < 1.5 && lastTickedBoundary !== i){
        lastTickedBoundary = i;
        tick();
      }
    }

    if(t < 1){
      rafId = requestAnimationFrame(loop);
    }else{
      cancelAnimationFrame(rafId);
      setTimeout(()=>{ // 트랜지션 종료 후 스냅샷
        wheelEl.style.transition = '';
        currentRotation = endRot % 360;
        wheelEl.style.transform = `rotate(${currentRotation}deg)`;
        rotating = false;
        resultEl.textContent = `당첨 🎉 ${chosenItem.name}`;

        if(fxToggle.checked){
          fx.celebrate();
        }
      }, 20);
    }
  }
  cancelAnimationFrame(rafId);
  rafId = requestAnimationFrame(loop);
}

// 편집 UI
function renderTable(){
  itemsTbody.innerHTML = '';
  items.forEach((it, idx)=>{
    const tr = document.createElement('tr');

    const tdName = document.createElement('td');
    const inpName = document.createElement('input'); inpName.type='text'; inpName.value=it.name;
    inpName.addEventListener('input', ()=>{ it.name = inpName.value; saveItems(); renderWheel(); });
    tdName.appendChild(inpName);

    const tdW = document.createElement('td');
    const inpW = document.createElement('input'); inpW.type='number'; inpW.min='0'; inpW.step='0.1'; inpW.value=it.weight;
    inpW.addEventListener('input', ()=>{ it.weight = Math.max(0, parseFloat(inpW.value||'0')); saveItems(); renderWheel(); });
    tdW.appendChild(inpW);

    const tdC = document.createElement('td');
    const inpC = document.createElement('input'); inpC.type='color'; inpC.value=it.color || '#888888';
    inpC.addEventListener('input', ()=>{ it.color = inpC.value; saveItems(); renderWheel(); });
    tdC.appendChild(inpC);

    const tdA = document.createElement('td');
    const chkA = document.createElement('input'); chkA.type='checkbox'; chkA.checked=!!it.active;
    chkA.addEventListener('change', ()=>{ it.active = chkA.checked; saveItems(); renderWheel(); });
    tdA.appendChild(chkA);

    const tdX = document.createElement('td');
    const delBtn = document.createElement('button'); delBtn.textContent='🗑️'; delBtn.title='삭제';
    delBtn.addEventListener('click', ()=>{
      items.splice(idx,1); saveItems(); renderTable(); renderWheel();
    });
    tdX.appendChild(delBtn);

    tr.append(tdName, tdW, tdC, tdA, tdX);
    itemsTbody.appendChild(tr);
  });
}

addItemBtn.addEventListener('click', ()=>{
  items.push({ name:'새 항목', weight:1, color:'#cccccc', active:true });
  saveItems(); renderTable(); renderWheel();
});
resetBtn.addEventListener('click', ()=>{
  items = DEFAULT_ITEMS.slice(); saveItems(); renderTable(); renderWheel();
});
clearInactiveBtn.addEventListener('click', ()=>{
  items = items.filter(i=>i.active); saveItems(); renderTable(); renderWheel();
});
spinBtn.addEventListener('click', ()=> spin());

// 초기 렌더
renderTable();
renderWheel();
currentRotation = 0;

// 페이지 포커스 시 오디오 컨텍스트 잠금 해제
window.addEventListener('pointerdown', ()=>{ if(!audioCtx && tickToggle.checked) audioCtx = new AudioContext(); }, { once:true });
```

## js/threefx.js

```javascript
// three.js 오버레이 연출: 파티클/조명 펄스/카메라 흔들림
// 정적 호스팅 친화적으로 CDN ESM 경로 사용
const THREE_URL = 'https://unpkg.com/three@0.160.0/build/three.module.js';

export class ThreeFX {
  constructor(container){
    this.container = container;
    this.enabled = false;
    this.opts = { lights:true, particles:true, camera:true };

    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.rafId = null;

    // 파티클
    this.points = null;
    this.velocities = null;
    this.gravity = -9.8 * 0.35;
    this.pulseT = 0;

    this._importPromise = null;
  }

  async _ensure(){
    if(this._importPromise) return this._importPromise;
    this._importPromise = import(THREE_URL).then(m => (this.THREE = m, m));
    return this._importPromise;
  }

  setOptions(partial){
    this.opts = { ...this.opts, ...partial };
  }

  async start(){
    if(this.enabled) return;
    await this._ensure();
    const THREE = this.THREE;

    this.scene = new THREE.Scene();
    const w = this.container.clientWidth || this.container.offsetWidth || 800;
    const h = this.container.clientHeight || this.container.offsetHeight || 600;

    this.camera = new THREE.PerspectiveCamera(45, w/h, 0.1, 100);
    this.camera.position.set(0, 0, 9);

    this.renderer = new THREE.WebGLRenderer({ alpha:true, antialias:true });
    this.renderer.setSize(w, h);
    this.renderer.setPixelRatio(Math.min(2, window.devicePixelRatio||1));
    this.container.innerHTML = '';
    this.container.appendChild(this.renderer.domElement);

    // 조명
    this.ambient = new THREE.AmbientLight(0xffffff, 0.35);
    this.scene.add(this.ambient);
    this.spot = new THREE.SpotLight(0xffffff, 1.5, 40, Math.PI/7, 0.3, 1.2);
    this.spot.position.set(0, 5, 8);
    this.scene.add(this.spot);

    // 파티클 준비(초기 비활성)
    this._initParticles();

    window.addEventListener('resize', this._onResize);
    this.enabled = true;
    this._loop();
  }

  stop(){
    if(!this.enabled) return;
    cancelAnimationFrame(this.rafId);
    this.rafId = null;
    window.removeEventListener('resize', this._onResize);
    this.container.innerHTML = '';
    this.scene = this.camera = this.renderer = null;
    this.enabled = false;
  }

  _onResize = () => {
    if(!this.enabled || !this.renderer || !this.camera) return;
    const w = this.container.clientWidth || 800;
    const h = this.container.clientHeight || 600;
    this.renderer.setSize(w, h);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }

  _initParticles(){
    const THREE = this.THREE;
    const N = 420;
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(N * 3);
    const col = new Float32Array(N * 3);
    const vel = new Float32Array(N * 3);

    function rand(min,max){ return min + Math.random()*(max-min); }

    for(let i=0;i<N;i++){
      // 시작은 중심 근처
      pos[i*3+0] = rand(-0.2, 0.2);
      pos[i*3+1] = rand(-0.2, 0.2);
      pos[i*3+2] = rand(-0.2, 0.2);

      // 속도는 반구형으로 퍼지게
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * (Math.PI/2); // 위쪽 반구
      const speed = rand(2.2, 5.0);
      vel[i*3+0] = Math.cos(theta) * Math.sin(phi) * speed;
      vel[i*3+1] = Math.cos(phi) * speed; // 위쪽
      vel[i*3+2] = Math.sin(theta) * Math.sin(phi) * speed;

      // 파스텔 컨페티
      const palette = [[1.0,0.45,0.47],[0.46,0.73,1.0],[1.0,0.92,0.55],[0.64,0.61,1.0],[0.56,0.94,0.77]];
      const [r,g,b] = palette[i % palette.length];
      col[i*3+0] = r; col[i*3+1] = g; col[i*3+2] = b;
    }

    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    this.velocities = vel;

    const mat = new THREE.PointsMaterial({ size: 0.08, vertexColors: true, transparent:true, opacity: 0.0 });
    this.points = new THREE.Points(geo, mat);
    this.points.visible = false;
    this.scene.add(this.points);
  }

  tension(){
    // 스핀 전 긴장감: 스팟라이트가 약하게 펄스
    this.pulseT = 0;
  }

  celebrate(){
    if(!this.enabled) return;
    if(this.opts.particles && this.points){
      // 파티클 재시작
      const pos = this.points.geometry.getAttribute('position').array;
      for(let i=0;i<pos.length;i++) pos[i] *= 0; // 중심으로 리셋
      this.points.material.opacity = 1.0;
      this.points.visible = true;
      this._particleTime = 0;
    }
    if(this.opts.camera){
      // 카메라 흔들림 트리거
      this._shakeT = 0.65;
    }
    if(this.opts.lights && this.spot){
      // 빛 플래시
      this.spot.intensity = 3.2;
    }
  }

  _loop = (t=0) => {
    if(!this.enabled || !this.renderer) return;

    // 조명 펄스
    if(this.opts.lights && this.spot){
      this.pulseT += 0.016;
      const base = 1.4 + Math.sin(this.pulseT*2.0)*0.25;
      // celebrate 직후 강한 플래시가 점차 감쇠
      this.spot.intensity = this.spot.intensity*0.92 + base*0.08;
      this.spot.position.x = Math.sin(this.pulseT*0.9)*1.6;
      this.spot.position.y = 5 + Math.cos(this.pulseT*1.3)*0.4;
    }

    // 카메라 흔들림
    if(this.opts.camera && this.camera){
      if(!this._shakeT) this._shakeT = 0;
      this._shakeT *= 0.94;
      const mag = this._shakeT * 0.12;
      this.camera.position.x = (Math.random()-0.5)*mag;
      this.camera.position.y = (Math.random()-0.5)*mag;
      this.camera.lookAt(0,0,0);
    }

    // 파티클 물리
    if(this.opts.particles && this.points){
      if(this.points.visible){
        if(this._particleTime == null) this._particleTime = 0;
        const dt = 0.016;
        this._particleTime += dt;
        const pos = this.points.geometry.getAttribute('position').array;
        const vel = this.velocities;
        for(let i=0;i<vel.length/3;i++){
          vel[i*3+1] += this.gravity * dt;
          pos[i*3+0] += vel[i*3+0] * dt;
          pos[i*3+1] += vel[i*3+1] * dt;
          pos[i*3+2] += vel[i*3+2] * dt;
        }
        this.points.geometry.attributes.position.needsUpdate = true;

        // 서서히 페이드아웃
        this.points.material.opacity = Math.max(0, 1.0 - this._particleTime*0.5);
        if(this._particleTime > 2.4){
          this.points.visible = false;
          this._particleTime = 0;
        }
      }
    }

    this.renderer.render(this.scene, this.camera);
    this.rafId = requestAnimationFrame(this._loop);
  }
}
```

---

# 3) GitHub Pages 배포 워크플로 (Actions)

## .github/workflows/deploy.yml

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: ["main"]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: "pages"
  cancel-in-progress: true

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4
      - name: Upload Pages artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: ./

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

## README.md (요약 가이드)

````markdown
# 가족 룰렛

- 정적 호스팅(빌드 불필요)
- three.js 연출 토글(파티클/조명/카메라)
- 공정한 CSPRNG 기반 가중치 추첨
- localStorage 자동 저장

## 로컬 실행
파일을 그대로 더블클릭해도 되지만, 보안 정책 때문에 일부 브라우저에서 ES 모듈이 막힐 수 있음.
가능하면 간단 서버로 여세요:

```bash
python3 -m http.server 5173
# http://localhost:5173 접속
````

## GitHub Pages 배포

1. 이 리포를 생성하고 위 파일들을 커밋/푸시 (브랜치: `main`)
2. 리포 > Settings > Pages

   * Build and deployment: **GitHub Actions** 선택
3. Actions 탭에서 `Deploy to GitHub Pages` 워크플로 실행 여부 확인
4. Pages URL 접속 (예: https\://<username>.github.io/<repo>)

## 사용 팁

* \[아이템 편집]에서 이름/가중치/색상/활성 토글을 조절하세요. 자동 저장됩니다.
* \[SPIN!] 클릭 → 긴장감(조명 펄스, 틱 사운드) → 당첨 시 컨페티 & 카메라 흔들림.
* 3D 연출이 무겁다면 상단 토글로 끄세요.

```

---

# 확인 포인트
- **3D 연출 토글**: 헤더 토글로 on/off, 상세 옵션(조명/파티클/카메라)은 패널에서 개별 제어.
- **공정성**: `crypto.getRandomValues`로 가중치 기반 선택.
- **긴장감 연출**: 세그먼트 경계 통과 시 `틱` 사운드, 라이트 펄스, 스핀 후 컨페티 + 카메라 흔들림.
- **GitHub Pages**: `deploy.yml`만 있으면 `main` 푸시 시 자동 배포.

원하는 연출(예: 폭죽 라이트닝, 승리 텍스트 3D, 스핀 전 카운트다운 등)을 더 얹고 싶다면 말해줘. PWA(오프라인, 홈화면 설치)도 원하면 바로 붙일게.
```
