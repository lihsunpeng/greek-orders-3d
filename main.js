import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';

const V = '3';
const stage = document.getElementById('stage');
const renderer = new THREE.WebGLRenderer({antialias:true});
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
stage.appendChild(renderer.domElement);

const scene = new THREE.Scene();
// pink sky gradient
{
  const c = document.createElement('canvas'); c.width = 4; c.height = 256;
  const g = c.getContext('2d'); const gr = g.createLinearGradient(0,0,0,256);
  gr.addColorStop(0,'#ffd6e4'); gr.addColorStop(0.55,'#ffe9ef'); gr.addColorStop(1,'#ffd9c4');
  g.fillStyle = gr; g.fillRect(0,0,4,256);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; scene.background = t;
}
scene.fog = new THREE.Fog(0xffe4ec, 40, 90);

const camera = new THREE.PerspectiveCamera(45, innerWidth/innerHeight, 0.05, 200);
camera.position.set(0, 7, 24);
const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 3.2, 0);
controls.enableDamping = true; controls.dampingFactor = 0.08;
controls.minDistance = 1.2; controls.maxDistance = 45;
controls.maxPolarAngle = Math.PI*0.495;
controls.zoomSpeed = 1.1; controls.rotateSpeed = 0.8;
controls.update();

scene.add(new THREE.HemisphereLight(0xfff4f7, 0xf6a9b9, 1.15));
const sun = new THREE.DirectionalLight(0xfff1e0, 2.2);
sun.position.set(9, 16, 11); sun.castShadow = true;
sun.shadow.mapSize.set(1024,1024);
Object.assign(sun.shadow.camera, {left:-19,right:19,top:14,bottom:-6,near:1,far:50});
sun.shadow.bias = -0.0008; sun.shadow.normalBias = 0.02;
scene.add(sun);
const fill = new THREE.DirectionalLight(0xffd8e6, 0.6); fill.position.set(-10, 6, -6); scene.add(fill);

const marble = new THREE.MeshStandardMaterial({color:0xfbf2ec, roughness:0.62, metalness:0.0});
const marbleD = new THREE.MeshStandardMaterial({color:0xf7e8e0, roughness:0.65, side:THREE.DoubleSide});
const leafM = new THREE.MeshStandardMaterial({color:0x7fb069, roughness:0.55, side:THREE.DoubleSide});
const leafS = new THREE.MeshStandardMaterial({color:0xa9cf8a, roughness:0.6, side:THREE.DoubleSide});
const pPink = new THREE.MeshStandardMaterial({color:0xF894BB, roughness:0.5});
const pCoral = new THREE.MeshStandardMaterial({color:0xED6578, roughness:0.5});
const pRed = new THREE.MeshStandardMaterial({color:0xEA3C3C, roughness:0.5});
const pOrange = new THREE.MeshStandardMaterial({color:0xF6925A, roughness:0.5});
const pGold = new THREE.MeshStandardMaterial({color:0xE9A84C, roughness:0.35, metalness:0.35});
const sideP = (side)=>[side,side,marble,marble,side,side]; // box: paint the 4 sides

function shade(m){ m.traverse(o=>{ if(o.isMesh){o.castShadow=true; o.receiveShadow=true;} }); return m; }

// ---------- ground ----------
const ground = new THREE.Mesh(new THREE.CylinderGeometry(17, 17.6, 0.6, 96), new THREE.MeshStandardMaterial({color:0xfbc3d4, roughness:0.9}));
ground.position.y = -0.3; ground.receiveShadow = true; scene.add(ground);
const rim = new THREE.Mesh(new THREE.TorusGeometry(17.3, 0.25, 12, 120), new THREE.MeshStandardMaterial({color:0xF894BB, roughness:0.7}));
rim.rotation.x = Math.PI/2; rim.position.y = 0.0; scene.add(rim);
// puffy clouds
const cloudM = new THREE.MeshStandardMaterial({color:0xffffff, roughness:1, emissive:0xffe6ee, emissiveIntensity:0.35});
function cloud(x,y,z,s){ const g=new THREE.Group(); [[0,0,0,1],[1,0.1,0,0.8],[-1,0,0,0.75],[0.4,0.5,0,0.7],[-0.5,0.45,0,0.6]].forEach(([a,b,c,r])=>{const m=new THREE.Mesh(new THREE.SphereGeometry(r,20,14),cloudM);m.position.set(a,b,c);g.add(m)}); g.position.set(x,y,z); g.scale.setScalar(s); scene.add(g); return g; }
const clouds=[cloud(-14,11,-18,2.2),cloud(12,13,-22,2.6),cloud(2,15,-28,2),cloud(-24,8,-10,1.8),cloud(24,9,-8,1.7)];

