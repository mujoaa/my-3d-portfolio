import * as T from 'three';

const TAU = Math.PI * 2;
const ivory = new T.MeshStandardMaterial({color:'#e2d6bd', roughness:.28, metalness:.08});
const brass = new T.MeshStandardMaterial({color:'#b99661', roughness:.3, metalness:.7});
const dark = new T.MeshStandardMaterial({color:'#151a18', roughness:.4, metalness:.35});
const chrome = new T.MeshStandardMaterial({color:'#a9b1af', roughness:.27, metalness:.9});
const rubber = new T.MeshStandardMaterial({color:'#111312', roughness:.87});

function mesh(geometry:T.BufferGeometry, material:T.Material, parent:T.Object3D, x=0,y=0,z=0) {
  const object = new T.Mesh(geometry, material);
  object.position.set(x,y,z);
  parent.add(object);
  return object;
}
function box(parent:T.Object3D, size:number[], pos:number[], material:T.Material) {
  return mesh(new T.BoxGeometry(size[0],size[1],size[2]), material,parent,...pos as [number,number,number]);
}
function tube(parent:T.Object3D, points:T.Vector3[], radius:number, material:T.Material, segments=32) {
  return mesh(new T.TubeGeometry(new T.CatmullRomCurve3(points),segments,radius,6,false),material,parent);
}
function rod(parent:T.Object3D, from:number[], to:number[], radius:number, material:T.Material) {
  const a=new T.Vector3(...from), b=new T.Vector3(...to);
  const m=mesh(new T.CylinderGeometry(radius,radius,a.distanceTo(b),10),material,parent);
  m.position.copy(a).add(b).multiplyScalar(.5);
  m.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),b.sub(a).normalize());
  return m;
}
function woodTexture() {
  const canvas=document.createElement('canvas'); canvas.width=128;canvas.height=256;
  const c=canvas.getContext('2d')!;
  c.fillStyle='#9e542e';c.fillRect(0,0,128,256);
  for(let i=0;i<100;i++){
    const x=(i*29.73)%128;
    c.strokeStyle=`rgba(48,20,10,${.03+(i%4)*.018})`;c.lineWidth=.5+(i%3)*.3;
    c.beginPath();c.moveTo(x,0);c.bezierCurveTo(x+5,75,x-4,165,x+2,256);c.stroke();
  }
  const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;
  return texture;
}

export function coffee(segments:number) {
  const group=new T.Group();
  const cup=new T.Group();group.add(cup);
  const profile=[[0,-.67],[.43,-.67],[.55,-.6],[.64,-.42],[.76,.15],[.84,.65],[.83,.71],[.77,.71],[.75,.62],[.68,.12],[.52,-.48],[0,-.49]].map(p=>new T.Vector2(...p));
  mesh(new T.LatheGeometry(profile,segments),ivory,cup);
  const handle=mesh(new T.TorusGeometry(.37,.09,12,segments,Math.PI*1.7),ivory,cup,.85,.08,0);
  handle.rotation.z=-Math.PI*.85;handle.scale.y=1.22;
  const coffeeMaterial=new T.MeshStandardMaterial({color:'#211006',roughness:.35,metalness:0});
  const surface=mesh(new T.CircleGeometry(.742,segments),coffeeMaterial,cup,0,.59,0);surface.rotation.x=-Math.PI/2;
  const crema=mesh(new T.TorusGeometry(.72,.012,6,segments),new T.MeshStandardMaterial({color:'#ab783f',roughness:.55}),cup,0,.595,0);crema.rotation.x=Math.PI/2;
  const ring=mesh(new T.TorusGeometry(.8,.026,8,segments),brass,cup,0,.7,0);ring.rotation.x=Math.PI/2;
  const saucer=mesh(new T.LatheGeometry([[0,-.88],[.7,-.88],[1.3,-.79],[1.42,-.73],[1.43,-.69],[1.3,-.71],[.68,-.79],[0,-.79]].map(p=>new T.Vector2(...p)),segments),ivory,group);
  saucer.rotation.z=-.06;
  const beanGeo=new T.SphereGeometry(.16,12,8);
  const beanMat=new T.MeshStandardMaterial({color:'#5d301a',roughness:.72});
  for(let i=0;i<8;i++){
    const bean=new T.Group();
    const b=mesh(beanGeo,beanMat,bean);b.scale.set(.7,.47,1.2);
    tube(bean,[new T.Vector3(0,.075,-.14),new T.Vector3(.025,.077,0),new T.Vector3(0,.075,.14)],.008,dark,8);
    bean.position.set(Math.cos(i*2.4)*1.65,Math.sin(i*1.7)*.82-.1,Math.sin(i*2.4)*1.12);
    bean.rotation.set(i*.5,i*.9,i*.4);group.add(bean);
  }
  const steamMat=new T.MeshBasicMaterial({color:'#c9b89a',transparent:true,opacity:.12,depthWrite:false});
  for(let i=0;i<3;i++){
    const pts=Array.from({length:10},(_,j)=>new T.Vector3(Math.sin(j*.65+i)*.12+(i-1)*.22,.8+j*.12,Math.cos(j*.5)*.08));
    tube(group,pts,.012,steamMat,30);
  }
  group.rotation.set(.15,0,.16);
  return group;
}

