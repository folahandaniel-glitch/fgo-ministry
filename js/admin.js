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

  const link = document.getElementById('s-attach-link').value.trim();
  const fileInput = document.getElementById('s-attach-file');
  let attachment = null;
  if(link){
    attachment = { link };
  } else if(fileInput.files.length){
    const file = fileInput.files[0];
    if(file.size > MATERIAL_MAX_BYTES){ showMsg(msg,'File is too large for the database (limit ~700KB). Paste an external link instead.','err'); return; }
    attachment = { name: file.name, mimeType: file.type || 'application/octet-stream', data: await fileToBase64(file) };
  }

  const id = await fsAdd('sermons', { title, scripture: document.getElementById('s-scripture').value.trim(), content: document.getElementById('s-content').value.trim(), attachment });
  if(!id){ showMsg(msg,'Save failed. Please try again.','err'); return; }
  showMsg(msg, 'Sermon published.', 'ok');
  ['s-title','s-scripture','s-content','s-attach-link'].forEach(i=>document.getElementById(i).value='');
  fileInput.value='';
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

/* ---- Bible School: Fee & Passcodes ---- */
async function saveSchoolFee(){
  const amount = parseFloat(document.getElementById('sf-amount').value) || 0;
  const msg = document.getElementById('sf-msg');
  const saved = await fsSet('config', 'schoolfee', { amount });
  if(!saved){ showMsg(msg,'Save failed. Please try again.','err'); return; }
  showMsg(msg, 'Bible School fee updated.', 'ok');
}
async function loadSchoolFee(){
  const cfg = await fsGet('config', 'schoolfee');
  if(cfg) document.getElementById('sf-amount').value = cfg.amount;
}

function randomPasscode(){
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for(let i=0;i<8;i++) code += chars[Math.floor(Math.random()*chars.length)];
  return code;
}
async function generatePasscodes(){
  const qty = parseInt(document.getElementById('pc-qty').value) || 1;
  const msg = document.getElementById('pc-msg');
  for(let i=0;i<qty;i++){
    const code = randomPasscode();
    await fsSet('passcodes', code, { code, used:false, usedBy:null, usedAt:null });
  }
  showMsg(msg, qty + ' passcode(s) generated below.', 'ok');
  loadPasscodes();
}
async function loadPasscodes(){
  const codes = await fsList('passcodes');
  document.querySelector('#passcodes-table tbody').innerHTML = codes.map(c=>
    `<tr><td style="font-family:monospace; letter-spacing:1px;">${esc(c.id)}</td><td><span class="badge">${c.used?'Used':'Unused'}</span></td><td>${esc(c.usedBy||'—')}</td></tr>`
  ).join('') || '<tr><td colspan="3" style="color:var(--muted);">No passcodes generated yet.</td></tr>';
}

/* ---- Bible School: Courses ---- */
async function createCourse(){
  const name = document.getElementById('co-name').value.trim();
  const msg = document.getElementById('co-msg');
  if(!name){ showMsg(msg,'Enter a course name.','err'); return; }
  const id = await fsAdd('courses', { name, desc: document.getElementById('co-desc').value.trim() });
  if(!id){ showMsg(msg,'Save failed. Please try again.','err'); return; }
  showMsg(msg, 'Course added.', 'ok');
  document.getElementById('co-name').value=''; document.getElementById('co-desc').value='';
  loadCourses();
}
async function deleteCourse(id){
  if(!confirm('Delete this course? Its exam questions will remain on record but be unreachable.')) return;
  await fsDelete('courses', id);
  loadCourses();
}
async function loadCourses(){
  const courses = await fsList('courses');
  const examsets = await fsList('examsets');
  document.querySelector('#courses-table tbody').innerHTML = courses.map(c=>{
    const set = examsets.find(e=>e.id===c.id);
    const qcount = set ? (set.questions||[]).length : 0;
    return `<tr><td>${esc(c.name)}</td><td>${esc(c.desc||'—')}</td><td>${qcount}</td><td><button class="btn small outline" onclick="deleteCourse('${c.id}')">Delete</button></td></tr>`;
  }).join('') || '<tr><td colspan="4" style="color:var(--muted);">No courses yet.</td></tr>';

  const sel = document.getElementById('ex-upload-course');
  if(sel) sel.innerHTML = courses.map(c=>`<option value="${c.id}">${esc(c.name)}</option>`).join('') || '<option disabled>No courses yet</option>';
}

