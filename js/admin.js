/* ============================================================
   Admin panel logic — auth, moderation, content management
   ============================================================ */

const DESIGNATED_SUPER_ADMIN_USERNAME = 'FBanjo'; // Only this username can bootstrap the first Super Admin account.
let currentAdmin = null; // { username, role }

/* ---- Auth ---- */
async function tryAdminLogin(){
  const username = document.getElementById('admin-username').value.trim();
  const password = document.getElementById('admin-pass').value;
  if(!username || !password){ alert('Enter a username and password.'); return; }
  const existingAdmins = await fsList('admins');
  const hash = await sha256Hex(password);

  if(existingAdmins.length === 0){
    if(username.toLowerCase() !== DESIGNATED_SUPER_ADMIN_USERNAME.toLowerCase()){
      alert('No admin account exists yet, and only the designated Super Admin username can set one up.');
      return;
    }
    const saved = await fsSet('admins', username, { username, passwordHash: hash, role:'super', note:'Super Admin (Founder)', active:true });
    if(!saved){ alert('Could not create the Super Admin account. Check your Firebase connection and try again.'); return; }
    currentAdmin = { username, role:'super' };
    enterAdminPanel();
    return;
  }

  const rec = await fsGet('admins', username);
  if(!rec || !rec.active || rec.passwordHash !== hash){ alert('Incorrect username or password, or account inactive.'); return; }
  currentAdmin = { username, role: rec.role };
  enterAdminPanel();
}

function enterAdminPanel(){
  document.getElementById('admin-locked').classList.add('hidden');
  document.getElementById('admin-panel').classList.remove('hidden');
  document.getElementById('admin-whoami').textContent = currentAdmin.username + ' (' + (currentAdmin.role==='super'?'Super Admin':'Admin') + ')';
  document.getElementById('super-admin-section').classList.toggle('hidden', currentAdmin.role !== 'super');
  loadAll();
}
function adminLogout(){
  currentAdmin = null;
  document.getElementById('admin-panel').classList.add('hidden');
  document.getElementById('admin-locked').classList.remove('hidden');
  document.getElementById('admin-username').value=''; document.getElementById('admin-pass').value='';
}

async function createAdmin(){
  const username = document.getElementById('na-username').value.trim();
  const password = document.getElementById('na-password').value;
  const msg = document.getElementById('na-msg');
  if(!username || !password){ showMsg(msg,'Enter a username and password.','err'); return; }
  const existing = await fsGet('admins', username);
  if(existing){ showMsg(msg,'That username already exists.','err'); return; }
  const hash = await sha256Hex(password);
  const saved = await fsSet('admins', username, { username, passwordHash: hash, role:'admin', note: document.getElementById('na-note').value.trim(), active:true });
  if(!saved){ showMsg(msg,'Save failed. Please try again.','err'); return; }
  showMsg(msg, 'Admin account created.', 'ok');
  document.getElementById('na-username').value=''; document.getElementById('na-password').value=''; document.getElementById('na-note').value='';
  loadAdmins();
}
async function toggleAdminActive(username){
  const rec = await fsGet('admins', username);
  if(!rec) return;
  await fsSet('admins', username, { active: !rec.active });
  loadAdmins();
}
async function loadAdmins(){
  const admins = await fsList('admins');
  document.querySelector('#admins-table tbody').innerHTML = admins.map(a=>
    `<tr><td>${esc(a.username)} ${a.role==='super'?'<span class="badge">Super</span>':''}</td><td>${esc(a.note||'—')}</td><td>${a.active?'Active':'Inactive'}</td>
     <td>${a.role!=='super' ? `<button class="btn small outline" onclick="toggleAdminActive('${a.username}')">${a.active?'Deactivate':'Reactivate'}</button>` : ''}</td></tr>`
  ).join('') || '<tr><td colspan="4" style="color:var(--muted);">No admins yet.</td></tr>';
}

