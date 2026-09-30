import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import { db, getDeviceId, seedLocal } from './db/db';
import { searchKnowledge } from './services/knowledge';
import { createAIProvider } from './services/ai';
import { assessRisk } from './services/triage';
import { enqueue, syncNow } from './services/sync';
import { api } from './services/api';
import './style.css';

function Layout() {
  const [online, setOnline] = useState(navigator.onLine);
  const [syncState, setSyncState] = useState('idle');

  useEffect(() => {
    const initialize = async () => { await seedLocal(); if (navigator.onLine) { setSyncState('syncing'); const result = await syncNow(); setSyncState(result.failed ? 'error' : 'synced'); } };
    initialize();
    const on = async () => { setOnline(true); setSyncState('syncing'); const result = await syncNow(); setSyncState(result.failed ? 'error' : 'synced'); };
    const off = () => setOnline(false);
    addEventListener('online', on); addEventListener('offline', off);
    return () => { removeEventListener('online', on); removeEventListener('offline', off); };
  }, []);

  return <div className="app min-h-screen">
    <header>
      <div><strong>Rural Health</strong><span className="sub">Offline-first healthcare</span></div>
      <span className={`status ${online ? 'on' : 'off'}`}>{online ? 'ONLINE' : 'OFFLINE'}{syncState === 'syncing' ? ' · SYNCING' : syncState === 'synced' ? ' · SYNCED' : syncState === 'error' ? ' · SYNC ERROR' : ''}</span>
    </header>
    <nav>{[['/','Dashboard'],['/chat','Chat'],['/assessment','Assessment'],['/history','History'],['/knowledge','Knowledge'],['/facilities','Facilities'],['/sync','Sync'],['/settings','Settings']].map(([path, label]) => <NavLink key={path} to={path}>{label}</NavLink>)}</nav>
    <main className="mx-auto"><Routes>
      <Route path="/" element={<Dashboard online={online} />} />
      <Route path="/chat" element={<Chat />} />
      <Route path="/assessment" element={<Assessment />} /><Route path="/history" element={<History />} />
      <Route path="/knowledge" element={<Knowledge />} />
      <Route path="/facilities" element={<Facilities />} />
      <Route path="/sync" element={<Sync />} />
      <Route path="/settings" element={<Settings />} />
    </Routes></main>
    <footer>Information support only — not a substitute for professional medical care.</footer>
  </div>;
}

function Dashboard({ online }) {
  return <><h1>Healthcare, even when offline.</h1><p className="lead">Access locally stored health information, basic risk assessment and rural care resources without continuous connectivity.</p><div className="grid"><Card to="/chat" title="Ask Health" text="Search the local healthcare knowledge base."/><Card to="/assessment" title="Check Symptoms" text="Run a basic safety-focused risk assessment."/><Card to="/knowledge" title="Health Library" text="Browse curated offline information."/><Card to="/facilities" title="Find Care" text="View saved PHCs and healthcare workers."/></div><div className="panel"><b>Current mode:</b> {online ? 'Connected — queued changes can synchronize.' : 'Offline — local features remain available.'}</div></>;
}
function Card({ to, title, text }) { return <NavLink className="card" to={to}><h2>{title}</h2><p>{text}</p><span>Open →</span></NavLink>; }

function Chat() {
  const [q, setQ] = useState(''); const [messages, setMessages] = useState([]); const [notice, setNotice] = useState('');
  useEffect(() => { db.conversations.orderBy('updatedAt').reverse().limit(10).toArray().then(async (conversations) => { const rows = []; for (const conversation of conversations) { const history = await db.messages.where('conversationId').equals(conversation.id).sortBy('createdAt'); if (history.length >= 2) rows.push({ q: history[history.length - 2].content, answer: history[history.length - 1].content }); } setMessages(rows.reverse()); }); }, []);
  async function ask(event) {
    event.preventDefault(); if (!q.trim()) return;
    const question = q.trim();
    const provider = createAIProvider('local');
    const response = await provider.answer(question);
    const answer = response.text;
    const conversationId = crypto.randomUUID(); const deviceId = await getDeviceId(); const now = Date.now();
    const userMessage = { id: crypto.randomUUID(), conversationId, role: 'user', content: question, createdAt: now };
    const assistantMessage = { id: crypto.randomUUID(), conversationId, role: 'assistant', content: answer, createdAt: now + 1 };
    const conversation = { id: conversationId, deviceId, title: question.slice(0, 80), updatedAt: now, messages: [userMessage, assistantMessage] };
    await db.conversations.put({ id: conversation.id, deviceId: conversation.deviceId, title: conversation.title, updatedAt: conversation.updatedAt });
    await db.messages.bulkAdd([userMessage, assistantMessage]);
    await enqueue({ entityType: 'conversation', entityId: conversationId, payload: conversation });
    setMessages((current) => [...current, { q: question, answer }]); setQ(''); setNotice(navigator.onLine ? 'Saved locally and queued for synchronization.' : 'Saved on this device. It will synchronize when connectivity returns.');
  }
  return <><h1>Health Chat</h1><p className="muted">Answers are retrieved from the local knowledge base. No cloud model is required.</p>{notice && <div className="panel notice">{notice}</div>}<div className="chat">{messages.map((m, i) => <div key={i} className="bubble"><b>You</b><p>{m.q}</p><b>Health information</b><p>{m.answer}</p></div>)}</div><form onSubmit={ask} className="row"><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Ask about fever, hygiene, warning signs..."/><button>Ask</button></form></>;
}

