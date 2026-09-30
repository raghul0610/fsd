import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import { db, getDeviceId, seedLocal } from './db/db';
import { searchKnowledge } from './services/knowledge';
import { createAIProvider } from './services/ai';
import { assessRisk } from './services/triage';
import { enqueue, syncNow } from './services/sync';
import { api } from './services/api';
import { LANGUAGES, getLanguage, setLanguage as saveLanguage, t } from './services/i18n';
import './style.css';

function Layout() {
  const [online, setOnline] = useState(navigator.onLine);
  const [syncState, setSyncState] = useState('idle');
  const [language, setLanguage] = useState(getLanguage());

  useEffect(() => {
    let mounted = true;
    const initialize = async () => {
      await seedLocal();
      if (mounted && navigator.onLine) {
        setSyncState('syncing');
        const result = await syncNow();
        if (mounted) setSyncState(result.failed ? 'error' : 'synced');
      }
    };

    initialize();
    const on = async () => {
      setOnline(true);
      setSyncState('syncing');
      const result = await syncNow();
      if (mounted) setSyncState(result.failed ? 'error' : 'synced');
    };
    const off = () => setOnline(false);

    addEventListener('online', on);
    addEventListener('offline', off);
    return () => {
      mounted = false;
      removeEventListener('online', on);
      removeEventListener('offline', off);
    };
  }, []);

  function changeLanguage(code) {
    const next = saveLanguage(code);
    setLanguage(next);
  }

  const nav = [
    ['/', 'dashboard'],
    ['/chat', 'chat'],
    ['/assessment', 'assessment'],
    ['/history', 'history'],
    ['/knowledge', 'knowledge'],
    ['/facilities', 'facilities'],
    ['/sync', 'sync'],
    ['/settings', 'settings'],
  ];

  return <div className="app min-h-screen">
    <header>
      <div><strong>{t(language, 'brand')}</strong><span className="sub">{t(language, 'offlineFirst')}</span></div>
      <span className={`status ${online ? 'on' : 'off'}`}>
        {online ? t(language, 'online') : t(language, 'offline')}
        {syncState === 'syncing' ? ` · ${t(language, 'syncing')}` : syncState === 'synced' ? ` · ${t(language, 'synced')}` : syncState === 'error' ? ` · ${t(language, 'syncError')}` : ''}
      </span>
    </header>
    <nav>{nav.map(([path, key]) => <NavLink key={path} to={path}>{t(language, key)}</NavLink>)}</nav>
    <main className="mx-auto"><Routes>
      <Route path="/" element={<Dashboard online={online} language={language} />} />
      <Route path="/chat" element={<Chat language={language} />} />
      <Route path="/assessment" element={<Assessment language={language} />} />
      <Route path="/history" element={<History language={language} />} />
      <Route path="/knowledge" element={<Knowledge language={language} />} />
      <Route path="/facilities" element={<Facilities language={language} />} />
      <Route path="/sync" element={<Sync language={language} />} />
      <Route path="/settings" element={<Settings language={language} onLanguageChange={changeLanguage} />} />
    </Routes></main>
    <footer>{t(language, 'footer')}</footer>
  </div>;
}

function Dashboard({ online, language }) {
  return <><h1>{t(language, 'dashboardTitle')}</h1><p className="lead">{t(language, 'dashboardLead')}</p><div className="grid">
    <Card to="/chat" title={t(language, 'askHealth')} text={t(language, 'askHealthText')} language={language} />
    <Card to="/assessment" title={t(language, 'checkSymptoms')} text={t(language, 'checkSymptomsText')} language={language} />
    <Card to="/knowledge" title={t(language, 'healthLibrary')} text={t(language, 'healthLibraryText')} language={language} />
    <Card to="/facilities" title={t(language, 'findCare')} text={t(language, 'findCareText')} language={language} />
  </div><div className="panel"><b>{t(language, 'currentMode')}</b> {online ? t(language, 'connectedMode') : t(language, 'offlineMode')}</div></>;
}

function Card({ to, title, text, language }) {
  return <NavLink className="card" to={to}><h2>{title}</h2><p>{text}</p><span>{t(language, 'open')} →</span></NavLink>;
}

