/* ===== Helpers ===== */
const $  = (s, p=document)=>p.querySelector(s);
const $$ = (s, p=document)=>[...p.querySelectorAll(s)];
const rand = (min,max)=>Math.floor(Math.random()*(max-min+1))+min;
const pick = arr=>arr[rand(0,arr.length-1)];
const fmt = n => (+n).toLocaleString('th-TH',{maximumFractionDigits:2});
function showToast(text="ดำเนินการแล้ว"){ const t=$('#toast'); if(!t) return; $('#toastText').textContent=text; t.classList.add('show'); setTimeout(()=>t.classList.remove('show'),1400); }
const today = ()=> new Date().toISOString().slice(0,10);

/* ===== Canvas fitting (ทำกราฟ responsive จริง) ===== */
function fitCanvas(canvas){
  if(!canvas) return;
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  canvas.width  = Math.max(1, Math.round(rect.width  * dpr));
  canvas.height = Math.max(1, Math.round(rect.height * dpr));
  const ctx = canvas.getContext('2d');
  ctx.setTransform(1,0,0,1,0,0);
}

/* ===== Mini chart engine (legend มุมขวา + กันทับ + x-label เอียงอัตโนมัติ) ===== */
function drawBarChart(canvas, {labels, series, yFmt=(v)=>v.toString()}){
  if(!canvas) return;
  fitCanvas(canvas);                          /* สำคัญ: ทำให้ไม่ล้นการ์ด */
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  ctx.clearRect(0,0,W,H);

  const pad = {l:56, r:16, t:42, b:44};
  const groups = labels.length;
  const colors = ['#7bdcb5','#9ad0f5','#ffd166','#b39ddb','#ff9aa2'];
  const maxVal = Math.max(1, ...series.flatMap(s=>s.data));
  const toY = v => H - pad.b - ((v/maxVal)*(H-pad.t-pad.b));

  // grid + y labels
  ctx.strokeStyle='#e8eef5'; ctx.lineWidth=1;
  const lines=5;
  for(let i=0;i<=lines;i++){
    const y=pad.t+i*(H-pad.t-pad.b)/lines;
    ctx.beginPath(); ctx.moveTo(pad.l,y); ctx.lineTo(W-pad.r,y); ctx.stroke();
    const val=maxVal - i*(maxVal/lines);
    ctx.fillStyle='#65748a'; ctx.font='12px ui-sans-serif';
    ctx.textAlign='right'; ctx.textBaseline='middle';
    ctx.fillText(yFmt(val), pad.l-8, y);
  }

  // bars + ตรวจความแคบของ label
  const groupW=(W-pad.l-pad.r)/groups, barGap=6;
  const barW=(groupW-barGap*(series.length-1))/Math.max(1,series.length);
  let needTilt=false;
  labels.forEach((lb,gi)=>{
    series.forEach((s,si)=>{
      const x=pad.l+gi*groupW+si*(barW+barGap);
      const y=toY(s.data[gi]); const h=H-pad.b-y;
      ctx.fillStyle=s.color||colors[si%colors.length];
      ctx.fillRect(x,y,barW,h);
    });
    ctx.font='12px ui-sans-serif';
    if(ctx.measureText(lb).width > groupW-4) needTilt=true;
  });

  // x labels
  labels.forEach((lb,gi)=>{
    const cx=pad.l+gi*groupW+groupW/2, yBase=H-pad.b+12;
    ctx.fillStyle='#65748a'; ctx.font='12px ui-sans-serif';
    if(needTilt){ ctx.save(); ctx.translate(cx,yBase); ctx.rotate(-Math.PI/8); ctx.textAlign='right'; ctx.textBaseline='top'; ctx.fillText(lb,0,0); ctx.restore(); }
    else{ ctx.textAlign='center'; ctx.textBaseline='top'; ctx.fillText(lb,cx,yBase); }
  });

  // legend มุมขวาบน + พื้นหลังโปร่ง
  ctx.font='12px ui-sans-serif';
  const items=series.map((s,i)=>({name:s.name, color:s.color||colors[i%colors.length]}));
  const box=12, space=10;
  let totalW=0; items.forEach(it=> totalW += box+6+ctx.measureText(it.name).width+space); totalW-=space;
  const legendX=Math.max(pad.l, W-16-totalW), legendY=8;
  ctx.fillStyle='rgba(255,255,255,.85)'; ctx.fillRect(legendX-6, legendY-4, totalW+12, box+10);
  let xRun=legendX;
  items.forEach(it=>{ ctx.fillStyle=it.color; ctx.fillRect(xRun,legendY,box,box);
    ctx.fillStyle='#344355'; ctx.textBaseline='top'; ctx.textAlign='left'; ctx.fillText(it.name,xRun+box+6,legendY-1);
    xRun += box+6+ctx.measureText(it.name).width+space;
  });
}