// ---------- helpers ----------
function lathe(points, seg=64, mat=marble){ return new THREE.Mesh(new THREE.LatheGeometry(points.map(p=>new THREE.Vector2(p[0],p[1])), seg), mat); }
// fluted shaft: n flutes, fillet fraction (0 = sharp arris), depth ratio
function shaft(R0,R1,H,n,depth,fillet){
  const ts = n*10, ys = 40; const pos=[], idx=[];
  for(let j=0;j<=ys;j++){
    const v=j/ys, y=v*H;
    const R = R0 + (R1-R0)*v + 0.012*R0*Math.sin(Math.PI*v); // slight entasis
    for(let i=0;i<=ts;i++){
      const th = i/ts*Math.PI*2; let f = (th/(Math.PI*2)*n)%1;
      let dip=0;
      if(fillet>0){ if(f>fillet/2 && f<1-fillet/2){ const u=(f-fillet/2)/(1-fillet); dip=Math.sqrt(Math.max(0,1-(2*u-1)**2)); } }
      else dip=Math.sqrt(Math.max(0,1-(2*f-1)**2));
      const r = R*(1-depth*dip);
      pos.push(r*Math.sin(th), y, r*Math.cos(th));
    }
  }
  for(let j=0;j<ys;j++)for(let i=0;i<ts;i++){const a=j*(ts+1)+i,b=a+ts+1; idx.push(a,a+1,b, b,a+1,b+1);}
  const g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3)); g.setIndex(idx); g.computeVertexNormals();
  return new THREE.Mesh(g, marble);
}
function box(w,h,d,y,mat=marble){ const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat); m.position.y=y; return m; }
function steps(x){ const g=new THREE.Group(); const m=new THREE.MeshStandardMaterial({color:0xfff3ea,roughness:0.8});
  [[3.2,0],[2.8,0.18],[2.4,0.36]].forEach(([w,y])=>{const b=new THREE.Mesh(new THREE.BoxGeometry(w,0.18,w),m);b.position.y=y+0.09;g.add(b)}); g.position.x=x; return shade(g); }
// spiral tube for volutes, in local XY plane
function spiral(rOut, rIn, turns, tube, dir=1){
  const pts=[]; const N=120;
  for(let i=0;i<=N;i++){const t=i/N; const a=Math.PI/2 + dir*t*turns*Math.PI*2; const r=rOut*Math.pow(rIn/rOut,t); pts.push(new THREE.Vector3(Math.cos(a)*r, Math.sin(a)*r, 0));}
  return new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 160, tube, 8, false), marble);
}

