// Host-authoritative WebRTC rooms. No game state is accepted from a guest.
let localId=0,roster=[null,null,null,null],peer=null,hostConn=null,isHost=false,room='',epoch=0,seq=0,netTick=0,connections=new Map(),inputs=new Map(),session=0,connectionTimer=null,lastSnapshot=0;
const names=['Red','Violet','Mint','Amber'],PREFIX='skyball-sprint-v1-';
const statusLine=text=>$('netStatus').textContent=text;
const localInput=()=>$('lobby').classList.contains('hidden')?({x:clamp((keys.ArrowRight||keys.d?1:0)-(keys.ArrowLeft||keys.a?1:0)+joystick.x,-1,1),y:clamp((keys.ArrowDown||keys.s?1:0)-(keys.ArrowUp||keys.w?1:0)+joystick.y,-1,1)}):({x:0,y:0});
function send(c,data){if(c?.open&&(!c.dataChannel||c.dataChannel.bufferedAmount<65536))c.send(data)}
function broadcast(data){for(const c of connections.values())send(c,data)}
let matchBucket=0,matchAttempt=0,matchTimer=null;
function party(){ $('lobby').classList.add('hidden');$('rooms').textContent=peer&&roster.filter(p=>p===true).length>1?'Online · '+roster.filter(p=>p===true).length+' players':'Playing · matching…'; }
function clearControls(){keys={};joystick={x:0,y:0};dragControl=null;inputs.clear()}
function localRace(){isHost=true;localId=0;roster=[true,'bot','bot','bot'];startMatch()}
function leave(){session++;clearTimeout(matchTimer);clearTimeout(connectionTimer);if(peer)peer.destroy();peer=null;hostConn=null;connections.clear();clearControls();localRace();setTimeout(()=>autoMatch(0),500)}
function autoMatch(bucket=0){
 const generation=++session;matchBucket=bucket;clearTimeout(matchTimer);if(peer)peer.destroy();connections.clear();hostConn=null;
 // A deterministic public Peer ID is the rendezvous point. ID ownership elects the host.
 peer=new Peer('skyball-public-v2-'+bucket,{debug:0});
 const fallback=()=>{if(generation!==session)return;session++;if(peer)peer.destroy();peer=null;hostConn=null;localRace();$('rooms').textContent='Computer race · reconnect';};
 matchTimer=setTimeout(fallback,12000);
 peer.on('open',()=>{if(generation!==session)return;clearTimeout(matchTimer);isHost=true;room=String(bucket);party()});
 peer.on('error',e=>{if(generation!==session)return;if(e.type==='unavailable-id'){peer.destroy();peer=new Peer(undefined,{debug:0});peer.on('open',()=>{if(generation!==session)return;hostConn=peer.connect('skyball-public-v2-'+bucket,{reliable:true,serialization:'json'});hostConn.on('data',d=>{if(generation!==session)return;if(d?.type==='reject'){autoMatch(bucket+1);return}receiveHost(d)});hostConn.on('close',()=>{if(generation===session)leave()});hostConn.on('error',fallback)});peer.on('error',fallback)}else fallback()});
 peer.on('disconnected',()=>{if(generation===session&&peer&&!peer.destroyed)peer.reconnect()});
 peer.on('connection',c=>{c.on('open',()=>{if(generation!==session){c.close();return}const slot=roster.findIndex((p,i)=>i>0&&p!==true);if(slot<0||state!=='playing'){send(c,{type:'reject'});setTimeout(()=>c.close(),300);return}roster[slot]=true;players[slot].botReturning=false;connections.set(slot,c);c.lastInputAt=performance.now();send(c,{type:'welcome',id:slot,room,roster});send(c,snapshot());broadcast({type:'roster',roster});party();let lastSeq=-1;c.on('data',d=>{if(generation!==session||connections.get(slot)!==c)return;if(d?.type==='input'&&d.epoch===epoch&&Number.isSafeInteger(d.seq)&&d.seq>lastSeq&&Number.isFinite(d.x)&&Number.isFinite(d.y)){lastSeq=d.seq;c.lastInputAt=performance.now();inputs.set(slot,{x:clamp(d.x,-1,1),y:clamp(d.y,-1,1),at:performance.now()})}if(d?.type==='retry'&&state==='finished')startMatch()});c.on('close',()=>{if(generation!==session||connections.get(slot)!==c)return;connections.delete(slot);inputs.delete(slot);roster[slot]='bot';broadcast({type:'roster',roster});party()});c.on('error',()=>c.close())})});
}
function snapshot(){return{type:'snapshot',epoch,round,elapsed,state,players,roster,winner:players.winner??null}}
function receiveHost(d){if(!d||typeof d!=='object')return;if(d.type==='welcome'){clearTimeout(matchTimer);isHost=false;epoch=-1;localId=d.id;roster=d.roster;party();statusLine('Connected. Waiting for the host to start.');return}if(d.type==='roster'){roster=d.roster;party();return}if(d.type!=='snapshot'||!Array.isArray(d.players)||d.players.length!==4)return;lastSnapshot=performance.now();const fresh=epoch!==d.epoch,previous=state;const old=players;epoch=d.epoch;round=d.round;elapsed=d.elapsed;players=d.players;players.winner=d.winner;roster=d.roster;state=d.state;if(fresh){clearControls();rebuildCourse();stopSounds();$('lobby').classList.add('hidden');$('overlay').classList.add('hidden')}if(old[localId]&&state==='playing'){movementSound(players[localId],Math.hypot(players[localId].x-old[localId].x,players[localId].y-old[localId].y));if(players[localId].energy<old[localId].energy)playEffect('build',.65)}if(state==='finished'&&previous!=='finished'){stopSounds();showResult()}party()}
function startMatch(){if(!isHost)return;epoch++;round=1;roster=roster.map(p=>p===true?true:'bot');reset();players.forEach(p=>p.speed=4.6);for(const c of connections.values())c.lastInputAt=performance.now();clearControls();state='playing';stopSounds();$('lobby').classList.add('hidden');$('overlay').classList.add('hidden');broadcast(snapshot());party()}
// Computers steer through the same movement and resource rules as people.
function computerInput(p){
 let wx=0,wy=0;
 if(p.mode==='stairs'){
  const owner=laneOwner(p);
  if(p.energy<=.001&&owner.built<stepsNeeded())p.botReturning=true;
  wy=p.botReturning?1:-1;
 }else{
  p.botReturning=false;
  const needed=Math.min(36,Math.max(0,stepsNeeded()-players[p.id].built)*9);
  if(p.energy>=needed)p.botGoal={x:p.lane,y:.1};
  else if(!p.botGoal||p.botGoal.y<1||distance(p,p.botGoal)<.2)p.botGoal={x:p.lane,y:p.y>4?1.5:6.5};
  const d=distance(p,p.botGoal);if(d>.001){wx=(p.botGoal.x-p.x)/d;wy=(p.botGoal.y-p.y)/d}
 }
 return{x:wx*Math.cos(cameraYaw)-wy*Math.sin(cameraYaw),y:wx*Math.sin(cameraYaw)+wy*Math.cos(cameraYaw)};
}
// Every occupied slot uses the same movement and shared-lane placement rules.
updatePlayer=function(p,dt){const bot=roster[p.id]==='bot',input=bot?computerInput(p):p.id===localId?localInput():inputs.get(p.id);let dx=input?.x||0,dy=input?.y||0;if(!bot&&p.id!==localId&&(!input||performance.now()-input.at>500))dx=dy=0;const length=Math.hypot(dx,dy);dx/=Math.max(1,length);dy/=Math.max(1,length);const wx=dx*Math.cos(cameraYaw)+dy*Math.sin(cameraYaw),wy=-dx*Math.sin(cameraYaw)+dy*Math.cos(cameraYaw),ox=p.x,oy=p.y,was=p.mode;
if(p.mode==='stairs'){const owner=laneOwner(p),frontier=-(owner.built*.65+.25);if(wy<-.08&&p.y<=frontier+.025){if(owner.built>=stepsNeeded()){p.finished=true;finish(p.id);return}if(p.energy>.001){p.energy=Math.max(0,p.energy-9);owner.built++;if(p.id===localId)playEffect('build',.65)}}if(Math.abs(wy)>.08)p.y=clamp(p.y+Math.sign(wy)*Math.min(1,length)*p.speed*dt,-(owner.built*.65+.25),1.3);p.x=owner.lane;if(p.y>=.55&&p.y>oy)p.mode='gather';
}else if(length>.08){p.x=clamp(p.x+wx*p.speed*dt,-5.7,5.7);p.y=clamp(p.y+wy*p.speed*dt,.1,6.9)}
const traveled=Math.hypot(p.x-ox,p.y-oy);movementSound(p,traveled);if(traveled>.0001){p.dirX=(p.x-ox)/traveled;p.dirY=(p.y-oy)/traveled;p.roll+=traveled*1.5;p.phase+=dt*12}if(was==='gather'&&p.mode==='gather'){p.floorDistance+=traveled;const growth=Math.max(0,p.floorDistance-1.4)-Math.max(0,p.floorDistance-traveled-1.4);p.energy=Math.min(36,p.energy+growth*3.5);const owner=players.reduce((a,b)=>Math.abs(p.x-a.lane)<Math.abs(p.x-b.lane)?a:b);if(p.y<.55&&Math.abs(p.x-owner.lane)<.8&&(p.energy>.001||owner.built>0)){p.activeLane=owner.id;p.mode='stairs'}}};
finish=function(id){if(!isHost||state!=='playing')return;players.winner=id;state='finished';stopSounds();broadcast(snapshot());showResult()};
showResult=function(){const won=players.winner===localId;$('eyebrow').textContent='RACE FINISHED';$('cardTitle').textContent=won?'You win!':`${names[players.winner]} wins!`;$('description').textContent=`${elapsed.toFixed(1)} seconds`;$('steps').classList.add('hidden');$('rankList').textContent='';$('restart').classList.add('hidden');$('record').textContent='';$('start').textContent='Race again';$('start').disabled=false;$('overlay').classList.remove('hidden')};
togglePause=function(){clearControls()};
loop=function(ms){const dt=Math.min((ms-last)/1000,.04);last=ms;if(isHost&&state==='playing'){for(const [slot,c] of connections){if(performance.now()-c.lastInputAt>10000){connections.delete(slot);inputs.delete(slot);roster[slot]='bot';c.close();broadcast({type:'roster',roster});party()}}elapsed+=dt;for(const p of players){if(state!=='playing')break;if(roster[p.id])updatePlayer(p,dt)}}if(ms-netTick>50){netTick=ms;if(isHost&&(state==='playing'||state==='finished'))broadcast(snapshot());else if(hostConn&&state==='playing'){send(hostConn,{type:'input',epoch,seq:seq++,...localInput()});if(performance.now()-lastSnapshot>10000)leave('Connection stalled. Please rejoin a new room.')}}render(ms/1000);requestAnimationFrame(loop)};
$('start').onclick=()=>{if(isHost)startMatch();else send(hostConn,{type:'retry'})};
$('rooms').onclick=()=>{if(!peer)autoMatch(0)};
init3D();localRace();requestAnimationFrame(loop);autoMatch(0);