/* ===== Tabs ===== */
$$('.tab').forEach(btn=>{
  btn.addEventListener('click', ()=>{
    $$('.tab').forEach(b=>b.classList.remove('active')); btn.classList.add('active');
    $$('.panel').forEach(p=>p.classList.remove('show')); $(`#tab-${btn.dataset.tab}`).classList.add('show');
    if(btn.dataset.tab==='attendance') calcAttendance();
    if(btn.dataset.tab==='accounting'){ renderYearOptions(); renderYearSummary(); renderLedger(); renderAccYearChart(); renderAccMonthlyChart(); }
    if(btn.dataset.tab==='fleet') renderFleet();
    if(btn.dataset.tab==='market') renderMarket();
  });
});

/* ===== Users & Login ===== */
const users=[];
function buildUsers(){
  users.length=0;
  users.push(
    {name:"คุณชาตรี", email:"ceo@ptg.local",   pass:"Pass@1234", role:"CEO",       warn:0, active:true},
    {name:"คุณนิอร",   email:"nior@ptg.local",  pass:"Pass@1234", role:"หัวหน้างาน", warn:0, active:true},
    {name:"นายมาโนท", email:"manot@ptg.local", pass:"Pass@1234", role:"หัวหน้างาน", warn:0, active:true},
  );
  const fn=["ศิริ","ภาคิน","พชร","ณิชา","แพร","ฟ้า","ขวัญ","มีน","ไอซ์","บีม","โอ๊ต","นัท","กันต์"];
  const ln=["กิตติ","วัฒน์","ศักดิ์","พงษ์","นฤมล","ปรีชา","มานี","ไพศาล","อนันต์","มารุต"];
  const mk=(n,role)=>({name:n,email:n.toLowerCase().replace(/\s+/g,'.')+"@ptg.local",pass:"Pass@1234",role,warn:rand(0,2),active:true});
  for(let i=0;i<20;i++) users.push(mk(`${pick(fn)} ${pick(ln)}`,"Driver"));
  for(let i=0;i<10;i++) users.push(mk(`${pick(fn)} ${pick(ln)}`,"Accounting"));
  for(let i=0;i<10;i++) users.push(mk(`${pick(fn)} ${pick(ln)}`,"GPS"));
}
function renderUsers(){
  const q=($('#qUser')?.value||'').trim().toLowerCase();
  const rf=$('#roleFilter')?.value||'';
  const tb=$('#tblUsers tbody'); if(!tb) return;
  let list=users.slice();
  if(rf) list=list.filter(u=>u.role===rf);
  if(q)  list=list.filter(u=>u.name.toLowerCase().includes(q)||u.email.toLowerCase().includes(q));
  tb.innerHTML=list.map(u=>`
    <tr>
      <td>${u.name}</td>
      <td>${u.email}</td>
      <td><span class="badge">${u.role}</span></td>
      <td>${u.warn}</td>
      <td>${u.active?'<span class="badge">Active</span>':'Inactive'}</td>
    </tr>`).join('');
  $('#cDrivers').textContent=users.filter(x=>x.role==='Driver').length;
  $('#cAcc').textContent=users.filter(x=>x.role==='Accounting').length;
  $('#cGps').textContent=users.filter(x=>x.role==='GPS').length;
  $('#cSup').textContent=users.filter(x=>x.role==='หัวหน้างาน').length;
}
$('#qUser')?.addEventListener('input', renderUsers);
$('#roleFilter')?.addEventListener('change', renderUsers);

function renderDemoList(){
  const sel=$('#demoUserSelect'); if(!sel) return;
  sel.innerHTML=users.slice(0,15).map((u,i)=>`<option value="${i}">${u.name} — ${u.role}</option>`).join('');
  const update=()=>{ const u=users[+sel.value||0]; $('#demoCred').textContent=`บัญชี: ${u.email} / ${u.pass}`; };
  sel.onchange=update; update();
}