// ---------- DORIC ----------
const H_D = {base:0.54};
function doric(){
  const g=new THREE.Group();
  const R0=0.5,R1=0.39,H=4.9;
  const s=shaft(R0,R1,H,20,0.07,0); g.add(s);
  // necking + annulets
  for(let k=0;k<3;k++){const t=new THREE.Mesh(new THREE.TorusGeometry(R1+0.005,0.012,6,48),marble);t.material=k===1?pCoral:pPink;t.rotation.x=Math.PI/2;t.position.y=H+0.03+k*0.035;g.add(t);}
  // echinus (cushion)
  const pts=[]; for(let i=0;i<=16;i++){const t=i/16; pts.push([R1+0.02+(0.62-R1)*Math.pow(Math.sin(t*Math.PI/2),0.55), H+0.11+t*0.24]);} pts.unshift([0,H+0.11],[R1+0.01,H+0.11]); pts.push([0,H+0.35]);
  g.add(lathe(pts,64));
  g.add(box(1.32,0.2,1.32,H+0.45,sideP(pPink))); // abacus (painted sides)
  g.userData={capY:H+0.3, top:H+0.55};
  return shade(g);
}
// ---------- IONIC ----------
function attic(R,mat=marble){ // attic base: plinth, torus, scotia, torus
  const g=new THREE.Group();
  g.add(box(R*2.7,0.12,R*2.7,0.06));
  const t1=new THREE.Mesh(new THREE.TorusGeometry(R*1.12,R*0.2,14,64),marble);t1.rotation.x=Math.PI/2;t1.position.y=0.12+R*0.2;g.add(t1);
  g.add(lathe([[0,0.12+R*0.38],[R*1.12,0.12+R*0.38],[R*1.0,0.12+R*0.44],[R*0.98,0.12+R*0.52],[R*1.05,0.12+R*0.58],[0,0.12+R*0.58]],64));
  const t2=new THREE.Mesh(new THREE.TorusGeometry(R*1.02,R*0.14,14,64),marble);t2.rotation.x=Math.PI/2;t2.position.y=0.12+R*0.70;g.add(t2);
  g.userData.top=0.12+R*0.8; return g;
}
function ionic(){
  const g=new THREE.Group(); const R0=0.36,R1=0.305;
  const b=attic(R0); g.add(b); const y0=b.userData.top;
  const H=5.55; const s=shaft(R0,R1,H,24,0.09,0.22); s.position.y=y0; g.add(s);
  const yc=y0+H;
  const ast=new THREE.Mesh(new THREE.TorusGeometry(R1+0.01,0.025,8,48),marble);ast.material=pOrange;ast.rotation.x=Math.PI/2;ast.position.y=yc+0.03;g.add(ast);
  // echinus with egg-and-dart
  g.add(lathe([[0,yc+0.05],[R1+0.02,yc+0.05],[R1+0.07,yc+0.12],[R1+0.07,yc+0.17],[0,yc+0.17]],48));
  for(let i=0;i<16;i++){const a=i/16*Math.PI*2;const e=new THREE.Mesh(new THREE.SphereGeometry(0.045,10,8),i%2?pOrange:pCoral);e.scale.set(1,1.4,0.6);e.position.set(Math.sin(a)*(R1+0.08),yc+0.11,Math.cos(a)*(R1+0.08));e.rotation.y=a;g.add(e);}
  // canalis slab
  const cy=yc+0.24; g.add(box(1.04,0.13,0.62,cy));
  // volutes on both ends: bolster (pulvinus) + spirals on front/back faces
  const vr=0.23, vy=cy-0.1;
  [-1,1].forEach(sx=>{
    const cx=sx*0.47;
    const bol=lathe([[0.0,-0.31],[vr,-0.31],[vr*0.86,-0.15],[vr*0.72,0],[vr*0.86,0.15],[vr,0.31],[0,0.31]],40);
    bol.rotation.x=Math.PI/2; bol.position.set(cx,vy,0); g.add(bol);
    // belt (balteus)
    const belt=new THREE.Mesh(new THREE.TorusGeometry(vr*0.74,0.025,8,32),pOrange); belt.position.set(cx,vy,0); g.add(belt);
    [-1,1].forEach(sz=>{
      const sp=spiral(vr,0.045,2.6,0.022,-sx); sp.material=pCoral; sp.position.set(cx,vy,sz*0.315); g.add(sp);
      const eye=new THREE.Mesh(new THREE.SphereGeometry(0.05,14,10),pRed); eye.position.set(cx,vy,sz*0.32); g.add(eye);
    });
  });
  g.add(box(0.98,0.07,0.74,cy+0.1,sideP(pPink))); // thin abacus
  g.userData={capY:cy, top:cy+0.14};
  return shade(g);
}
// ---------- CORINTHIAN (Lysicrates type) ----------
function leafGeom(W,Hl,curl,lobes){
  const nu=10,nv=24,pos=[],idx=[];
  for(let j=0;j<=nv;j++){const v=j/nv;
    let w=W*Math.sin(Math.PI*Math.min(1,v*0.95+0.05))*Math.pow(1-v*0.55,1)*(1+0.18*Math.abs(Math.sin(lobes*Math.PI*v)));
    if(v<0.15) w*=0.55+3*v;
    for(let i=0;i<=nu;i++){const u=i/nu*2-1;
      const x=u*w;
      let y=v*Hl, z=0.25*Hl*Math.pow(v,2.2)*curl + 0.06*Hl*u*u - 0.02*Hl*(1-Math.abs(u));
      if(v>0.72){const k=(v-0.72)/0.28; y-=curl*0.35*Hl*k*k; z+=curl*0.22*Hl*k;}
      pos.push(x,y,z);}
  }
  for(let j=0;j<nv;j++)for(let i=0;i<nu;i++){const a=j*(nu+1)+i,b=a+nu+1;idx.push(a,a+1,b,b,a+1,b+1);}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setIndex(idx);g.computeVertexNormals();return g;
}
function corinthian(){
  const g=new THREE.Group(); const R0=0.33,R1=0.28;
  const b=attic(R0); g.add(b); const y0=b.userData.top;
  const H=5.25; const s=shaft(R0,R1,H,24,0.09,0.22); s.position.y=y0; g.add(s);
  const yc=y0+H;
  const ast=new THREE.Mesh(new THREE.TorusGeometry(R1+0.01,0.022,8,48),marble);ast.material=pOrange;ast.rotation.x=Math.PI/2;ast.position.y=yc+0.02;g.add(ast);
  const CH=0.95; // tall capital (Lysicrates)
  // bell (kalathos)
  g.add(lathe([[0,yc+0.03],[R1,yc+0.03],[R1+0.01,yc+0.3],[R1+0.05,yc+0.65],[R1+0.12,yc+CH-0.08],[R1+0.15,yc+CH-0.05],[0,yc+CH-0.05]],48));
  // lower row: small lotus/reed leaves (Lysicrates)
  const small=leafGeom(0.06,0.22,0.6,2);
  for(let i=0;i<16;i++){const a=i/16*Math.PI*2+Math.PI/16;const m=new THREE.Mesh(small,leafS);m.position.set(Math.sin(a)*(R1+0.005),yc+0.04,Math.cos(a)*(R1+0.005));m.rotation.y=a;g.add(m);}
  // main row: 8 tall acanthus leaves with curling tips
  const big=leafGeom(0.13,0.58,1.0,4);
  for(let i=0;i<8;i++){const a=i/8*Math.PI*2;const m=new THREE.Mesh(big,leafM);m.position.set(Math.sin(a)*(R1+0.02),yc+0.2,Math.cos(a)*(R1+0.02));m.rotation.y=a;g.add(m);}
  // corner helices rising to the abacus corners
  const top=yc+CH;
  for(let i=0;i<4;i++){const a=Math.PI/4+i*Math.PI/2;
    const pts=[]; for(let k=0;k<=40;k++){const t=k/40; const r=R1+0.12+0.28*t; const y=yc+0.6+0.28*t; pts.push(new THREE.Vector3(Math.sin(a)*r,y,Math.cos(a)*r));}
    const end=pts[pts.length-1];
    // small spiral at the end, in the vertical plane through the diagonal
    const dirv=new THREE.Vector3(Math.sin(a),0,Math.cos(a));
    for(let k=1;k<=50;k++){const t=k/50; const ang=t*Math.PI*2.2; const r=0.08*(1-t*0.75); pts.push(end.clone().add(dirv.clone().multiplyScalar(Math.sin(ang)*r)).add(new THREE.Vector3(0,-(1-Math.cos(ang))*r*0.9,0)));}
    g.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts),120,0.02,6,false),pGold));
    // stalk leaf (cauliculus) under the helix
    const m=new THREE.Mesh(leafGeom(0.09,0.3,1.2,3),leafM); m.position.set(Math.sin(a)*(R1+0.1),yc+0.5,Math.cos(a)*(R1+0.1)); m.rotation.y=a; g.add(m);
  }
  // central palmette (anthemion) on each face, Lysicrates-style
  for(let i=0;i<4;i++){const a=i*Math.PI/2; const pg=new THREE.Group();
    for(let k=-3;k<=3;k++){const p=new THREE.Mesh(new THREE.SphereGeometry(0.03,8,6),pCoral); p.scale.set(0.6,2.4,0.5); const ang=k*0.28; p.position.set(Math.sin(ang)*0.1,0.08+Math.cos(ang)*0.1,0); p.rotation.z=-ang; pg.add(p);}
    pg.position.set(Math.sin(a)*(R1+0.17),yc+0.62,Math.cos(a)*(R1+0.17)); pg.rotation.y=a; g.add(pg);}
  // concave-sided abacus
  const S=0.56, sh=new THREE.Shape(); const k=0.07;
  sh.moveTo(-S,-S); sh.quadraticCurveTo(0,-S+k*2,S,-S); sh.quadraticCurveTo(S-k*2,0,S,S); sh.quadraticCurveTo(0,S-k*2,-S,S); sh.quadraticCurveTo(-S+k*2,0,-S,-S);
  const ab=new THREE.Mesh(new THREE.ExtrudeGeometry(sh,{depth:0.11,bevelEnabled:true,bevelSize:0.012,bevelThickness:0.012,bevelSegments:2,curveSegments:16}),[marble,pPink]);
  ab.rotation.x=-Math.PI/2; ab.position.y=top-0.06; g.add(ab);
  // fleuron in the middle of each abacus face
  for(let i=0;i<4;i++){const a=i*Math.PI/2;const f=new THREE.Mesh(new THREE.SphereGeometry(0.055,12,10),pRed);f.scale.set(1,1,0.6);f.position.set(Math.sin(a)*(S-0.1),top-0.01,Math.cos(a)*(S-0.1));g.add(f);}
  g.userData={capY:yc+0.5, top:top+0.07};
  return shade(g);
}

