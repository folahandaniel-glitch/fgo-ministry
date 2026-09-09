/* ============================================================
   Shared helpers: Firestore CRUD, formatting, common UI behavior
   Loaded on every page after firebase-config.js
   ============================================================ */

/* ---- Firestore helpers (proper collections, not a flat store) ---- */
async function fsAdd(collection, data){
  try{
    const ref = await db.collection(collection).add({ ...data, _createdAt: firebase.firestore.FieldValue.serverTimestamp() });
    return ref.id;
  }catch(e){ console.error('fsAdd failed', collection, e); return null; }
}
async function fsSet(collection, id, data){
  try{
    await db.collection(collection).doc(id).set({ ...data, _updatedAt: firebase.firestore.FieldValue.serverTimestamp() }, { merge:true });
    return true;
  }catch(e){ console.error('fsSet failed', collection, id, e); return null; }
}
async function fsGet(collection, id){
  try{
    const doc = await db.collection(collection).doc(id).get();
    return doc.exists ? { id: doc.id, ...doc.data() } : null;
  }catch(e){ console.error('fsGet failed', collection, id, e); return null; }
}
async function fsList(collection, whereField, whereValue){
  try{
    let q = db.collection(collection);
    if(whereField) q = q.where(whereField, '==', whereValue);
    const snap = await q.get();
    return snap.docs.map(d=>({ id:d.id, ...d.data() }));
  }catch(e){ console.error('fsList failed', collection, e); return []; }
}
async function fsDelete(collection, id){
  try{ await db.collection(collection).doc(id).delete(); return true; }catch(e){ return null; }
}

/* ---- Storage health check (shows a banner if Firestore isn't reachable) ---- */
async function checkStorageHealth(){
  try{
    if(typeof db === 'undefined'){ return true; } // this page doesn't use Firestore — nothing to check
    const testId = await fsAdd('_healthcheck', { ping: true });
    if(!testId) throw new Error('add failed');
    const back = await fsGet('_healthcheck', testId);
    if(!back) throw new Error('read-back failed');
    await fsDelete('_healthcheck', testId);
    return true;
  }catch(e){
    const banner = document.getElementById('storage-warning');
    if(banner) banner.classList.remove('hidden');
    return false;
  }
}

/* ---- Small utilities ---- */
function esc(str){
  if(str === null || str === undefined) return '';
  return String(str).replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
function uid(){ return Date.now().toString(36) + Math.random().toString(36).slice(2,7); }
function showMsg(el, text, cls){
  if(!el) return;
  el.textContent = text; el.className = 'msg show ' + cls;
  setTimeout(()=>{ el.classList.remove('show'); }, 5000);
}
async function sha256Hex(text){
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf)).map(b=>b.toString(16).padStart(2,'0')).join('');
}
function formatDate(d){
  try{ return new Date(d).toLocaleDateString('en-GB',{day:'numeric',month:'long',year:'numeric'}); }catch(e){ return d; }
}

/* ---- Mobile nav toggle (shared markup across pages) ---- */
document.addEventListener('DOMContentLoaded', ()=>{
  const toggle = document.getElementById('nav-toggle');
  const nav = document.getElementById('main-nav');
  if(toggle && nav){
    toggle.addEventListener('click', ()=> nav.classList.toggle('open'));
  }
  checkStorageHealth();
});