/* ===== Login (ตรวจอีเมล+รหัสผ่านจริง) ===== */
let currentUser=null;
function findUserByCreds(email, pass){
  email=(email||'').trim().toLowerCase();
  pass =(pass ||'').trim();
  return users.find(u=>u.email.toLowerCase()===email && u.pass===pass) || null;
}
$('#btnFill')?.addEventListener('click', ()=>{
  const u=users[+$('#demoUserSelect').value||0];
  $('#loginEmail').value=u.email; $('#loginPass').value=u.pass; $('#loginEmail').focus();
});
$('#loginForm')?.addEventListener('submit', e=>{
  e.preventDefault();
  const email=$('#loginEmail').value, pass=$('#loginPass').value;
  const u=findUserByCreds(email, pass);
  if(!u){ alert('อีเมลหรือรหัสผ่านไม่ถูกต้อง'); return; }
  currentUser=u;
  $('#loginWrap').style.display='none'; $('#appRoot').hidden=false; initApp();
});
$('#btnLogout')?.addEventListener('click', ()=>{
  currentUser=null; $('#appRoot').hidden=true; $('#loginWrap').style.display='grid';
});

/* ===== Attendance ===== */
function canViewAttendance(){ return currentUser && (currentUser.role==='หัวหน้างาน' || currentUser.role==='CEO'); }
function lockAttendanceUI(){
  const allow=canViewAttendance();
  $('#attControls').style.display=allow?'flex':'none';
  $('#attSummary').style.display=allow?'flex':'none';
  $('#attNotice').hidden=allow;
}
function calcAttendance(){
  if(!$('#attMonth')) return;
  if(!canViewAttendance()){ lockAttendanceUI(); return; }
  const ym=$('#attMonth').value||new Date().toISOString().slice(0,7);
  const [y,m]=ym.split('-').map(Number);
  const dmax=new Date(y,m,0).getDate();
  const tb=$('#tblAtt tbody'); tb.innerHTML='';
  let present=0,absent=0;
  for(let d=1; d<=dmax; d++){
    const st=Math.random()<0.87?'มา':'ไม่มา';
    if(st==='มา') present++; else absent++;
    tb.insertAdjacentHTML('beforeend', `<tr><td>${ym}-${String(d).padStart(2,'0')}</td><td>${st}</td></tr>`);
  }
  $('#attPresent').textContent=present; $('#attAbsent').textContent=absent;
  let warn=0; if(absent>=3 && absent<=5) warn=1; else if(absent>5) warn=rand(2,3);
  $('#attWarn').textContent=warn; lockAttendanceUI();
}
$('#attUser')?.addEventListener('change', calcAttendance);
$('#attMonth')?.addEventListener('change', calcAttendance);

/* ===== Fleet (ตายตัว: tanker 30 | box 20 | pickup 20) ===== */
const vehicleModels=[
  // รถน้ำมัน
  {model:"Isuzu FTR 240", type:"tanker", capacity:"18 KL", image:"isuzu.png"},
  {model:"Volvo 400",     type:"tanker", capacity:"30 KL", image:"volvo.png"},

  // รถตู้ทึบ
  {model:"Fuso Fighter",  type:"box",    capacity:"12 t",  image:"fuso.png"},
  {model:"Scania P360",   type:"box",    capacity:"15 t",  image:"scania.png"},

  // รถกระบะ
  {model:"Toyota Hilux",  type:"pickup", capacity:"1 t",   image:"hilux.png"},
  {model:"Ford Ranger",   type:"pickup", capacity:"1.2 t", image:"ranger.png"},
];
const FALLBACK_IMG={tanker:"tanker.png", box:"box.png", pickup:"pickup.png"};
const fleet=[];
function plate(){ return `TRK-${String(rand(1,999)).padStart(3,'0')}`; }
function pushRandomByType(type, count){
  const models = vehicleModels.filter(m=>m.type===type);
  for(let i=0;i<count;i++){
    const m=pick(models);
    const st=pick(['available','assigned','maintenance','available']);
    fleet.push({ id:crypto.randomUUID?.()||('v'+i+Date.now()+type), plate:plate(), ...m, status:st });
  }
}
function seedFleetFixed(){
  fleet.length=0;
  pushRandomByType('tanker', 30);  // น้ำมัน 30
  pushRandomByType('box',    20);  // ตู้ทึบ 20
  pushRandomByType('pickup', 20);  // กระบะ 20
}
function imgVehicle(f){
  const src = f.image || FALLBACK_IMG[f.type] || "tanker.png";
  const extraClass = f.model.includes("Isuzu") ? "isuzu-img" : "";
  return `<img src="${src}" alt="${f.model}" class="${extraClass}"
          loading="lazy" decoding="async"
          style="width:100%;height:100%;object-fit:contain;border-radius:10px;">`;
}