// ---------- labels & figure cards ----------
function label(zh,en){
  const c=document.createElement('canvas'); c.width=512; c.height=176; const x=c.getContext('2d');
  x.fillStyle='#ffffff'; x.strokeStyle='#F894BB'; x.lineWidth=12;
  const r=70; x.beginPath(); x.roundRect(8,8,496,160,r); x.fill(); x.stroke();
  x.fillStyle='#ED6578'; x.font='800 64px "Noto Sans CJK TC","PingFang TC","Microsoft JhengHei",sans-serif'; x.textAlign='center'; x.fillText(zh,256,88);
  x.fillStyle='#b45a74'; x.font='600 38px sans-serif'; x.fillText(en,256,142);
  const t=new THREE.CanvasTexture(c); t.colorSpace=THREE.SRGBColorSpace; t.anisotropy=4;
  const s=new THREE.Sprite(new THREE.SpriteMaterial({map:t,depthWrite:false})); s.scale.set(2.2,0.76,1); return s;
}
const loader=new THREE.TextureLoader();
function roundedCard(w,h,r){ const s=new THREE.Shape(); s.moveTo(-w/2+r,-h/2); s.lineTo(w/2-r,-h/2); s.quadraticCurveTo(w/2,-h/2,w/2,-h/2+r); s.lineTo(w/2,h/2-r); s.quadraticCurveTo(w/2,h/2,w/2-r,h/2); s.lineTo(-w/2+r,h/2); s.quadraticCurveTo(-w/2,h/2,-w/2,h/2-r); s.lineTo(-w/2,-h/2+r); s.quadraticCurveTo(-w/2,-h/2,-w/2+r,-h/2); return s; }
function shapeUV(geo,w,h){ const p=geo.attributes.position, uv=[]; for(let i=0;i<p.count;i++) uv.push(p.getX(i)/w+0.5, p.getY(i)/h+0.5); geo.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2)); return geo; }
let pending=0;
function figureCard(src, cap, H, aspect){
  const g=new THREE.Group(); const h=H, w=h*aspect;
  pending++;
  const tex=loader.load(src+'?v='+V,()=>{pending--;}); tex.colorSpace=THREE.SRGBColorSpace; tex.anisotropy=8;
  const geo=new THREE.PlaneGeometry(w,h);
  const pic=new THREE.Mesh(geo,new THREE.MeshStandardMaterial({map:tex,transparent:true,alphaTest:0.04,roughness:0.75,side:THREE.DoubleSide,emissive:0xffffff,emissiveMap:tex,emissiveIntensity:0.18}));
  pic.castShadow=true;
  pic.customDepthMaterial=new THREE.MeshDepthMaterial({depthPacking:THREE.RGBADepthPacking,map:tex,alphaTest:0.5});
  g.add(pic);
  // slight depth: dark silhouette layers behind the cutout
  [0.025,0.05].forEach((dz,k)=>{const sil=new THREE.Mesh(geo,new THREE.MeshBasicMaterial({map:tex,color:k?0x5a2333:0x8a3a4a,alphaTest:0.92,side:THREE.DoubleSide})); sil.position.z=-dz; sil.scale.set(1.004+k*0.004,1.002,1); g.add(sil);});
  g.position.y=h/2+0.16;
  const wrap=new THREE.Group(); wrap.add(g);
  const st=new THREE.Mesh(new THREE.CylinderGeometry(w*0.42+0.25,w*0.42+0.35,0.16,40),new THREE.MeshStandardMaterial({color:0xF6925A,roughness:0.6})); st.position.y=0.08; st.receiveShadow=true; st.castShadow=true; wrap.add(st);
  const ring=new THREE.Mesh(new THREE.TorusGeometry(w*0.42+0.3,0.05,10,48),new THREE.MeshStandardMaterial({color:0xF894BB,roughness:0.5})); ring.rotation.x=Math.PI/2; ring.position.y=0.16; wrap.add(ring);
  const cl=label(cap[0],cap[1]); cl.scale.set(1.9,0.65,1); cl.position.y=h+0.75; wrap.add(cl);
  wrap.userData.card=g; return wrap;
}

