// Behavior checks using a simulated DOM. Does not validate browser/WebGL rendering.
const {readFileSync} = require('node:fs');
const {join} = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const html = readFileSync(join(__dirname, '..', 'index.html'), 'utf8');
// A pixel-backed canvas substitute exercises actual rolling/compositing logic.
// PNG encoding and browser rendering still require browser verification.
class PixelCanvas {
 _width=0;_height=0;data=new Uint8ClampedArray();
 set width(value){this._width=value;this.data=new Uint8ClampedArray(value*this._height*4)}
 get width(){return this._width}
 set height(value){this._height=value;this.data=new Uint8ClampedArray(value*this._width*4)}
 get height(){return this._height}
 getContext(){
  const canvas=this;
  return {
   fillStyle:'#000000',
   fillRect(sx,sy,width,height){
    const rgb=this.fillStyle==='#ff00ff'?[255,0,255]:this.fillStyle==='#ffffff'?[255,255,255]:[0,0,0];
    for(let y=sy;y<sy+height;y++)for(let x=sx;x<sx+width;x++)canvas.data.set([...rgb,255],(y*canvas.width+x)*4);
   },
   clearRect(sx,sy,width,height){
    for(let y=sy;y<sy+height;y++)for(let x=sx;x<sx+width;x++)canvas.data.fill(0,(y*canvas.width+x)*4,(y*canvas.width+x+1)*4);
   },
   drawImage(image,...args){
    const iw=image.naturalWidth||image.width,ih=image.naturalHeight||image.height;
    let sx=0,sy=0,sw=iw,sh=ih,dx=0,dy=0,dw=iw,dh=ih;
    if(args.length===2)[dx,dy]=args;
    else if(args.length===4)[dx,dy,dw,dh]=args;
    else [sx,sy,sw,sh,dx,dy,dw,dh]=args;
    for(let y=0;y<dh;y++)for(let x=0;x<dw;x++){
     const source=((sy+Math.floor(y*sh/dh))*iw+sx+Math.floor(x*sw/dw))*4;
     const target=((dy+y)*canvas.width+dx+x)*4;
     canvas.data.set(image.data.subarray(source,source+4),target);
    }
   },
   getImageData(sx,sy,width,height){
    const data=new Uint8ClampedArray(width*height*4);
    for(let y=0;y<height;y++)for(let x=0;x<width;x++){
     const source=((sy+y)*canvas.width+sx+x)*4;data.set(canvas.data.subarray(source,source+4),(y*width+x)*4);
    }
    return {data,width,height};
   },
   putImageData(image,dx,dy){
    for(let y=0;y<image.height;y++)for(let x=0;x<image.width;x++){
     const source=(y*image.width+x)*4;canvas.data.set(image.data.subarray(source,source+4),((dy+y)*canvas.width+dx+x)*4);
    }
   }
  };
 }
 toBlob(callback){queueMicrotask(()=>callback(new Blob(['simulated PNG'])))}
}
const elements = {}, events = {};
const gl = new Proxy({
 NO_ERROR: 0, getError: () => 0, getShaderPrecisionFormat: () => ({precision:23}),
 getShaderParameter: () => true, getProgramParameter: () => true,
 getParameter: () => 4096, isContextLost: () => false
}, {get:(object,key) => key in object ? object[key] : key === key.toUpperCase() ? 1 : () => ({})});
for (const [,id] of html.matchAll(/\bid="([^"]+)"/g)) {
 elements[id] = {
  hidden: ['view','loading','promptPanel','file'].includes(id), value:'', textContent:'',
  clientWidth:1200, clientHeight:800, handlers:{}, attributes:{}, disabled:false, isConnected:true, open:false,
  classList:{add(){},remove(){}},
  addEventListener(type,callback){this.handlers[type]=callback},
  setAttribute(name,value){this.attributes[name]=value},
  focus(){context.document.activeElement=this}, select(){this.selected=true}, click(){this.clicked=true},
  showModal(){this.open=true;elements.closeGuide.focus()},close(){this.open=false},
  getBoundingClientRect(){return {left:10,top:10,right:600,bottom:700}},
  setPointerCapture(){}, getContext:()=>gl
 };
}
elements.bearing.value='0';elements.meters.value='5';elements.seamPercent.value='12';
elements.beforeRepair=new PixelCanvas();elements.afterRepair=new PixelCanvas();
let made=0,freed=0,copied='',downloads=[];
class Image {
 naturalWidth=2048; naturalHeight=1024;
 set src(value){
  if(value.includes('repair-small')){
   this.naturalWidth=100;this.naturalHeight=50;this.data=new Uint8ClampedArray(100*50*4).fill(200);
   for(let i=3;i<this.data.length;i+=4)this.data[i]=255;
  }
  queueMicrotask(()=>value.includes('invalid')?this.onerror():this.onload());
 }
}
const storage=new Map();
const localStorage={getItem:key=>storage.get(key)||null,setItem:(key,value)=>storage.set(key,value)};
const context = {
 document:{getElementById:id=>elements[id],body:{appendChild(){}},createElement:tag=>tag==='canvas'?new PixelCanvas():{click(){downloads.push(this.download)},remove(){}}},
 window:{devicePixelRatio:1,localStorage,addEventListener:(type,callback)=>events[type]=callback},
 navigator:{clipboard:{writeText:async text=>{copied=text}}},
 URL:{createObjectURL:file=>(made++,'blob:'+file.name),revokeObjectURL:()=>freed++},
 Image, console, Blob, setTimeout:callback=>callback()
};
vm.createContext(context);
vm.runInContext(html.match(/<script>([\s\S]*?)<\/script>/)[1],context);
const run = source => vm.runInContext(source,context);
const load = name => run(`openImage(${JSON.stringify({name})})`);
const near = (a,b) => assert.ok(Math.abs(a-b)<1e-8, `${a} != ${b}`);
async function main(){
 assert.equal(elements.usageGuide.open,true); // First visit opens automatically.
 elements.guideDone.handlers.click();assert.equal(elements.usageGuide.open,false);
 assert.equal(storage.get('orbit.usageGuideSeen.v1'),'1');
 assert.equal(context.document.activeElement,elements.choose);
 run('guideSeen=false;showFirstVisitHelp()');assert.equal(elements.usageGuide.open,false);
 elements.loaderHelp.handlers.click();assert.equal(elements.usageGuide.open,true);
 elements.usageGuide.handlers.cancel({preventDefault(){}});assert.equal(elements.usageGuide.open,false);
 assert.equal(context.document.activeElement,elements.loaderHelp);
 // Blocked storage should not break help or the app.
 context.window.localStorage={getItem(){throw Error('blocked')},setItem(){throw Error('blocked')}};
 run('guideSeen=false;showFirstVisitHelp()');assert.equal(elements.usageGuide.open,true);
 elements.closeGuide.handlers.click();assert.equal(elements.usageGuide.open,false);
 context.window.localStorage=localStorage;
 // Check all cardinal directions and a diagonal against independent expectations.
 for(const [bearing,right,forward] of [[0,0,5],[-90,-5,0],[90,5,0],[180,0,-5],[-180,0,-5],[45,Math.sqrt(12.5),Math.sqrt(12.5)]]){
  const delta=run(`movement(${bearing},5)`);near(delta.right,right);near(delta.forward,forward);
 }
 assert.equal(run('normalizeBearing(450)'),90);
 assert.equal(run('normalizeBearing(-450)'),-90);
 await load('current.png');assert.equal(elements.view.hidden,false);
 const loadedPanorama=run('currentPanorama');run('yaw=.4;pitch=.1;draw()');
 elements.viewerHelp.handlers.click();assert.equal(elements.usageGuide.open,true);
 events.keydown({key:'ArrowRight',target:elements.canvas,preventDefault(){}});assert.equal(run('yaw'),.4);
 events.drop({preventDefault(){},dataTransfer:{files:[{name:'other.png'}]}});assert.equal(run('currentPanorama'),loadedPanorama);
 events.keydown({key:'Escape',preventDefault(){}});
 assert.equal(elements.usageGuide.open,false);assert.equal(elements.view.hidden,false);
 assert.equal(run('currentPanorama'),loadedPanorama);assert.equal(run('pitch'),.1);
 assert.equal(context.document.activeElement,elements.viewerHelp);
 elements.viewerHelp.handlers.click();
 elements.usageGuide.handlers.click({target:elements.usageGuide,clientX:0,clientY:0});assert.equal(elements.usageGuide.open,false);
 run('home()');
 elements.next.handlers.click();assert.equal(elements.promptPanel.hidden,false);
 assert.equal(elements.next.attributes['aria-expanded'],'true');
 assert.match(elements.prompt.value,/walks 5 meters straight forward/);
 // Turning fills the direction and refreshes an open prompt immediately.
 run('yaw=Math.PI/2;draw()');assert.equal(elements.bearing.value,'90');
 assert.match(elements.prompt.value,/walks 5 meters directly right/);
 run('yaw=-Math.PI/2;draw()');assert.equal(elements.bearing.value,'-90');
 assert.match(elements.prompt.value,/walks 5 meters directly left/);
 // Zooming preserves a manual choice; the next rotation resumes autofill.
 elements.bearing.value='45';elements.bearing.handlers.input();run('zoom(-5)');
 assert.equal(elements.bearing.value,'45');
 run('yaw=3*Math.PI;draw()');assert.equal(elements.bearing.value,'-180');
 elements.closePanel.handlers.click();run('yaw=Math.PI/4;draw()');
 elements.next.handlers.click();assert.equal(elements.bearing.value,'45');
 assert.match(elements.prompt.value,/signed bearing 45°/);
 run('home()');
 elements.leftBearing.handlers.click();assert.equal(elements.bearing.value,'-90');
 assert.match(elements.prompt.value,/ΔX=-5 m, ΔZ=0 m/);
 elements.rightBearing.handlers.click();assert.match(elements.prompt.value,/ΔX=5 m, ΔZ=0 m/);
 elements.backBearing.handlers.click();assert.match(elements.prompt.value,/ΔX=0 m, ΔZ=-5 m/);
 run('yaw=450*Math.PI/180');elements.useHeading.handlers.click();assert.equal(elements.bearing.value,'90');
 elements.meters.value='2.5';elements.sceneNotes.value='Keep the terrace railing.';elements.meters.handlers.input();
 assert.match(elements.prompt.value,/walks 2.5 meters directly right/);
 assert.match(elements.prompt.value,/Keep the terrace railing\./);
 assert.match(elements.prompt.value,/u=0.25 is −90° left, u=0.75 is \+90° right/);
 assert.match(elements.prompt.value,/do not rotate the output/);
 assert.match(elements.prompt.value,/parallax/);
 assert.match(elements.prompt.value,/exact 2:1 aspect ratio/);
 assert.match(elements.prompt.value,/wrap seamlessly/);
 assert.match(elements.prompt.value,/complete zenith.*nadir/);
 await elements.copyPrompt.handlers.click();assert.equal(copied,elements.prompt.value);
 context.navigator.clipboard=undefined;await elements.copyPrompt.handlers.click();assert.equal(elements.prompt.selected,true);
 for(const [bearing,meters] of [['','5'],['Infinity','5'],['181','5'],['0','-5'],['0',''],['0','0'],['0','1001']]){
  elements.bearing.value=bearing;elements.meters.value=meters;elements.meters.handlers.input();
  assert.equal(elements.copyPrompt.disabled,true);assert.equal(elements.prompt.value,'');
 }
 elements.bearing.value='-180';elements.meters.value='0.1';elements.meters.handlers.input();assert.equal(elements.copyPrompt.disabled,false);
 elements.loadNext.handlers.click();assert.equal(elements.file.clicked,true);
 events.keydown({key:'Escape',preventDefault(){}});assert.equal(elements.view.hidden,true);assert.equal(elements.loader.hidden,false);assert.equal(elements.promptPanel.hidden,true);
 await load('next.png');elements.next.handlers.click();assert.equal(elements.bearing.value,'0');assert.equal(elements.sceneNotes.value,'');
 // Exact roll/inverse round trip, for both even and odd image widths.
 for(const width of [8,9]){
  const fixture=new PixelCanvas();fixture.width=width;fixture.height=2;
  for(let i=0;i<fixture.data.length;i++)fixture.data[i]=i;
  context.fixture=fixture;
  const result=run(`rollPanorama(rollPanorama(fixture,${Math.floor(width/2)}),-${Math.floor(width/2)})`);
  assert.deepEqual(result.data,fixture.data);
 }
 const original=new PixelCanvas();original.width=100;original.height=50;
 for(let y=0;y<50;y++)for(let x=0;x<100;x++)original.data.set([x,y,10,255],(y*100+x)*4);
 context.original=original;run("displayPanorama(original,'sample.png');resetRepair();yaw=.75;draw()");
 assert.equal(elements.prepareRepair.disabled,false);
 await elements.prepareRepair.handlers.click();
 assert.equal(downloads.at(-1),'sample-seam-reference.png');
 assert.match(elements.repairPrompt.value,/x=50, in the CENTER/);
 assert.match(elements.repairPrompt.value,/x=44 to x=56/);
 assert.match(elements.repairPrompt.value,/exactly 100 × 50 pixels/);
 assert.match(elements.repairPrompt.value,/Do not undo the half-width horizontal roll/);
 assert.equal(elements.copyRepair.disabled,false);assert.equal(elements.importRepair.disabled,false);
 const shifted=run('repairSession.shifted');
 assert.deepEqual([...shifted.data.slice(0,4)],[50,0,10,255]);
 assert.deepEqual([...shifted.data.slice(50*4,51*4)],[0,0,10,255]);
 const gapped=run('makeRepairReference(repairSession.shifted,repairSession.band)');
 assert.deepEqual([...gapped.data.slice(50*4,51*4)],[255,0,255,255]);
 assert.deepEqual([...gapped.data.slice(44*4,45*4)],[94,0,10,255]);
 assert.match(elements.repairPrompt.value,/REPLACE THE ENTIRE SOLID MAGENTA STRIP/);
 assert.match(elements.repairPrompt.value,/Do not disguise the join with blur/);
 const mask=run('makeRepairMask(repairSession.shifted,repairSession.band)');
 assert.equal(mask.data[50*4+3],0);assert.equal(mask.data[44*4+3],255);
 await elements.downloadMask.handlers.click();assert.equal(downloads.at(-1),'sample-seam-mask.png');
 assert.equal(run('repairStats(repairSession,repairSession.shifted).unchanged'),true);
 assert.ok(run('repairStats(repairSession,makeRepairReference(repairSession.shifted,repairSession.band)).placeholderFraction')>.25);
 const referencePrompt=elements.repairPrompt.value;
 elements.seamPercent.value='20';elements.seamPercent.handlers.input();
 assert.equal(elements.repairPrompt.value,referencePrompt); // Existing reference retains its matching band.
 await run("importRepair({name:'wrong-size.png'})");
 assert.match(elements.repairFeedback.textContent,/exactly 100 × 50/);
 assert.equal(run('currentPanorama'),original);assert.equal(elements.importRepair.disabled,false);
 for(const [fixture,expected] of [[shifted,/repair band is unchanged/],[gapped,/magenta placeholder remains/]]){
  context.Image=class {
   naturalWidth=100;naturalHeight=50;data=fixture.data.slice();
   set src(value){queueMicrotask(()=>this.onload())}
  };
  await run("importRepair({name:'unchanged-candidate.png'})");
  assert.match(elements.repairFeedback.textContent,expected);
  assert.equal(run('currentPanorama'),original);assert.equal(elements.repairCandidate.hidden,true);
 }
 context.Image=Image;
 await run("importRepair({name:'repair-small.png'})");
 assert.equal(run('currentPanorama'),original);assert.equal(elements.repairCandidate.hidden,false);
 assert.equal(elements.applyRepair.disabled,false);
 const candidate=run('pendingRepair');elements.viewerHelp.handlers.click();
 events.keydown({key:'Escape',preventDefault(){}});
 assert.equal(run('pendingRepair'),candidate);assert.equal(run('currentPanorama'),original);
 assert.equal(elements.repairCandidate.hidden,false);
 assert.match(elements.repairDifference.textContent,/Pixel changes do not prove/);
 assert.equal(elements.beforeRepair.width,36);assert.equal(elements.afterRepair.width,36);
 elements.discardRepair.handlers.click();assert.equal(run('currentPanorama'),original);
 assert.equal(elements.repairCandidate.hidden,true);
 await run("importRepair({name:'repair-small.png'})");
 elements.applyRepair.handlers.click();
 const fixed=run('currentPanorama');
 assert.equal(run('yaw'),.75);assert.equal(elements.saveRepaired.disabled,false);
 assert.equal(elements.importRepair.disabled,true);
 for(let y=0;y<50;y++)for(let x=6;x<=93;x++){
  const at=(y*100+x)*4;assert.deepEqual(fixed.data.slice(at,at+4),original.data.slice(at,at+4));
 }
 assert.deepEqual([...fixed.data.slice(0,4)],[200,200,200,255]);
 assert.deepEqual([...fixed.data.slice(99*4,100*4)],[200,200,200,255]);
 // Feather boundary stays original; a transition pixel receives a partial edit.
 assert.deepEqual([...fixed.data.slice(94*4,95*4)],[94,0,10,255]);
 assert.ok(fixed.data[95*4]>95&&fixed.data[95*4]<200);
 await elements.saveRepaired.handlers.click();assert.equal(downloads.at(-1),'sample-seam-fixed.png');
 await elements.prepareRepair.handlers.click();
 const repairPending=run("importRepair({name:'repair-small.png'})");
 events.keydown({key:'Escape',preventDefault(){}});await repairPending;
 assert.equal(run('currentPanorama'),null);assert.equal(run('repairSession'),null);
 assert.equal(elements.saveRepaired.disabled,true);
 await load('invalid.png');assert.match(elements.message.textContent,/Could not read/);
 const pending=load('cancelled.png');events.keydown({key:'Escape',preventDefault(){}});await pending;
 assert.equal(elements.view.hidden,true);assert.equal(made,freed);
 console.log('PASS: first-visit guide/storage fallback, help controls/focus/Escape/state preservation, direction/autofill, repair reference/mask, candidate validation/application, band compositing, save and cancellation.');
}
main().catch(error=>{console.error(error);process.exitCode=1});
