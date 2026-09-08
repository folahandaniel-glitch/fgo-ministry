/* ============================================================
   Admin panel logic — auth, moderation, content management
   ============================================================ */

/* ============================================================
   Admin panel logic — real Firebase Authentication, moderation,
   content management
   ============================================================ */

const DESIGNATED_SUPER_ADMIN_EMAIL = 'folahandaniel@gmail.com'; // Only this email can bootstrap the first Super Admin account.

// A second, independent Firebase app instance used only for creating new
// admin accounts. Without this, Firebase Auth's client SDK would sign the
// Super Admin OUT and INTO the new account the moment it's created — this
// keeps the Super Admin's own session untouched.
const secondaryApp = firebase.initializeApp(firebaseConfig, 'Secondary');

let currentAdmin = null; // { uid, email, role, branch }

/* ---- Auth ---- */
async function tryAdminLogin(){
  const email = document.getElementById('admin-email').value.trim();
  const password = document.getElementById('admin-pass').value;
  const msg = document.getElementById('admin-login-msg');
  if(!email || !password){ showMsg(msg,'Enter your email and password.','err'); return; }

  const existingAdmins = await fsList('admins');

  if(existingAdmins.length === 0){
    if(email.toLowerCase() !== DESIGNATED_SUPER_ADMIN_EMAIL.toLowerCase()){
      showMsg(msg,'No admin account exists yet, and only the designated Super Admin email can set one up.','err');
      return;
    }
    try{
      const cred = await firebase.auth().createUserWithEmailAndPassword(email, password);
      const saved = await fsSet('admins', cred.user.uid, { email, role:'super', note:'Super Admin (Founder)', active:true });
      if(!saved){ showMsg(msg,'Account created but the admin record failed to save. Please try logging in again.','err'); return; }
      currentAdmin = { uid: cred.user.uid, email, role:'super' };
      enterAdminPanel();
    }catch(e){
      showMsg(msg, e.message, 'err');
    }
    return;
  }

  try{
    const cred = await firebase.auth().signInWithEmailAndPassword(email, password);
    const rec = await fsGet('admins', cred.user.uid);
    if(!rec || !rec.active){
      await firebase.auth().signOut();
      showMsg(msg,'This account is not an active admin. Contact the Super Admin.','err');
      return;
    }
    currentAdmin = { uid: cred.user.uid, email, role: rec.role, branch: rec.branch };
    enterAdminPanel();
  }catch(e){
    showMsg(msg,'Incorrect email or password.','err');
  }
}

async function forgotPassword(){
  const email = document.getElementById('admin-email').value.trim();
  const msg = document.getElementById('admin-login-msg');
  if(!email){ showMsg(msg,'Enter your email address first, then click Forgot Password.','err'); return; }
  try{
    await firebase.auth().sendPasswordResetEmail(email);
    showMsg(msg,'Password reset email sent. Check your inbox.','ok');
  }catch(e){
    showMsg(msg, e.message, 'err');
  }
}

// Resume an existing session automatically on page reload.
firebase.auth().onAuthStateChanged(async (user)=>{
  if(user && !currentAdmin){
    const rec = await fsGet('admins', user.uid);
    if(rec && rec.active){
      currentAdmin = { uid: user.uid, email: user.email, role: rec.role, branch: rec.branch };
      enterAdminPanel();
    }
  }
});

function enterAdminPanel(){
  document.getElementById('admin-locked').classList.add('hidden');
  document.getElementById('admin-panel').classList.remove('hidden');
  document.getElementById('admin-whoami').textContent = currentAdmin.email + ' (' + (currentAdmin.role==='super'?'Super Admin':'Admin') + ')';
  document.getElementById('super-admin-section').classList.toggle('hidden', currentAdmin.role !== 'super');
  loadAll();
}
async function adminLogout(){
  await firebase.auth().signOut();
  currentAdmin = null;
  document.getElementById('admin-panel').classList.add('hidden');
  document.getElementById('admin-locked').classList.remove('hidden');
  document.getElementById('admin-email').value=''; document.getElementById('admin-pass').value='';
}

async function createAdmin(){
  const email = document.getElementById('na-email').value.trim();
  const password = document.getElementById('na-password').value;
  const msg = document.getElementById('na-msg');
  if(!email || !password){ showMsg(msg,'Enter an email and password.','err'); return; }
  if(password.length < 6){ showMsg(msg,'Password must be at least 6 characters.','err'); return; }
  try{
    const cred = await secondaryApp.auth().createUserWithEmailAndPassword(email, password);
    await secondaryApp.auth().signOut();
    const saved = await fsSet('admins', cred.user.uid, { email, role:'admin', note: document.getElementById('na-note').value.trim(), active:true });
    if(!saved){ showMsg(msg,'Account created but the admin record failed to save.','err'); return; }
    showMsg(msg,'Admin account created.','ok');
    document.getElementById('na-email').value=''; document.getElementById('na-password').value=''; document.getElementById('na-note').value='';
    loadAdmins();
  }catch(e){
    showMsg(msg, e.message, 'err');
  }
}
async function toggleAdminActive(uid){
  const rec = await fsGet('admins', uid);
  if(!rec) return;
  await fsSet('admins', uid, { active: !rec.active });
  loadAdmins();
}
async function loadAdmins(){
  const admins = await fsList('admins');
  document.querySelector('#admins-table tbody').innerHTML = admins.map(a=>
    `<tr><td>${esc(a.email)} ${a.role==='super'?'<span class="badge">Super</span>':''}</td><td>${esc(a.note||'—')}</td><td>${a.active?'Active':'Inactive'}</td>
     <td>${a.role!=='super' ? `<button class="btn small outline" onclick="toggleAdminActive('${a.id}')">${a.active?'Deactivate':'Reactivate'}</button>` : ''}</td></tr>`
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
