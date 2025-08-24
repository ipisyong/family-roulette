
// 공정 추첨 + SVG 룰렛 + three.js 연출 토글
import { ThreeFX } from './threefx.js';

const wheelEl = document.getElementById('wheel');
const resultEl = document.getElementById('result');
const itemsList = document.getElementById('items-list');
const addItemBtn = document.getElementById('add-item');
const resetBtn = document.getElementById('reset-defaults');

const STORAGE_KEY = 'family_roulette_items_v1';
let rotating = false;
let currentRotation = 0;

// 기본 프리셋(가족 활동 아이템)
const DEFAULT_ITEMS = [
  { name:'사우나 가기', weight:1, color:'#ff6b6b', active:true },  
  { name:'보드게임', weight:1, color:'#4ecdc4', active:true },
  { name:'야외 산책', weight:1, color:'#45b7d1', active:true },
  { name:'영화 감상', weight:1, color:'#96ceb4', active:true },
  { name:'요리하기', weight:1, color:'#feca57', active:true },
  { name:'게임하기', weight:1, color:'#ff9ff3', active:true },
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
  const width = wheelEl.getBoundingClientRect().width;
  if (width === 0) return;

  wheelEl.setAttribute('viewBox', `0 0 ${width} ${width}`);
  const cx = width / 2;
  const cy = width / 2;
  const r = cx - 10;

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
    const fontSize = Math.max(8, Math.min(14, width / 35));
    text.setAttribute('font-size', fontSize.toFixed(1));
    text.setAttribute('fill', '#0b0f14');
    text.setAttribute('transform', `rotate(${toDegrees(labelAngle)} ${pos.x} ${pos.y})`);
    text.textContent = seg.item.name;
    wheelEl.appendChild(text);
  }

  // 중앙 허브
  const hub = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
  hub.setAttribute('cx', cx);
  hub.setAttribute('cy', cy);
  hub.setAttribute('r', Math.max(12, width / 16));
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
fx.setOptions({ lights: true, particles: true, camera: true });
fx.start();

// 스핀
function spin(){
  if(rotating) return;
  const segs = computeSegments(items);
  if(segs.length === 0){ alert('활성화된 항목이 없습니다. 편집 패널에서 항목을 추가/활성화 해주세요.'); return; }

  const chosenItem = pickIndex(items);
  if(!chosenItem){ alert('추첨할 항목이 없습니다.'); return; }
  const chosenSeg = segs.find(s => s.item === chosenItem);
  const midDeg = (toDegrees(chosenSeg.mid) + 360) % 360;

  // 포인터는 화면 상단(SVG 기준 270deg)을 가리킵니다.
  // CSS transform은 시계방향 회전이므로, 휠의 midDeg 부분이 270deg에 오도록 최종 각도를 (270 - midDeg)로 설정합니다.
  // 현재 각도(currentRotation)를 빼서 필요한 회전량을 계산합니다.
  const extraSpins = 6 + Math.floor(secureRandom() * 4); // 6~9
  const targetAngle = 270 - midDeg; // 최종적으로 휠이 위치해야 할 각도
  const target = (targetAngle - currentRotation) + (extraSpins * 360); // 현재 각도에서 목표 각도까지의 변화량 + 추가 회전

  // 틱 사운드 검출을 위한 경계셋
  setupBoundaries();

  // 텐션 업: FX 예열
  fx.tension();

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

        fx.celebrate();
      }, 20);
    }
  }
  cancelAnimationFrame(rafId);
  rafId = requestAnimationFrame(loop);
}