export function guitar(segments:number) {
  const group=new T.Group();
  const wood=new T.MeshStandardMaterial({map:woodTexture(),color:'#bc8752',roughness:.36,metalness:.06});
  const edge=new T.MeshStandardMaterial({color:'#542e1d',roughness:.36});
  const shape=new T.Shape();
  shape.moveTo(0,-1.15);shape.bezierCurveTo(-1.05,-1.2,-1.15,-.2,-.63,.03);shape.bezierCurveTo(-.33,.2,-.66,.48,-.5,.79);shape.bezierCurveTo(-.4,1.03,-.1,.99,0,.91);shape.bezierCurveTo(.1,.99,.4,1.03,.5,.79);shape.bezierCurveTo(.66,.48,.33,.2,.63,.03);shape.bezierCurveTo(1.15,-.2,1.05,-1.2,0,-1.15);
  const geometry=new T.ExtrudeGeometry(shape,{depth:.28,bevelEnabled:true,bevelSegments:3,steps:1,bevelSize:.06,bevelThickness:.04,curveSegments:segments/2});
  const body=new T.Mesh(geometry,[wood,edge]);group.add(body);
  const sound=mesh(new T.CircleGeometry(.23,segments),dark,group,0,.22,.331);
  sound.rotation.z=.1;
  for(const r of [.245,.27,.28])mesh(new T.TorusGeometry(r,.009,6,segments),brass,group,0,.22,.335);
  box(group,[.19,1.64,.14],[0,1.5,.17],edge);
  box(group,[.17,1.7,.035],[0,1.45,.32],dark);
  const head=box(group,[.29,.47,.11],[0,2.48,.18],wood);head.rotation.z=-.06;
  box(group,[.4,.12,.07],[0,-.43,.35],edge);
  box(group,[.28,.025,.026],[0,-.42,.397],ivory);
  for(let i=0;i<17;i++) {
    const y=.7+1.5*(1-Math.pow(.92,i));
    box(group,[.17,.008,.014],[0,y,.349],chrome);
  }
  for(let i=0;i<6;i++) {
    rod(group,[-.062+i*.025,-.42,.41],[-.062+i*.025,2.3,.36],.0015,chrome);
    const tuner=mesh(new T.SphereGeometry(.047,8,6),chrome,group,i<3?-.2:.2,2.33+(i%3)*.14,.18);tuner.scale.z=.6;
  }
  for(const y of [1.05,1.35,1.65,1.92])mesh(new T.CircleGeometry(.018,8),ivory,group,0,y,.35);
  group.position.y=-.4;
  group.rotation.set(-.15,-.3,-.35);
  return group;
}