/* ---- Bible School: DOCX exam upload ---- */
function parseQuestionsFromText(text){
  const lines = text.split('\n').map(l=>l.trim()).filter(l=>l.length>0);
  const questions = [];
  let cur = null;
  const qRe = /^\d+[\.\)]\s*(.+)/;
  const optRe = /^(\*)?\s*([A-Da-d])[\.\)]\s*(.+)/;
  for(const line of lines){
    const qm = line.match(qRe);
    const om = line.match(optRe);
    if(qm && !om){
      if(cur && cur.opts.length>=2) questions.push(cur);
      cur = { q: qm[1].trim(), opts: [], a: 0 };
    } else if(om && cur){
      const isCorrect = !!om[1];
      cur.opts.push(om[3].trim());
      if(isCorrect) cur.a = cur.opts.length - 1;
    }
  }
  if(cur && cur.opts.length>=2) questions.push(cur);
  return questions;
}

async function parseExamDocx(){
  const fileInput = document.getElementById('ex-upload-file');
  const msg = document.getElementById('ex-upload-msg');
  const previewBox = document.getElementById('ex-preview');
  if(!fileInput.files.length){ showMsg(msg,'Choose a .docx file first.','err'); return; }
  if(typeof mammoth === 'undefined'){ showMsg(msg,'The document reader failed to load. Check your connection and try again.','err'); return; }
  const file = fileInput.files[0];
  const reader = new FileReader();
  reader.onload = async function(){
    try{
      const result = await mammoth.extractRawText({ arrayBuffer: reader.result });
      const questions = parseQuestionsFromText(result.value);
      if(questions.length === 0){
        previewBox.innerHTML = '<div class="msg err show">No questions detected. Check the format shown above and try again.</div>';
        return;
      }
      window.__pendingExamQuestions = questions;
      previewBox.innerHTML = '<h4 class="sans" style="color:var(--gold-soft); font-size:0.9rem;">' + questions.length + ' question(s) detected — review before saving:</h4>' +
        questions.map((q,i)=>`<div class="sans" style="margin-bottom:10px;"><div>${i+1}. ${esc(q.q)}</div>` +
          q.opts.map((o,oi)=>`<div style="font-size:0.82rem; color:${oi===q.a?'#a8e6bf':'var(--muted)'}; padding:2px 0;">${oi===q.a?'✓ ':'&nbsp;&nbsp;&nbsp;'}${esc(o)}</div>`).join('') +
        `</div>`).join('') +
        '<button class="btn" onclick="saveExamSet()">Save This Exam</button>';
    }catch(err){
      previewBox.innerHTML = '<div class="msg err show">Could not read that file. Make sure it is a .docx file.</div>';
    }
  };
  reader.readAsArrayBuffer(file);
}
async function saveExamSet(){
  const msg = document.getElementById('ex-upload-msg');
  const courseId = document.getElementById('ex-upload-course').value;
  const qs = window.__pendingExamQuestions || [];
  if(qs.length===0){ showMsg(msg,'Nothing to save.','err'); return; }
  const saved = await fsSet('examsets', courseId, { questions: qs });
  if(!saved){ showMsg(msg,'Save failed. Please try again.','err'); return; }
  showMsg(msg, 'Exam saved for this course.', 'ok');
  document.getElementById('ex-preview').innerHTML = '';
  loadCourses();
}

/* ---- Bible Trivia ---- */
let triviaQuestionRows = [];
let editingTriviaCategoryId = null;

function addTriviaQuestionRow(){
  triviaQuestionRows.push({ q:'', opts:['','','',''], a:0 });
  renderTriviaQuestionBuilder();
}
function removeTriviaQuestionRow(idx){ triviaQuestionRows.splice(idx,1); renderTriviaQuestionBuilder(); }
function updateTriviaQuestion(idx, val){ triviaQuestionRows[idx].q = val; }
function updateTriviaOption(idx, optIdx, val){ triviaQuestionRows[idx].opts[optIdx] = val; }
function updateTriviaCorrect(idx, val){ triviaQuestionRows[idx].a = parseInt(val); }