/* ---- Members ---- */
async function loadMembers(){
  const members = await fsList('members');
  document.getElementById('stat-members').textContent = members.length;
  document.querySelector('#members-table tbody').innerHTML = members.map(m=>
    `<tr><td>${esc(m.name)}</td><td>${esc(m.phone)}</td><td>${esc(m.wing)}</td><td>${esc(m.branch||'—')}</td></tr>`
  ).join('') || '<tr><td colspan="4" style="color:var(--muted);">No members yet.</td></tr>';
  const welfare = members.filter(m=>m.request);
  document.getElementById('stat-welfare').textContent = welfare.length;
  document.querySelector('#welfare-table tbody').innerHTML = welfare.map(m=>
    `<tr><td>${esc(m.name)}</td><td>${esc(m.phone)}</td><td>${esc(m.request)}</td></tr>`
  ).join('') || '<tr><td colspan="3" style="color:var(--muted);">No requests yet.</td></tr>';
}

/* ---- Sermons ---- */
async function publishSermon(){
  const title = document.getElementById('s-title').value.trim();
  const msg = document.getElementById('s-msg');
  if(!title){ showMsg(msg,'Enter a title.','err'); return; }
  const id = await fsAdd('sermons', { title, scripture: document.getElementById('s-scripture').value.trim(), content: document.getElementById('s-content').value.trim() });
  if(!id){ showMsg(msg,'Save failed. Please try again.','err'); return; }
  showMsg(msg, 'Sermon published.', 'ok');
  ['s-title','s-scripture','s-content'].forEach(i=>document.getElementById(i).value='');
  loadSermons();
}
async function deleteSermon(id){
  if(!confirm('Delete this sermon?')) return;
  await fsDelete('sermons', id);
  loadSermons();
}
async function loadSermons(){
  const sermons = await fsList('sermons');
  document.querySelector('#sermons-table tbody').innerHTML = sermons.map(s=>
    `<tr><td>${esc(s.title)}</td><td>${esc(s.scripture||'—')}</td><td><button class="btn small outline" onclick="deleteSermon('${s.id}')">Delete</button></td></tr>`
  ).join('') || '<tr><td colspan="3" style="color:var(--muted);">No sermons yet.</td></tr>';
}

/* ---- Events ---- */
async function createEvent(){
  const title = document.getElementById('ev-title').value.trim();
  const date = document.getElementById('ev-date').value;
  const msg = document.getElementById('ev-msg');
  if(!title || !date){ showMsg(msg,'Enter a title and date.','err'); return; }
  const id = await fsAdd('events', {
    title, category: document.getElementById('ev-category').value,
    description: document.getElementById('ev-desc').value.trim(),
    date, time: document.getElementById('ev-time').value,
    location: document.getElementById('ev-location').value.trim(),
    price: parseFloat(document.getElementById('ev-price').value) || 0
  });
  if(!id){ showMsg(msg,'Save failed. Please try again.','err'); return; }
  showMsg(msg, 'Event published.', 'ok');
  ['ev-title','ev-desc','ev-date','ev-time','ev-location'].forEach(i=>document.getElementById(i).value='');
  document.getElementById('ev-price').value='0';
  loadEvents();
}
async function deleteEvent(id){
  if(!confirm('Delete this event?')) return;
  await fsDelete('events', id);
  loadEvents();
}
async function loadEvents(){
  const events = await fsList('events');
  const tickets = await fsList('tickets');
  document.querySelector('#events-table tbody').innerHTML = events.map(e=>{
    const sold = tickets.filter(t=>t.eventId===e.id);
    const revenue = sold.reduce((s,t)=>s+(t.amount||0),0);
    return `<tr><td>${esc(e.title)}</td><td>${e.date}</td><td>${sold.length}</td><td>₦${revenue.toLocaleString()}</td>
      <td><button class="btn small outline" onclick="viewAttendees('${e.id}','${esc(e.title)}')">Attendees</button>
          <button class="btn small outline" onclick="deleteEvent('${e.id}')">Delete</button></td></tr>`;
  }).join('') || '<tr><td colspan="5" style="color:var(--muted);">No events yet.</td></tr>';
}
async function viewAttendees(eventId, title){
  const tickets = (await fsList('tickets')).filter(t=>t.eventId===eventId);
  document.getElementById('attendees-title').textContent = 'Attendees — ' + title;
  document.querySelector('#attendees-table tbody').innerHTML = tickets.map(t=>
    `<tr><td>${esc(t.name)}</td><td>${esc(t.phone)}</td><td style="font-family:monospace;">${esc(t.code)}</td></tr>`
  ).join('') || '<tr><td colspan="3" style="color:var(--muted);">No tickets yet.</td></tr>';
  document.getElementById('attendees-panel').classList.remove('hidden');
}