const ORD=[
 {x:-8.5, ar:361/1000, make:doric, zh:'多立克', en:'Doric', fig:'assets/fig_doric_color.png', cap:['阿波羅型男子','Apollo type']},
 {x:0,  ar:479/1000, make:ionic, zh:'愛奧尼克', en:'Ionic', fig:'assets/fig_ionic_color.png', cap:['長髮女子','Woman']},
 {x:8.5, ar:320/1000, make:corinthian, zh:'柯林斯', en:'Corinthian', fig:'assets/fig_corinth_color.png', cap:['頭頂花籃少女','Maiden']},
];
const pickables=[];
ORD.forEach((o,i)=>{
  // v3: no stepped blocks under any column; Doric shaft stands directly on the ground/stylobate
  const col=o.make(); col.position.set(o.x,0,0); scene.add(col); o.col=col;
  o.capY=col.userData.capY; o.topY=col.userData.top;
  const lb=label(o.zh,o.en); lb.position.set(o.x,o.topY+0.75,0); scene.add(lb); o.lb=lb;
  const card=figureCard(o.fig,o.cap,5.6,o.ar); card.position.set(o.x+2.7,0,0.9); scene.add(card); o.card=card;
  col.traverse(m=>{if(m.isMesh){m.userData.order=i;pickables.push(m);}});
  card.traverse(m=>{if(m.isMesh){m.userData.order=i;pickables.push(m);}});
});