function renderTriviaQuestionBuilder(){
  document.getElementById('tv-question-builder').innerHTML = triviaQuestionRows.map((row,idx)=>`
    <div class="sans" style="border:1px solid var(--line); border-radius:8px; padding:12px; margin-bottom:10px;">
      <input placeholder="Question ${idx+1}" value="${esc(row.q)}" oninput="updateTriviaQuestion(${idx},this.value)" style="margin-bottom:8px;">
      ${row.opts.map((o,oi)=>`
        <div style="display:flex; align-items:center; gap:8px; margin-bottom:6px;">
          <input type="radio" name="correct${idx}" value="${oi}" ${row.a===oi?'checked':''} onchange="updateTriviaCorrect(${idx},this.value)" style="width:auto;">
          <input placeholder="Option ${oi+1}" value="${esc(o)}" oninput="updateTriviaOption(${idx},${oi},this.value)" style="flex:1;">
        </div>
      `).join('')}
      <button class="btn small outline" onclick="removeTriviaQuestionRow(${idx})">Remove Question</button>
    </div>
  `).join('');
}

function triviaCategoryRowHTML(c, plays){
  return `<tr><td>${esc(c.name)}</td><td>${c.questions.length}</td><td>${plays||0}</td>
    <td><button class="btn small outline" onclick="editTriviaCategory('${c.id}')">Edit</button>
        <button class="btn small outline" onclick="deleteTriviaCategory('${c.id}')">Delete</button></td></tr>`;
}

async function saveTriviaCategory(){
  const name = document.getElementById('tv-cat-name').value.trim();
  const msg = document.getElementById('tv-msg');
  if(!name){ showMsg(msg,'Enter a category name.','err'); return; }
  const questions = triviaQuestionRows.filter(r=>r.q.trim() && r.opts.every(o=>o.trim()));
  if(questions.length===0){ showMsg(msg,'Add at least one complete question with all four options filled in.','err'); return; }
  let ok;
  if(editingTriviaCategoryId){
    ok = await fsSet('triviacategories', editingTriviaCategoryId, { name, questions });
  } else {
    ok = await fsAdd('triviacategories', { name, questions });
  }
  if(!ok){ showMsg(msg,'Save failed. Please try again.','err'); return; }
  showMsg(msg, editingTriviaCategoryId ? 'Trivia category updated.' : 'Trivia category saved.', 'ok');
  document.getElementById('tv-cat-name').value=''; triviaQuestionRows=[]; renderTriviaQuestionBuilder();
  document.getElementById('tv-save-btn').textContent = 'Save Category';
  document.getElementById('tv-cancel-edit-btn').classList.add('hidden');
  editingTriviaCategoryId = null;
  loadTrivia();
}

async function editTriviaCategory(id){
  const cat = await fsGet('triviacategories', id);
  if(!cat) return;
  editingTriviaCategoryId = id;
  document.getElementById('tv-cat-name').value = cat.name;
  triviaQuestionRows = cat.questions.map(q=>({ q:q.q, opts:[...q.opts], a:q.a }));
  renderTriviaQuestionBuilder();
  document.getElementById('tv-save-btn').textContent = 'Update Category';
  document.getElementById('tv-cancel-edit-btn').classList.remove('hidden');
  document.getElementById('tv-cat-name').scrollIntoView({behavior:'smooth', block:'center'});
}
function cancelTriviaEdit(){
  editingTriviaCategoryId = null;
  document.getElementById('tv-cat-name').value = '';
  triviaQuestionRows = []; addTriviaQuestionRow();
  document.getElementById('tv-save-btn').textContent = 'Save Category';
  document.getElementById('tv-cancel-edit-btn').classList.add('hidden');
}
async function deleteTriviaCategory(id){
  if(!confirm('Delete this trivia category? Leaderboard scores for it will remain on record but be unreachable.')) return;
  await fsDelete('triviacategories', id);
  loadTrivia();
}