/* ---- Testimonies ---- */
async function approveTestimony(id){
  await fsSet('testimonies', id, { status:'approved' });
  loadTestimonies();
}
async function rejectTestimony(id){
  if(!confirm('Delete this testimony?')) return;
  await fsDelete('testimonies', id);
  loadTestimonies();
}
async function loadTestimonies(){
  const all = await fsList('testimonies');
  const pending = all.filter(t=>t.status==='pending');
  const approved = all.filter(t=>t.status==='approved');
  document.getElementById('stat-testimonies-pending').textContent = pending.length;
  document.querySelector('#pending-testimony-table tbody').innerHTML = pending.map(t=>
    `<tr><td>${esc(t.name)}</td><td style="max-width:280px;">${esc(t.text.slice(0,120))}${t.text.length>120?'…':''}</td>
     <td><button class="btn small outline" onclick="approveTestimony('${t.id}')">Approve</button>
         <button class="btn small outline" onclick="rejectTestimony('${t.id}')">Reject</button></td></tr>`
  ).join('') || '<tr><td colspan="3" style="color:var(--muted);">No pending testimonies.</td></tr>';
  document.querySelector('#approved-testimony-table tbody').innerHTML = approved.map(t=>
    `<tr><td>${esc(t.name)}</td><td style="max-width:280px;">${esc(t.text.slice(0,120))}${t.text.length>120?'…':''}</td><td>${t.reactions||0}</td>
     <td><button class="btn small outline" onclick="rejectTestimony('${t.id}')">Delete</button></td></tr>`
  ).join('') || '<tr><td colspan="4" style="color:var(--muted);">No published testimonies yet.</td></tr>';
}

/* ---- Giving ---- */
async function savePaystackKey(){
  const key = document.getElementById('pk-key').value.trim();
  const msg = document.getElementById('pk-msg');
  if(!key){ showMsg(msg,'Enter a Paystack public key.','err'); return; }
  const saved = await fsSet('config', 'paystack', { key });
  if(!saved){ showMsg(msg,'Save failed. Please try again.','err'); return; }
  showMsg(msg, 'Paystack key saved. Online giving is now active.', 'ok');
}
async function loadGiving(){
  const gifts = await fsList('gifts');
  const total = gifts.reduce((s,g)=>s+(g.amount||0),0);
  document.getElementById('stat-gifts').textContent = '₦' + total.toLocaleString();
  document.querySelector('#gifts-table tbody').innerHTML = gifts.map(g=>
    `<tr><td>${esc(g.name)}</td><td>${esc(g.purpose)}</td><td>₦${(g.amount||0).toLocaleString()}</td><td style="font-family:monospace;font-size:0.72rem;">${esc(g.reference||'—')}</td></tr>`
  ).join('') || '<tr><td colspan="4" style="color:var(--muted);">No gifts recorded yet.</td></tr>';
  const pk = await fsGet('config', 'paystack');
  if(pk) document.getElementById('pk-key').value = pk.key;
}

/* ---- About page content ---- */
async function saveAboutContent(){
  const mission = document.getElementById('ab-mission').value.trim();
  const faith = document.getElementById('ab-faith').value.trim();
  const registration = document.getElementById('ab-registration').value.trim();
  await fsSet('config', 'about_mission', { text: mission });
  await fsSet('config', 'about_faith', { text: faith });
  await fsSet('config', 'about_registration', { text: registration });
  showMsg(document.getElementById('ab-msg'), 'About page updated.', 'ok');
}
async function loadAboutFields(){
  const mission = await fsGet('config', 'about_mission');
  const faith = await fsGet('config', 'about_faith');
  const reg = await fsGet('config', 'about_registration');
  if(mission) document.getElementById('ab-mission').value = mission.text;
  if(faith) document.getElementById('ab-faith').value = faith.text;
  if(reg) document.getElementById('ab-registration').value = reg.text;
}

async function loadAll(){
  await loadMembers();
  await loadSermons();
  await loadEvents();
  await loadTestimonies();
  await loadGiving();
  await loadAboutFields();
  if(currentAdmin.role==='super') await loadAdmins();
}