function countSummary(){
  $('#fleetAvail').textContent=fleet.filter(f=>f.status==='available').length;
  $('#fleetAssign').textContent=fleet.filter(f=>f.status==='assigned').length;
  $('#fleetMaint').textContent=fleet.filter(f=>f.status==='maintenance').length;
}
function renderModelChips(){
  const map={}; fleet.forEach(f=>map[f.model]=(map[f.model]||0)+1);
  $('#modelChips').innerHTML=Object.entries(map).map(([m,c])=>`<span class="badge">${m} <b>${c}</b></span>`).join('');
}
function renderFleet(){
  const grid=$('#fleetGrid'); if(!grid) return;
  countSummary(); renderModelChips();
  const status=$('#fleetStatus')?.value||'', q=$('#fleetSearch')?.value?.trim().toLowerCase()||'';
  let list=fleet.slice();
  if(status) list=list.filter(f=>f.status===status);
  if(q) list=list.filter(f=>f.plate.toLowerCase().includes(q)||f.model.toLowerCase().includes(q));
  grid.innerHTML=list.map(f=>`
    <div class="car-card" id="car-${f.id}">
      <div class="car-img">${imgVehicle(f)}</div>
      <div class="car-meta">
        <div class="model">${f.model}</div>
        <div class="plate">${f.plate} • ${f.capacity}</div>
        <div class="tags">
          <span class="tag">${f.type}</span>
          <span class="st ${f.status}">${f.status==='available'?'ว่าง':f.status==='assigned'?'ใช้งาน':'ซ่อม'}</span>
        </div>
        <div class="actions">
          ${f.status!=='assigned'?`<button class="btn tiny act" data-assign="${f.id}">มอบหมาย</button>`:''}
          ${f.status!=='available'?`<button class="btn tiny act" data-release="${f.id}">ปล่อยว่าง</button>`:''}
          ${f.status!=='maintenance'?`<button class="btn tiny act" data-maint="${f.id}">ส่งซ่อม</button>`:''}
        </div>
      </div>
    </div>`).join('');
  const pulse=(id,msg)=>{ const card=$(`#car-${id}`); if(!card) return; card.classList.remove('press'); void card.offsetWidth; card.classList.add('press'); showToast(msg); };
  $$('[data-assign]').forEach(b=>b.onclick=e=>{const id=e.currentTarget.dataset.assign; const v=fleet.find(x=>x.id===id); v.status='assigned'; renderFleet(); pulse(id,'มอบหมายรถแล้ว');});
  $$('[data-release]').forEach(b=>b.onclick=e=>{const id=e.currentTarget.dataset.release; const v=fleet.find(x=>x.id===id); v.status='available'; renderFleet(); pulse(id,'ปล่อยรถว่าง');});
  $$('[data-maint]').forEach(b=>b.onclick=e=>{const id=e.currentTarget.dataset.maint; const v=fleet.find(x=>x.id===id); v.status='maintenance'; renderFleet(); pulse(id,'ส่งซ่อมแล้ว');});
}
$('#fleetStatus')?.addEventListener('change', renderFleet);
$('#fleetSearch')?.addEventListener('input', renderFleet);

/* ===== Accounting (2550–2568) ===== */
const ledger=[]; // {date, type:'income'|'cost', desc, amt}
const beToAd = be => be-543;
function addEntry({type, desc, amt, date=today()}){ const n=parseFloat(amt||0); if(!type||!isFinite(n)) return; ledger.unshift({date, type, desc, amt:n}); }

