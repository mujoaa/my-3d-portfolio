import * as T from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { coffee, guitar, novels, motorcycle } from './models';

export type Gallery = {
  setScroll(scene:number,progress:number,hero:boolean,anchorY:number):void;
  setEnabled(enabled:boolean):void;
  setReducedMotion(reduced:boolean):void;
  dispose():void;
};

export function createGallery(container:HTMLElement, onLost:()=>void, reducedMotion:boolean):Gallery {
  const compact=()=>innerWidth<=640;
  const lowPower=matchMedia('(pointer: coarse)').matches || innerWidth<800;
  const renderer=new T.WebGLRenderer({alpha:true,antialias:!lowPower,powerPreference:'low-power'});
  renderer.setPixelRatio(Math.min(devicePixelRatio,lowPower?1.25:1.7));
  renderer.outputColorSpace=T.SRGBColorSpace;
  renderer.toneMapping=T.ACESFilmicToneMapping;
  renderer.toneMappingExposure=1.05;
  container.appendChild(renderer.domElement);
  const scene=new T.Scene();
  const camera=new T.PerspectiveCamera(36,innerWidth/innerHeight,.1,60);
  camera.position.set(0,0,10);
  const pmrem=new T.PMREMGenerator(renderer);
  const room=new RoomEnvironment();
  const environment=pmrem.fromScene(room,.04);
  scene.environment=environment.texture;
  scene.environmentIntensity=.55;
  room.dispose();pmrem.dispose();
  scene.add(new T.HemisphereLight('#fff3db','#292d24',1.1));
  const key=new T.DirectionalLight('#ffe5ba',2.2);key.position.set(-3,5,6);scene.add(key);
  const rim=new T.DirectionalLight('#b9c5b8',1.4);rim.position.set(4,2,-4);scene.add(rim);
  const root=new T.Group();scene.add(root);
  const factories=[coffee,guitar,novels,motorcycle];
  const models=factories.map(factory=>{
    const model=factory(lowPower?32:56);
    const pivot=new T.Group();pivot.add(model);root.add(pivot);pivot.visible=false;return pivot;
  });
  // A fine orbit anchors the collection without requiring textures or post-processing.
  const orbit=new T.Group();root.add(orbit);
  const ring= new T.Mesh(new T.TorusGeometry(2.3,.003,3,lowPower?96:160),new T.MeshBasicMaterial({color:'#c9a67f',transparent:true,opacity:.22}));
  ring.rotation.set(.68,-.25,-.3);orbit.add(ring);
  for(let i=0;i<4;i++){
    const dot=new T.Mesh(new T.SphereGeometry(.025,6,4),new T.MeshBasicMaterial({color:'#c9a67f'}));
    dot.position.set(Math.cos(i*Math.PI/2)*2.3,Math.sin(i*Math.PI/2)*2.3,0);ring.add(dot);
  }
  let targetScene=0,local=.5,hero=true,active=true,visible=!document.hidden;
  let raf=0,last=0,elapsed=0,blend=1,current=0,previous=0;
  let reduced=reducedMotion;
  let anchorY=280;
  let previousTime=0;
  const pointer=new T.Vector2();
  const smoothPointer=new T.Vector2();
  const sizes=[1.18,.95,1.23,1.06];

  function resize(){
    const width=document.documentElement.clientWidth,height=innerHeight;
    renderer.setSize(width,height);camera.aspect=width/height;
    // Desktop reserves the left side for copy. Mobile places models above the copy.
    camera.fov=compact()?42:36;camera.updateProjectionMatrix();
    draw(performance.now(),true);
  }
  function draw(now:number,force=false){
    if(!active || !visible)return;
    const frameInterval=lowPower?1000/30:1000/60;
    if(!force && now-last<frameInterval-1){schedule();return;}
    const dt=Math.min((now-previousTime)/1000 || .016,.06);previousTime=now;last=now;
    if(!reduced)elapsed+=dt;
    blend=Math.min(1,blend+dt*2.3);
    smoothPointer.lerp(pointer,Math.min(1,dt*3));
    const mobile=compact();
    const viewHeight=2*Math.tan(T.MathUtils.degToRad(camera.fov/2))*10;
    const viewWidth=viewHeight*camera.aspect;
    root.position.x=mobile?0:viewWidth*.225;
    root.position.y=mobile?viewHeight*(.5-anchorY/innerHeight):.05;
    const baseScale=mobile?Math.min(viewWidth/5.4,1):Math.min(viewWidth/11,1.25);
    root.scale.setScalar(baseScale);
    const drift=reduced?0:Math.sin(elapsed*.55)*.045;
    models.forEach((model,i)=>{
      model.visible=i===current || (i===previous && blend<1);
      if(!model.visible)return;
      const incoming=i===current;
      const amount=incoming?blend:1-blend;
      const ease=T.MathUtils.smoothstep(amount,0,1);
      model.scale.setScalar(sizes[i]*(.86+.14*ease));
      model.position.x=(incoming?1:-1)*(1-ease)*4;
      model.position.y=drift+(hero?-.1:0);
      model.position.z=-1+(ease);
      model.rotation.y=(reduced?0:(local-.5)*.55)+smoothPointer.x*.08+(1-ease)*.4;
      model.rotation.x=(i===0?.3:0)+smoothPointer.y*.04;
      model.rotation.z=reduced?0:Math.sin(elapsed*.35)*.025;
    });
    orbit.rotation.y=reduced?0:Math.sin(elapsed*.1)*.08;
    orbit.visible=targetScene<4;
    root.visible=targetScene<4;
    renderer.render(scene,camera);
    if(!reduced || blend<1)schedule();
  }
  function schedule(){cancelAnimationFrame(raf);raf=requestAnimationFrame(draw);}
  function onPointer(event:PointerEvent){if(!lowPower&&!reduced)pointer.set((event.clientX/innerWidth-.5)*2,(event.clientY/innerHeight-.5)*2);}
  function visibility(){visible=!document.hidden;if(visible){previousTime=performance.now();schedule();}else cancelAnimationFrame(raf);}
  function lost(event:Event){event.preventDefault();active=false;cancelAnimationFrame(raf);onLost();}
  function restored(){renderer.dispose();onLost();}
  renderer.domElement.addEventListener('webglcontextlost',lost);
  renderer.domElement.addEventListener('webglcontextrestored',restored);
  addEventListener('resize',resize,{passive:true});
  addEventListener('pointermove',onPointer,{passive:true});
  document.addEventListener('visibilitychange',visibility);
  resize();schedule();
  return {
    setScroll(index,progress,isHero,anchor){
      targetScene=index;local=progress;hero=isHero;anchorY=anchor;
      if(index<4&&index!==current){previous=current;current=index;blend=reduced?1:0;}
      if(active&&visible)schedule();
    },
    setEnabled(value){active=value;if(value){previousTime=performance.now();schedule();}else cancelAnimationFrame(raf);},
    setReducedMotion(value){reduced=value;pointer.set(0,0);schedule();},
    dispose(){
      cancelAnimationFrame(raf);removeEventListener('resize',resize);removeEventListener('pointermove',onPointer);document.removeEventListener('visibilitychange',visibility);
      scene.traverse(object=>{if(object instanceof T.Mesh){object.geometry.dispose();const materials=Array.isArray(object.material)?object.material:[object.material];materials.forEach(material=>{if(material instanceof T.MeshStandardMaterial)material.map?.dispose();material.dispose();});}});
      environment.dispose();renderer.dispose();renderer.domElement.remove();
    }
  };
}