async function parseTriviaDocx(){
  const fileInput = document.getElementById('tv-upload-file');
  const msg = document.getElementById('tv-upload-msg');
  const previewBox = document.getElementById('tv-upload-preview');
  if(!fileInput.files.length){ showMsg(msg,'Choose a .docx file first.','err'); return; }
  if(typeof mammoth === 'undefined'){ showMsg(msg,'The document reader failed to load. Check your connection and try again.','err'); return; }
  const file = fileInput.files[0];
  const reader = new FileReader();
  reader.onload = async function(){
    try{
      const result = await mammoth.extractRawText({ arrayBuffer: reader.result });
      const questions = parseQuestionsFromText(result.value);
      if(questions.length === 0){
        previewBox.innerHTML = '<div class="msg err show">No questions detected. Check the format shown above and try again.</div>';
        return;
      }
      window.__pendingTriviaQuestions = questions;
      previewBox.innerHTML = '<h4 class="sans" style="color:var(--gold-soft); font-size:0.9rem;">' + questions.length + ' question(s) detected:</h4>' +
        questions.map((q,i)=>`<div class="sans" style="margin-bottom:10px;"><div>${i+1}. ${esc(q.q)}</div>` +
          q.opts.map((o,oi)=>`<div style="font-size:0.82rem; color:${oi===q.a?'#a8e6bf':'var(--muted)'}; padding:2px 0;">${oi===q.a?'✓ ':'&nbsp;&nbsp;&nbsp;'}${esc(o)}</div>`).join('') +
        `</div>`).join('') +
        '<button class="btn" onclick="applyTriviaDocxQuestions()">Add These to the Category</button>';
    }catch(err){
      previewBox.innerHTML = '<div class="msg err show">Could not read that file. Make sure it is a .docx file.</div>';
    }
  };
  reader.readAsArrayBuffer(file);
}
function applyTriviaDocxQuestions(){
  const qs = window.__pendingTriviaQuestions || [];
  if(qs.length === 0) return;
  triviaQuestionRows = triviaQuestionRows.filter(r=>r.q.trim() || r.opts.some(o=>o.trim()));
  qs.forEach(q => triviaQuestionRows.push({ q: q.q, opts: [...q.opts], a: q.a }));
  renderTriviaQuestionBuilder();
  document.getElementById('tv-upload-preview').innerHTML = '';
  document.getElementById('tv-upload-file').value = '';
  window.__pendingTriviaQuestions = null;
  showMsg(document.getElementById('tv-upload-msg'), qs.length + ' question(s) added below. Give the category a name and click Save.', 'ok');
}

const TRIVIA_STARTER_PACK = {
  name: 'General Bible Knowledge',
  questions: [
    { q:'Who built an ark to survive the flood?', opts:['Moses','Noah','Abraham','David'], a:1 },
    { q:'How many days and nights did it rain during the flood?', opts:['7','40','100','12'], a:1 },
    { q:'Who led the Israelites out of slavery in Egypt?', opts:['Joshua','Moses','Elijah','Samuel'], a:1 },
    { q:'What did God create on the first day?', opts:['Animals','Light','Man','The sun'], a:1 },
    { q:'Who was thrown into a den of lions?', opts:['Daniel','Jonah','Peter','Paul'], a:0 },
    { q:'What did Jesus turn water into at a wedding in Cana?', opts:['Oil','Bread','Wine','Milk'], a:2 },
    { q:'How many disciples did Jesus have?', opts:['10','12','7','15'], a:1 },
    { q:'Who was swallowed by a great fish?', opts:['Jonah','Job','Jeremiah','Jacob'], a:0 },
    { q:'What is the first book of the Bible?', opts:['Exodus','Genesis','Matthew','Psalms'], a:1 },
    { q:'Who defeated the giant Goliath?', opts:['Saul','Samson','David','Solomon'], a:2 },
  ]
};
async function addTriviaStarterPack(){
  const msg = document.getElementById('trivia-pack-msg');
  const existing = await fsList('triviacategories');
  if(existing.some(c=>c.name.toLowerCase()===TRIVIA_STARTER_PACK.name.toLowerCase())){
    showMsg(msg, 'This starter category already exists.', 'err'); return;
  }
  const id = await fsAdd('triviacategories', { name: TRIVIA_STARTER_PACK.name, questions: TRIVIA_STARTER_PACK.questions });
  if(!id){ showMsg(msg,'Save failed. Please try again.','err'); return; }
  showMsg(msg, 'Starter trivia pack added.', 'ok');
  loadTrivia();
}

async function loadTrivia(){
  const cats = await fsList('triviacategories');
  const scores = await fsList('triviascores');
  document.querySelector('#trivia-table tbody').innerHTML = cats.map(c=>{
    const plays = scores.filter(s=>s.categoryId===c.id).length;
    return triviaCategoryRowHTML(c, plays);
  }).join('') || '<tr><td colspan="4" style="color:var(--muted);">No trivia categories yet.</td></tr>';
}