function seedLedgerHistory(){
  ledger.length=0;
  const startBE=2550, endBE=2568;
  for(let be=startBE; be<=endBE; be++){
    const ad=beToAd(be);
    for(let m=1;m<=12;m++){
      const baseIncome=150000+(be-startBE)*2500+rand(-8000,8000);
      const seasonal=(m===3||m===4||m===12)? rand(10000,20000): rand(-5000,8000);
      const income=Math.max(60000, baseIncome+seasonal);
      const fuelCost=60000+(be-startBE)*1500+rand(-5000,9000);
      const tollCost=8000+rand(-1500,2500);
      const maint=12000+(m%4===0? rand(3000,12000): rand(0,4000));
      addEntry({type:'income', desc:`รายได้ขนส่ง ${be}-${String(m).padStart(2,'0')}`, amt:income, date:`${ad}-${String(m).padStart(2,'0')}-10`});
      addEntry({type:'cost',   desc:'ค่าน้ำมัน',   amt:fuelCost,  date:`${ad}-${String(m).padStart(2,'0')}-12`});
      addEntry({type:'cost',   desc:'ค่าทางด่วน',  amt:tollCost,  date:`${ad}-${String(m).padStart(2,'0')}-15`});
      if(rand(0,100)<40) addEntry({type:'cost', desc:'ซ่อมบำรุง', amt:maint, date:`${ad}-${String(m).padStart(2,'0')}-20`});
    }
  }
  ledger.sort((a,b)=> b.date.localeCompare(a.date));
}
function renderYearOptions(){
  const yearSel=$('#accYear'); if(!yearSel) return;
  const years=[...new Set(ledger.map(r=> new Date(r.date).getFullYear()+543))].sort((a,b)=>b-a);
  yearSel.innerHTML=years.map(y=>`<option value="${y}">${y}</option>`).join('');
  renderAccMonthlyChart();
}
function renderLedger(){
  const tb=$('#accTable tbody'); if(!tb) return;
  const be=+($('#accYear')?.value || (new Date().getFullYear()+543));
  const ad=beToAd(be);
  const rows=ledger.filter(r=>r.date.startsWith(`${ad}-`));
  tb.innerHTML=rows.map(row=>`
    <tr>
      <td>${row.date}</td>
      <td>${row.type==='income' ? '<span class="badge">รายได้</span>' : '<span class="badge warn">ต้นทุน</span>'}</td>
      <td>${row.desc||'-'}</td>
      <td style="text-align:right">${fmt(row.amt)}</td>
    </tr>`).join('');
  const income=rows.filter(x=>x.type==='income').reduce((s,x)=>s+x.amt,0);
  const cost=rows.filter(x=>x.type==='cost').reduce((s,x)=>s+x.amt,0);
  $('#accIncome').textContent=fmt(income);
  $('#accCost').textContent=fmt(cost);
  $('#accProfit').textContent=fmt(income-cost);
}
function renderYearSummary(){
  const tb=$('#accYearTable tbody'); if(!tb) return;
  const byYear={};
  ledger.forEach(r=>{
    const be=new Date(r.date).getFullYear()+543;
    byYear[be] ??= {income:0,cost:0};
    byYear[be][r.type]+=r.amt;
  });
  tb.innerHTML=Object.keys(byYear).sort((a,b)=>b-a).map(be=>{
    const x=byYear[be], profit=x.income-x.cost;
    return `<tr><td>${be}</td><td>${fmt(x.income)}</td><td>${fmt(x.cost)}</td><td>${fmt(profit)}</td></tr>`;
  }).join('');
  renderAccYearChart();
}
$('#accAdd')?.addEventListener('click', ()=>{
  const be=+($('#accYear').value || (new Date().getFullYear()+543)); const ad=beToAd(be);
  const type=$('#accType').value, desc=$('#accDesc').value.trim(), amt=$('#accAmt').value;
  if(!amt){ alert('กรอกจำนวนเงินก่อนนะ'); return; }
  addEntry({type, desc, amt, date:`${ad}-${String(new Date().getMonth()+1).padStart(2,'0')}-28`});
  renderLedger(); renderYearSummary(); showToast('บันทึกรายการแล้ว');
});
$('#accQuickFuel')?.addEventListener('click', ()=>{
  const be=+($('#accYear').value || (new Date().getFullYear()+543)); const ad=beToAd(be);
  addEntry({type:'cost', desc:'ค่าน้ำมัน', amt:rand(1500,4500), date:`${ad}-${String(new Date().getMonth()+1).padStart(2,'0')}-18`});
  renderLedger(); renderYearSummary(); showToast('บันทึกค่าน้ำมันแล้ว');
});
$('#accQuickToll')?.addEventListener('click', ()=>{
  const be=+($('#accYear').value || (new Date().getFullYear()+543)); const ad=beToAd(be);
  addEntry({type:'cost', desc:'ค่าทางด่วน', amt:rand(60,400), date:`${ad}-${String(new Date().getMonth()+1).padStart(2,'0')}-19`});
  renderLedger(); renderYearSummary(); showToast('บันทึกค่าทางด่วนแล้ว');
});
$('#accYear')?.addEventListener('change', ()=>{ renderLedger(); renderAccMonthlyChart(); });