// 편집 UI (개선된 버전)
function renderList() {
  // 기존 아이템들만 렌더링 (추가 버튼은 HTML에 고정)
  const existingItems = itemsList.querySelectorAll('.item-card:not(.add-item-card)');
  existingItems.forEach(item => item.remove());
  
  items.forEach((it, idx) => {
    const li = document.createElement('li');
    li.className = 'item-card';
    li.style.setProperty('--item-color', it.color || '#888');
    li.dataset.active = it.active;

    // 일반 모드 뷰
    const viewMode = document.createElement('div');
    viewMode.style.display = 'flex';
    viewMode.style.alignItems = 'center';
    viewMode.style.width = '100%';

    const nameEl = document.createElement('span');
    nameEl.className = 'item-name';
    nameEl.textContent = it.name;
    nameEl.style.textDecoration = it.active ? 'none' : 'line-through';

    const weightEl = document.createElement('span');
    weightEl.className = 'item-weight';
    weightEl.textContent = `가중치: ${it.weight}`;

    const actions = document.createElement('div');
    actions.className = 'item-actions';

    const toggleBtn = document.createElement('button');
    toggleBtn.textContent = it.active ? '비활성' : '활성';
    toggleBtn.title = it.active ? '룰렛에서 제외' : '룰렛에 포함';
    toggleBtn.addEventListener('click', () => {
      it.active = !it.active;
      saveItems();
      renderList();
      renderWheel();
    });

    const editBtn = document.createElement('button');
    editBtn.textContent = '✏️ 수정';
    editBtn.addEventListener('click', () => {
      li.classList.add('edit-mode');
      viewMode.style.display = 'none';
      editMode.style.display = 'flex';
    });

    const delBtn = document.createElement('button');
    delBtn.textContent = '🗑️ 삭제';
    delBtn.addEventListener('click', () => {
      if (confirm(`'${it.name}' 항목을 정말 삭제하시겠습니까?`)) {
        items.splice(idx, 1);
        saveItems();
        renderList();
        renderWheel();
      }
    });

    actions.append(toggleBtn, editBtn, delBtn);
    viewMode.append(nameEl, weightEl, actions);

    // 편집 모드 뷰
    const editMode = document.createElement('div');
    editMode.className = 'edit-controls';
    editMode.style.display = 'none';

    const inpName = document.createElement('input');
    inpName.type = 'text';
    inpName.value = it.name;

    const weightControl = document.createElement('div');
    weightControl.className = 'weight-control';
    const minusBtn = document.createElement('button');
    minusBtn.textContent = '-';
    const plusBtn = document.createElement('button');
    plusBtn.textContent = '+';
    minusBtn.addEventListener('click', () => {
      inpW.value = Math.max(0, parseFloat(inpW.value) - 1);
    });
    plusBtn.addEventListener('click', () => {
      inpW.value = parseFloat(inpW.value) + 1;
    });
    const inpW = document.createElement('input');
    inpW.type = 'number';
    inpW.value = it.weight;
    inpW.style.width = '40px';
    inpW.style.textAlign = 'center';
    weightControl.append(minusBtn, inpW, plusBtn);

    const inpC = document.createElement('input');
    inpC.type = 'color';
    inpC.value = it.color || '#888888';

    const saveBtn = document.createElement('button');
    saveBtn.className = 'save-btn';
    saveBtn.textContent = '저장';
    saveBtn.addEventListener('click', () => {
      it.name = inpName.value.trim() || '이름 없음';
      it.weight = Math.max(0, parseFloat(inpW.value) || 0);
      it.color = inpC.value;
      saveItems();
      renderList();
      renderWheel();
      li.classList.remove('edit-mode');
      viewMode.style.display = 'flex';
      editMode.style.display = 'none';
    });

    editMode.append(inpName, weightControl, inpC, saveBtn);

    li.append(viewMode, editMode);
    itemsList.appendChild(li);
  });
}

// 룰렛 클릭 이벤트
wheelEl.addEventListener('click', spin);

// 밝고 가시성 있는 색상 생성
function generateBrightColor() {
  const brightColors = [
    '#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57', '#ff9ff3',
    '#ff9ff3', '#54a0ff', '#5f27cd', '#00d2d3', '#ff9f43', '#10ac84',
    '#ee5a24', '#f368e0', '#0abde3', '#ff3838', '#ff6348', '#2ed573'
  ];
  return brightColors[Math.floor(Math.random() * brightColors.length)];
}

// 새 항목 추가
addItemBtn.addEventListener('click', () => {
  items.push({ name: '새 항목', weight: 1, color: generateBrightColor(), active: true });
  saveItems();
  renderList();
  renderWheel();
  // 새 항목의 편집 모드를 바로 연다.
  const lastItem = itemsList.querySelector('.item-card:last-child');
  if (lastItem) {
    lastItem.classList.add('edit-mode');
    lastItem.querySelector('.edit-controls').style.display = 'flex';
    lastItem.querySelector('div').style.display = 'none';
    lastItem.querySelector('input[type="text"]').focus();
  }
});

// 기본값으로 되돌리기
resetBtn.addEventListener('click', () => {
  if (confirm('모든 항목을 기본값으로 되돌리시겠습니까?')) {
    items = DEFAULT_ITEMS.slice();
    saveItems();
    renderList();
    renderWheel();
  }
});

// 초기 렌더
renderList();
renderWheel();
currentRotation = 0;

// 페이지 포커스 시 오디오 컨텍스트 잠금 해제
window.addEventListener('pointerdown', ()=>{ if(!audioCtx) audioCtx = new AudioContext(); }, { once:true });

// 창 크기 변경 시 휠 다시 렌더링
window.addEventListener('resize', renderWheel);