function Chat({ language }) {
  const [q, setQ] = useState('');
  const [messages, setMessages] = useState([]);
  const [notice, setNotice] = useState('');

  useEffect(() => {
    (async () => {
      const conversations = await db.conversations.orderBy('updatedAt').reverse().limit(10).toArray();
      const rows = [];
      for (const conversation of conversations) {
        const history = await db.messages.where('conversationId').equals(conversation.id).sortBy('createdAt');
        if (history.length >= 2) {
          rows.push({ q: history[history.length - 2].content, answer: history[history.length - 1].content });
        }
      }
      setMessages(rows.reverse());
    })();
  }, []);

  async function getLocalContext() {
    const [assessments, conversations] = await Promise.all([
      db.assessments.orderBy('createdAt').reverse().limit(5).toArray(),
      db.conversations.orderBy('updatedAt').reverse().limit(5).toArray(),
    ]);
    return { assessments, conversations };
  }

  async function ask(event) {
    event.preventDefault();
    if (!q.trim()) return;

    const question = q.trim();
    const context = await getLocalContext();
    const provider = createAIProvider('local');
    const response = await provider.answer(question, { ...context, language });
    const answer = response.text;

    const conversationId = crypto.randomUUID();
    const deviceId = await getDeviceId();
    const now = Date.now();
    const userMessage = { id: crypto.randomUUID(), conversationId, role: 'user', content: question, createdAt: now };
    const assistantMessage = { id: crypto.randomUUID(), conversationId, role: 'assistant', content: answer, createdAt: now + 1 };
    const conversation = { id: conversationId, deviceId, title: question.slice(0, 80), updatedAt: now, messages: [userMessage, assistantMessage] };

    await db.conversations.put({ id: conversation.id, deviceId: conversation.deviceId, title: conversation.title, updatedAt: conversation.updatedAt });
    await db.messages.bulkAdd([userMessage, assistantMessage]);
    await enqueue({ entityType: 'conversation', entityId: conversationId, payload: conversation });

    setMessages((current) => [...current, { q: question, answer }]);
    setQ('');
    setNotice(navigator.onLine ? t(language, 'savedQueued') : t(language, 'savedOffline'));
  }

  return <><h1>{t(language, 'healthChat')}</h1>
    <p className="muted">{t(language, 'chatHelp')}</p>
    {notice && <div className="panel notice">{notice}</div>}
    <div className="chat">{messages.map((m, i) => <div key={i} className="bubble"><b>{t(language, 'you')}</b><p>{m.q}</p><b>{t(language, 'healthInformation')}</b><p>{m.answer}</p></div>)}</div>
    <form onSubmit={ask} className="row"><input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t(language, 'askPlaceholder')} /><button>{t(language, 'ask')}</button></form>
  </>;
}

function History({ language }) {
  const [items, setItems] = useState([]);
  useEffect(() => { db.assessments.orderBy('createdAt').reverse().toArray().then(setItems); }, []);
  return <><h1>{t(language, 'assessmentHistory')}</h1><p className="muted">{t(language, 'assessmentHistoryHelp')}</p>
    {items.length ? <div className="list">{items.map((item) => <article className="panel" key={item.id}><div><b>{item.risk}</b><span className="right">{new Date(item.createdAt).toLocaleString()}</span></div><p>{item.symptoms}</p><small>{t(language, 'severity')} {item.severity}/5 · {t(language, 'duration')} {item.durationDays}</small><p>{translateRiskReason(language, item.risk)}</p></article>)}</div> : <div className="panel">{t(language, 'noAssessments')}</div>}</>;
}

function translateRiskReason(language, risk) {
  const reasons = {
    en: {
      CRITICAL: 'A potential emergency warning sign was detected. Seek urgent professional or emergency care.',
      MODERATE: 'Symptoms may need professional evaluation, especially if persistent or worsening.',
      LOW: 'No critical rule was triggered. Monitor symptoms and seek professional care if they worsen or persist.',
    },
    ta: {
      CRITICAL: 'அவசர எச்சரிக்கை அறிகுறி இருக்கலாம். உடனடி மருத்துவ அல்லது அவசர சிகிச்சையைப் பெறுங்கள்.',
      MODERATE: 'அறிகுறிகள் தொடர்ந்து நீடித்தாலோ மோசமடைந்தாலோ மருத்துவ மதிப்பீடு தேவைப்படலாம்.',
      LOW: 'முக்கியமான ஆபத்து விதி எதுவும் செயல்படவில்லை. அறிகுறிகள் மோசமடைந்தாலோ தொடர்ந்து இருந்தாலோ மருத்துவ உதவியைப் பெறுங்கள்.',
    },
    hi: {
      CRITICAL: 'संभावित आपातकालीन चेतावनी संकेत मिला है। तुरंत पेशेवर या आपातकालीन चिकित्सा सहायता लें।',
      MODERATE: 'लक्षण लगातार रहें या बिगड़ें तो पेशेवर चिकित्सा मूल्यांकन की आवश्यकता हो सकती है।',
      LOW: 'कोई गंभीर जोखिम नियम सक्रिय नहीं हुआ। लक्षण बिगड़ें या बने रहें तो चिकित्सा सहायता लें।',
    },
  };
  return reasons[language]?.[risk] || reasons.en[risk] || '';
}