/* ---- Forum moderation ---- */
async function loadForum(){
  const topics = await fsList('forumtopics');
  const posts = await fsList('forumposts');
  topics.sort((a,b)=> (b._createdAt?.seconds||0) - (a._createdAt?.seconds||0));
  document.querySelector('#forum-topics-table tbody').innerHTML = topics.map(t=>{
    const replies = posts.filter(p=>p.topicId===t.id).length;
    return `<tr><td>${esc(t.title)}</td><td><span class="badge">${esc(t.category)}</span></td><td>${esc(t.author)}</td><td>${replies}</td>
      <td><button class="btn small outline" onclick="viewForumTopicPosts('${t.id}','${esc(t.title).replace(/'/g,"\\'")}')">View</button>
          <button class="btn small outline" onclick="deleteForumTopic('${t.id}')">Delete</button></td></tr>`;
  }).join('') || '<tr><td colspan="5" style="color:var(--muted);">No topics yet.</td></tr>';
}
async function viewForumTopicPosts(topicId, title){
  const posts = (await fsList('forumposts')).filter(p=>p.topicId===topicId);
  posts.sort((a,b)=> (a._createdAt?.seconds||0) - (b._createdAt?.seconds||0));
  document.getElementById('forum-posts-title').textContent = 'Replies — ' + title;
  document.querySelector('#forum-posts-table tbody').innerHTML = posts.map(p=>
    `<tr><td>${esc(p.author)}</td><td style="max-width:320px;">${esc(p.message)}</td><td><button class="btn small outline" onclick="deleteForumPost('${p.id}','${topicId}','${esc(title).replace(/'/g,"\\'")}')">Delete</button></td></tr>`
  ).join('') || '<tr><td colspan="3" style="color:var(--muted);">No replies yet.</td></tr>';
  document.getElementById('forum-posts-panel').classList.remove('hidden');
}
async function deleteForumTopic(id){
  if(!confirm('Delete this topic and all its replies?')) return;
  const posts = (await fsList('forumposts')).filter(p=>p.topicId===id);
  for(const p of posts) await fsDelete('forumposts', p.id);
  await fsDelete('forumtopics', id);
  document.getElementById('forum-posts-panel').classList.add('hidden');
  loadForum();
}
async function deleteForumPost(postId, topicId, title){
  if(!confirm('Delete this reply?')) return;
  await fsDelete('forumposts', postId);
  viewForumTopicPosts(topicId, title);
  loadForum();
}