// ---------- views ----------
const VIEWS={
  all:{p:[0,7.5,24],t:[0,3.2,0]},
};
let sel=0, tween=null;
function viewFor(k){
  const small=innerWidth<760;
  if(k==='all') return small?{p:[19,10.5,27],t:[1.0,3.2,0]}:{p:[2.6,7.6,25.5],t:[1.4,3.4,0]};
  if(k==='cap'){const o=ORD[sel]; return {p:[o.x+1.6,o.capY+0.9,small?3.9:3.1],t:[o.x,o.capY-0.05,0]};}
  const o=ORD[k]; return small?{p:[o.x+4.6,5.4,14.5],t:[o.x+1.4,3.5,0]}:{p:[o.x+4.6,5.2,13],t:[o.x+1.4,3.6,0]};
}
function go(k){ ORD.forEach(o=>o.lb.visible=(k!=='cap'));
  const v=viewFor(k); tween={t0:performance.now(),d:1100,p0:camera.position.clone(),t0v:controls.target.clone(),p1:new THREE.Vector3(...v.p),t1:new THREE.Vector3(...v.t)};
}
const btns=[...document.querySelectorAll('#views button[data-view]')];
function setOn(k){btns.forEach(b=>b.classList.toggle('on',b.dataset.view===String(k)));}
btns.forEach(b=>b.addEventListener('click',()=>{const k=b.dataset.view; if(k==='all'||k==='cap'){go(k);} else {sel=+k; showTab(sel); go(sel);} setOn(k);}));
const spinBtn=document.getElementById('spin');
spinBtn.addEventListener('click',()=>{controls.autoRotate=!controls.autoRotate; controls.autoRotateSpeed=1.2; spinBtn.setAttribute('aria-pressed',controls.autoRotate);});

// click/tap column or card to select
const ray=new THREE.Raycaster(), ptr=new THREE.Vector2(); let down=null;
renderer.domElement.addEventListener('pointerdown',e=>{down=[e.clientX,e.clientY];});
renderer.domElement.addEventListener('pointerup',e=>{
  if(!down||Math.hypot(e.clientX-down[0],e.clientY-down[1])>6) return;
  const r=renderer.domElement.getBoundingClientRect(); ptr.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);
  ray.setFromCamera(ptr,camera); const h=ray.intersectObjects(pickables,false)[0];
  if(h){sel=h.object.userData.order; showTab(sel); go(sel); setOn(sel);}
});