/* ===== Accounting charts ===== */
function getYearAggBE(){
  const map={};
  ledger.forEach(r=>{
    const be=new Date(r.date).getFullYear()+543;
    map[be] ??= {income:0, cost:0};
    map[be][r.type]+=r.amt;
  });
  const years=Object.keys(map).map(Number).sort((a,b)=>a-b);
  return {years,map};
}
function renderAccYearChart(){
  const cv=document.getElementById('accYearChart'); if(!cv) return;
  const {years,map}=getYearAggBE();
  const income=years.map(y=>map[y].income);
  const cost=years.map(y=>map[y].cost);
  const profit=years.map((y,i)=>income[i]-cost[i]);
  drawBarChart(cv,{
    labels:years.map(String),
    series:[
      {name:'รายได้', data:income, color:'#7bdcb5'},
      {name:'ต้นทุน', data:cost,   color:'#9ad0f5'},
      {name:'กำไร',  data:profit, color:'#ffd166'},
    ],
    yFmt: v=>v.toLocaleString('th-TH',{maximumFractionDigits:0})
  });
}
function renderAccMonthlyChart(){
  const cv=document.getElementById('accMonthlyChart'); if(!cv) return;
  const be=+($('#accYear')?.value || (new Date().getFullYear()+543));
  document.getElementById('accSelectedYear').textContent=be;
  const ad=be-543;
  const months=Array.from({length:12},(_,i)=>i+1);
  const rows=ledger.filter(r=>r.date.startsWith(`${ad}-`));
  const inc=months.map(m=> rows.filter(r=>r.type==='income' && r.date.slice(5,7)==String(m).padStart(2,'0')).reduce((s,x)=>s+x.amt,0));
  const cst=months.map(m=> rows.filter(r=>r.type==='cost'   && r.date.slice(5,7)==String(m).padStart(2,'0')).reduce((s,x)=>s+x.amt,0));
  drawBarChart(cv,{
    labels:months.map(m=>String(m).padStart(2,'0')),
    series:[
      {name:'รายได้', data:inc, color:'#7bdcb5'},
      {name:'ต้นทุน', data:cst, color:'#9ad0f5'},
    ],
    yFmt: v=>v.toLocaleString('th-TH',{maximumFractionDigits:0})
  });
}

