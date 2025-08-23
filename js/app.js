
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

// 3D 연출이 기본 활성화 상태이면 즉시 시작
if (fxToggle.checked) {
  fx.start();
}

// 스핀
function spin(){
  if(rotating) return;
  const segs = computeSegments(items);
  if(segs.length === 0){ alert('활성화된 항목이 없습니다. 편집 패널에서 항목을 추가/활성화 해주세요.'); return; }

  const chosenItem = pickIndex(items);
  if(!chosenItem){ alert('추첨할 항목이 없습니다.'); return; }
  const chosenSeg = segs.find(s => s.item === chosenItem);
  const midDeg = (toDegrees(chosenSeg.mid) + 360) % 360;

  // 포인터는 화면 상단(12시, 270deg)을 가리킵니다.
  // CSS transform의 rotate는 시계방향 회전이므로, 최종 각도를 (midDeg - 270)으로 만들어야 합니다.
  // 현재 각도(currentRotation)를 빼서 필요한 회전량을 계산합니다.
  const extraSpins = 6 + Math.floor(secureRandom() * 4); // 6~9
  const targetAngle = midDeg - 270; // 최종적으로 휠이 위치해야 할 각도
  const target = (targetAngle - currentRotation) + (extraSpins * 360); // 현재 각도에서 목표 각도까지의 변화량 + 추가 회전

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