// ---------- panel ----------
const credit=`<div class="ref">Swayne, S. (n.d.). <i>The Parthenon in Athens</i> [Photograph]. Wikimedia Commons. <a href="https://commons.wikimedia.org/wiki/File:The_Parthenon_in_Athens.jpg" target="_blank" rel="noopener">https://commons.wikimedia.org/wiki/File:The_Parthenon_in_Athens.jpg</a> (CC BY 2.0)</div>`;
const credit2=`<div class="ref">Savin, A. (2013). <i>Attica 06-13 Athens 25 Olympian Zeus Temple</i> [Photograph]. Wikimedia Commons. <a href="https://commons.wikimedia.org/wiki/File:Attica_06-13_Athens_25_Olympian_Zeus_Temple.jpg" target="_blank" rel="noopener">https://commons.wikimedia.org/wiki/File:Attica_06-13_Athens_25_Olympian_Zeus_Temple.jpg</a> (CC BY-SA 3.0)</div>`;
const T=[
`<h2>多立克式<small>Doric</small></h2>
<dl>
<dt>年代 Date</dt><dd>西元前 7 世紀晚期，距今約 2,650 年<div class="en">late 7th century BC, ~2,650 years ago</div></dd>
<dt>命名族群 People</dt><dd>多利安人：伯羅奔尼撒半島，代表城邦斯巴達；尚武、簡樸。<div class="en">Dorians — Peloponnese, Sparta; martial and austere</div></dd>
<dt>發源地（相對雅典）Origin</dt><dd>斯巴達在雅典西南方，直線約 150 公里。<div class="en">Sparta, ~150 km SW of Athens (straight line)</div></dd>
<dt>代表建築與所在地 Landmark</dt><dd>帕德嫩神廟・雅典衛城，西元前 447–432 年（主體前 438 年完成，雕刻到前 432 年）。<div class="en">Parthenon, Acropolis of Athens, 447–432 BC</div></dd>
<dt>隱喻形象 Metaphor</dt><dd>維特魯威《建築十書》第 4 卷：多立克柱取男子身體比例，表現力量與樸實。這裡用阿波羅型男子示意。<div class="en">Vitruvius, Book IV: proportions of a man</div></dd>
<dt>意涵 Meaning</dt><dd>力量、陽剛<div class="en">Strength, masculinity</div></dd>
<dt>風格特色 Features</dt><dd>沒有柱礎（底座），柱身直接立在地面（台基）上，下面不墊任何方塊；柱身粗壯、20 條尖稜凹槽；柱頭是圓墊狀的「鐘形托」加方形「頂板」。<div class="en">No base — the shaft stands directly on the stylobate; stout shaft with 20 sharp-edged flutes; cushion echinus + square abacus</div></dd>
</dl>
<div class="figs"><figure><img src="assets/fig_doric_color.png?v=${V}" alt="阿波羅型男子示意"><figcaption>阿波羅型男子（彩色示意插畫）</figcaption></figure></div>
<figure><img src="assets/tem_parthenon.jpg?v=${V}" alt="帕德嫩神廟照片" loading="lazy"><figcaption>帕德嫩神廟 Parthenon（照片：Steve Swayne，CC BY 2.0）</figcaption></figure>
${credit}`,
`<h2>愛奧尼克式<small>Ionic</small></h2>
<dl>
<dt>年代 Date</dt><dd>西元前 6 世紀中葉，距今約 2,580 年<div class="en">mid-6th century BC, ~2,580 years ago</div></dd>
<dt>命名族群 People</dt><dd>愛奧尼亞人：小亞細亞西岸（今土耳其）的米利都、以弗所等城邦；航海貿易與自然哲學興盛。<div class="en">Ionians — west coast of Asia Minor; trade and philosophy</div></dd>
<dt>發源地（相對雅典）Origin</dt><dd>以弗所在雅典正東方，直線約 320 公里，隔著愛琴海。<div class="en">Ephesus, ~320 km east of Athens across the Aegean</div></dd>
<dt>代表建築與所在地 Landmark</dt><dd>以弗所阿提米絲神廟（今土耳其塞爾丘克附近）：古風期神廟約西元前 560–550 年起建，呂底亞王克羅伊斯出資；前 356 年被焚毀後重建，名列古代世界七大奇蹟。老普林尼記載有 127 根柱子。今天只剩一根重新立起的柱子。<div class="en">Temple of Artemis, Ephesus — begun c. 560–550 BC; rebuilt after 356 BC; one of the Seven Wonders</div></dd>
<dt>隱喻形象 Metaphor</dt><dd>維特魯威：愛奧尼克柱取女子較纖細的比例；柱頭渦卷像兩側捲起的頭髮，凹槽像長袍的褶紋。<div class="en">Vitruvius: slender female proportions; volutes like curls, flutes like drapery</div></dd>
<dt>意涵 Meaning</dt><dd>優雅、柔美<div class="en">Elegance, grace</div></dd>
<dt>風格特色 Features</dt><dd>有柱礎（上下兩道圓環線腳）；柱身較細，24 條凹槽，槽間留平帶；柱頭兩側大渦卷，下方有卵箭飾。<div class="en">Moulded base; 24 flutes with fillets; twin volutes over egg-and-dart</div></dd>
</dl>
<div class="figs"><figure><img src="assets/fig_ionic_color.png?v=${V}" alt="長直髮肩上大卷女子示意"><figcaption>長直髮・肩上雙大卷女子（彩色示意插畫）</figcaption></figure></div>
<figure><img src="assets/tem_artemis.jpg?v=${V}" alt="阿提米絲神廟復原圖" loading="lazy"><figcaption>阿提米絲神廟 Temple of Artemis（復原示意插畫）</figcaption></figure>`,
`<h2>柯林斯式<small>Corinthian</small></h2>
<dl>
<dt>年代 Date</dt><dd>約西元前 420 年，距今約 2,450 年；已知最早的例子在巴賽的阿波羅神廟內部。<div class="en">c. 420 BC, ~2,450 years ago; earliest known at Bassae</div></dd>
<dt>命名族群 People</dt><dd>科林斯城：地峽上的商業城邦，富裕，以精緻工藝聞名。<div class="en">Corinth — wealthy isthmus trading city, fine crafts</div></dd>
<dt>發源地（相對雅典）Origin</dt><dd>古科林斯在雅典西方，直線約 75 公里。<div class="en">Ancient Corinth, ~75 km west of Athens (straight line)</div></dd>
<dt>代表建築與所在地 Landmark</dt><dd>奧林匹亞宙斯神廟・雅典：前 6 世紀末庇西特拉圖家族始建未完成；前 174 年塞琉古王安條克四世改用科林斯式續建；西元 131/132 年羅馬皇帝哈德良完工。今天還立著 15 根柱子，另有 1 根在 1852 年倒下。<div class="en">Olympieion, Athens — resumed in Corinthian 174 BC, completed by Hadrian AD 131/132</div></dd>
<dt>柱頭範本 Model</dt><dd>本作柱頭仿雅典的列西克拉特斯合唱紀念碑（前 335/334 年），它是現存最早用在建築外部的科林斯柱頭：下有一圈小葉、上有一圈大莨苕葉、中間有棕櫚葉飾。<div class="en">Modeled on the Choragic Monument of Lysicrates, 335/334 BC</div></dd>
<dt>隱喻形象 Metaphor</dt><dd>維特魯威記載：一位科林斯少女病逝，奶媽把她的遺物裝進籃子放在墳上；籃下的莨苕長出葉子包住籃子，雕刻家卡利馬科斯看見後設計了這種柱頭。<div class="en">Vitruvius: Callimachus and the acanthus around a maiden's basket</div></dd>
<dt>意涵 Meaning</dt><dd>華麗、重生<div class="en">Splendour, rebirth</div></dd>
<dt>風格特色 Features</dt><dd>三種柱式中最修長；鐘形柱頭包著莨苕葉，四角有細渦卷，頂板四邊內凹。<div class="en">Slenderest; bell capital with acanthus, corner helices, concave abacus</div></dd>
</dl>
<div class="figs"><figure><img src="assets/fig_corinth_color.png?v=${V}" alt="頭頂花籃少女示意"><figcaption>頭頂花籃少女（彩色示意插畫）</figcaption></figure><figure><img src="assets/col_lysicrates.jpg?v=${V}" alt="列西克拉特斯型柯林斯柱示意"><figcaption>列西克拉特斯型柱（示意插畫）</figcaption></figure></div>
<figure><img src="assets/tem_olympieion.jpg?v=${V}" alt="奧林匹亞宙斯神廟照片" loading="lazy"><figcaption>奧林匹亞宙斯神廟 Olympieion（照片：A. Savin，CC BY-SA 3.0）</figcaption></figure>
${credit2}`,
`<h2>出處<small>Sources & credits</small></h2>
<p><b>照片出處 Photo credits（APA 7）</b></p>
${credit}${credit2}
<p><b>文獻 Reference</b></p>
<div class="ref">Vitruvius. (1914). <i>The ten books on architecture</i> (M. H. Morgan, Trans.). Harvard University Press. (Original work published ca. 30–15 BC)</div>
<p><b>軟體 Software</b></p>
<div class="ref">three.js authors. (2023). <i>three.js</i> (Version r160) [Computer software]. <a href="https://threejs.org/" target="_blank" rel="noopener">https://threejs.org/</a> (MIT License)</div>
<p class="note">3D 柱子是用程式建出的示意模型，比例參考維特魯威，細節為簡化版；柱頭的彩繪是參考古希臘神廟原本有上色的示意配色。彩色人物、柱子插畫與阿提米絲神廟復原圖都是示意插畫，不是照片。<br><span class="en">3D columns are simplified procedural models; other images are illustrations.</span></p>
<figure><a href="assets/table.jpg?v=${V}" target="_blank" rel="noopener"><img src="assets/table.jpg?v=${V}" alt="希臘三柱式比較表" loading="lazy"></a><figcaption>希臘三柱式比較表（點圖看大圖）</figcaption></figure>`
];
const body=document.getElementById('body');
const tabs=[...document.querySelectorAll('#tabs button')];
function showTab(k){ body.innerHTML=T[k==='src'?3:k]; body.scrollTop=0; tabs.forEach(b=>b.classList.toggle('on',b.dataset.tab===String(k))); }
tabs.forEach(b=>b.addEventListener('click',()=>{const k=b.dataset.tab; if(k==='src'){showTab('src');return;} sel=+k; showTab(sel); go(sel); setOn(sel);}));
const panel=document.getElementById('panel'), fold=document.getElementById('fold');
fold.addEventListener('click',()=>{panel.classList.toggle('folded'); fold.textContent=panel.classList.contains('folded')?'▴':'▾'; resize();});
resize();
showTab(0);