/* ===== Oil Market (mock) ===== */
const FX={USDTHB:36.0};
function mockPrice(base,vol=1.2){ const change=(Math.random()-0.5)*vol; const price=Math.max(10,base+change); const pct=(change/base)*100; return {price:+price.toFixed(2), pct:+pct.toFixed(2)}; }
function setPill(el,pct){ el.classList.remove('up','down','neutral'); if(pct>0.05) el.classList.add('up'); else if(pct<-0.05) el.classList.add('down'); else el.classList.add('neutral'); el.textContent=(pct>0?'+':'')+pct.toFixed(2)+'%'; }
const PUMP_BRANDS=[
  {name:'PTG',    margin:{B7:6.0, G95:7.2, G91:6.8}},
  {name:'PTT',    margin:{B7:6.3, G95:7.4, G91:7.0}},
  {name:'บางจาก', margin:{B7:6.1, G95:7.1, G91:6.7}},
  {name:'Shell',  margin:{B7:6.6, G95:7.8, G91:7.4}},
  {name:'Esso',   margin:{B7:6.4, G95:7.5, G91:7.2}},
];
function computeRetailTHB(perBblUSD, marginTHB){
  const L_PER_BBL=158.987;
  const usdToTHB=$('#mkCurrency')?.value==='USD' ? 1 : FX.USDTHB;
  const baseTHBperL=(perBblUSD * usdToTHB)/L_PER_BBL;
  return baseTHBperL + marginTHB;
}
function renderPumpChart(pumps){
  const cv=document.getElementById('mkPumpChart'); if(!cv) return;
  const labels=pumps.map(p=>p.brand);
  const B7=pumps.map(p=>p.B7), G95=pumps.map(p=>p.G95), G91=pumps.map(p=>p.G91);
  drawBarChart(cv,{
    labels,
    series:[
      {name:'B7',  data:B7,  color:'#7bdcb5'},
      {name:'G95', data:G95, color:'#ffd166'},
      {name:'G91', data:G91, color:'#9ad0f5'},
    ],
    yFmt: v=>v.toLocaleString('th-TH',{maximumFractionDigits:2})
  });
}
function renderMarket(){
  const cur=$('#mkCurrency')?.value||'THB';
  const br=mockPrice(84), wt=mockPrice(80), db=mockPrice(82);
  const rate=(cur==='THB')?FX.USDTHB:1, suffix=cur==='THB'?' ฿':' $';
  $('#mkBrent').textContent=(br.price*rate).toFixed(2)+suffix;
  $('#mkWTI').textContent  =(wt.price*rate).toFixed(2)+suffix;
  $('#mkDubai').textContent=(db.price*rate).toFixed(2)+suffix;
  setPill($('#mkBrentChg'),br.pct); setPill($('#mkWTIChg'),wt.pct); setPill($('#mkDubaiChg'),db.pct);

  const b7USD =(db.price*0.6 + wt.price*0.4);
  const g95USD= br.price*1.02;
  const g91USD= br.price*0.99;

  const pumps=PUMP_BRANDS.map(b=>{
    const B7 =computeRetailTHB(b7USD,  b.margin.B7);
    const G95=computeRetailTHB(g95USD, b.margin.G95);
    const G91=computeRetailTHB(g91USD, b.margin.G91);
    return {brand:b.name, B7:+B7.toFixed(2), G95:+G95.toFixed(2), G91:+G91.toFixed(2)};
  });

  const rowsHtml=pumps.map(p=>`
    <tr>
      <td>${p.brand}</td>
      <td class="num">${p.B7.toLocaleString('th-TH',{maximumFractionDigits:2})}</td>
      <td class="num">${p.G95.toLocaleString('th-TH',{maximumFractionDigits:2})}</td>
      <td class="num">${p.G91.toLocaleString('th-TH',{maximumFractionDigits:2})}</td>
    </tr>`).join('');
  const tSlim=document.querySelector('#mkPumpTableSlim tbody');
  const tMain=document.querySelector('#mkPumpTable tbody'); // เผื่อมีตารางใหญ่
  if(tSlim) tSlim.innerHTML=rowsHtml;
  if(tMain) tMain.innerHTML=rowsHtml;

  renderPumpChart(pumps);
}
$('#mkRefresh')?.addEventListener('click', renderMarket);
$('#mkCurrency')?.addEventListener('change', renderMarket);

/* ===== Init ===== */
function fillUserSelects(){ const el=$('#attUser'); if(el) el.innerHTML=users.map((u,i)=>`<option value="${i}">${u.name} — ${u.role}</option>`).join(''); }
function initApp(){
  fillUserSelects(); renderUsers();
  const now=new Date().toISOString().slice(0,7); if($('#attMonth')) $('#attMonth').value=now; calcAttendance();

  if(!window._fleetSeeded){ seedFleetFixed(); window._fleetSeeded=true; }
  renderFleet();

  seedLedgerHistory(); renderYearOptions(); renderYearSummary(); renderLedger();
  renderAccYearChart(); renderAccMonthlyChart();

  renderMarket();
}
document.addEventListener('DOMContentLoaded', ()=>{ buildUsers(); renderDemoList(); });

/* ===== Redraw on resize (debounce) ===== */
let _rsTimer=null;
window.addEventListener('resize', ()=>{
  clearTimeout(_rsTimer);
  _rsTimer = setTimeout(()=>{
    renderAccYearChart();
    renderAccMonthlyChart();
    renderMarket();
  }, 150);
});

/* ===== iPhone anti-zoom ===== */
const isIOS=/iPad|iPhone|iPod/.test(navigator.userAgent); const vp=document.querySelector('meta[name="viewport"]');
function lockZoom(){ if(isIOS&&vp) vp.setAttribute('content','width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover'); }
function unlockZoom(){ if(isIOS&&vp) vp.setAttribute('content','width=device-width, initial-scale=1, viewport-fit=cover'); }
document.addEventListener('focusin',e=>{ if(e.target.matches('input,textarea,select')) lockZoom(); });
document.addEventListener('focusout',e=>{ if(e.target.matches('input,textarea,select')) unlockZoom(); });
let lastTouch=0; document.addEventListener('touchend',e=>{ const n=Date.now(); if(n-lastTouch<=300) e.preventDefault(); lastTouch=n; },{passive:false});