/* ---- Bible School: course materials ---- */
const MATERIAL_MAX_BYTES = 700 * 1024;
function fileToBase64(file){
  return new Promise((resolve,reject)=>{
    const reader = new FileReader();
    reader.onload = ()=> resolve(reader.result.split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
async function uploadCourseMaterial(){
  const courseSel = document.getElementById('cm-course');
  const courseId = courseSel.value;
  const courseName = courseSel.options[courseSel.selectedIndex] ? courseSel.options[courseSel.selectedIndex].text : '';
  const link = document.getElementById('cm-link').value.trim();
  const fileInput = document.getElementById('cm-file');
  const msg = document.getElementById('cm-msg');
  if(!courseId){ showMsg(msg,'Add a course first, then come back here.','err'); return; }
  let data = { courseId, courseName, desc: document.getElementById('cm-desc').value.trim() };
  if(link){
    data.name = link; data.link = link;
  } else if(fileInput.files.length){
    const file = fileInput.files[0];
    if(file.size > MATERIAL_MAX_BYTES){ showMsg(msg,'File is too large for the database (limit ~700KB). Paste an external link instead.','err'); return; }
    data.name = file.name; data.mimeType = file.type || 'application/octet-stream'; data.sizeKB = Math.round(file.size/1024);
    data.data = await fileToBase64(file);
  } else {
    showMsg(msg,'Choose a file or paste a link.','err'); return;
  }
  const id = await fsAdd('coursematerials', data);
  if(!id){ showMsg(msg,'Save failed. Please try again.','err'); return; }
  showMsg(msg,'Material saved.','ok');
  fileInput.value=''; document.getElementById('cm-link').value=''; document.getElementById('cm-desc').value='';
  loadCourseMaterials();
}
async function deleteCourseMaterial(id){
  if(!confirm('Delete this material?')) return;
  await fsDelete('coursematerials', id);
  loadCourseMaterials();
}
async function loadCourseMaterials(){
  const courses = await fsList('courses');
  const sel = document.getElementById('cm-course');
  if(sel) sel.innerHTML = courses.map(c=>`<option value="${c.id}">${esc(c.name)}</option>`).join('') || '<option disabled>No courses yet</option>';
  const materials = await fsList('coursematerials');
  document.querySelector('#materials-table tbody').innerHTML = materials.map(m=>
    `<tr><td>${esc(m.courseName)}</td><td>${esc(m.name)}</td><td>${esc(m.desc||'—')}</td><td><button class="btn small outline" onclick="deleteCourseMaterial('${m.id}')">Delete</button></td></tr>`
  ).join('') || '<tr><td colspan="4" style="color:var(--muted);">No materials uploaded yet.</td></tr>';
}

/* ---- Children's Department ---- */
let kidPanelRows = [];
let editingKidLessonId = null;
let currentKidAttachment = null;

function addKidPanelRow(){
  kidPanelRows.push({ text:'', icon:'star' });
  renderKidPanelBuilder();
}
function removeKidPanelRow(idx){ kidPanelRows.splice(idx,1); renderKidPanelBuilder(); }
function updateKidPanelRow(idx, field, val){ kidPanelRows[idx][field] = val; }
function renderKidPanelBuilder(){
  const iconOpts = Object.keys(KID_ICONS);
  document.getElementById('k-panel-builder').innerHTML = kidPanelRows.map((row,idx)=>`
    <div class="panel-builder-row sans">
      <select onchange="updateKidPanelRow(${idx},'icon',this.value)">
        ${iconOpts.map(o=>`<option value="${o}" ${row.icon===o?'selected':''}>${o}</option>`).join('')}
      </select>
      <input placeholder="Panel ${idx+1} text..." value="${esc(row.text)}" oninput="updateKidPanelRow(${idx},'text',this.value)">
      <button class="btn small outline" onclick="removeKidPanelRow(${idx})">Remove</button>
    </div>
  `).join('');
}

async function getKidLessonsAdmin(){
  const lessons = await fsList('kidlessons');
  lessons.sort((a,b)=> (a.order||0) - (b.order||0));
  return lessons;
}

async function editKidLesson(id){
  const l = await fsGet('kidlessons', id);
  if(!l) return;
  editingKidLessonId = id;
  document.getElementById('k-title').value = l.title;
  document.getElementById('k-scripture').value = l.scripture || '';
  document.getElementById('k-order').value = l.order || '';
  kidPanelRows = l.panels.map(p=>({ text:p.text, icon:p.icon }));
  currentKidAttachment = l.attachment || null;
  renderKidPanelBuilder();
  document.getElementById('k-attach-link').value = (l.attachment && l.attachment.link) ? l.attachment.link : '';
  document.getElementById('k-save-btn').textContent = 'Update Lesson';
  document.getElementById('k-cancel-edit-btn').classList.remove('hidden');
  document.getElementById('k-title').scrollIntoView({behavior:'smooth', block:'center'});
}
function cancelKidEdit(){
  editingKidLessonId = null; currentKidAttachment = null;
  document.getElementById('k-title').value=''; document.getElementById('k-scripture').value=''; document.getElementById('k-order').value='';
  document.getElementById('k-attach-link').value=''; document.getElementById('k-attach-file').value='';
  kidPanelRows = []; addKidPanelRow();
  document.getElementById('k-save-btn').textContent = 'Save Lesson';
  document.getElementById('k-cancel-edit-btn').classList.add('hidden');
}
async function deleteKidLesson(id){
  if(!confirm('Delete this Bible story lesson?')) return;
  await fsDelete('kidlessons', id);
  loadKidLessons();
}

async function saveKidLesson(){
  const title = document.getElementById('k-title').value.trim();
  const msg = document.getElementById('k-msg');
  if(!title){ showMsg(msg,'Enter a lesson title.','err'); return; }
  const panels = kidPanelRows.filter(r=>r.text.trim().length>0);
  if(panels.length===0){ showMsg(msg,'Add at least one story panel.','err'); return; }

  const link = document.getElementById('k-attach-link').value.trim();
  const fileInput = document.getElementById('k-attach-file');
  let attachment = currentKidAttachment;
  if(link){
    attachment = { link };
  } else if(fileInput.files.length){
    const file = fileInput.files[0];
    if(file.size > MATERIAL_MAX_BYTES){ showMsg(msg,'Attachment too large (limit ~700KB). Use the link field instead.','err'); return; }
    attachment = { name: file.name, mimeType: file.type || 'application/octet-stream', data: await fileToBase64(file) };
  }

  const data = {
    title, scripture: document.getElementById('k-scripture').value.trim(),
    order: parseInt(document.getElementById('k-order').value) || 0,
    panels, attachment: attachment || null
  };

  let ok;
  if(editingKidLessonId){
    ok = await fsSet('kidlessons', editingKidLessonId, data);
  } else {
    ok = await fsAdd('kidlessons', data);
  }
  if(!ok){ showMsg(msg,'Save failed. Please try again.','err'); return; }
  showMsg(msg, editingKidLessonId ? 'Lesson updated.' : "Bible story lesson saved.", 'ok');
  cancelKidEdit();
  loadKidLessons();
}

async function loadKidLessons(){
  const lessons = await getKidLessonsAdmin();
  document.querySelector('#kids-table tbody').innerHTML = lessons.map(l=>
    `<tr><td>${l.order||'—'}</td><td>${esc(l.title)}</td><td>${esc(l.scripture||'—')}</td><td>${l.panels.length}</td><td>${l.attachment ? (l.attachment.link?'Link':'File') : '—'}</td>
     <td><button class="btn small outline" onclick="editKidLesson('${l.id}')">Edit</button>
         <button class="btn small outline" onclick="deleteKidLesson('${l.id}')">Delete</button></td></tr>`
  ).join('') || '<tr><td colspan="6" style="color:var(--muted);">No lessons yet.</td></tr>';
}

async function addGenesisPack(){
  const msg = document.getElementById('genesis-pack-msg');
  const existing = await getKidLessonsAdmin();
  const existingTitles = existing.map(l=>l.title.toLowerCase());
  let added = 0, skipped = 0;
  for(const story of GENESIS_STORY_PACK){
    if(existingTitles.includes(story.title.toLowerCase())){ skipped++; continue; }
    await fsAdd('kidlessons', { title: story.title, scripture: story.scripture, order: story.order, panels: story.panels, attachment: null });
    added++;
  }
  showMsg(msg, added + ' lesson(s) added' + (skipped ? ', ' + skipped + ' skipped (already existed)' : '') + '.', 'ok');
  loadKidLessons();
}

async function loadKidProgress(){
  const progress = await fsList('kidprogress');
  progress.sort((a,b)=> (b._createdAt?.seconds||0) - (a._createdAt?.seconds||0));
  document.querySelector('#kidprogress-table tbody').innerHTML = progress.map(p=>
    `<tr><td>${esc(p.child)}</td><td>${esc(p.lessonTitle)}</td></tr>`
  ).join('') || '<tr><td colspan="2" style="color:var(--muted);">No completions yet.</td></tr>';
}

/* ---- Bible School: enrollments & results ---- */
async function loadEnrollments(){
  const enrolls = await fsList('enrollments');
  document.querySelector('#enrollments-table tbody').innerHTML = enrolls.map(e=>
    `<tr><td>${esc(e.name)}</td><td>${esc(e.phone)}</td><td><span class="badge">${esc(e.role)}</span></td><td>${esc(e.courseName)}</td></tr>`
  ).join('') || '<tr><td colspan="4" style="color:var(--muted);">No enrollments yet.</td></tr>';
}
async function loadExamResults(){
  const results = await fsList('examresults');
  results.sort((a,b)=> (b._createdAt?.seconds||0) - (a._createdAt?.seconds||0));
  document.querySelector('#examresults-table tbody').innerHTML = results.map(r=>
    `<tr><td>${esc(r.name)}</td><td>${esc(r.courseName)}</td><td><span class="badge">${r.score}%</span></td></tr>`
  ).join('') || '<tr><td colspan="3" style="color:var(--muted);">No exam results yet.</td></tr>';
}

async function loadAll(){
  await loadMembers();
  await loadSermons();
  await loadEvents();
  await loadTestimonies();
  await loadGiving();
  await loadAboutFields();
  await loadSchoolFee();
  await loadPasscodes();
  await loadCourses();
  await loadCourseMaterials();
  await loadEnrollments();
  await loadExamResults();
  await loadKidLessons();
  await loadKidProgress();
  await loadTrivia();
  await loadForum();
  if(currentAdmin.role==='super') await loadAdmins();
}