export function novels() {
  const group=new T.Group();
  const cover=new T.MeshStandardMaterial({color:'#3b5149',roughness:.75});
  const paper=new T.MeshStandardMaterial({color:'#e3dbc7',roughness:.9,side:T.DoubleSide});
  const pageTexture=document.createElement('canvas');pageTexture.width=256;pageTexture.height=256;
  const ctx=pageTexture.getContext('2d')!;
  ctx.fillStyle='#e9dfc8';ctx.fillRect(0,0,256,256);ctx.fillStyle='#8b806a';
  for(let col=0;col<13;col++)for(let row=0;row<24;row++){
    if((col*3+row)%17===0)continue;
    ctx.globalAlpha=.28+((row+col)%5)*.07;
    ctx.fillRect(230-col*16,22+row*8,1+(row%3),5);ctx.fillRect(228-col*16,22+row*8,5,1);
  }
  const texture=new T.CanvasTexture(pageTexture);texture.colorSpace=T.SRGBColorSpace;
  const printed=new T.MeshStandardMaterial({map:texture,roughness:.9,side:T.DoubleSide});
  for(const side of [-1,1]) {
    const half=new T.Group();group.add(half);
    box(half,[1.18,.06,1.72],[side*.58,-.17,0],cover);
    box(half,[1.08,.16,1.61],[side*.57,-.075,0],paper);
    const geo=new T.PlaneGeometry(1.12,1.62,24,16);
    const attr=geo.attributes.position;
    for(let i=0;i<attr.count;i++){
      const u=(attr.getX(i)+.56)/1.12;
      attr.setXYZ(i,side*u*1.12,.06+Math.sin(u*Math.PI)*.1,attr.getY(i));
    }
    geo.computeVertexNormals();mesh(geo,printed,half);
    half.rotation.z=side*.19;
    for(let j=0;j<5;j++)rod(half,[side*.05,-.12+j*.027,.808],[side*1.1,-.12+j*.027,.808],.002,new T.MeshStandardMaterial({color:'#b7aa92',roughness:1}));
  }
  const ribbon=box(group,[.045,.01,1.92],[.1,.075,.22],new T.MeshStandardMaterial({color:'#b37a50',side:T.DoubleSide,roughness:1}));ribbon.rotation.z=-.05;
  for(let j=0;j<3;j++){
    const geo=new T.PlaneGeometry(.8,1.3,16,16);const p=geo.attributes.position;
    for(let i=0;i<p.count;i++)p.setZ(i,Math.sin(p.getX(i)*3+j)*.15);
    geo.computeVertexNormals();const page=mesh(geo,printed,group,1.2+j*.22,.48+j*.3,-.2-j*.25);page.rotation.set(-.9+j*.15,-.3+j*.12,-.3+j*.2);page.scale.setScalar(.6+j*.06);
  }
  group.rotation.set(.52,-.4,.18);
  return group;
}

