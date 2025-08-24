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
    this.gravity = -9.8 * 0.15;
    this.pulseT = 0;
    
    // 축하 효과용 추가 파티클 시스템
    this.confetti = null;
    this.confettiVelocities = null;
    this.confettiTime = 0;
    
    // 조명 효과
    this.lights = [];
    this.lightPulse = 0;

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
    this.camera.position.set(0, 0, 12);

    this.renderer = new THREE.WebGLRenderer({ alpha:true, antialias:true });
    this.renderer.setSize(w, h);
    this.renderer.setPixelRatio(Math.min(2, window.devicePixelRatio||1));
    this.renderer.setClearColor(0x000000, 0);
    this.container.innerHTML = '';
    this.container.appendChild(this.renderer.domElement);

    // 향상된 조명 시스템
    this._setupLights();
    
    // 파티클 준비
    this._initParticles();
    this._initConfetti();

    window.addEventListener('resize', this._onResize);
    this.enabled = true;
    this._loop();
  }

  _setupLights() {
    const THREE = this.THREE;
    
    // 주변광 (부드러운 전체 조명)
    this.ambient = new THREE.AmbientLight(0xffffff, 0.4);
    this.scene.add(this.ambient);
    
    // 메인 스팟라이트
    this.spot = new THREE.SpotLight(0xffffff, 2.0, 50, Math.PI/6, 0.3, 1.5);
    this.spot.position.set(0, 8, 12);
    this.spot.castShadow = true;
    this.scene.add(this.spot);
    
    // 보조 조명들 (동적 색상 변화)
    const colors = [0xff6b6b, 0x4ecdc4, 0x45b7d1, 0x96ceb4, 0xfeca57, 0xff9ff3];
    for (let i = 0; i < 4; i++) {
      const light = new THREE.PointLight(colors[i], 0.8, 20);
      const angle = (i / 4) * Math.PI * 2;
      light.position.set(
        Math.cos(angle) * 15,
        3 + Math.sin(angle) * 2,
        Math.sin(angle) * 8
      );
      this.lights.push(light);
      this.scene.add(light);
    }
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
    const N = 1200; // 파티클 개수 증가
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(N * 3);
    const col = new Float32Array(N * 3);
    const vel = new Float32Array(N * 3);
    const sizes = new Float32Array(N);
    const types = new Float32Array(N); // 파티클 타입 (0: 원형, 1: 별, 2: 다각형)

    function rand(min,max){ return min + Math.random()*(max-min); }

    for(let i=0;i<N;i++){
      // 시작은 중심의 한 점에서
      pos[i*3+0] = 0;
      pos[i*3+1] = 0;
      pos[i*3+2] = 0;

      // 속도는 구형으로 퍼지게 (더 멀리, 더 빠르게)
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(1 - 2 * Math.random());
      const speed = rand(8.0, 18.0);
      vel[i*3+0] = Math.sin(phi) * Math.cos(theta) * speed;
      vel[i*3+1] = Math.sin(phi) * Math.sin(theta) * speed;
      vel[i*3+2] = Math.cos(phi) * speed;

      // 더 밝고 선명한 파스텔톤 + 골드/실버 추가
      const palette = [
        [1, 0.5, 0.6], [0.6, 0.8, 1], [1, 0.9, 0.6], [0.8, 0.7, 1], [0.7, 1, 0.8],
        [1, 0.8, 0.2], [0.8, 0.8, 0.8], [1, 0.6, 0.8], [0.6, 1, 0.9], [1, 0.7, 0.4]
      ];
      const [r,g,b] = palette[i % palette.length];
      col[i*3+0] = r; col[i*3+1] = g; col[i*3+2] = b;
      
      // 다양한 크기
      sizes[i] = rand(0.08, 0.25);
      
      // 파티클 타입 랜덤 선택
      types[i] = Math.floor(Math.random() * 3);
    }

    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    geo.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    geo.setAttribute('type', new THREE.BufferAttribute(types, 1));
    this.velocities = vel;

    // 커스텀 셰이더 머티리얼 생성
    const vertexShader = `
      attribute float size;
      attribute float type;
      varying float vType;
      varying vec3 vColor;
      void main() {
        vType = type;
        vColor = color;
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = size * (300.0 / -mvPosition.z);
        gl_Position = projectionMatrix * mvPosition;
      }
    `;

    const fragmentShader = `
      varying float vType;
      varying vec3 vColor;
      void main() {
        vec2 center = gl_PointCoord - vec2(0.5);
        float dist = length(center);
        
        if (vType == 0.0) {
          // 원형 파티클
          if (dist > 0.5) discard;
          float alpha = 1.0 - smoothstep(0.3, 0.5, dist);
          gl_FragColor = vec4(vColor, alpha * 0.8);
        } else if (vType == 1.0) {
          // 별 모양 파티클
          float angle = atan(center.y, center.x);
          float star = sin(angle * 5.0) * 0.3 + 0.7;
          if (dist > star) discard;
          float alpha = 1.0 - smoothstep(0.2, star, dist);
          gl_FragColor = vec4(vColor, alpha * 0.9);
        } else {
          // 다각형 파티클
          float angle = atan(center.y, center.x);
          float polygon = cos(floor(0.5 + angle / 1.256) * 1.256 - angle) * 0.4 + 0.6;
          if (dist > polygon) discard;
          float alpha = 1.0 - smoothstep(0.1, polygon, dist);
          gl_FragColor = vec4(vColor, alpha * 0.85);
        }
      }
    `;

    const mat = new THREE.ShaderMaterial({ 
      vertexShader: vertexShader,
      fragmentShader: fragmentShader,
      attributes: {
        size: { type: 'f', value: sizes },
        type: { type: 'f', value: types }
      },
      vertexColors: true, 
      transparent: true, 
      opacity: 0.0,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    
    this.points = new THREE.Points(geo, mat);
    this.points.visible = false;
    this.scene.add(this.points);
  }

  _initConfetti() {
    const THREE = this.THREE;
    const N = 200; // 컨페티 개수
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(N * 3);
    const col = new Float32Array(N * 3);
    const vel = new Float32Array(N * 3);
    const rotations = new Float32Array(N * 3);
    const rotationSpeeds = new Float32Array(N * 3);
    const types = new Float32Array(N); // 컨페티 타입 (0: 원형, 1: 하트, 2: 다이아몬드)
    const sizes = new Float32Array(N);

    function rand(min,max){ return min + Math.random()*(max-min); }

    for(let i=0;i<N;i++){
      // 시작 위치 (화면 상단에서)
      pos[i*3+0] = rand(-20, 20);
      pos[i*3+1] = 15;
      pos[i*3+2] = rand(-10, 10);

      // 속도 (아래로 떨어지면서 흔들림)
      vel[i*3+0] = rand(-2, 2);
      vel[i*3+1] = rand(-8, -4);
      vel[i*3+2] = rand(-1, 1);

      // 회전 속도
      rotationSpeeds[i*3+0] = rand(-0.2, 0.2);
      rotationSpeeds[i*3+1] = rand(-0.2, 0.2);
      rotationSpeeds[i*3+2] = rand(-0.2, 0.2);

      // 컨페티 색상 (축하 느낌의 밝은 색상)
      const colors = [0xff6b6b, 0x4ecdc4, 0x45b7d1, 0x96ceb4, 0xfeca57, 0xff9ff3, 0xffd700, 0xff69b4];
      const color = new THREE.Color(colors[i % colors.length]);
      col[i*3+0] = color.r; col[i*3+1] = color.g; col[i*3+2] = color.b;
      
      // 컨페티 타입 랜덤 선택
      types[i] = Math.floor(Math.random() * 3);
      
      // 다양한 크기
      sizes[i] = rand(0.12, 0.3);
    }

    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    geo.setAttribute('rotation', new THREE.BufferAttribute(rotations, 3));
    geo.setAttribute('rotationSpeed', new THREE.BufferAttribute(rotationSpeeds, 3));
    geo.setAttribute('type', new THREE.BufferAttribute(types, 1));
    geo.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    this.confettiVelocities = vel;

    // 커스텀 셰이더 머티리얼 생성
    const vertexShader = `
      attribute float size;
      attribute float type;
      varying float vType;
      varying vec3 vColor;
      void main() {
        vType = type;
        vColor = color;
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = size * (300.0 / -mvPosition.z);
        gl_Position = projectionMatrix * mvPosition;
      }
    `;

    const fragmentShader = `
      varying float vType;
      varying vec3 vColor;
      void main() {
        vec2 center = gl_PointCoord - vec2(0.5);
        float dist = length(center);
        
        if (vType == 0.0) {
          // 원형 컨페티
          if (dist > 0.5) discard;
          float alpha = 1.0 - smoothstep(0.3, 0.5, dist);
          gl_FragColor = vec4(vColor, alpha * 0.9);
        } else if (vType == 1.0) {
          // 하트 모양 컨페티
          vec2 p = center * 2.0;
          float a = atan(p.y, p.x) / 3.14159;
          float r = length(p);
          float h = abs(a) * 0.5 + 0.5;
          float heart = r - h * 0.3;
          if (heart > 0.4) discard;
          float alpha = 1.0 - smoothstep(0.2, 0.4, heart);
          gl_FragColor = vec4(vColor, alpha * 0.95);
        } else {
          // 다이아몬드 모양 컨페티
          vec2 p = abs(center * 2.0);
          float diamond = max(p.x + p.y * 0.7, p.y + p.x * 0.7);
          if (diamond > 0.8) discard;
          float alpha = 1.0 - smoothstep(0.1, 0.8, diamond);
          gl_FragColor = vec4(vColor, alpha * 0.9);
        }
      }
    `;

    const mat = new THREE.ShaderMaterial({ 
      vertexShader: vertexShader,
      fragmentShader: fragmentShader,
      attributes: {
        size: { type: 'f', value: sizes },
        type: { type: 'f', value: types }
      },
      vertexColors: true, 
      transparent: true, 
      opacity: 0.0,
      depthWrite: false,
      blending: THREE.NormalBlending,
    });
    
    this.confetti = new THREE.Points(geo, mat);
    this.confetti.visible = false;
    this.scene.add(this.confetti);
  }

  tension(){
    // 스핀 전 긴장감: 조명이 더 빠르고 강하게 펄스
    this.pulseT = 0;
    this.lightPulse = 0;
    if (this.opts.lights && this.spot) {
      this.spot.intensity = 3.5;
      this.spot.penumbra = 0.9;
    }
  }

  celebrate(){
    if(!this.enabled) return;
    
    // 메인 파티클 시스템
    if(this.opts.particles && this.points){
      this._initParticles();
      this.points.material.opacity = 1.0;
      this.points.visible = true;
      this._particleTime = 0;
    }
    
    // 컨페티 시스템
    if(this.confetti){
      this._initConfetti();
      this.confetti.material.opacity = 1.0;
      this.confetti.visible = true;
      this.confettiTime = 0;
    }
    
    // 카메라 효과
    if(this.opts.camera){
      this._shakeT = 1.5; // 더 강한 흔들림
      this._zoomT = 1.0; // 줌 효과
    }
    
    // 조명 효과
    if(this.opts.lights){
      // 메인 스팟라이트 플래시
      if(this.spot){
        this.spot.color.set(0xfffacd);
        this.spot.intensity = 8;
        this.spot.angle = Math.PI / 4;
      }
      
      // 보조 조명들도 플래시
      this.lights.forEach((light, i) => {
        const colors = [0xff6b6b, 0x4ecdc4, 0x45b7d1, 0x96ceb4, 0xfeca57, 0xff9ff3];
        light.color.setHex(colors[i % colors.length]);
        light.intensity = 2.0;
      });
    }
  }

  _loop = (t=0) => {
    if(!this.enabled || !this.renderer) return;
    const dt = 0.016;

    // 조명 펄스 및 복구
    if(this.opts.lights){
      this.pulseT += dt;
      this.lightPulse += dt * 2;
      
      // 메인 스팟라이트
      if(this.spot){
        const baseIntensity = 2.0 + Math.sin(this.pulseT * 2.5) * 0.8;
        this.spot.intensity = this.spot.intensity * 0.92 + baseIntensity * 0.08;
        this.spot.color.lerp(new this.THREE.Color(0xffffff), 0.02);
        this.spot.angle = this.spot.angle * 0.95 + (Math.PI/6) * 0.05;

        // 부드러운 움직임
        this.spot.position.x = Math.sin(this.pulseT*0.7)*3.0;
        this.spot.position.y = 8 + Math.cos(this.pulseT*1.1)*1.2;
      }
      
      // 보조 조명들 동적 변화
      this.lights.forEach((light, i) => {
        const pulse = Math.sin(this.lightPulse + i * Math.PI/2) * 0.3 + 0.7;
        light.intensity = light.intensity * 0.95 + (0.8 * pulse) * 0.05;
        
        // 부드러운 움직임
        const angle = (i / this.lights.length) * Math.PI * 2 + this.lightPulse * 0.3;
        light.position.x = Math.cos(angle) * 15;
        light.position.y = 3 + Math.sin(angle) * 2;
      });
    }

    // 카메라 효과
    if(this.opts.camera && this.camera){
      // 흔들림
      if(!this._shakeT) this._shakeT = 0;
      this._shakeT = Math.max(0, this._shakeT - dt * 0.6);
      const shakeAmount = Math.pow(this._shakeT, 1.5);
      const mag = shakeAmount * 0.3;
      this.camera.position.x = Math.sin(t * 0.008) * mag;
      this.camera.position.y = Math.cos(t * 0.006) * mag;
      
      // 줌 효과
      if(!this._zoomT) this._zoomT = 0;
      this._zoomT = Math.max(0, this._zoomT - dt * 0.8);
      const zoomAmount = Math.pow(this._zoomT, 2);
      const zoomMag = zoomAmount * 0.4;
      this.camera.position.z = 12 + Math.sin(t * 0.01) * zoomMag;
      
      this.camera.lookAt(0,0,0);
    }

    // 메인 파티클 물리
    if(this.opts.particles && this.points){
      if(this.points.visible){
        if(this._particleTime == null) this._particleTime = 0;
        this._particleTime += dt;
        const pos = this.points.geometry.getAttribute('position').array;
        const vel = this.velocities;
        const type = this.points.geometry.getAttribute('type').array;
        const drag = 0.985;

        for(let i=0;i<vel.length/3;i++){
          // 타입별로 다른 물리 효과
          let typeDrag = drag;
          let typeGravity = this.gravity;
          
          if(type[i] === 0) { // 원형 - 빠르게 떨어짐
            typeDrag = 0.98;
            typeGravity = this.gravity * 1.2;
          } else if(type[i] === 1) { // 별 - 천천히 떨어짐
            typeDrag = 0.99;
            typeGravity = this.gravity * 0.8;
          } else { // 다각형 - 중간 속도
            typeDrag = 0.985;
            typeGravity = this.gravity;
          }
          
          vel[i*3+0] *= typeDrag;
          vel[i*3+1] *= typeDrag;
          vel[i*3+2] *= typeDrag;

          vel[i*3+1] += typeGravity * dt;
          pos[i*3+0] += vel[i*3+0] * dt;
          pos[i*3+1] += vel[i*3+1] * dt;
          pos[i*3+2] += vel[i*3+2] * dt;
        }
        this.points.geometry.attributes.position.needsUpdate = true;

        // 서서히 페이드아웃
        this.points.material.opacity = Math.max(0, 1.0 - this._particleTime * 0.3);
        if(this._particleTime > 3.5){
          this.points.visible = false;
          this._particleTime = 0;
        }
      }
    }

    // 컨페티 물리
    if(this.confetti && this.confetti.visible){
      this.confettiTime += dt;
      const pos = this.confetti.geometry.getAttribute('position').array;
      const vel = this.confettiVelocities;
      const rot = this.confetti.geometry.getAttribute('rotation').array;
      const rotSpeed = this.confetti.geometry.getAttribute('rotationSpeed').array;
      const type = this.confetti.geometry.getAttribute('type').array;
      
      for(let i=0;i<vel.length/3;i++){
        // 타입별로 다른 물리 효과
        let typeGravity = this.gravity * 0.8;
        let typeDrag = 0.99;
        let typeBounce = 0.6;
        
        if(type[i] === 0) { // 원형 - 빠르게 떨어짐
          typeGravity = this.gravity * 1.0;
          typeDrag = 0.98;
          typeBounce = 0.5;
        } else if(type[i] === 1) { // 하트 - 천천히 떨어짐
          typeGravity = this.gravity * 0.6;
          typeDrag = 0.995;
          typeBounce = 0.7;
        } else { // 다이아몬드 - 중간 속도
          typeGravity = this.gravity * 0.8;
          typeDrag = 0.99;
          typeBounce = 0.6;
        }
        
        // 중력과 공기저항
        vel[i*3+1] += typeGravity * dt;
        vel[i*3+0] *= typeDrag;
        vel[i*3+2] *= typeDrag;
        
        // 위치 업데이트
        pos[i*3+0] += vel[i*3+0] * dt;
        pos[i*3+1] += vel[i*3+1] * dt;
        pos[i*3+2] += vel[i*3+2] * dt;
        
        // 회전 업데이트
        rot[i*3+0] += rotSpeed[i*3+0];
        rot[i*3+1] += rotSpeed[i*3+1];
        rot[i*3+2] += rotSpeed[i*3+2];
        
        // 바닥에 닿으면 튀어오르기
        if(pos[i*3+1] < -8 && vel[i*3+1] < 0){
          pos[i*3+1] = -8;
          vel[i*3+1] = Math.abs(vel[i*3+1]) * typeBounce;
          
          // 바운스 후 회전 속도도 조정
          rotSpeed[i*3+0] *= 0.8;
          rotSpeed[i*3+1] *= 0.8;
          rotSpeed[i*3+2] *= 0.8;
        }
      }
      
      this.confetti.geometry.attributes.position.needsUpdate = true;
      this.confetti.geometry.attributes.rotation.needsUpdate = true;
      
      // 서서히 페이드아웃
      this.confetti.material.opacity = Math.max(0, 1.0 - this.confettiTime * 0.15);
      if(this.confettiTime > 8){
        this.confetti.visible = false;
        this.confettiTime = 0;
      }
    }

    this.renderer.render(this.scene, this.camera);
    this.rafId = requestAnimationFrame(this._loop);
  }
}