function Assessment({ language }) {
  const [symptoms, setSymptoms] = useState('');
  const [severity, setSeverity] = useState(1);
  const [durationDays, setDuration] = useState(1);
  const [result, setResult] = useState(null);

  async function run(event) {
    event.preventDefault();
    if (!symptoms.trim()) return;
    const risk = assessRisk({ symptoms, severity, durationDays });
    const id = crypto.randomUUID();
    const deviceId = await getDeviceId();
    const assessment = { id, deviceId, symptoms: symptoms.trim(), severity, durationDays, ...risk, createdAt: Date.now() };
    await db.assessments.put(assessment);
    await enqueue({ entityType: 'assessment', entityId: id, payload: assessment });
    setResult(risk);
  }

  return <><h1>{t(language, 'symptomAssessment')}</h1><p className="muted">{t(language, 'triageWarning')}</p>
    <form className="panel form" onSubmit={run}>
      <label>{t(language, 'symptoms')}<textarea required value={symptoms} onChange={(e) => setSymptoms(e.target.value)} placeholder={t(language, 'symptomsPlaceholder')} /></label>
      <label>{t(language, 'severity')}<input type="number" min="1" max="5" value={severity} onChange={(e) => setSeverity(Number(e.target.value))} /></label>
      <label>{t(language, 'duration')}<input type="number" min="0" value={durationDays} onChange={(e) => setDuration(Number(e.target.value))} /></label>
      <button>{t(language, 'assessRisk')}</button>
    </form>
    {result && <div className={`result ${result.risk.toLowerCase()}`}><h2>{result.risk}</h2><p>{translateRiskReason(language, result.risk)}</p></div>}
  </>;
}

function Knowledge({ language }) {
  const [q, setQ] = useState('');
  const [docs, setDocs] = useState([]);
  async function load(query = '') {
    const local = await searchKnowledge(query, language);
    setDocs(local);
    if (navigator.onLine) {
      try {
        const remote = await api.knowledge(query, language);
        if (remote.data?.length) {
          await db.knowledge.bulkPut(remote.data);
          setDocs(remote.data);
        }
      } catch {
        setDocs(local);
      }
    }
  }
  useEffect(() => { load(''); }, [language]);
  return <><h1>{t(language, 'healthLibrary')}</h1><div className="row"><input value={q} onChange={(e) => { setQ(e.target.value); load(e.target.value); }} placeholder={t(language, 'librarySearch')} /></div>
    <div className="list">{docs.length ? docs.map((d) => <article className="panel" key={d.id}><h2>{d.title}</h2><small>{d.category} · {d.source}</small><p>{d.content}</p></article>) : <div className="panel">{t(language, 'noLanguageData')}</div>}</div></>;
}

function Facilities({ language }) {
  const [facilities, setFacilities] = useState([]);
  const [workers, setWorkers] = useState([]);
  useEffect(() => {
    (async () => {
      const lf = await db.facilities.toArray();
      const lw = await db.workers.toArray();
      setFacilities(lf);
      setWorkers(lw);
      if (navigator.onLine) {
        try {
          const [f, w] = await Promise.all([api.facilities(), api.workers()]);
          if (f.data?.length) { await db.facilities.bulkPut(f.data); setFacilities(f.data); }
          if (w.data?.length) { await db.workers.bulkPut(w.data); setWorkers(w.data); }
        } catch { setFacilities(lf); setWorkers(lw); }
      }
    })();
  }, []);

  return <><h1>{t(language, 'nearbyCare')}</h1><p className="muted">{t(language, 'directoryWarning')}</p>
    <h2>{t(language, 'facilities')}</h2>{facilities.map((f) => <div className="panel" key={f.id}><h2>{f.name}</h2><p>{f.type} · {f.location}</p><p>{f.contact} · {f.hours}</p></div>)}
    <h2>{t(language, 'workers')}</h2>{workers.map((w) => <div className="panel" key={w.id}><h2>{w.name}</h2><p>{w.role} · {w.facility}</p><p>{w.contact}</p></div>)}
  </>;
}

function Sync({ language }) {
  const [items, setItems] = useState([]);
  const refresh = async () => setItems(await db.syncQueue.orderBy('createdAt').reverse().toArray());
  useEffect(() => { refresh(); }, []);
  async function go() { await syncNow(); await refresh(); }
  return <><h1>{t(language, 'syncCenter')}</h1><div className="panel"><p>{t(language, 'syncHelp')}</p><button onClick={go}>{t(language, 'syncNow')}</button></div><div className="list">{items.map((x) => <div className="panel" key={x.id}><b>{x.entityType}</b> · {x.operation}<span className="right">{x.status}</span>{x.error && <p className="error">{x.error}</p>}</div>)}</div></>;
}

function Settings({ language, onLanguageChange }) {
  const [deviceId, setDeviceId] = useState('');
  useEffect(() => { getDeviceId().then(setDeviceId); }, []);
  return <><h1>{t(language, 'settings')}</h1>
    <div className="panel"><h2>{t(language, 'privacy')}</h2><p>{t(language, 'privacyText')}</p><small>Device ID: {deviceId}</small></div>
    <div className="panel"><h2>{t(language, 'language')}</h2><p>{t(language, 'languageHelp')}</p><div className="row">{LANGUAGES.map((item) => <button type="button" key={item.code} onClick={() => onLanguageChange(item.code)} aria-pressed={language === item.code}>{item.nativeName}</button>)}</div></div>
  </>;
}

export default function App() {
  return <BrowserRouter><Layout /></BrowserRouter>;
}