export function motorcycle(segments:number) {
  const group=new T.Group();
  const paint=new T.MeshStandardMaterial({color:'#718076',roughness:.28,metalness:.7});
  const leather=new T.MeshStandardMaterial({color:'#352a22',roughness:.9});
  const engine=new T.MeshStandardMaterial({color:'#454a47',roughness:.42,metalness:.75});
  for(const x of [-1.25,1.25]){
    mesh(new T.TorusGeometry(.55,.115,12,segments),rubber,group,x,-.62,0);
    mesh(new T.TorusGeometry(.49,.035,8,segments),chrome,group,x,-.62,.04);
    const hub=mesh(new T.CylinderGeometry(.13,.13,.32,16),engine,group,x,-.62,0);hub.rotation.x=Math.PI/2;
    mesh(new T.TorusGeometry(.24,.025,6,24),chrome,group,x,-.62,.17);
    for(let i=0;i<12;i++)rod(group,[x,-.62,.06],[x+Math.cos(i*TAU/12)*.48,-.62+Math.sin(i*TAU/12)*.48,.04],.009,chrome);
    const fender=mesh(new T.TorusGeometry(.62,.055,8,24,Math.PI*.7),paint,group,x,-.62,0);fender.rotation.z=Math.PI*.15;fender.scale.z=2;
  }
  for(const z of [-.15,.15]){
    rod(group,[-1.25,-.62,z],[-.5,.3,z],.045,chrome);
    rod(group,[-1.25,-.62,z],[.3,-.4,z],.04,dark);
    rod(group,[-.65,.4,z],[.82,.29,z],.045,dark);
    rod(group,[.82,.29,z],[.3,-.5,z],.045,dark);
    rod(group,[.3,-.5,z],[-.65,.4,z],.04,dark);
    rod(group,[1.25,-.62,z],[.88,.58,z],.055,chrome);
    rod(group,[1.05,-.03,z],[.88,.58,z],.075,dark);
  }
  const tank=mesh(new T.SphereGeometry(.5,segments,16),paint,group,.18,.48,0);tank.scale.set(1.4,.64,.68);tank.rotation.z=-.1;
  const cap=mesh(new T.CylinderGeometry(.085,.085,.025,16),chrome,group,.12,.81,0);cap.rotation.z=.05;
  const seat=mesh(new T.CapsuleGeometry(.16,.73,5,12),leather,group,-.68,.5,0);seat.rotation.z=Math.PI/2;seat.scale.z=1.28;
  for(let i=0;i<7;i++)rod(group,[-.98+i*.1,.662,-.14],[-.98+i*.1,.662,.14],.007,brass);
  const motor=mesh(new T.CylinderGeometry(.32,.3,.54,10),engine,group,-.05,-.15,0);motor.rotation.x=Math.PI/2;
  for(let i=0;i<6;i++)box(group,[.45,.034,.48],[-.04,-.03+i*.05,0],chrome);
  const motorCap=mesh(new T.CylinderGeometry(.22,.22,.03,20),dark,group,-.05,-.15,.29);motorCap.rotation.x=Math.PI/2;
  tube(group,[new T.Vector3(.2,-.05,.25),new T.Vector3(.52,-.36,.3),new T.Vector3(.23,-.6,.34),new T.Vector3(-.94,-.58,.34)],.043,chrome);
  const exhaust=mesh(new T.CylinderGeometry(.085,.07,.8,16),dark,group,-.8,-.52,.36);exhaust.rotation.z=Math.PI/2+.12;
  const headlight=mesh(new T.CylinderGeometry(.18,.18,.22,segments),chrome,group,1.05,.52,0);headlight.rotation.z=Math.PI/2;
  const glass=mesh(new T.CircleGeometry(.158,segments),new T.MeshStandardMaterial({color:'#f5e7b7',emissive:'#bd9855',emissiveIntensity:.35,roughness:.22}),group,1.165,.52,0);glass.rotation.y=Math.PI/2;
  rod(group,[.82,.67,-.32],[.9,.8,.32],.027,chrome);
  rod(group,[.82,.68,.28],[.68,.72,.43],.038,rubber);
  rod(group,[.82,.68,-.28],[.68,.72,-.43],.038,rubber);
  rod(group,[.81,.75,-.25],[.68,1.02,-.36],.015,chrome);
  const mirror=mesh(new T.SphereGeometry(.1,12,8),chrome,group,.68,1.04,-.36);mirror.scale.set(1,.7,.25);
  box(group,[.14,.08,.22],[-1.19,.43,0],new T.MeshStandardMaterial({color:'#a43f29',emissive:'#641b0d',emissiveIntensity:.4}));
  group.rotation.set(.02,-.3,-.08);
  group.position.y=.05;
  return group;
}
