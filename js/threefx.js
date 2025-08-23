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
    this.gravity = -9.8 * 0.25;
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
    const N = 800; // 파티클 개수 증가
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(N * 3);
    const col = new Float32Array(N * 3);
    const vel = new Float32Array(N * 3);

    function rand(min,max){ return min + Math.random()*(max-min); }

    for(let i=0;i<N;i++){
      // 시작은 중심의 한 점에서
      pos[i*3+0] = 0;
      pos[i*3+1] = 0;
      pos[i*3+2] = 0;

      // 속도는 구형으로 퍼지게 (더 멀리, 더 빠르게)
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(1 - 2 * Math.random()); // 균일한 구면 분포
      const speed = rand(6.0, 12.0);
      vel[i*3+0] = Math.sin(phi) * Math.cos(theta) * speed;
      vel[i*3+1] = Math.sin(phi) * Math.sin(theta) * speed;
      vel[i*3+2] = Math.cos(phi) * speed;

      // 더 밝고 선명한 파스텔톤
      const palette = [ [1, 0.5, 0.6], [0.6, 0.8, 1], [1, 0.9, 0.6], [0.8, 0.7, 1], [0.7, 1, 0.8] ];
      const [r,g,b] = palette[i % palette.length];
      col[i*3+0] = r; col[i*3+1] = g; col[i*3+2] = b;
    }

    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    this.velocities = vel;

    const mat = new THREE.PointsMaterial({ 
      size: 0.06, 
      vertexColors: true, 
      transparent:true, 
      opacity: 0.0,
      depthWrite: false, // 더 부드러운 블렌딩
      blending: THREE.AdditiveBlending, // 빛나는 효과
    });
    this.points = new THREE.Points(geo, mat);
    this.points.visible = false;
    this.scene.add(this.points);
  }

  tension(){
    // 스핀 전 긴장감: 스팟라이트가 더 빠르고 강하게 펄스
    this.pulseT = 0;
    if (this.opts.lights && this.spot) {
      this.spot.intensity = 2.5;
      this.spot.penumbra = 0.8;
    }
  }

  celebrate(){
    if(!this.enabled) return;
    if(this.opts.particles && this.points){
      // 파티클 재시작
      this._initParticles(); // 파티클 속도 및 위치 초기화
      this.points.material.opacity = 1.0;
      this.points.visible = true;
      this._particleTime = 0;
    }
    if(this.opts.camera){
      // 카메라 흔들림 트리거 (더 강하게)
      this._shakeT = 1.0;
    }
    if(this.opts.lights && this.spot){
      // 빛 플래시 (더 밝고 노란빛으로)
      this.spot.color.set(0xfffacd);
      this.spot.intensity = 5;
      this.spot.angle = Math.PI / 5;
    }
  }

  _loop = (t=0) => {
    if(!this.enabled || !this.renderer) return;
    const dt = 0.016;

    // 조명 펄스 및 복구
    if(this.opts.lights && this.spot){
      this.pulseT += dt;
      const baseIntensity = 1.5 + Math.sin(this.pulseT * 3.0) * 0.5;
      // celebrate 후 원래 상태로 서서히 복귀
      this.spot.intensity = this.spot.intensity * 0.95 + baseIntensity * 0.05;
      this.spot.color.lerp(new this.THREE.Color(0xffffff), 0.03);
      this.spot.angle = this.spot.angle * 0.97 + (Math.PI/7) * 0.03;

      this.spot.position.x = Math.sin(this.pulseT*0.9)*2.0;
      this.spot.position.y = 5 + Math.cos(this.pulseT*1.3)*0.8;
    }

    // 카메라 흔들림 (부드러운 감쇠)
    if(this.opts.camera && this.camera){
      if(!this._shakeT) this._shakeT = 0;
      this._shakeT = Math.max(0, this._shakeT - dt * 0.8);
      const shakeAmount = Math.pow(this._shakeT, 2);
      const mag = shakeAmount * 0.2;
      this.camera.position.x = Math.sin(t * 0.005) * mag;
      this.camera.position.y = Math.cos(t * 0.004) * mag;
      this.camera.lookAt(0,0,0);
    }

    // 파티클 물리
    if(this.opts.particles && this.points){
      if(this.points.visible){
        if(this._particleTime == null) this._particleTime = 0;
        this._particleTime += dt;
        const pos = this.points.geometry.getAttribute('position').array;
        const vel = this.velocities;
        const drag = 0.98;

        for(let i=0;i<vel.length/3;i++){
          vel[i*3+0] *= drag;
          vel[i*3+1] *= drag;
          vel[i*3+2] *= drag;

          vel[i*3+1] += this.gravity * dt;
          pos[i*3+0] += vel[i*3+0] * dt;
          pos[i*3+1] += vel[i*3+1] * dt;
          pos[i*3+2] += vel[i*3+2] * dt;
        }
        this.points.geometry.attributes.position.needsUpdate = true;

        // 서서히 페이드아웃
        this.points.material.opacity = Math.max(0, 1.0 - this._particleTime * 0.4);
        if(this._particleTime > 2.5){
          this.points.visible = false;
          this._particleTime = 0;
        }
      }
    }

    this.renderer.render(this.scene, this.camera);
    this.rafId = requestAnimationFrame(this._loop);
  }
}