// ---------- loop ----------
function resize(){ const w=innerWidth,h=innerHeight; renderer.setSize(w,h); camera.aspect=w/h;
  const r=panel.getBoundingClientRect();
  if(w>=760){ const pw=Math.min(r.width+24,w*0.45); camera.fov=45; camera.setViewOffset(w+pw,h,pw,0,w,h); camera.aspect=(w+pw)/h; }
  else { const ph=Math.min(innerHeight-r.top+8,h*0.5), vis=h-ph, B=52*Math.PI/180;
    camera.fov=2*Math.atan(Math.tan(B/2)*(h+ph)/vis)*180/Math.PI; camera.setViewOffset(w,h+ph,0,ph,w,h); camera.aspect=w/(h+ph); }
  camera.updateProjectionMatrix(); }
addEventListener('resize',resize);
const ease=t=>t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2;
let first=true; const clock=new THREE.Clock();
function loop(now){
  requestAnimationFrame(loop);
  const t=clock.getElapsedTime();
  if(tween){ const k=Math.min(1,(now-tween.t0)/tween.d), e=ease(k);
    camera.position.lerpVectors(tween.p0,tween.p1,e); controls.target.lerpVectors(tween.t0v,tween.t1,e); if(k>=1) tween=null; }
  // figure cards face the camera (rotate about Y only)
  ORD.forEach(o=>{ const c=o.card; const dx=camera.position.x-c.position.x, dz=camera.position.z-c.position.z; c.userData.card.rotation.y=Math.atan2(dx,dz); });
  clouds.forEach((c,i)=>{c.position.y+=Math.sin(t*0.5+i)*0.002;});
  controls.update(); renderer.render(scene,camera);
  if(first && pending===0){ first=false; document.getElementById('loading').classList.add('done'); window.__ready=true; }
}
go('all'); tween.d=1; requestAnimationFrame(loop);