function History() {
  const [items, setItems] = useState([]);
  useEffect(() => { db.assessments.orderBy('createdAt').reverse().toArray().then(setItems); }, []);
  return <><h1>Assessment History</h1><p className="muted">Assessments are stored locally on this device and may be synchronized when connected.</p>{items.length ? <div className="list">{items.map((item) => <article className="panel" key={item.id}><div><b>{item.risk}</b><span className="right">{new Date(item.createdAt).toLocaleString()}</span></div><p>{item.symptoms}</p><small>Severity {item.severity}/5 · Duration {item.durationDays} day(s)</small><p>{item.reason}</p></article>)}</div> : <div className="panel">No assessments recorded on this device.</div>}</>;
}

function Assessment() {
  const [symptoms, setSymptoms] = useState(''); const [severity, setSeverity] = useState(1); const [durationDays, setDuration] = useState(1); const [result, setResult] = useState(null);
  async function run(event) { event.preventDefault(); if (!symptoms.trim()) return; const risk = assessRisk({ symptoms, severity, durationDays }); const id = crypto.randomUUID(); const deviceId = await getDeviceId(); const assessment = { id, deviceId, symptoms: symptoms.trim(), severity, durationDays, ...risk, createdAt: Date.now() }; await db.assessments.put(assessment); await enqueue({ entityType: 'assessment', entityId: id, payload: assessment }); setResult(risk); }
  return <><h1>Symptom Assessment</h1><p className="muted">Conservative demonstration triage only. It is not a diagnosis.</p><form className="panel form" onSubmit={run}><label>Symptoms<textarea required value={symptoms} onChange={(e) => setSymptoms(e.target.value)} placeholder="Describe symptoms..."/></label><label>Severity (1–5)<input type="number" min="1" max="5" value={severity} onChange={(e) => setSeverity(Number(e.target.value))}/></label><label>Duration (days)<input type="number" min="0" value={durationDays} onChange={(e) => setDuration(Number(e.target.value))}/></label><button>Assess risk</button></form>{result && <div className={`result ${result.risk.toLowerCase()}`}><h2>{result.risk}</h2><p>{result.reason}</p></div>}</>;
}

function Knowledge() {
  const [q, setQ] = useState(''); const [docs, setDocs] = useState([]);
  async function load(query = '') { const local = await searchKnowledge(query); setDocs(local); if (navigator.onLine) { try { const remote = await api.knowledge(query); if (remote.data?.length) { await db.knowledge.bulkPut(remote.data); setDocs(remote.data); } } catch { /* local-first fallback */ } } }
  useEffect(() => { load(''); }, []);
  return <><h1>Health Library</h1><div className="row"><input value={q} onChange={(e) => { setQ(e.target.value); load(e.target.value); }} placeholder="Search health topics"/></div><div className="list">{docs.map((d) => <article className="panel" key={d.id}><h2>{d.title}</h2><small>{d.category} · {d.source}</small><p>{d.content}</p></article>)}</div></>;
}

function Facilities() {
  const [facilities, setFacilities] = useState([]); const [workers, setWorkers] = useState([]);
  useEffect(() => { (async () => { const lf = await db.facilities.toArray(); const lw = await db.workers.toArray(); setFacilities(lf); setWorkers(lw); if (navigator.onLine) { try { const [f, w] = await Promise.all([api.facilities(), api.workers()]); if (f.data?.length) { await db.facilities.bulkPut(f.data); setFacilities(f.data); } if (w.data?.length) { await db.workers.bulkPut(w.data); setWorkers(w.data); } } catch {} } })(); }, []);
  return <><h1>Nearby Care Directory</h1><p className="muted">Directory records must be verified locally before relying on them.</p><h2>Facilities</h2>{facilities.map((f) => <div className="panel" key={f.id}><h2>{f.name}</h2><p>{f.type} · {f.location}</p><p>{f.contact} · {f.hours}</p></div>)}<h2>Healthcare Workers</h2>{workers.map((w) => <div className="panel" key={w.id}><h2>{w.name}</h2><p>{w.role} · {w.facility}</p><p>{w.contact}</p></div>)}</>;
}

function Sync() { const [items, setItems] = useState([]); const refresh = () => db.syncQueue.orderBy('createdAt').reverse().toArray().then(setItems); useEffect(refresh, []); async function go() { await syncNow(); refresh(); } return <><h1>Sync Center</h1><div className="panel"><p>Offline changes remain local until synchronization succeeds.</p><button onClick={go}>Sync now</button></div><div className="list">{items.map((x) => <div className="panel" key={x.id}><b>{x.entityType}</b> · {x.operation}<span className="right">{x.status}</span>{x.error && <p className="error">{x.error}</p>}</div>)}</div></>; }

function Settings() { const [deviceId, setDeviceId] = useState(''); useEffect(() => { getDeviceId().then(setDeviceId); }, []); return <><h1>Settings</h1><div className="panel"><h2>Privacy</h2><p>This MVP does not require an account. A random device identifier is used only to associate local sync operations.</p><small>Device ID: {deviceId}</small></div><div className="panel"><h2>Language</h2><p>English is the current demonstration language. The data model is language-aware so regional translations can be added later.</p></div></>; }

export default function App() { return <BrowserRouter><Layout /></BrowserRouter>; }