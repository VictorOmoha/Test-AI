// ============ API client + app state context ============

const TOKEN_KEY = 'testai.token';
const getToken = () => { try { return localStorage.getItem(TOKEN_KEY); } catch { return null; } };
const setToken = (t) => { try { t ? localStorage.setItem(TOKEN_KEY, t) : localStorage.removeItem(TOKEN_KEY); } catch {} };

async function apiCall(method, path, body) {
  const headers = { 'Content-Type': 'application/json' };
  const tok = getToken();
  if (tok) headers['Authorization'] = `Bearer ${tok}`;
  const opts = { method, headers };
  if (body !== undefined) opts.body = JSON.stringify(body);
  const res = await fetch(path, opts);
  let data = null;
  try { data = await res.json(); } catch { data = null; }
  if (!res.ok || (data && data.success === false)) {
    const msg = (data && data.message) || `Request failed (${res.status})`;
    const err = new Error(msg);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}
const api = {
  get:  (p)      => apiCall('GET',    p),
  post: (p, b)   => apiCall('POST',   p, b || {}),
  del:  (p)      => apiCall('DELETE', p),
};

const AppCtx = React.createContext(null);
const useApp = () => React.useContext(AppCtx);

// Map UI difficulty → backend enum
const mapDifficulty = (d) => ({ easy: 'Easy', medium: 'Medium', hard: 'Hard', mixed: 'Medium' })[d] || 'Medium';
// Map UI types object → backend array (filter out false; map keys)
const mapTypes = (types) => {
  const out = [];
  if (types.mcq) out.push('MCQ');
  if (types.tf) out.push('TrueFalse');
  if (types.short) out.push('ShortAnswer');
  return out.length ? out : ['MCQ'];
};

// Read file → base64 (strip data URL prefix)
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const s = String(reader.result || '');
      const idx = s.indexOf(',');
      resolve(idx >= 0 ? s.slice(idx + 1) : s);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Group history rows by calendar day label
function groupByDay(rows) {
  const fmt = (iso) => {
    const d = new Date(iso);
    const today = new Date();
    const ymd = (x) => `${x.getFullYear()}-${x.getMonth()}-${x.getDate()}`;
    const yd = new Date(today); yd.setDate(today.getDate() - 1);
    if (ymd(d) === ymd(today)) return 'Today · ' + d.toLocaleDateString(undefined, { month: 'long', day: 'numeric' });
    if (ymd(d) === ymd(yd))    return 'Yesterday · ' + d.toLocaleDateString(undefined, { month: 'long', day: 'numeric' });
    return d.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
  };
  const out = new Map();
  rows.forEach(r => {
    const key = fmt(r.created_at || r.start_time || new Date().toISOString());
    if (!out.has(key)) out.set(key, []);
    out.get(key).push(r);
  });
  return Array.from(out.entries()).map(([d, tests]) => ({ d, tests }));
}

// Icons — minimal 1.5px stroke, outline style
const icon = (path, size = 14) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
       stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"
       strokeLinejoin="round" className="nav-icon">
    {path}
  </svg>
);

const Icon = {
  home: () => icon(<><path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/></>),
  tests: () => icon(<><rect x="4" y="3" width="16" height="18" rx="1.5"/><path d="M8 8h8M8 12h8M8 16h5"/></>),
  history: () => icon(<><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>),
  chart: () => icon(<><path d="M3 20h18"/><path d="M6 16V10M11 16V6M16 16v-4M20 16v-8"/></>),
  folder: () => icon(<><path d="M3 6a1 1 0 0 1 1-1h5l2 2h8a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6z"/></>),
  user: () => icon(<><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/></>),
  gear: () => icon(<><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 0 1-4 0v-.1A1.7 1.7 0 0 0 9 19.4a1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 0 1 0-4h.1A1.7 1.7 0 0 0 4.6 9a1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 0 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 0 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></>),
  chat: () => icon(<><path d="M4 5h16v11H8l-4 4z"/></>),
  plus: () => icon(<><path d="M12 5v14M5 12h14"/></>),
  upload: () => icon(<><path d="M12 15V3M7 8l5-5 5 5M4 17v3h16v-3"/></>),
  arrow: () => icon(<><path d="M5 12h14M13 5l7 7-7 7"/></>),
  check: () => icon(<><path d="M4 12l5 5L20 6"/></>),
  x: () => icon(<><path d="M6 6l12 12M18 6L6 18"/></>),
  sparkle: () => icon(<><path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5L18 18M6 18l2.5-2.5M15.5 8.5L18 6"/></>),
  file: () => icon(<><path d="M6 3h9l4 4v14H6z"/><path d="M14 3v5h5"/></>),
  dots: () => icon(<><circle cx="5" cy="12" r="1.2"/><circle cx="12" cy="12" r="1.2"/><circle cx="19" cy="12" r="1.2"/></>),
  clock: () => icon(<><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>),
  flag: () => icon(<><path d="M5 21V4M5 4h13l-3 5 3 5H5"/></>),
  book: () => icon(<><path d="M4 4h6a3 3 0 0 1 3 3v14a2 2 0 0 0-2-2H4zM20 4h-6a3 3 0 0 0-3 3v14a2 2 0 0 1 2-2h7z"/></>),
};

window.Icon = Icon;
// Sidebar, topbar, tweaks panel, screen routing

const Sidebar = ({ screen, setScreen }) => {
  const app = useApp();
  const matCount = (app?.materials || []).length;
  const items = [
    { id: 'dashboard', label: 'Dashboard', icon: Icon.home, kbd: 'D' },
    { id: 'tests',     label: 'Tests',     icon: Icon.tests, kbd: 'T' },
    { id: 'history',   label: 'History',   icon: Icon.history },
    { id: 'analytics', label: 'Analytics', icon: Icon.chart },
    { id: 'materials', label: 'Materials', icon: Icon.folder, count: matCount > 0 ? matCount : undefined },
    { id: 'ask',       label: 'Ask',       icon: Icon.chat },
  ];
  return (
    <aside className="sidebar">
      <div className="wordmark">
        <span className="dot"/>
        <span>testai</span>
        <span className="sub">v2</span>
      </div>

      <div className="nav-section">Study</div>
      {items.map(it => (
        <div key={it.id}
             className={`nav-item ${screen === it.id ? 'active' : ''}`}
             onClick={() => setScreen(it.id)}>
          <it.icon/>
          <span>{it.label}</span>
          {it.count != null && <span className="count">{it.count}</span>}
          {it.kbd && <span className="kbd">{it.kbd}</span>}
        </div>
      ))}

      {app?.user && (
        <>
          <div className="nav-section">You</div>
          <div className={`nav-item ${screen === 'profile' ? 'active' : ''}`}
               onClick={() => setScreen('profile')}>
            <Icon.user/>
            <span>Profile</span>
          </div>
          <div className={`nav-item ${screen === 'settings' ? 'active' : ''}`}
               onClick={() => setScreen('settings')}>
            <Icon.gear/>
            <span>Settings</span>
          </div>
          <div style={{padding:'8px 14px 4px', fontSize:12, color:'var(--ink-3)', lineHeight:1.4, borderTop:'1px solid var(--rule-2)', marginTop:8}}>
            <div style={{fontSize:12.5, color:'var(--ink)', fontWeight:500, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis'}}>
              {app.user.name || app.user.email}
            </div>
            {app.user.name && (
              <div className="mono" style={{fontSize:10.5, color:'var(--ink-4)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis'}}>
                {app.user.email}
              </div>
            )}
          </div>
          <div className="nav-item"
               onClick={() => { if (window.confirm('Sign out?')) app.signOut(); }}
               style={{cursor:'pointer'}}>
            <Icon.x/>
            <span>Sign out</span>
          </div>
        </>
      )}

      <div className="sidebar-foot">
        <span className="pip"/>
        <span>{matCount} {matCount === 1 ? 'material' : 'materials'} imported</span>
      </div>
    </aside>
  );
};

const Topbar = ({ crumbs, right }) => (
  <div className="topbar">
    <div className="crumb">
      {crumbs.map((c, i) => (
        <React.Fragment key={i}>
          {i > 0 && <span className="sep">/</span>}
          <span className={i === crumbs.length - 1 ? 'here' : ''}>{c}</span>
        </React.Fragment>
      ))}
    </div>
    <div className="search">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4-4"/></svg>
      <span>Search materials, tests…</span>
      <span className="kbd">⌘K</span>
    </div>
    {right}
    <div className="avatar">ML</div>
  </div>
);

window.Sidebar = Sidebar;
window.Topbar = Topbar;
// Landing page — focused, confident, not SaaS.
const Landing = ({ navigate }) => (
  <div style={{minHeight:'100vh', background:'var(--bg)'}}>
    {/* Colored announcement bar */}
    <div style={{
      background:'var(--accent)', color:'white',
      padding:'8px 40px', textAlign:'center',
      fontSize:12.5, letterSpacing:'0.01em'
    }}>
      <span className="mono" style={{opacity:0.75, textTransform:'uppercase', letterSpacing:'0.14em', fontSize:10.5}}>New</span>
      <span style={{margin:'0 12px'}}>Ask questions about your material in plain English — with page citations.</span>
      <button onClick={() => navigate('ask')} style={{textDecoration:'underline', opacity:0.9, background:'none', border:'none', color:'inherit', cursor:'pointer', fontFamily:'inherit', fontSize:'inherit'}}>Try it →</button>
    </div>
    <div style={{
      maxWidth: 1180, margin: '0 auto',
      padding: '24px 40px', display:'flex', alignItems:'center', gap:24,
      borderBottom: '1px solid var(--rule)'
    }}>
      <div className="wordmark" style={{padding:0}}>
        <span className="dot"/>
        <span style={{fontSize:17}}>testai</span>
      </div>
      <nav style={{display:'flex', gap:24, marginLeft:40, fontSize:13.5, color:'var(--ink-2)'}}>
        <span>How it works</span>
        <span>Subjects</span>
        <span>Pricing</span>
        <span>Changelog</span>
      </nav>
      <div style={{marginLeft:'auto', display:'flex', gap:10, alignItems:'center'}}>
        <button onClick={() => navigate('auth')} style={{fontSize:13.5, color:'var(--ink-2)', background:'none', border:'none', cursor:'pointer', fontFamily:'inherit'}}>Sign in</button>
        <button onClick={() => navigate('dashboard')} className="btn btn-primary btn-sm">Start studying</button>
      </div>
    </div>

    {/* Hero */}
    <section style={{maxWidth:1180, margin:'0 auto', padding:'88px 40px 40px'}}>
      <div style={{display:'grid', gridTemplateColumns:'1.1fr 0.9fr', gap:72, alignItems:'start'}}>
        <div>
          <div className="eyebrow" style={{marginBottom:20}}>
            <span style={{color:'var(--accent-ink)'}}>●</span> Grounded in your notes. Not the internet.
          </div>
          <h1 className="page-title display" style={{fontSize:64, lineHeight:1.02, letterSpacing:'-0.03em'}}>
            Practice tests<br/>from <em style={{fontFamily:'var(--font-serif)', fontStyle:'italic', fontWeight:400}}>your</em> material.
          </h1>
          <p style={{marginTop:24, fontSize:17, lineHeight:1.5, color:'var(--ink-2)', maxWidth:'46ch'}}>
            Upload lecture notes, PDFs, or a slide deck.
            TestAI writes practice questions drawn from what's
            actually in the document — not trivia it made up.
          </p>
          <div style={{display:'flex', gap:12, marginTop:36, alignItems:'center'}}>
            <button onClick={() => navigate('materials')} className="btn btn-accent btn-lg">
              <Icon.upload/> Try it with a file
            </button>
            <button onClick={() => navigate('tests')} className="btn btn-ghost btn-lg">See a sample test</button>
          </div>
          <div style={{marginTop:48, display:'flex', gap:40, alignItems:'baseline', color:'var(--ink-3)', fontSize:13}}>
            <div>
              <div className="mono" style={{fontSize:22, color:'var(--ink)', fontWeight:500}}>41,203</div>
              <div>tests written this week</div>
            </div>
            <div>
              <div className="mono" style={{fontSize:22, color:'var(--ink)', fontWeight:500}}>PDF · DOCX · MD · TXT</div>
              <div>supported formats</div>
            </div>
          </div>
        </div>

        {/* Sample card — upload demo */}
        <div>
          <div className="card" style={{padding:0, overflow:'hidden'}}>
            <div style={{padding:'10px 14px', borderBottom:'1px solid var(--rule)',
                         display:'flex', alignItems:'center', gap:10, background:'var(--bg-sunken)'}}>
              <div style={{display:'flex', gap:6}}>
                <span style={{width:10, height:10, background:'var(--ink-4)', borderRadius:'50%', opacity:0.5}}/>
                <span style={{width:10, height:10, background:'var(--ink-4)', borderRadius:'50%', opacity:0.5}}/>
                <span style={{width:10, height:10, background:'var(--ink-4)', borderRadius:'50%', opacity:0.5}}/>
              </div>
              <span className="mono" style={{fontSize:11, color:'var(--ink-3)'}}>testai.app — new test</span>
            </div>
            <div style={{padding:22}}>
              <div style={{
                border:'1.5px dashed var(--rule)', borderRadius:8,
                padding:'28px 20px', textAlign:'center', marginBottom:16,
                background:'var(--bg-sunken)'
              }}>
                <Icon.upload size={22}/>
                <div style={{marginTop:10, fontSize:14, fontWeight:500}}>Drop a file, or paste notes</div>
                <div className="mono" style={{fontSize:11, color:'var(--ink-3)', marginTop:4}}>
                  lecture_7_thermodynamics.pdf
                </div>
              </div>
              <div style={{display:'flex', gap:8, flexWrap:'wrap', marginBottom:14}}>
                <span className="chip accent">12 questions</span>
                <span className="chip">Multiple choice</span>
                <span className="chip">20 min</span>
              </div>
              <div style={{padding:'14px 16px', background:'var(--bg-sunken)', borderRadius:6, marginBottom:10}}>
                <div className="mono" style={{fontSize:10, color:'var(--ink-3)', textTransform:'uppercase', letterSpacing:'0.12em'}}>Q1 · from pg. 14</div>
                <div style={{marginTop:8, fontSize:14, lineHeight:1.45}}>
                  In an isothermal expansion of an ideal gas, which quantity remains constant?
                </div>
                <div style={{marginTop:10, display:'flex', flexDirection:'column', gap:6, fontSize:13, color:'var(--ink-2)'}}>
                  <div>A. Internal energy</div>
                  <div>B. Volume</div>
                  <div>C. Pressure</div>
                  <div>D. Entropy</div>
                </div>
              </div>
              <div className="mono" style={{fontSize:11, color:'var(--ink-3)', textAlign:'right'}}>
                generated in 3.2s
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    {/* How it works — colored band per subject */}
    <section style={{
      maxWidth:1180, margin:'60px auto 0', padding:'0 40px'
    }}>
      <div className="eyebrow" style={{marginBottom:24}}>How it works</div>
      <div style={{
        display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:2,
        border:'1px solid var(--rule)', borderRadius:12, overflow:'hidden',
        background:'var(--rule)'
      }}>
        {[
          {n:'01', t:'Upload what you\'re studying', d:'A lecture PDF, your own notes, a chapter scan. We handle up to 200 pages per document.',
           bg:'var(--physics-soft)', fg:'var(--physics-ink)', swatch:'var(--physics)'},
          {n:'02', t:'Pick how you want to be tested', d:'Multiple choice, true/false, or short answer. Set difficulty, length, and whether to time it.',
           bg:'var(--biology-soft)', fg:'var(--biology-ink)', swatch:'var(--biology)'},
          {n:'03', t:'See what you actually know', d:'Wrong answers cite the exact page from your source. No hallucinated explanations.',
           bg:'var(--chem-soft)', fg:'var(--chem-ink)', swatch:'var(--chem)'}
        ].map(s => (
          <div key={s.n} style={{background:s.bg, padding:'40px 32px 48px', minHeight:220}}>
            <div style={{display:'flex', alignItems:'center', gap:10}}>
              <span style={{width:10, height:10, borderRadius:'50%', background:s.swatch}}/>
              <span className="mono" style={{fontSize:11, color:s.fg, letterSpacing:'0.14em', fontWeight:500}}>{s.n}</span>
            </div>
            <div style={{marginTop:20, fontSize:19, fontWeight:500, letterSpacing:'-0.015em', color:'var(--ink)'}}>{s.t}</div>
            <p style={{marginTop:10, color:'var(--ink-2)', fontSize:14, lineHeight:1.55}}>{s.d}</p>
          </div>
        ))}
      </div>
    </section>

    {/* Subjects strip — colored */}
    <section style={{maxWidth:1180, margin:'80px auto 0', padding:'0 40px'}}>
      <div className="eyebrow" style={{marginBottom:20}}>Works for anything you're studying</div>
      <div style={{display:'flex', gap:10, flexWrap:'wrap'}}>
        {[
          {l:'Organic chemistry', c:'chem'},
          {l:'Molecular biology', c:'biology'},
          {l:'Thermodynamics', c:'physics'},
          {l:'Linear algebra', c:'math'},
          {l:'American history', c:'hum'},
          {l:'Constitutional law', c:'hum'},
          {l:'Microeconomics', c:'math'},
          {l:'Neuroscience', c:'biology'},
          {l:'Classical mechanics', c:'physics'},
          {l:'Anatomy', c:'chem'},
        ].map((s,i) => (
          <span key={i} className={`chip ${s.c}`} style={{fontSize:13, padding:'6px 12px', fontFamily:'var(--font-sans)', fontWeight:500}}>
            <span className={`subj-dot ${s.c}`} style={{width:6, height:6}}/>
            {s.l}
          </span>
        ))}
      </div>
    </section>

    {/* Quote on colored background */}
    <section style={{
      background:'var(--accent)', color:'white',
      marginTop:80, padding:'96px 40px',
    }}>
      <div style={{maxWidth:960, margin:'0 auto', textAlign:'center'}}>
        <div className="mono" style={{fontSize:11, textTransform:'uppercase', letterSpacing:'0.16em', opacity:0.7, marginBottom:28}}>
          ● From a real user, not our marketing team
        </div>
        <p className="display" style={{fontSize:40, lineHeight:1.2, letterSpacing:'-0.025em', fontWeight:400, margin:0}}>
          "ChatGPT made up half the answers on my orgo quiz.
          With TestAI, the explanation links to the page in my textbook —
          so I know the answer is <em style={{fontFamily:'var(--font-serif)', fontStyle:'italic'}}>actually right</em>."
        </p>
        <div style={{marginTop:36, fontSize:13, opacity:0.85}}>
          <span className="mono">maya l.</span> · 2nd year biochem · UT Austin
        </div>
      </div>
    </section>

    {/* Footer */}
    <footer style={{borderTop:'1px solid var(--rule)', padding:'28px 40px',
                    maxWidth:1180, margin:'0 auto',
                    display:'flex', alignItems:'center', gap:24, fontSize:12.5, color:'var(--ink-3)'}}>
      <div className="mono">© testai 2026</div>
      <span>·</span>
      <span>Privacy</span>
      <span>Terms</span>
      <span>Changelog</span>
      <span style={{marginLeft:'auto'}} className="mono">v2.4.1</span>
    </footer>
  </div>
);

window.Landing = Landing;
// Dashboard — 3 hero variants via tweak

const Greeting = () => {
  const app = useApp();
  const now = new Date();
  const hour = now.getHours();
  const partOfDay = hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening';
  const dayLabel = now.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
  const firstName = app.user?.name?.split(/\s+/)[0] || app.user?.email?.split('@')[0] || 'there';
  const stats = app.stats;
  const materialCount = (app.materials || []).length;
  const subtitle = stats && stats.total_tests > 0
    ? <>You've taken <b>{stats.total_tests}</b> {stats.total_tests === 1 ? 'test' : 'tests'} — average <b>{Math.round(stats.avg_score)}%</b>. Pick up where you left off.</>
    : materialCount > 0
      ? <>You have <b>{materialCount}</b> {materialCount === 1 ? 'material' : 'materials'} ready. Start a test to build a baseline.</>
      : <>Upload some material and TestAI will write practice questions drawn straight from it.</>;

  return (
    <div style={{marginBottom:28}}>
      <div className="eyebrow" style={{marginBottom:8}}>{dayLabel}</div>
      <h1 className="page-title">Good {partOfDay}, {firstName}.</h1>
      <p className="page-sub">{subtitle}</p>
    </div>
  );
};

// Variant A — Upload is literally the hero
const HeroA = ({ navigate }) => {
  const app = useApp();
  const fileRef = React.useRef(null);
  const [dragOver, setDragOver] = React.useState(false);
  const [uploaded, setUploaded] = React.useState(null);
  const [busy, setBusy] = React.useState(false);

  const handleFiles = async (files) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    setUploaded(file.name);
    setBusy(true);
    try {
      const base64 = await fileToBase64(file);
      const data = await api.post('/api/tests/materials/import', {
        file_name: file.name,
        mime_type: file.type || '',
        file_content_base64: base64
      });
      await app.refreshMaterials();
      if (data.material?.id) {
        app.setSelectedMaterial({
          id: data.material.id,
          title: data.material.title || file.name,
          file_name: data.material.file_name || file.name,
          material_type: data.material.material_type,
        });
      }
      app.flashToast('ok', `"${file.name}" imported. Generating a test next.`);
      navigate('tests');
    } catch (err) {
      app.flashToast('error', err.message || 'Upload failed.');
      setUploaded(null);
    } finally {
      setBusy(false);
    }
  };

  const recent = (app.materials || []).slice(0, 3);

  return (
  <div className="card" style={{padding:0, overflow:'hidden', marginBottom:32, borderColor:'var(--accent)'}}>
    <div style={{
      padding:'40px 36px 36px',
      borderBottom:'1px solid var(--rule)',
      background:'linear-gradient(135deg, var(--accent-soft), var(--bg-elev) 70%)'
    }}>
      <div style={{display:'grid', gridTemplateColumns:'1fr auto', gap:32, alignItems:'end'}}>
        <div>
          <div className="eyebrow" style={{marginBottom:12}}>Start a test</div>
          <div className="display" style={{fontSize:28, fontWeight:500, letterSpacing:'-0.02em', lineHeight:1.15}}>
            Drop a file.<br/>
            <span style={{color:'var(--ink-3)'}}>Get a test in about 3 seconds.</span>
          </div>
        </div>
        <div style={{display:'flex', gap:8}}>
          <button onClick={() => {
            const text = window.prompt('Paste notes, an article, or a chapter. TestAI will generate questions from it.');
            if (!text || !text.trim()) return;
            const blob = new Blob([text], { type: 'text/plain' });
            const file = new File([blob], `pasted-${new Date().toISOString().slice(0,10)}.txt`, { type: 'text/plain' });
            handleFiles([file]);
          }} className="btn btn-ghost btn-sm">Paste text</button>
          <button onClick={() => navigate('materials')} className="btn btn-ghost btn-sm">From library</button>
        </div>
      </div>

      <input ref={fileRef} type="file" accept=".pdf,.docx,.md,.txt" style={{display:'none'}}
             onChange={e => handleFiles(e.target.files)}/>

      <div onClick={() => fileRef.current?.click()}
           onDragOver={e => { e.preventDefault(); setDragOver(true); }}
           onDragLeave={() => setDragOver(false)}
           onDrop={e => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); }}
           style={{
        marginTop:24,
        border:'1.5px dashed ' + (dragOver ? 'var(--accent)' : 'oklch(80% 0.008 80)'),
        borderRadius:10,
        padding:'36px 24px',
        textAlign:'center',
        background: dragOver ? 'var(--accent-soft)' : 'var(--bg-elev)',
        cursor:'pointer', transition:'all 0.15s'
      }}>
        <Icon.upload size={26}/>
        <div style={{marginTop:12, fontSize:16, fontWeight:500}}>
          {busy ? `Importing ${uploaded}…` : uploaded ? uploaded : 'Drop any PDF, DOCX, or notes file here'}
        </div>
        <div style={{marginTop:4, fontSize:13, color:'var(--ink-3)'}}>
          or <span style={{color:'var(--accent-ink)', fontWeight:500, borderBottom:'1px solid var(--accent-ink)'}}>browse files</span> — up to 200 pages
        </div>
      </div>
    </div>

    {recent.length > 0 && (
      <div style={{padding:'14px 20px', display:'flex', alignItems:'center', gap:14, fontSize:12.5, color:'var(--ink-3)', flexWrap:'wrap'}}>
        <span className="mono">Recent:</span>
        {recent.map((m, i) => (
          <React.Fragment key={m.id}>
            {i > 0 && <span>·</span>}
            <span onClick={() => { app.setSelectedMaterial({ id: m.id, title: m.title, file_name: m.file_name }); navigate('tests'); }}
                  style={{color:'var(--ink-2)', cursor:'pointer'}}>{m.file_name || m.title}</span>
          </React.Fragment>
        ))}
      </div>
    )}
  </div>
  );
};

// Variant B — Pick from library
const HeroB = ({ navigate }) => {
  const app = useApp();
  const fileRef = React.useRef(null);
  const items = (app.materials || []).filter(m => m.processing_status === 'ready').slice(0, 3);

  const uploadFile = async (file) => {
    try {
      const base64 = await fileToBase64(file);
      const data = await api.post('/api/tests/materials/import', {
        file_name: file.name, mime_type: file.type || '', file_content_base64: base64
      });
      await app.refreshMaterials();
      app.flashToast('ok', `"${file.name}" imported.`);
      if (data.material?.id) {
        app.setSelectedMaterial({ id: data.material.id, title: data.material.title, file_name: data.material.file_name });
        navigate('tests');
      }
    } catch (err) { app.flashToast('error', err.message || 'Upload failed.'); }
  };

  const colorFor = (m) => {
    const t = (m.title || m.file_name || '').toLowerCase();
    if (t.match(/phys|thermo|mech/)) return 'physics';
    if (t.match(/bio|cell/)) return 'biology';
    if (t.match(/chem|orgo/)) return 'chem';
    if (t.match(/math|algebra|calc/)) return 'math';
    return 'hum';
  };

  if (items.length === 0) {
    return (
      <div style={{marginBottom:32}}>
        <input ref={fileRef} type="file" accept=".pdf,.docx,.md,.txt" multiple style={{display:'none'}}
               onChange={e => { Array.from(e.target.files || []).forEach(uploadFile); if (e.target) e.target.value=''; }} />
        <div className="card" style={{padding:28, background:'var(--bg-sunken)', textAlign:'center'}}>
          <div style={{fontSize:16, fontWeight:500}}>No materials yet.</div>
          <p style={{fontSize:13, color:'var(--ink-3)', margin:'8px auto 18px', maxWidth:'40ch', lineHeight:1.5}}>
            Upload a PDF, DOCX, Markdown, or TXT and TestAI will build practice questions from it.
          </p>
          <button onClick={() => fileRef.current?.click()} className="btn btn-primary btn-sm">
            <Icon.upload size={12}/> Upload your first file
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{marginBottom:32}}>
      <input ref={fileRef} type="file" accept=".pdf,.docx,.md,.txt" multiple style={{display:'none'}}
             onChange={e => { Array.from(e.target.files || []).forEach(uploadFile); if (e.target) e.target.value=''; }} />
      <div style={{display:'flex', alignItems:'baseline', gap:12, marginBottom:16}}>
        <h2 style={{fontSize:18, fontWeight:500}}>Start a test from…</h2>
        <span className="mono" style={{fontSize:12, color:'var(--ink-3)'}}>{items.length} ready · {(app.materials || []).length} total</span>
        <button onClick={() => fileRef.current?.click()} className="btn btn-ghost btn-sm" style={{marginLeft:'auto'}}>
          <Icon.upload size={12}/> Upload new
        </button>
      </div>
      <div style={{display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:14}}>
        {items.map((m) => {
          const subj = colorFor(m);
          const select = () => {
            app.setSelectedMaterial({ id: m.id, title: m.title, file_name: m.file_name });
            navigate('tests');
          };
          return (
            <div key={m.id} onClick={select} className="card" style={{padding:20, cursor:'pointer',
                 borderTop:`3px solid var(--${subj})`, borderColor:'var(--rule)'}}>
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start'}}>
                <span className={`chip ${subj}`} style={{fontFamily:'var(--font-sans)', fontWeight:500}}>
                  <span className={`subj-dot ${subj}`} style={{width:6, height:6}}/>
                  {(m.file_type || 'doc').toUpperCase()}
                </span>
                <span className="mono" style={{fontSize:10.5, color:'var(--ink-4)', textTransform:'uppercase', letterSpacing:'0.1em'}}>
                  {m.chunk_count || 0} chunks
                </span>
              </div>
              <div style={{marginTop:16, fontSize:15.5, fontWeight:500, letterSpacing:'-0.01em', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis'}}>
                {m.title || m.file_name}
              </div>
              <div style={{fontSize:12, color:'var(--ink-3)', marginTop:2}}>{m.file_name}</div>
              <div style={{marginTop:14, fontSize:13, color:`var(--${subj}-ink)`, fontWeight:500, display:'flex', alignItems:'center', gap:6}}>
                Start a test <Icon.arrow size={12}/>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Variant C — single command prompt (simplified: focus + quick actions)
const HeroC = ({ navigate }) => {
  const app = useApp();
  const readyMaterials = (app.materials || []).filter(m => m.processing_status === 'ready');
  const firstReady = readyMaterials[0];

  const quickStart = () => {
    if (firstReady) {
      app.setSelectedMaterial({ id: firstReady.id, title: firstReady.title, file_name: firstReady.file_name });
      navigate('tests');
    } else {
      navigate('materials');
    }
  };

  return (
    <div style={{marginBottom:32}}>
      <div className="card" style={{padding:'32px 30px'}}>
        <div className="eyebrow" style={{marginBottom:14}}>What do you want to study?</div>
        <button onClick={quickStart} style={{
          display:'flex', alignItems:'center', gap:14, width:'100%', textAlign:'left',
          padding:'16px 18px', border:'1px solid var(--rule)', borderRadius:8,
          background:'var(--bg)', cursor:'pointer', fontFamily:'inherit'
        }}>
          <Icon.sparkle size={16}/>
          <span className="display" style={{fontSize:20, color:'var(--ink-3)', fontWeight:400, flex:1}}>
            {firstReady
              ? `Start a test on ${firstReady.title || firstReady.file_name}`
              : 'Upload a file and we\'ll write a test from it'}
          </span>
          <span className="kbd-key">⏎</span>
        </button>
        <div style={{display:'flex', gap:8, marginTop:14, flexWrap:'wrap'}}>
          <button onClick={() => navigate('materials')} className="chip outline" style={{padding:'5px 11px', cursor:'pointer'}}>
            <Icon.upload size={10}/> Upload something new
          </button>
          <button onClick={() => navigate('history')} className="chip outline" style={{padding:'5px 11px', cursor:'pointer'}}>
            <Icon.history size={10}/> Browse history
          </button>
          <button onClick={() => navigate('ask')} className="chip outline" style={{padding:'5px 11px', cursor:'pointer'}}>
            <Icon.chat size={10}/> Ask a question
          </button>
        </div>
      </div>
    </div>
  );
};


const RecentTests = ({ navigate }) => {
  const app = useApp();
  const rowsRaw = (app.history || []).slice(0, 5);

  if (rowsRaw.length === 0) {
    return (
      <div>
        <div className="section-title">
          <span>Recent tests</span>
          <span className="rule"/>
        </div>
        <div className="card" style={{padding:'28px 22px', textAlign:'center', background:'var(--bg-sunken)'}}>
          <div style={{fontSize:14.5, fontWeight:500}}>No tests yet.</div>
          <p style={{fontSize:13, color:'var(--ink-3)', marginTop:6, lineHeight:1.5, maxWidth:'44ch', margin:'6px auto 0'}}>
            Once you run a test from a material, it'll show up here with your score and a link back to the debrief.
          </p>
        </div>
      </div>
    );
  }

  const subjOf = (attempt) => {
    const t = (attempt.test_type || '').toLowerCase();
    if (t.includes('physic') || t.includes('thermo') || t.includes('mech')) return 'physics';
    if (t.includes('bio') || t.includes('cell')) return 'biology';
    if (t.includes('chem') || t.includes('orgo')) return 'chem';
    if (t.includes('math') || t.includes('algebra') || t.includes('calc')) return 'math';
    return 'hum';
  };
  const whenLabel = (iso) => {
    if (!iso) return '—';
    const d = new Date(iso);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays <= 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };
  const fmtDur = (sec) => {
    sec = Number(sec || 0);
    const m = Math.floor(sec / 60);
    const s = String(sec % 60).padStart(2, '0');
    return `${String(m).padStart(2,'0')}:${s}`;
  };

  return (
    <div>
      <div className="section-title">
        <span>Recent tests</span>
        <span className="count">{rowsRaw.length} recent</span>
        <span className="rule"/>
        <span onClick={() => navigate('history')} style={{fontSize:12, color:'var(--ink-3)', cursor:'pointer'}}>See all →</span>
      </div>
      <div style={{border:'1px solid var(--rule)', borderRadius:8, overflow:'hidden', background:'var(--bg-elev)'}}>
        {rowsRaw.map((r, i) => {
          const score = Math.round(Number(r.score || 0));
          return (
            <div key={r.id || i} style={{
              padding:'14px 18px',
              borderBottom: i < rowsRaw.length-1 ? '1px solid var(--rule)' : 'none',
              display:'grid', gridTemplateColumns:'14px 1fr 100px 80px 70px 24px',
              alignItems:'center', gap:16
            }}>
              <span className={`subj-dot ${subjOf(r)}`}/>
              <div>
                <div style={{fontSize:14, fontWeight:500}}>{r.test_type || 'Test'}</div>
                <div style={{fontSize:12, color:'var(--ink-3)', marginTop:2}}>
                  {whenLabel(r.created_at || r.start_time)} · {r.total_questions || 0} questions
                </div>
              </div>
              <div className="mono" style={{fontSize:12, color:'var(--ink-3)'}}>{fmtDur(r.duration_seconds)}</div>
              <div style={{display:'flex', alignItems:'center', gap:8}}>
                <div style={{flex:1, height:3, background:'var(--rule-2)', borderRadius:999}}>
                  <div style={{width:score+'%', height:'100%',
                       background: score >= 80 ? 'var(--accent)' : score >= 70 ? 'var(--warn)' : 'var(--danger)',
                       borderRadius:999}}/>
                </div>
              </div>
              <div className="mono" style={{fontSize:14, fontWeight:500, textAlign:'right'}}>{score}</div>
              <Icon.arrow size={12}/>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const WeakSpots = ({ navigate }) => (
  <div>
    <div className="section-title">
      <span>Worth another look</span>
      <span className="rule"/>
    </div>
    <div style={{display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:12}}>
      {[
        {t:'Second law of thermo', s:'4 of 5 missed', m:'From lecture 7', urgent:true, bg:'var(--danger-soft)', fg:'var(--danger)'},
        {t:'Gibbs vs Helmholtz', s:'3 of 4 missed', m:'From lecture 7', bg:'var(--warn-soft)', fg:'var(--warn)'},
        {t:'Phase transitions', s:'2 of 3 missed', m:'From statmech wk3', bg:'var(--hum-soft)', fg:'var(--hum-ink)'},
      ].map((w, i) => (
        <div key={i} className="card" style={{padding:16, cursor:'pointer', background:w.bg, borderColor:'transparent'}}>
          <div style={{display:'flex', alignItems:'center', gap:8}}>
            <span style={{width:8, height:8, borderRadius:'50%', background: w.fg}}/>
            <div style={{fontSize:14, fontWeight:500}}>{w.t}</div>
          </div>
          <div style={{fontSize:12.5, color:'var(--ink-2)', marginTop:6}}>{w.s} · {w.m}</div>
          <div style={{marginTop:12, fontSize:12.5, color:w.fg, fontWeight:600}}>
            <span onClick={() => navigate('tests')} style={{cursor:'pointer'}}>5-question drill →</span>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const StatsStrip = () => {
  const app = useApp();
  const stats = app.stats;
  if (!stats || !stats.total_tests) return null;
  const items = [
    { v: String(stats.total_tests), l: 'Tests taken', bg: 'var(--biology-soft)', fg: 'var(--biology-ink)' },
    { v: `${Math.round(stats.avg_score)}%`, l: 'Average score', bg: 'var(--physics-soft)', fg: 'var(--physics-ink)' },
    { v: `${Math.round(stats.best_score)}%`, l: 'Best score', bg: 'var(--chem-soft)', fg: 'var(--chem-ink)' },
    { v: String(stats.total_questions_answered), l: 'Questions answered', bg: 'var(--hum-soft)', fg: 'var(--hum-ink)' },
  ];
  return (
    <div style={{
      display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:2, marginBottom:32,
      background:'var(--rule)', border:'1px solid var(--rule)', borderRadius:10, overflow:'hidden',
    }}>
      {items.map((s, i) => (
        <div key={i} style={{background:s.bg, padding:'18px 20px'}}>
          <div className="mono" style={{fontSize:24, fontWeight:500, letterSpacing:'-0.01em', color:s.fg}}>{s.v}</div>
          <div style={{fontSize:10.5, color:s.fg, marginTop:4, opacity:0.8,
                       fontFamily:'var(--font-mono)', textTransform:'uppercase', letterSpacing:'0.1em', fontWeight:600}}>{s.l}</div>
        </div>
      ))}
    </div>
  );
};

const ContinueBar = ({ navigate }) => {
  const app = useApp();
  const [resuming, setResuming] = React.useState(false);
  const inProgress = (app.history || []).filter(r => r.status === 'InProgress');
  if (inProgress.length === 0) return null;
  const latest = inProgress[0];

  const resume = async () => {
    setResuming(true);
    try {
      const data = await api.get(`/api/tests/attempts/${latest.id}`);
      if (!data.questions?.length) throw new Error('This attempt has no questions.');
      const attempt = data.attempt;
      const config = data.config || {};
      const startedMs = attempt.start_time ? new Date(attempt.start_time).getTime() : Date.now();
      const totalSec = Number(config.duration_minutes || 20) * 60;
      const elapsed = Math.floor((Date.now() - startedMs) / 1000);
      const remaining = Math.max(0, totalSec - elapsed);
      const answers = {};
      data.questions.forEach((q, i) => { if (q.user_answer != null && q.user_answer !== '') answers[i] = q.user_answer; });

      app.setSession({
        attemptId: attempt.id,
        config,
        material: data.material || null,
        questions: data.questions.map(q => ({
          id: q.id,
          question_number: q.question_number,
          question_type: q.question_type,
          question_text: q.question_text,
          options: q.options,
        })),
        answers,
        flagged: {},
        questionShownAt: { 0: Date.now() },
        startedAt: startedMs,
        timed: remaining > 0,
        durationMinutes: Math.ceil(remaining / 60) || 1,
      });
      app.setResults(null);
      navigate('taking');
    } catch (err) {
      app.flashToast('error', err.message || 'Couldn\'t resume that test.');
    } finally {
      setResuming(false);
    }
  };

  const startedAgo = (() => {
    const ts = latest.start_time || latest.created_at;
    if (!ts) return '';
    const min = Math.max(1, Math.round((Date.now() - new Date(ts).getTime()) / 60000));
    if (min < 60) return `${min} min ago`;
    const hr = Math.round(min / 60);
    if (hr < 24) return `${hr}h ago`;
    return `${Math.round(hr / 24)}d ago`;
  })();

  return (
    <div className="card" style={{padding:'14px 18px', marginBottom:32,
         display:'flex', alignItems:'center', gap:16,
         background:'var(--physics-soft)', borderColor:'var(--physics)',
         borderLeft:'3px solid var(--physics)', borderRadius:'0 8px 8px 0'}}>
      <div style={{flex:1}}>
        <div style={{fontSize:14, fontWeight:500}}>Pick up where you stopped</div>
        <div style={{fontSize:12.5, color:'var(--ink-3)', marginTop:2}}>
          {latest.test_type || 'Test'} · {latest.total_questions || 0} questions · started {startedAgo}
        </div>
      </div>
      <button onClick={resume} disabled={resuming}
              className="btn btn-primary btn-sm"
              style={{opacity: resuming ? 0.6 : 1}}>
        {resuming ? 'Loading…' : <>Resume <Icon.arrow size={12}/></>}
      </button>
    </div>
  );
};

const Dashboard = ({ heroVariant, navigate }) => {
  const app = useApp();
  React.useEffect(() => {
    app.refreshMaterials();
    app.refreshStats();
    app.refreshHistory();
  }, []);
  const Hero = heroVariant === 'a' ? () => <HeroA navigate={navigate}/> : heroVariant === 'b' ? () => <HeroB navigate={navigate}/> : () => <HeroC navigate={navigate}/>;
  return (
    <div className="content">
      <Greeting/>
      <Hero/>
      <ContinueBar navigate={navigate}/>
      <StatsStrip/>
      <RecentTests navigate={navigate}/>
    </div>
  );
};

window.Dashboard = Dashboard;
// Materials library + upload

const Materials = ({ navigate }) => {
  const app = useApp();
  const fileRef = React.useRef(null);
  const [uploading, setUploading] = React.useState(null); // filename
  const [filter, setFilter] = React.useState('all'); // 'all'|'pdf'|'docx'|'md'|'txt'|'untested'

  React.useEffect(() => { app.refreshMaterials(); }, []);

  const materials = app.materials || [];

  const uploadFile = async (file) => {
    setUploading(file.name);
    try {
      const base64 = await fileToBase64(file);
      await api.post('/api/tests/materials/import', {
        file_name: file.name,
        mime_type: file.type || '',
        file_content_base64: base64
      });
      await app.refreshMaterials();
      app.flashToast('ok', `"${file.name}" imported.`);
    } catch (err) {
      app.flashToast('error', err.message || 'Upload failed.');
    } finally {
      setUploading(null);
    }
  };

  const onFileChange = (e) => {
    const files = Array.from(e.target.files || []);
    files.forEach(uploadFile);
    if (e.target) e.target.value = '';
  };

  const deleteMaterial = async (ev, m) => {
    ev.stopPropagation();
    if (!window.confirm(`Delete "${m.title || m.file_name}"? This also removes tests generated from it.`)) return;
    try {
      await api.del(`/api/tests/materials/${m.id}`);
      await app.refreshMaterials();
      app.flashToast('ok', 'Deleted.');
    } catch (err) {
      app.flashToast('error', err.message || 'Delete failed.');
    }
  };

  const openMaterial = (m) => {
    app.setSelectedMaterial({ id: m.id, title: m.title, file_name: m.file_name });
    navigate('tests');
  };

  const typeStyles = (ft) => {
    const key = (ft || '').toLowerCase();
    if (key === 'pdf') return { subj: 'physics', label: 'PDF' };
    if (key === 'docx' || key === 'doc') return { subj: 'chem', label: 'DOCX' };
    if (key === 'md' || key === 'markdown') return { subj: 'biology', label: 'MD' };
    if (key === 'txt') return { subj: 'hum', label: 'TXT' };
    return { subj: 'math', label: (key || 'FILE').toUpperCase() };
  };

  const bucketOf = (m) => {
    const ft = (m.file_type || '').toLowerCase();
    if (ft === 'md' || ft === 'markdown') return 'md';
    return ft || 'other';
  };
  const counts = {
    all: materials.length,
    pdf: materials.filter(m => bucketOf(m) === 'pdf').length,
    docx: materials.filter(m => bucketOf(m) === 'docx' || bucketOf(m) === 'doc').length,
    md: materials.filter(m => bucketOf(m) === 'md').length,
    txt: materials.filter(m => bucketOf(m) === 'txt').length,
    untested: materials.filter(m => !m.chunk_count || m.processing_status !== 'ready').length,
  };
  const filtered = materials.filter(m => {
    if (filter === 'all') return true;
    if (filter === 'untested') return !m.chunk_count || m.processing_status !== 'ready';
    const b = bucketOf(m);
    if (filter === 'docx') return b === 'docx' || b === 'doc';
    return b === filter;
  });

  const fmtDate = (iso) => {
    try { return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }); }
    catch { return ''; }
  };

  return (
    <div className="content">
      <div style={{marginBottom:28, display:'flex', alignItems:'flex-end', gap:24}}>
        <div>
          <div className="eyebrow" style={{marginBottom:8}}>Your material</div>
          <h1 className="page-title">Materials</h1>
          <p className="page-sub">Everything you've uploaded. Tests pull questions from here — nothing else.</p>
        </div>
        <div style={{marginLeft:'auto', display:'flex', gap:8}}>
          <input ref={fileRef} type="file" accept=".pdf,.docx,.md,.txt" style={{display:'none'}}
                 multiple onChange={onFileChange} />
          <button onClick={() => fileRef.current?.click()} className="btn btn-primary">
            <Icon.upload size={12}/> {uploading ? `Importing ${uploading}…` : 'Upload'}
          </button>
        </div>
      </div>

      {/* Upload zone */}
      <div onClick={() => fileRef.current?.click()}
           onDragOver={e => e.preventDefault()}
           onDrop={e => { e.preventDefault(); Array.from(e.dataTransfer.files || []).forEach(uploadFile); }}
           style={{
        border:'1.5px dashed var(--rule)', borderRadius:10,
        padding:'28px 24px', marginBottom:32,
        background:'var(--bg-sunken)',
        display:'flex', alignItems:'center', gap:24, cursor:'pointer'
      }}>
        <div style={{
          width:44, height:44, borderRadius:'50%',
          background:'var(--bg-elev)', border:'1px solid var(--rule)',
          display:'flex', alignItems:'center', justifyContent:'center'
        }}>
          <Icon.upload size={18}/>
        </div>
        <div style={{flex:1}}>
          <div style={{fontSize:14.5, fontWeight:500}}>
            {uploading ? `Importing ${uploading}…` : 'Drop files here or click to choose'}
          </div>
          <div style={{fontSize:12.5, color:'var(--ink-3)', marginTop:2}}>
            PDF, DOCX, Markdown, plain text · up to 200 pages per file
          </div>
        </div>
      </div>

      {/* Filters */}
      <div style={{display:'flex', alignItems:'center', gap:8, marginBottom:16, flexWrap:'wrap'}}>
        {[
          ['all','All', counts.all],
          ['pdf','PDF', counts.pdf],
          ['docx','DOCX', counts.docx],
          ['md','Markdown', counts.md],
          ['txt','Text', counts.txt],
          ['untested','Untested', counts.untested],
        ].map(([k,l,n]) => (
          <button key={k} onClick={() => setFilter(k)}
                  className={filter === k ? 'chip ink' : 'chip outline'}
                  style={filter === k ? {} : {padding:'3px 10px'}}>
            {l} · {n}
          </button>
        ))}
      </div>

      {/* File list */}
      <div style={{border:'1px solid var(--rule)', borderRadius:8, overflow:'hidden', background:'var(--bg-elev)'}}>
        <div style={{
          padding:'10px 18px', display:'grid',
          gridTemplateColumns:'1fr 110px 110px 100px 90px 40px',
          gap:16, fontSize:11, color:'var(--ink-3)',
          fontFamily:'var(--font-mono)', textTransform:'uppercase', letterSpacing:'0.1em',
          borderBottom:'1px solid var(--rule)', background:'var(--bg-sunken)'
        }}>
          <span>Name</span><span>Type</span><span>Added</span><span>Chunks</span><span style={{textAlign:'right'}}>Status</span><span/>
        </div>
        {filtered.length === 0 && (
          <div style={{padding:'32px 18px', textAlign:'center', color:'var(--ink-3)', fontSize:13.5}}>
            {app.materialsState?.loading ? 'Loading materials…'
              : app.materialsState?.error ? `Couldn't load: ${app.materialsState.error}`
              : materials.length === 0 ? 'No materials yet. Upload a PDF, DOCX, Markdown, or TXT file to get started.'
              : 'No materials match this filter.'}
          </div>
        )}
        {filtered.map((m, i) => {
          const ts = typeStyles(m.file_type);
          const ready = m.processing_status === 'ready';
          return (
            <div key={m.id} onClick={() => openMaterial(m)} style={{
              padding:'14px 18px', display:'grid',
              gridTemplateColumns:'1fr 110px 110px 100px 90px 40px',
              gap:16, alignItems:'center',
              borderBottom: i < filtered.length-1 ? '1px solid var(--rule-2)' : 'none',
              cursor:'pointer'
            }}>
              <div style={{display:'flex', alignItems:'center', gap:12, minWidth:0}}>
                <div style={{
                  width:30, height:36, borderRadius:3, flexShrink:0,
                  background:`var(--${ts.subj}-soft)`,
                  border:`1px solid var(--${ts.subj})`,
                  display:'flex', alignItems:'center', justifyContent:'center',
                  fontSize:9, fontFamily:'var(--font-mono)', color:`var(--${ts.subj}-ink)`, fontWeight:600
                }}>{ts.label}</div>
                <div style={{minWidth:0}}>
                  <div style={{fontSize:14, fontWeight:500, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis'}}>
                    {m.title || m.file_name}
                  </div>
                  <div className="mono" style={{fontSize:11, color:'var(--ink-3)', marginTop:2}}>
                    {m.file_name}
                  </div>
                </div>
              </div>
              <span style={{fontSize:12.5}}>
                <span className={`chip ${ts.subj}`} style={{fontFamily:'var(--font-sans)', fontWeight:500, fontSize:11.5}}>
                  <span className={`subj-dot ${ts.subj}`} style={{width:6, height:6}}/>
                  {ts.label}
                </span>
              </span>
              <span className="mono" style={{fontSize:12, color:'var(--ink-3)'}}>{fmtDate(m.created_at)}</span>
              <span style={{fontSize:12.5, color:'var(--ink-2)'}}>{m.chunk_count || 0}</span>
              <div style={{display:'flex', alignItems:'center', gap:6, justifyContent:'flex-end'}}>
                <span className="mono" style={{fontSize:11, color: ready ? 'var(--accent-ink)' : 'var(--warn)', fontWeight:500}}>
                  {ready ? 'ready' : (m.processing_status || 'pending')}
                </span>
              </div>
              <button onClick={(ev) => deleteMaterial(ev, m)}
                      title="Delete"
                      style={{background:'none', border:'none', color:'var(--ink-3)', cursor:'pointer', padding:0}}>
                <Icon.x size={14}/>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

window.Materials = Materials;
// Test setup — NOT a stack of dropdowns. Opinionated, minimal.

const TestSetup = ({ navigate }) => {
  const app = useApp();
  const [count, setCount] = React.useState(15);
  const [difficulty, setDifficulty] = React.useState('mixed');
  const [types, setTypes] = React.useState({mcq:true, tf:true, short:false});
  const [timed, setTimed] = React.useState(true);
  const [minutes, setMinutes] = React.useState(20);
  const [generating, setGenerating] = React.useState(false);
  const [mode, setMode] = React.useState('material'); // 'material' | 'category'
  const [categories, setCategories] = React.useState([]);
  const [categoryName, setCategoryName] = React.useState(null);

  const selected = app.selectedMaterial;
  const availableMaterials = (app.materials || []).filter(m => m.processing_status === 'ready');

  // Load materials + categories on mount
  React.useEffect(() => {
    app.refreshMaterials();
    (async () => {
      try {
        const data = await api.get('/api/tests/categories');
        setCategories(data.categories || []);
      } catch {}
    })();
  }, []);

  // If user lands here with a selected material, ensure material mode
  React.useEffect(() => { if (selected) setMode('material'); }, [selected?.id]);

  const startTest = async () => {
    setGenerating(true);
    try {
      if (mode === 'material') {
        if (!selected || !selected.id) {
          app.flashToast('error', 'Pick a material first.');
          return;
        }
        const data = await api.post('/api/tests/materials/generate-test', {
          material_id: selected.id,
          difficulty: mapDifficulty(difficulty),
          num_questions: Math.max(10, Math.min(50, count)),
          question_types: mapTypes(types),
          topic_focus: selected.title
        });
        if (!data.attempt_id || !data.questions || data.questions.length === 0) {
          throw new Error('No questions were generated.');
        }
        app.setSession({
          attemptId: data.attempt_id,
          config: data.config,
          material: data.material || selected,
          questions: data.questions,
          answers: {}, flagged: {},
          questionShownAt: { 0: Date.now() },
          startedAt: Date.now(),
          timed, durationMinutes: minutes,
        });
      } else {
        if (!categoryName) {
          app.flashToast('error', 'Pick a category first.');
          return;
        }
        const clamped = Math.max(10, Math.min(50, count));
        const cfg = await api.post('/api/tests/config', {
          test_type: categoryName,
          difficulty: mapDifficulty(difficulty),
          num_questions: clamped,
          duration_minutes: Math.max(5, Math.min(180, timed ? minutes : 45)),
          question_types: mapTypes(types)
        });
        const start = await api.post('/api/tests/start', { config_id: cfg.config_id });
        if (!start.attempt_id || !start.questions?.length) {
          throw new Error('No questions were generated.');
        }
        app.setSession({
          attemptId: start.attempt_id,
          config: start.config,
          material: null,
          questions: start.questions,
          answers: {}, flagged: {},
          questionShownAt: { 0: Date.now() },
          startedAt: Date.now(),
          timed, durationMinutes: minutes,
        });
      }
      app.setResults(null);
      navigate('taking');
    } catch (err) {
      app.flashToast('error', err.message || 'Failed to generate test.');
    } finally {
      setGenerating(false);
    }
  };

  // Keyboard shortcut: Cmd/Ctrl+Enter to start
  React.useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') startTest();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [selected, count, difficulty, types, timed, minutes]);

  const Segment = ({options, value, onChange}) => (
    <div style={{
      display:'inline-flex', padding:3, gap:2,
      background:'var(--bg-sunken)', borderRadius:6, border:'1px solid var(--rule)'
    }}>
      {options.map(o => (
        <button key={o.v} onClick={() => onChange(o.v)}
                style={{
                  padding:'5px 12px', fontSize:12.5, borderRadius:4,
                  background: value === o.v ? 'var(--bg-elev)' : 'transparent',
                  color: value === o.v ? 'var(--ink)' : 'var(--ink-3)',
                  boxShadow: value === o.v ? 'var(--shadow-sm)' : 'none',
                  fontWeight: value === o.v ? 500 : 400,
                }}>
          {o.l}
        </button>
      ))}
    </div>
  );

  const titleText = mode === 'material'
    ? (selected
        ? <>Testing on <em style={{fontFamily:'var(--font-serif)', fontStyle:'italic', fontWeight:400}}>{selected.title || selected.file_name}</em>.</>
        : 'Pick something to study.')
    : (categoryName
        ? <>A <em style={{fontFamily:'var(--font-serif)', fontStyle:'italic', fontWeight:400}}>{categoryName}</em> practice test.</>
        : 'Pick a category.');
  const subText = mode === 'material'
    ? (selected ? 'Tweak below, or just hit start.' : 'Choose a material you\'ve uploaded — questions are pulled from its contents.')
    : (categoryName ? 'Tweak below, or just hit start.' : 'Generic questions, generated by AI — no material needed.');

  return (
    <div className="content narrow">
      <div style={{marginBottom:30}}>
        <div className="eyebrow" style={{marginBottom:10}}>New test</div>
        <h1 className="page-title">{titleText}</h1>
        <p className="page-sub">{subText}</p>
      </div>

      {/* Source mode toggle */}
      <div style={{marginBottom:24, display:'flex', gap:6, padding:3,
                   background:'var(--bg-sunken)', borderRadius:8, border:'1px solid var(--rule)', width:'fit-content'}}>
        {[
          { k:'material', l:'From a material' },
          { k:'category', l:'From a category' },
        ].map(o => (
          <button key={o.k} onClick={() => setMode(o.k)}
                  style={{
                    padding:'6px 14px', fontSize:13, borderRadius:5,
                    background: mode === o.k ? 'var(--bg-elev)' : 'transparent',
                    color: mode === o.k ? 'var(--ink)' : 'var(--ink-3)',
                    boxShadow: mode === o.k ? 'var(--shadow-sm)' : 'none',
                    fontWeight: mode === o.k ? 500 : 400, cursor:'pointer'
                  }}>
            {o.l}
          </button>
        ))}
      </div>

      {/* Material picker */}
      {mode === 'material' && !selected && availableMaterials.length === 0 && (
        <div className="card" style={{padding:24, marginBottom:24, background:'var(--bg-sunken)'}}>
          <div style={{fontSize:14.5, fontWeight:500}}>No ready materials yet.</div>
          <p style={{fontSize:13, color:'var(--ink-3)', marginTop:6, lineHeight:1.5}}>
            Upload a PDF, DOCX, Markdown, or TXT file, or switch to "From a category" above for a generic test.
          </p>
          <div style={{marginTop:14, display:'flex', gap:8}}>
            <button onClick={() => navigate('materials')} className="btn btn-primary btn-sm">
              <Icon.upload size={12}/> Go to Materials
            </button>
            <button onClick={() => setMode('category')} className="btn btn-ghost btn-sm">
              Use a category instead
            </button>
          </div>
        </div>
      )}
      {mode === 'material' && !selected && availableMaterials.length > 0 && (
        <div style={{marginBottom:28}}>
          <div style={{fontSize:10.5, color:'var(--ink-3)', marginBottom:10, fontFamily:'var(--font-mono)', textTransform:'uppercase', letterSpacing:'0.1em'}}>
            Choose a material
          </div>
          <div style={{display:'flex', flexDirection:'column', gap:6}}>
            {availableMaterials.map(m => (
              <button key={m.id} onClick={() => app.setSelectedMaterial({ id: m.id, title: m.title, file_name: m.file_name })}
                      style={{
                        display:'flex', alignItems:'center', gap:12,
                        padding:'12px 14px', textAlign:'left',
                        border:'1px solid var(--rule)', borderRadius:6,
                        background:'var(--bg-elev)', cursor:'pointer'
                      }}>
                <Icon.file size={14}/>
                <div style={{flex:1}}>
                  <div style={{fontSize:14, fontWeight:500}}>{m.title || m.file_name}</div>
                  <div className="mono" style={{fontSize:11, color:'var(--ink-3)', marginTop:2}}>{m.file_name} · {m.chunk_count || 0} chunks</div>
                </div>
                <Icon.arrow size={12}/>
              </button>
            ))}
          </div>
        </div>
      )}
      {mode === 'material' && selected && (
        <div style={{marginBottom:24, fontSize:12.5, color:'var(--ink-3)'}}>
          <button onClick={() => app.setSelectedMaterial(null)}
                  style={{background:'none', border:'none', color:'var(--ink-2)', cursor:'pointer', fontSize:12.5, padding:0, borderBottom:'1px solid var(--rule)'}}>
            Change material
          </button>
        </div>
      )}

      {/* Category picker */}
      {mode === 'category' && (
        <div style={{marginBottom:28}}>
          <div style={{fontSize:10.5, color:'var(--ink-3)', marginBottom:10, fontFamily:'var(--font-mono)', textTransform:'uppercase', letterSpacing:'0.1em'}}>
            Choose a category
          </div>
          {categories.length === 0 ? (
            <div style={{padding:16, fontSize:13, color:'var(--ink-3)', border:'1px dashed var(--rule)', borderRadius:6}}>
              Loading categories… (requires a configured database and an OpenAI API key to generate questions)
            </div>
          ) : (
            <div style={{display:'grid', gridTemplateColumns:'repeat(2, 1fr)', gap:8}}>
              {categories.map(cat => (
                <button key={cat.id} onClick={() => setCategoryName(cat.name)}
                        style={{
                          display:'flex', alignItems:'flex-start', gap:12,
                          padding:'14px 16px', textAlign:'left',
                          border:'1px solid ' + (categoryName === cat.name ? 'var(--ink)' : 'var(--rule)'),
                          borderRadius:8,
                          background: categoryName === cat.name ? 'var(--bg-elev)' : 'var(--bg-sunken)',
                          cursor:'pointer'
                        }}>
                  <div style={{flex:1, minWidth:0}}>
                    <div style={{fontSize:14, fontWeight:500}}>{cat.name}</div>
                    <div style={{fontSize:12, color:'var(--ink-3)', marginTop:4, lineHeight:1.45}}>{cat.description}</div>
                  </div>
                  {categoryName === cat.name && <Icon.check size={14}/>}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <div style={{display:'flex', flexDirection:'column', gap:32}}>

        {/* How many */}
        <div>
          <div style={{display:'flex', alignItems:'baseline', gap:12, marginBottom:14}}>
            <div style={{fontSize:14, fontWeight:500}}>How many questions</div>
            <div className="mono" style={{fontSize:24, color:'var(--ink)', fontWeight:500, marginLeft:'auto'}}>
              {count}
            </div>
          </div>
          <input type="range" min={5} max={40} step={1} value={count}
                 onChange={e => setCount(+e.target.value)}
                 style={{width:'100%', accentColor:'var(--accent)'}}/>
          <div style={{display:'flex', justifyContent:'space-between', marginTop:6,
                       fontSize:11, fontFamily:'var(--font-mono)', color:'var(--ink-4)'}}>
            <span>5</span><span>quick</span><span>standard</span><span>deep</span><span>40</span>
          </div>
        </div>

        {/* Difficulty */}
        <div>
          <div style={{fontSize:14, fontWeight:500, marginBottom:10}}>Difficulty</div>
          <Segment
            value={difficulty}
            onChange={setDifficulty}
            options={[
              {v:'easy',   l:'Recall'},
              {v:'medium', l:'Applied'},
              {v:'hard',   l:'Synthesis'},
              {v:'mixed',  l:'Mixed'},
            ]}/>
          <div style={{fontSize:12.5, color:'var(--ink-3)', marginTop:10}}>
            {{
              easy: 'Definitions and facts lifted directly from the material.',
              medium: 'Applying concepts to new scenarios.',
              hard: 'Connecting ideas across multiple sections.',
              mixed: 'A realistic blend — what you\'d see on an exam.',
            }[difficulty]}
          </div>
        </div>

        {/* Types */}
        <div>
          <div style={{fontSize:14, fontWeight:500, marginBottom:10}}>Question types</div>
          <div style={{display:'flex', gap:8, flexWrap:'wrap'}}>
            {[
              {k:'mcq',   l:'Multiple choice'},
              {k:'tf',    l:'True / false'},
              {k:'short', l:'Short answer'},
            ].map(t => (
              <button key={t.k}
                onClick={() => setTypes({...types, [t.k]: !types[t.k]})}
                style={{
                  padding:'8px 14px', fontSize:13, borderRadius:6,
                  border:'1px solid ' + (types[t.k] ? 'var(--ink)' : 'var(--rule)'),
                  background: types[t.k] ? 'var(--ink)' : 'var(--bg-elev)',
                  color: types[t.k] ? 'var(--bg)' : 'var(--ink-2)',
                  fontWeight: types[t.k] ? 500 : 400,
                  display:'flex', alignItems:'center', gap:8,
                }}>
                {types[t.k] && <Icon.check size={11}/>}
                {t.l}
              </button>
            ))}
          </div>
        </div>

        {/* Timer */}
        <div>
          <div style={{display:'flex', alignItems:'center', gap:12, marginBottom:10}}>
            <div style={{fontSize:14, fontWeight:500}}>Time limit</div>
            <button onClick={() => setTimed(!timed)}
                    style={{
                      marginLeft:'auto', display:'flex', alignItems:'center', gap:8,
                      fontSize:12.5, color:'var(--ink-3)'
                    }}>
              <div style={{
                width:30, height:17, borderRadius:999,
                background: timed ? 'var(--accent)' : 'var(--ink-4)',
                position:'relative', transition:'background 0.15s'
              }}>
                <div style={{
                  position:'absolute', top:2, left: timed ? 15 : 2,
                  width:13, height:13, background:'white', borderRadius:'50%',
                  transition:'left 0.15s'
                }}/>
              </div>
              {timed ? 'On' : 'Off'}
            </button>
          </div>
          {timed && (
            <div style={{display:'flex', gap:6}}>
              {[10, 15, 20, 30, 45].map(m => (
                <button key={m}
                  onClick={() => setMinutes(m)}
                  style={{
                    padding:'8px 14px', fontSize:13, borderRadius:6,
                    border:'1px solid ' + (minutes === m ? 'var(--ink)' : 'var(--rule)'),
                    background: minutes === m ? 'var(--ink)' : 'var(--bg-elev)',
                    color: minutes === m ? 'var(--bg)' : 'var(--ink-2)',
                    fontFamily:'var(--font-mono)',
                    fontWeight: minutes === m ? 500 : 400,
                    minWidth: 56,
                  }}>
                  {m} min
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Preview / commit */}
        <div className="card" style={{padding:18, background:'var(--bg-sunken)'}}>
          <div style={{fontSize:12.5, color:'var(--ink-3)', marginBottom:4,
                       fontFamily:'var(--font-mono)', textTransform:'uppercase', letterSpacing:'0.1em', fontSize:10.5}}>
            You're about to take
          </div>
          <div style={{fontSize:15.5}}>
            <b>{Math.max(10, Math.min(50, count))} {difficulty === 'mixed' ? 'mixed' : difficulty} questions</b>
            {mode === 'material' && selected && <> from <b>{selected.title || selected.file_name}</b></>}
            {mode === 'category' && categoryName && <> in <b>{categoryName}</b></>}
            {Object.values(types).filter(Boolean).length < 3 && <> · {Object.entries(types).filter(([,v])=>v).map(([k])=>({mcq:'MCQ',tf:'T/F',short:'short answer'}[k])).join(', ')}</>}
            {timed ? <> · timed {minutes} min</> : <> · untimed</>}
          </div>
          {count < 10 && (
            <div style={{marginTop:8, fontSize:12, color:'var(--warn)'}}>
              Minimum is 10 questions — we'll round up.
            </div>
          )}
        </div>

        {(() => {
          const disabled = generating
            || (mode === 'material' && !selected)
            || (mode === 'category' && !categoryName);
          return (
            <div style={{display:'flex', gap:12, alignItems:'center'}}>
              <button onClick={startTest} disabled={disabled}
                      className="btn btn-accent btn-lg"
                      style={{flex:1, justifyContent:'center', opacity: disabled ? 0.6 : 1}}>
                {generating ? <>Generating…</> : <>Start test <Icon.arrow size={14}/></>}
              </button>
            </div>
          );
        })()}
        <div style={{fontSize:12, color:'var(--ink-4)', textAlign:'center'}}>
          <span className="kbd-key">⌘</span> <span className="kbd-key">⏎</span> to start
        </div>
      </div>
    </div>
  );
};

window.TestSetup = TestSetup;
// Test-taking — distraction-free writing-app vibe

const TestTaking = ({ navigate }) => {
  const app = useApp();
  const session = app.session;

  const [currentQ, setCurrentQ] = React.useState(0);
  const [submitting, setSubmitting] = React.useState(false);
  const [shortAnswer, setShortAnswer] = React.useState({});
  const [remaining, setRemaining] = React.useState(null);

  // Redirect if no session
  React.useEffect(() => {
    if (!session) { navigate('dashboard'); return; }
    if (session.timed && remaining === null) {
      setRemaining(Math.max(0, session.durationMinutes * 60));
    }
  }, [session]);

  const totalQ = session?.questions?.length || 0;
  const q = session?.questions?.[currentQ];
  const answers = session?.answers || {};
  const flagged = session?.flagged || {};
  const selected = answers[currentQ] || null;
  const isFlagged = !!flagged[currentQ];

  // Ref holds the latest finishTest so the timer interval doesn't fire a
  // stale closure (which would submit the wrong question's answer on auto-
  // finish after the user has navigated).
  const finishTestRef = React.useRef(null);

  // Timer
  React.useEffect(() => {
    if (!session || !session.timed) return;
    const iv = setInterval(() => {
      setRemaining(r => {
        if (r === null) return r;
        if (r <= 1) { clearInterval(iv); finishTestRef.current?.(true); return 0; }
        return r - 1;
      });
    }, 1000);
    return () => clearInterval(iv);
  }, [session?.timed]);

  const fmtTime = (sec) => {
    if (sec === null || sec === undefined) return '';
    const m = Math.floor(sec / 60);
    const s = String(sec % 60).padStart(2, '0');
    return `${m}:${s}`;
  };

  // Record question-shown timestamps
  React.useEffect(() => {
    if (!session) return;
    if (!session.questionShownAt?.[currentQ]) {
      app.setSession({
        ...session,
        questionShownAt: { ...(session.questionShownAt || {}), [currentQ]: Date.now() }
      });
    }
  }, [currentQ, !!session]);

  const selectAnswer = (k) => {
    app.setSession({
      ...session,
      answers: { ...session.answers, [currentQ]: k }
    });
  };

  const toggleFlag = () => {
    app.setSession({
      ...session,
      flagged: { ...session.flagged, [currentQ]: !isFlagged }
    });
  };

  const submitCurrentAnswer = async () => {
    const userAnswer = q.question_type === 'ShortAnswer'
      ? (shortAnswer[currentQ] ?? session.answers[currentQ] ?? '')
      : (session.answers[currentQ] ?? '');
    if (!q?.id) return;
    const shownAt = session.questionShownAt[currentQ] || session.startedAt;
    const timeSpent = Math.max(1, Math.round((Date.now() - shownAt) / 1000));
    try {
      await api.post('/api/tests/answer', {
        question_id: q.id,
        user_answer: String(userAnswer || ''),
        time_spent_seconds: timeSpent,
      });
    } catch (err) {
      // Not fatal — keep going, but surface once
      app.flashToast('error', err.message || 'Couldn\'t save that answer.');
    }
  };

  const goNext = async () => {
    if (submitting) return;
    if (q.question_type === 'ShortAnswer') {
      const v = shortAnswer[currentQ];
      if (v !== undefined && v !== null) {
        app.setSession({ ...session, answers: { ...session.answers, [currentQ]: v } });
      }
    }
    setSubmitting(true);
    try { await submitCurrentAnswer(); } finally { setSubmitting(false); }
    if (currentQ < totalQ - 1) setCurrentQ(currentQ + 1);
    else finishTest(false);
  };
  const goPrev = () => { if (currentQ > 0) setCurrentQ(currentQ - 1); };

  const finishTest = async (fromTimeout) => {
    setSubmitting(true);
    try {
      // Best-effort: submit current answer first
      await submitCurrentAnswer();
      const data = await api.post(`/api/tests/complete/${session.attemptId}`);
      app.setResults(data.results);
      app.refreshStats();
      app.setSession(null);
      if (fromTimeout) app.flashToast('ok', 'Time\'s up — scoring your test.');
      navigate('results');
    } catch (err) {
      app.flashToast('error', err.message || 'Failed to complete test.');
    } finally {
      setSubmitting(false);
    }
  };

  // Keep the timer's callback pointing at the latest finishTest so it
  // submits the currently-visible question's answer, not a stale one.
  finishTestRef.current = finishTest;

  // Keyboard shortcuts
  React.useEffect(() => {
    const handler = (e) => {
      // Don't hijack keys while typing in a textarea
      const tag = (e.target && e.target.tagName) || '';
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      if (e.key === 'ArrowRight' || e.key === 'Enter') goNext();
      if (e.key === 'ArrowLeft') goPrev();
      if (q?.question_type !== 'ShortAnswer' && ['a','b','c','d'].includes(e.key.toLowerCase())) {
        selectAnswer(e.key.toUpperCase());
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [currentQ, session, shortAnswer, submitting]);

  // Parse options: backend sends options as array (already parsed) or undefined for TF/Short
  let options = null;
  if (q.question_type === 'MCQ') {
    if (Array.isArray(q.options)) options = q.options.map((t, i) => {
      const letter = String.fromCharCode(65 + i);
      // options may come as "A. Text" strings, or plain text
      const match = String(t).match(/^([A-D])[\).\s-]\s*(.*)$/);
      return match
        ? { k: match[1], t: match[2] }
        : { k: letter, t: String(t).replace(/^[A-D][\).\s-]\s*/, '') };
    });
  } else if (q.question_type === 'TrueFalse') {
    options = [{k:'True', t:'True'}, {k:'False', t:'False'}];
  }

  if (!session || !q) return null;

  const materialLabel = session.material?.title || session.config?.test_type || 'Test';
  const qTypeLabel = q.question_type === 'MCQ' ? 'Multiple choice'
    : q.question_type === 'TrueFalse' ? 'True / false'
    : 'Short answer';

  return (
    <div style={{
      minHeight:'100vh', background:'var(--bg-sunken)',
      display:'flex', flexDirection:'column',
      fontFamily:'var(--font-sans)'
    }}>
      {/* Colored top strip */}
      <div style={{
        background:'var(--physics)', color:'white',
        padding:'14px 40px',
        display:'flex', alignItems:'center', gap:24
      }}>
        <div style={{display:'flex', alignItems:'center', gap:10, minWidth:0}}>
          <span style={{width:8, height:8, background:'white', borderRadius:'50%'}}/>
          <span style={{fontSize:13, fontWeight:500, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', maxWidth:320}}>{materialLabel}</span>
          <span className="mono" style={{fontSize:11.5, opacity:0.75}}>Q {currentQ + 1} of {totalQ}</span>
        </div>

        {session.timed && (
          <div style={{margin:'0 auto', display:'flex', alignItems:'center', gap:10}}>
            <Icon.clock size={12}/>
            <span className="mono" style={{fontSize:15, fontWeight:500, letterSpacing:'0.02em'}}>
              {fmtTime(remaining ?? 0)}
            </span>
            <span className="mono" style={{fontSize:11, opacity:0.7}}>remaining</span>
          </div>
        )}

        <div style={{display:'flex', alignItems:'center', gap:10, fontSize:12.5, opacity:0.85, marginLeft: session.timed ? 0 : 'auto'}}>
          <button onClick={() => {
            if (window.confirm('Exit this test? Your answers so far will be saved, but the test will be scored as submitted.')) {
              finishTest(false);
            }
          }} className="btn-bare" style={{fontSize:12.5, color:'white'}}>Exit</button>
        </div>
      </div>

      {/* Progress dots */}
      <div style={{
        padding:'12px 40px', background:'var(--bg-elev)', borderBottom:'1px solid var(--rule)',
        display:'flex', gap:4, justifyContent:'center', flexWrap:'wrap'
      }}>
        {Array.from({length:totalQ}).map((_,i) => (
          <div key={i} onClick={() => setCurrentQ(i)} style={{
            width: i === currentQ ? 20 : 6, height:6, borderRadius:3,
            background: answers[i] !== undefined ? 'var(--accent)' : i === currentQ ? 'var(--chem)' : 'var(--rule)',
            cursor:'pointer', transition:'all 0.15s'
          }}/>
        ))}
      </div>

      {/* Question — centered, generous */}
      <div style={{
        flex:1, display:'flex', flexDirection:'column',
        alignItems:'center', justifyContent:'flex-start',
        padding:'72px 40px 40px'
      }}>
        <div style={{maxWidth:680, width:'100%'}}>
          <div className="eyebrow" style={{marginBottom:18, color:'var(--ink-3)'}}>
            Question {(currentQ + 1).toString().padStart(2, '0')} — {qTypeLabel}
          </div>

          <div className="display" style={{
            fontSize:26, lineHeight:1.35, letterSpacing:'-0.015em', fontWeight:400,
            marginBottom:40
          }}>
            {q.question_text}
          </div>

          {options && options.map(opt => (
            <button key={opt.k}
              onClick={() => selectAnswer(opt.k)}
              style={{
                display:'flex', gap:18, alignItems:'flex-start',
                width:'100%', textAlign:'left',
                padding:'16px 20px', marginBottom:8,
                borderRadius:8,
                border:'1px solid ' + (selected === opt.k ? 'var(--ink)' : 'var(--rule)'),
                background: selected === opt.k ? 'var(--bg-elev)' : 'transparent',
                transition:'all 0.12s', cursor:'pointer'
              }}>
              <span className="mono" style={{
                fontSize:12, color: selected === opt.k ? 'var(--bg)' : 'var(--ink-3)',
                background: selected === opt.k ? 'var(--ink)' : 'var(--bg-sunken)',
                width:22, height:22, borderRadius:4,
                display:'flex', alignItems:'center', justifyContent:'center',
                flexShrink:0, marginTop:1, fontWeight:500,
              }}>
                {opt.k.length > 1 ? opt.k[0] : opt.k}
              </span>
              <span style={{fontSize:15.5, lineHeight:1.45}}>{opt.t}</span>
            </button>
          ))}

          {q.question_type === 'ShortAnswer' && (
            <textarea
              value={shortAnswer[currentQ] ?? answers[currentQ] ?? ''}
              onChange={e => setShortAnswer({ ...shortAnswer, [currentQ]: e.target.value })}
              placeholder="Type your answer…"
              rows={4}
              style={{
                width:'100%', padding:'14px 16px', fontSize:15, lineHeight:1.5,
                border:'1px solid var(--rule)', borderRadius:8,
                background:'var(--bg-elev)', color:'var(--ink)', outline:'none',
                fontFamily:'inherit', resize:'vertical'
              }}/>
          )}
        </div>
      </div>

      {/* Footer nav — quiet */}
      <div style={{
        borderTop:'1px solid var(--rule)',
        padding:'14px 40px',
        display:'flex', alignItems:'center', gap:16
      }}>
        <button onClick={goPrev} disabled={currentQ === 0} className="btn btn-ghost btn-sm" style={{opacity: currentQ === 0 ? 0.4 : 1}}>← Previous</button>
        <button onClick={toggleFlag}
                className="btn btn-bare"
                style={{fontSize:12.5, color: isFlagged ? 'var(--warn)' : 'var(--ink-3)'}}>
          <Icon.flag size={12}/> {isFlagged ? 'Flagged' : 'Flag for review'}
        </button>
        <div style={{marginLeft:'auto', fontSize:11.5, color:'var(--ink-4)', display:'flex', gap:10}}>
          {q.question_type === 'MCQ' && <span><span className="kbd-key">A–D</span> to answer</span>}
          <span><span className="kbd-key">→</span> next</span>
        </div>
        <button onClick={goNext} disabled={submitting} className="btn btn-primary btn-sm" style={{opacity: submitting ? 0.6 : 1}}>
          {submitting ? (currentQ === totalQ - 1 ? 'Scoring…' : 'Saving…')
            : (currentQ === totalQ - 1 ? 'Finish test' : 'Next question')} <Icon.arrow size={12}/>
        </button>
      </div>
    </div>
  );
};

window.TestTaking = TestTaking;
// Results — debrief, not KPI dashboard. Narrative + per-question review with citations.

const Results = ({ navigate }) => {
  const app = useApp();
  const results = app.results;
  const [retrying, setRetrying] = React.useState(false);
  const [recs, setRecs] = React.useState(null); // { recommendations: string[], source: 'ai'|'generic' }
  const [recsLoading, setRecsLoading] = React.useState(false);

  React.useEffect(() => {
    if (!results) navigate('dashboard');
  }, [results]);

  const attempt = results?.attempt || {};
  const questions = results?.questions || [];
  const material = results?.material || null;
  const config = results?.config || {};

  React.useEffect(() => {
    if (!results) return;
    const wrong = questions.filter(q => !q.is_correct);
    if (wrong.length === 0) { setRecs(null); return; }
    const weakAreas = wrong.slice(0, 5).map(q => String(q.question_text || '').slice(0, 120));
    setRecsLoading(true);
    (async () => {
      try {
        const data = await api.post('/api/social/recommendations', {
          attempt_id: attempt.id,
          weak_areas: weakAreas,
          test_type: config.test_type || (material?.title) || 'General',
          score: Math.round(Number(attempt.score || 0))
        });
        setRecs({ recommendations: data.recommendations || [], source: data.source || 'generic' });
      } catch {
        setRecs(null);
      } finally {
        setRecsLoading(false);
      }
    })();
  }, [results?.attempt?.id]);

  if (!results) return null;

  const correctCount = questions.filter(q => q.is_correct).length;
  const wrongCount = questions.length - correctCount;
  const pct = Math.round(Number(attempt.score || (questions.length ? (correctCount / questions.length) * 100 : 0)));
  const duration = Number(attempt.duration_seconds || 0);
  const mm = Math.floor(duration / 60);
  const ss = String(duration % 60).padStart(2, '0');
  const doneAt = attempt.end_time ? new Date(attempt.end_time) : new Date();
  const avgSec = Math.round(Number(results.performance_analytics?.average_time_per_question || 0));

  const missed = questions.filter(q => !q.is_correct).map(q => ({
    question: q.question_text,
    correct_answer: q.correct_answer,
    explanation: q.ai_explanation
  }));

  const retakeMissed = async () => {
    if (!material || missed.length === 0) return;
    setRetrying(true);
    try {
      const data = await api.post('/api/tests/materials/retry-test', {
        material_id: material.id,
        missed_questions: missed,
        difficulty: config.difficulty || 'Medium',
        num_questions: Math.max(3, Math.min(20, missed.length + 2)),
        question_types: config.question_types || ['MCQ']
      });
      if (!data.attempt_id || !data.questions?.length) throw new Error('No questions were generated.');
      app.setSession({
        attemptId: data.attempt_id,
        config: data.config,
        material: data.material || material,
        questions: data.questions,
        answers: {}, flagged: {},
        questionShownAt: { 0: Date.now() },
        startedAt: Date.now(),
        timed: true,
        durationMinutes: Math.max(10, data.questions.length * 2),
      });
      app.setResults(null);
      navigate('taking');
    } catch (err) {
      app.flashToast('error', err.message || 'Couldn\'t generate a retry test.');
    } finally {
      setRetrying(false);
    }
  };

  const askAboutMaterial = () => {
    if (!material) return;
    app.setSelectedMaterial({ id: material.id, title: material.title, file_name: material.file_name });
    navigate('ask');
  };

  return (
    <div className="content narrow">
      {/* Header */}
      <div style={{marginBottom:44}}>
        <div className="eyebrow" style={{marginBottom:12}}>
          Done · {doneAt.toLocaleDateString(undefined, { month: 'long', day: 'numeric' })}, {doneAt.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}
        </div>
        <h1 className="page-title">
          You got <span className="mono" style={{fontSize:'0.9em', fontWeight:500}}>{correctCount}</span> of <span className="mono" style={{fontSize:'0.9em', fontWeight:500}}>{questions.length}</span>.
        </h1>
        <p className="page-sub" style={{fontSize:16, marginTop:12, maxWidth:'58ch'}}>
          {material
            ? <>Scored from <b>{material.title || material.file_name}</b>. {wrongCount > 0 ? `You missed ${wrongCount} — scroll down for why.` : 'Clean sweep.'}</>
            : <>Here's your result. {wrongCount > 0 && <>You missed {wrongCount} — see below.</>}</>}
        </p>
      </div>

      {/* Stat strip */}
      <div style={{
        display:'grid', gridTemplateColumns:'repeat(4, 1fr)',
        gap:2, marginBottom:40,
        background:'var(--rule)',
        border:'1px solid var(--rule)',
        borderRadius:10, overflow:'hidden',
      }}>
        {[
          {v: pct + '%',    l:'Score',         s: `${correctCount} right · ${wrongCount} wrong`, bg:'var(--biology-soft)', fg:'var(--biology-ink)'},
          {v: `${mm}:${ss}`, l:'Time taken',   s: avgSec ? `avg ${avgSec}s per question` : '—', bg:'var(--physics-soft)', fg:'var(--physics-ink)'},
          {v: String(wrongCount), l:'Missed',   s: wrongCount ? 'see breakdown below' : 'none', bg:'var(--danger-soft)', fg:'var(--danger)'},
          {v: String(questions.length), l:'Questions', s: config?.difficulty || '—', bg:'var(--hum-soft)', fg:'var(--hum-ink)'},
        ].map((s,i) => (
          <div key={i} style={{background:s.bg, padding:'22px 20px'}}>
            <div className="mono" style={{fontSize:28, fontWeight:500, letterSpacing:'-0.01em', color:s.fg}}>{s.v}</div>
            <div style={{fontSize:11, color:s.fg, marginTop:4, opacity:0.8,
                         fontFamily:'var(--font-mono)', textTransform:'uppercase', letterSpacing:'0.1em', fontWeight:600}}>{s.l}</div>
            <div style={{fontSize:12.5, color:'var(--ink-2)', marginTop:8}}>{s.s}</div>
          </div>
        ))}
      </div>

      {/* What to do next */}
      {(wrongCount > 0 || material) && (
        <div style={{marginBottom:40}}>
          <div className="section-title">
            <span>What to do next</span>
            <span className="rule"/>
          </div>
          <div style={{padding:'26px 28px', background:'var(--accent)', color:'white', borderRadius:12}}>
            <div style={{fontSize:16, lineHeight:1.55}}>
              {wrongCount > 0
                ? <>You missed <b>{wrongCount}</b>. The quickest path to learning it is a focused retry that targets the same concepts.</>
                : <>Clean sweep. Want to push harder or ask follow-up questions?</>}
            </div>
            <div style={{marginTop:20, display:'flex', gap:10, flexWrap:'wrap'}}>
              {wrongCount > 0 && (
                <button onClick={retakeMissed} disabled={retrying || !material}
                        className="btn btn-sm"
                        style={{background:'white', color:'var(--accent-ink)', fontWeight:600, opacity: (retrying || !material) ? 0.7 : 1}}>
                  <Icon.sparkle size={12}/> {retrying ? 'Generating…' : `Retry on the ${wrongCount} I missed`}
                </button>
              )}
              {material && (
                <button onClick={askAboutMaterial} className="btn btn-sm" style={{background:'oklch(1 0 0 / 0.15)', color:'white'}}>
                  Ask about this material
                </button>
              )}
              <button onClick={() => navigate('dashboard')} className="btn btn-sm" style={{background:'oklch(1 0 0 / 0.15)', color:'white'}}>
                Back to dashboard
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI recommendations (or fallback) */}
      {(recsLoading || (recs && recs.recommendations?.length > 0)) && (
        <div style={{marginBottom:40}}>
          <div className="section-title">
            <span>Study suggestions</span>
            {recs?.source === 'ai' && <span className="count">from your questions</span>}
            <span className="rule"/>
          </div>
          {recsLoading ? (
            <div style={{padding:16, fontSize:13, color:'var(--ink-3)'}}>Generating suggestions…</div>
          ) : (
            <div className="card" style={{padding:22}}>
              <ul style={{margin:0, paddingLeft:20, display:'flex', flexDirection:'column', gap:10}}>
                {recs.recommendations.map((r, i) => (
                  <li key={i} style={{fontSize:14, lineHeight:1.55, color:'var(--ink-2)'}}>{r}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Per-question review */}
      <div>
        <div className="section-title">
          <span>Question by question</span>
          <span className="count">{correctCount} right · {wrongCount} wrong</span>
          <span className="rule"/>
        </div>

        <div style={{display:'flex', flexDirection:'column', gap:2}}>
          {questions.map(q => {
            const correct = q.is_correct;
            return (
              <div key={q.id} style={{
                borderLeft: '2px solid ' + (correct ? 'var(--accent)' : 'var(--danger)'),
                padding:'14px 18px',
                background: correct ? 'transparent' : 'oklch(98% 0.015 25 / 0.4)',
                borderRadius:'0 6px 6px 0',
              }}>
                <div style={{display:'flex', alignItems:'baseline', gap:12}}>
                  <span className="mono" style={{fontSize:11.5, color:'var(--ink-3)', minWidth:28}}>
                    Q{String(q.question_number).padStart(2,'0')}
                  </span>
                  <span className="chip" style={{fontSize:10.5}}>
                    {q.question_type === 'MCQ' ? 'MCQ' : q.question_type === 'TrueFalse' ? 'T/F' : 'Short'}
                  </span>
                  <span style={{flex:1, fontSize:14, lineHeight:1.4}}>{q.question_text}</span>
                  <span style={{
                    fontSize:11.5, fontFamily:'var(--font-mono)', minWidth:80, textAlign:'right',
                    color: correct ? 'var(--accent-ink)' : 'var(--danger)',
                    fontWeight:500,
                  }}>
                    {correct ? '✓ correct' : `✗ ${q.user_answer || '—'} → ${q.correct_answer}`}
                  </span>
                </div>
                {!correct && q.ai_explanation && (
                  <div style={{
                    marginTop:12, marginLeft:40,
                    padding:'14px 16px',
                    background:'var(--bg-elev)', borderRadius:6,
                    border:'1px solid var(--rule)'
                  }}>
                    <div className="eyebrow" style={{marginBottom:6, color:'var(--ink-3)'}}>Why</div>
                    <div style={{fontSize:13.5, lineHeight:1.55}}>{q.ai_explanation}</div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Closing */}
      <div style={{
        marginTop:40, padding:'24px', textAlign:'center',
        borderTop:'1px solid var(--rule)'
      }}>
        <button onClick={() => navigate('dashboard')} className="btn btn-primary">Back to dashboard</button>
      </div>
    </div>
  );
};

window.Results = Results;
// Analytics — study journal, not KPI dashboard

const Analytics = () => {
  const app = useApp();
  React.useEffect(() => { app.refreshStats(); app.refreshHistory(); }, []);
  const stats = app.stats;
  const completed = (app.history || []).filter(r => (r.status || '').toLowerCase() === 'completed' || r.status == null);
  const sorted = [...completed].sort((a, b) => new Date(a.created_at || a.start_time) - new Date(b.created_at || b.start_time));
  const series = sorted.slice(-12).map(r => Math.round(Number(r.score || 0)));
  const w = 400, h = 160;

  return (
    <div className="content">
      <div style={{marginBottom:36}}>
        <div className="eyebrow" style={{marginBottom:10}}>Your study, in numbers</div>
        <h1 className="page-title">Analytics.</h1>
        <p className="page-sub" style={{fontSize:16, maxWidth:'60ch'}}>
          {stats && stats.total_tests > 0
            ? <>You've taken <b>{stats.total_tests}</b> {stats.total_tests === 1 ? 'test' : 'tests'}. Average score <b>{Math.round(stats.avg_score)}%</b>, best <b>{Math.round(stats.best_score)}%</b>.</>
            : <>No finished tests yet. Take one and we'll start tracking trends here.</>}
        </p>
      </div>

      {series.length > 1 && (
        <div className="card" style={{padding:24, marginBottom:24}}>
          <div style={{fontSize:15, fontWeight:500}}>Score over time</div>
          <div style={{fontSize:12.5, color:'var(--ink-3)', marginTop:2}}>Last {series.length} completed tests</div>
          <svg viewBox={`0 0 ${w} ${h}`} style={{width:'100%', marginTop:20, overflow:'visible'}}>
            {[0, 25, 50, 75, 100].map(y => (
              <React.Fragment key={y}>
                <line x1="0" x2={w} y1={h - y*(h/100)} y2={h - y*(h/100)} stroke="var(--rule-2)" strokeWidth="0.5"/>
                <text x="-6" y={h - y*(h/100) + 3} fontFamily="var(--font-mono)" fontSize="9" fill="var(--ink-4)" textAnchor="end">{y}</text>
              </React.Fragment>
            ))}
            <path d={`M ${series.map((v, i) => `${i * (w/Math.max(1,series.length-1))} ${h - v*(h/100)}`).join(' L ')}`}
                  fill="none" stroke="var(--accent)" strokeWidth="1.8"/>
            {series.map((v, i) => (
              <circle key={i} cx={i * (w/Math.max(1,series.length-1))} cy={h - v*(h/100)} r="2.5"
                      fill="var(--bg-elev)" stroke="var(--accent)" strokeWidth="1.5"/>
            ))}
          </svg>
        </div>
      )}

      {stats && stats.total_tests > 0 && (
        <div style={{display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:2,
                     background:'var(--rule)', border:'1px solid var(--rule)', borderRadius:10, overflow:'hidden'}}>
          {[
            { l:'Tests completed', v: String(stats.total_tests), bg:'var(--chem-soft)', fg:'var(--chem-ink)' },
            { l:'Average score', v: `${Math.round(stats.avg_score)}%`, bg:'var(--biology-soft)', fg:'var(--biology-ink)' },
            { l:'Best score', v: `${Math.round(stats.best_score)}%`, bg:'var(--math-soft)', fg:'var(--math-ink)' },
            { l:'Avg time / question', v: `${Math.round(stats.avg_time_per_question)}s`, bg:'var(--physics-soft)', fg:'var(--physics-ink)' },
          ].map((h, i) => (
            <div key={i} style={{padding:'22px 20px', background:h.bg}}>
              <div className="mono" style={{fontSize:10.5, color:h.fg, textTransform:'uppercase', letterSpacing:'0.12em', fontWeight:600}}>{h.l}</div>
              <div className="mono" style={{fontSize:20, fontWeight:600, marginTop:6, color:h.fg}}>{h.v}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

window.Analytics = Analytics;
// Auth + Ask + History screens

const Auth = ({ navigate }) => {
  const app = useApp();
  const [mode, setMode] = React.useState('login'); // 'login' | 'register'
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [name, setName] = React.useState('');
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState(null);

  const submit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setError(null);
    if (!email || !password || (mode === 'register' && !name)) {
      setError('Please fill in all fields.');
      return;
    }
    setSubmitting(true);
    try {
      const path = mode === 'login' ? '/api/auth/login' : '/api/auth/register';
      const body = mode === 'login'
        ? { email, password }
        : { email, password, name };
      const data = await api.post(path, body);
      if (data.token) setToken(data.token);
      if (data.user) app.setUser(data.user);
      app.refreshMaterials();
      app.refreshStats();
      app.refreshHistory();
      app.flashToast('ok', mode === 'login' ? `Welcome back, ${data.user?.name || email}.` : 'Account created.');
      navigate('dashboard');
    } catch (err) {
      setError(err.message || 'Authentication failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{minHeight:'100vh', display:'grid', gridTemplateColumns:'1fr 1fr', background:'var(--bg)'}}>
      {/* Left — form */}
      <div style={{padding:'48px', display:'flex', flexDirection:'column'}}>
        <div className="wordmark" style={{padding:0, cursor:'pointer'}} onClick={() => navigate('landing')}>
          <span className="dot"/>
          <span style={{fontSize:17}}>testai</span>
        </div>

        <form onSubmit={submit} style={{margin:'auto', width:'100%', maxWidth:360}}>
          <h1 className="page-title" style={{fontSize:30}}>
            {mode === 'login' ? 'Welcome back.' : 'Make an account.'}
          </h1>
          <p className="page-sub" style={{marginBottom:32}}>
            {mode === 'login'
              ? 'Sign in to pick up your tests, materials, and progress.'
              : 'Create an account to upload material and generate practice tests.'}
          </p>

          {mode === 'register' && (
            <div style={{marginBottom:14}}>
              <div className="mono" style={{fontSize:10.5, color:'var(--ink-3)', marginBottom:6,
                           textTransform:'uppercase', letterSpacing:'0.1em'}}>Name</div>
              <input type="text" placeholder="Your name" value={name} onChange={e => setName(e.target.value)}
                     style={{
                       width:'100%', padding:'10px 12px', fontSize:14,
                       border:'1px solid var(--rule)', borderRadius:6,
                       background:'var(--bg-elev)', color:'var(--ink)', outline:'none',
                     }}/>
            </div>
          )}

          <div style={{marginBottom:14}}>
            <div className="mono" style={{fontSize:10.5, color:'var(--ink-3)', marginBottom:6,
                         textTransform:'uppercase', letterSpacing:'0.1em'}}>Email</div>
            <input type="email" autoComplete="email" placeholder="you@school.edu"
                   value={email} onChange={e => setEmail(e.target.value)}
                   style={{
                     width:'100%', padding:'10px 12px', fontSize:14,
                     border:'1px solid var(--rule)', borderRadius:6,
                     background:'var(--bg-elev)', color:'var(--ink)', outline:'none',
                   }}/>
          </div>
          <div style={{marginBottom:14}}>
            <div className="mono" style={{fontSize:10.5, color:'var(--ink-3)', marginBottom:6,
                         textTransform:'uppercase', letterSpacing:'0.1em'}}>Password</div>
            <input type="password" autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                   placeholder="••••••••"
                   value={password} onChange={e => setPassword(e.target.value)}
                   style={{
                     width:'100%', padding:'10px 12px', fontSize:14,
                     border:'1px solid var(--rule)', borderRadius:6,
                     background:'var(--bg-elev)', color:'var(--ink)', outline:'none',
                   }}/>
          </div>

          {error && (
            <div style={{
              marginTop:6, marginBottom:10, padding:'8px 12px',
              background:'var(--danger-soft)', color:'var(--danger)',
              borderRadius:6, fontSize:13
            }}>{error}</div>
          )}

          <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:20}}>
            <button type="submit" disabled={submitting}
                    className="btn btn-accent"
                    style={{flex:1, justifyContent:'center', opacity: submitting ? 0.6 : 1}}>
              {submitting
                ? (mode === 'login' ? 'Signing in…' : 'Creating account…')
                : (mode === 'login' ? <>Sign in <Icon.arrow size={12}/></> : <>Create account <Icon.arrow size={12}/></>)}
            </button>
          </div>

          <div style={{marginTop:20, fontSize:12.5, color:'var(--ink-3)', textAlign:'center'}}>
            {mode === 'login' ? (
              <>New here? <button type="button" onClick={() => { setError(null); setMode('register'); }}
                   style={{background:'none', border:'none', color:'var(--ink)', fontWeight:500, borderBottom:'1px solid var(--rule)', cursor:'pointer', fontFamily:'inherit', fontSize:'inherit'}}>
                Make an account
              </button></>
            ) : (
              <>Already have one? <button type="button" onClick={() => { setError(null); setMode('login'); }}
                   style={{background:'none', border:'none', color:'var(--ink)', fontWeight:500, borderBottom:'1px solid var(--rule)', cursor:'pointer', fontFamily:'inherit', fontSize:'inherit'}}>
                Sign in
              </button></>
            )}
          </div>
        </form>

        <div style={{fontSize:11.5, color:'var(--ink-4)', display:'flex', gap:16}}>
          <span>© testai 2026</span><span>Privacy</span><span>Terms</span>
        </div>
      </div>

      {/* Right — quote / visual */}
      <div style={{
        background:'var(--accent)', color:'white', borderLeft:'none',
        padding:'48px', display:'flex', flexDirection:'column', justifyContent:'space-between'
      }}>
        <div className="eyebrow" style={{color:'oklch(1 0 0 / 0.7)'}}>What students say</div>
        <div>
          <p className="display" style={{fontSize:34, lineHeight:1.25, letterSpacing:'-0.02em', fontWeight:400, maxWidth:'24ch'}}>
            It's the first time a tool has made me want to review <em style={{fontFamily:'var(--font-serif)'}}>before</em> the test.
          </p>
          <div style={{marginTop:24, fontSize:12.5, opacity:0.75}}>
            <span className="mono">james r.</span> · first-year med student
          </div>
        </div>
        <div className="mono" style={{fontSize:11, opacity:0.5, letterSpacing:'0.1em', textTransform:'uppercase'}}>
          v 2.4.1 — updated apr 17
        </div>
      </div>
    </div>
  );
};

const Ask = ({ navigate }) => {
  const app = useApp();
  const [question, setQuestion] = React.useState('');
  const [messages, setMessages] = React.useState([]); // {role:'user'|'assistant', text, ts, source?}
  const [asking, setAsking] = React.useState(false);
  const [uploading, setUploading] = React.useState(null);
  const fileRef = React.useRef(null);

  React.useEffect(() => { app.refreshMaterials(); }, []);

  const uploadMaterial = async (file) => {
    setUploading(file.name);
    try {
      const base64 = await fileToBase64(file);
      const data = await api.post('/api/tests/materials/import', {
        file_name: file.name, mime_type: file.type || '', file_content_base64: base64
      });
      await app.refreshMaterials();
      if (data.material?.id) {
        app.setSelectedMaterial({ id: data.material.id, title: data.material.title, file_name: data.material.file_name });
      }
      app.flashToast('ok', `"${file.name}" imported.`);
    } catch (err) {
      app.flashToast('error', err.message || 'Upload failed.');
    } finally {
      setUploading(null);
    }
  };

  const readyMaterials = (app.materials || []).filter(m => m.processing_status === 'ready');
  const selectedMat = app.selectedMaterial?.id
    ? app.materials.find(m => m.id === app.selectedMaterial.id) || app.selectedMaterial
    : readyMaterials[0];

  const sendQuestion = async (q) => {
    if (!q || !q.trim()) return;
    if (!selectedMat?.id) {
      app.flashToast('error', 'Pick a material first.');
      return;
    }
    setMessages(ms => [...ms, { role:'user', text:q, ts:Date.now() }]);
    setAsking(true);
    try {
      const data = await api.post('/api/tests/materials/ask', {
        material_id: selectedMat.id,
        question: q
      });
      setMessages(ms => [...ms, {
        role:'assistant',
        text: data.answer || '(no answer)',
        ts: Date.now(),
        source: data.source,
        parentQuestion: q
      }]);
    } catch (err) {
      setMessages(ms => [...ms, { role:'assistant', text: 'Sorry — ' + (err.message || 'failed to answer.'), ts: Date.now(), error: true }]);
    } finally {
      setAsking(false);
    }
  };

  const ask = () => {
    const q = question.trim();
    if (!q) return;
    setQuestion('');
    sendQuestion(q);
  };

  const explainSimpler = (m) => {
    if (asking) return;
    const prev = m.parentQuestion || 'the previous topic';
    sendQuestion(`Explain that last answer in simpler terms. Original question: "${prev}". Use short sentences and avoid jargon.`);
  };

  const makeTestFromThis = async (m) => {
    if (!selectedMat?.id) return;
    const topic = (m.parentQuestion || m.text || '').slice(0, 160);
    try {
      app.flashToast('ok', 'Generating a short test on this topic…');
      const data = await api.post('/api/tests/materials/generate-test', {
        material_id: selectedMat.id,
        difficulty: 'Medium',
        num_questions: 10,
        question_types: ['MCQ'],
        topic_focus: topic
      });
      if (!data.attempt_id || !data.questions?.length) throw new Error('No questions were generated.');
      app.setSession({
        attemptId: data.attempt_id,
        config: data.config,
        material: data.material || selectedMat,
        questions: data.questions,
        answers: {}, flagged: {},
        questionShownAt: { 0: Date.now() },
        startedAt: Date.now(),
        timed: true, durationMinutes: 15,
      });
      app.setResults(null);
      navigate('taking');
    } catch (err) {
      app.flashToast('error', err.message || 'Failed to generate test.');
    }
  };

  const fmtTime = (ts) => new Date(ts).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });

  return (
    <div className="content narrow">
      <div style={{marginBottom:24}}>
        <div className="eyebrow" style={{marginBottom:8}}>Ask a question</div>
        <h1 className="page-title">What's on your mind?</h1>
        <p className="page-sub">Answers are pulled from your uploaded material — nothing else.</p>
      </div>

      {/* Scope selector */}
      <div style={{display:'flex', gap:8, marginBottom:20, alignItems:'center', flexWrap:'wrap'}}>
        <span className="mono" style={{fontSize:11, color:'var(--ink-3)', textTransform:'uppercase', letterSpacing:'0.12em'}}>In:</span>
        <input ref={fileRef} type="file" accept=".pdf,.docx,.md,.txt" style={{display:'none'}}
               onChange={e => { const f = e.target.files?.[0]; if (f) uploadMaterial(f); if (e.target) e.target.value=''; }} />
        {readyMaterials.length === 0 ? (
          <button onClick={() => fileRef.current?.click()} disabled={!!uploading}
                  className="chip outline" style={{padding:'3px 10px', cursor:'pointer'}}>
            {uploading ? `Importing ${uploading}…` : '+ Upload a material first'}
          </button>
        ) : (
          <>
            {readyMaterials.map(m => (
              <button key={m.id}
                      onClick={() => app.setSelectedMaterial({ id: m.id, title: m.title, file_name: m.file_name })}
                      className={`chip ${selectedMat?.id === m.id ? 'ink' : 'outline'}`}
                      style={{padding:'3px 10px', cursor:'pointer'}}>
                {m.title || m.file_name}
              </button>
            ))}
            <button onClick={() => fileRef.current?.click()} disabled={!!uploading}
                    className="chip outline" style={{padding:'3px 10px', cursor:'pointer', borderStyle:'dashed'}}>
              <Icon.plus size={10}/> {uploading ? `Importing ${uploading}…` : 'add material'}
            </button>
          </>
        )}
      </div>

      {/* Conversation */}
      <div style={{display:'flex', flexDirection:'column', gap:24, marginBottom:32, minHeight: messages.length ? 0 : 120}}>
        {messages.length === 0 && (
          <div style={{padding:'24px 20px', border:'1px dashed var(--rule)', borderRadius:8, textAlign:'center', color:'var(--ink-3)', fontSize:13.5}}>
            Try a question like "Summarize the main argument in chapter 3" or "Why does X matter?"
          </div>
        )}
        {messages.map((m, i) => m.role === 'user' ? (
          <div key={i}>
            <div className="mono" style={{fontSize:10.5, color:'var(--ink-3)', marginBottom:8, textTransform:'uppercase', letterSpacing:'0.1em'}}>
              You · {fmtTime(m.ts)}
            </div>
            <div style={{fontSize:15.5, lineHeight:1.5}}>{m.text}</div>
          </div>
        ) : (
          <div key={i} style={{
            padding:'20px 22px', background:'var(--bg-elev)',
            border:'1px solid var(--rule)', borderRadius:8
          }}>
            <div className="mono" style={{fontSize:10.5, color:'var(--ink-3)', marginBottom:8, textTransform:'uppercase', letterSpacing:'0.1em'}}>
              <span className="dot" style={{display:'inline-block', width:6, height:6, background:'var(--accent)', borderRadius:'50%', marginRight:6}}/>
              testai · from your notes
            </div>
            <div style={{fontSize:15, lineHeight:1.6, whiteSpace:'pre-wrap', color: m.error ? 'var(--danger)' : 'inherit'}}>
              {m.text}
            </div>
            {m.source && m.source.chunk_count > 0 && (
              <div style={{marginTop:14, fontSize:11.5, color:'var(--ink-3)', fontFamily:'var(--font-mono)'}}>
                Drawn from {m.source.chunk_count} passage{m.source.chunk_count === 1 ? '' : 's'} in <b>{m.source.title}</b>.
              </div>
            )}
            {!m.error && (
              <div style={{marginTop:14, display:'flex', gap:12, fontSize:12.5, color:'var(--ink-3)', flexWrap:'wrap'}}>
                <button onClick={() => explainSimpler(m)} disabled={asking}
                        className="btn-bare" style={{fontSize:12.5, cursor:'pointer', opacity: asking ? 0.5 : 1}}>
                  Explain simpler
                </button>
                <span>·</span>
                <button onClick={() => makeTestFromThis(m)}
                        className="btn-bare" style={{fontSize:12.5, cursor:'pointer'}}>
                  Make a test on this
                </button>
              </div>
            )}
          </div>
        ))}
        {asking && (
          <div style={{padding:'14px 18px', fontSize:13, color:'var(--ink-3)'}}>
            <span className="mono">Reading {selectedMat?.title || 'your notes'}…</span>
          </div>
        )}
      </div>

      {/* Input */}
      <form onSubmit={(e) => { e.preventDefault(); ask(); }}
            style={{
              display:'flex', gap:10, alignItems:'center',
              padding:'14px 16px', border:'1px solid var(--rule)', borderRadius:8,
              background:'var(--bg-elev)'
            }}>
        <Icon.sparkle size={14}/>
        <input value={question}
               onChange={e => setQuestion(e.target.value)}
               disabled={asking || !selectedMat}
               placeholder={selectedMat ? `Ask about ${selectedMat.title || selectedMat.file_name}…` : 'Upload a material to start asking…'}
               style={{
                 flex:1, fontSize:14.5, color:'var(--ink)', background:'transparent',
                 border:'none', outline:'none', fontFamily:'inherit'
               }}/>
        <button type="submit" disabled={asking || !question.trim() || !selectedMat}
                className="btn btn-primary btn-sm"
                style={{opacity: (asking || !question.trim() || !selectedMat) ? 0.5 : 1}}>
          {asking ? 'Thinking…' : 'Ask'} <Icon.arrow size={12}/>
        </button>
      </form>
    </div>
  );
};

const History = () => {
  const app = useApp();
  React.useEffect(() => { app.refreshHistory(); }, []);

  const rows = app.history || [];
  const completed = rows.filter(r => (r.status || '').toLowerCase() === 'completed' || r.status == null);
  const days = groupByDay(completed);

  return (
    <div className="content narrow">
      <div style={{marginBottom:28}}>
        <div className="eyebrow" style={{marginBottom:10}}>Everything you've taken</div>
        <h1 className="page-title">History</h1>
        {rows.length === 0 && (
          <p className="page-sub" style={{marginTop:12}}>No tests yet. Upload a material and take one — it'll show up here.</p>
        )}
      </div>
      {days.map((d, i) => (
        <div key={i} style={{marginBottom:28}}>
          <div style={{fontSize:12.5, color:'var(--ink-3)', marginBottom:10, fontFamily:'var(--font-mono)', letterSpacing:'0.08em', textTransform:'uppercase'}}>{d.d}</div>
          <div style={{borderTop:'1px solid var(--rule)'}}>
            {d.tests.map((t) => {
              const score = Math.round(Number(t.score || 0));
              const when = new Date(t.created_at || t.start_time).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
              return (
                <div key={t.id} style={{
                  padding:'14px 0', borderBottom:'1px solid var(--rule-2)',
                  display:'grid', gridTemplateColumns:'1fr 80px 60px 16px', gap:16, alignItems:'center',
                }}>
                  <div style={{fontSize:14.5}}>
                    {t.test_type || 'Test'}
                    <span style={{color:'var(--ink-3)', fontSize:12, marginLeft:8}}>· {t.total_questions || 0} questions</span>
                  </div>
                  <div className="mono" style={{fontSize:12, color:'var(--ink-3)'}}>{when}</div>
                  <div className="mono" style={{fontSize:14, fontWeight:500, textAlign:'right',
                       color: score >= 80 ? 'var(--accent-ink)' : score >= 70 ? 'var(--ink)' : 'var(--warn)'}}>{score}</div>
                  <Icon.arrow size={12}/>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};

window.Auth = Auth;
window.Ask = Ask;
window.History = History;

// ============ Profile — user + social stats + achievements ============

const Profile = ({ navigate }) => {
  const app = useApp();
  const [social, setSocial] = React.useState(null); // { user_stats, global_stats, rank, subject_performance }
  const [achievements, setAchievements] = React.useState(null);
  const [leaderboard, setLeaderboard] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const [socialData, achData, lbData] = await Promise.allSettled([
          api.get('/api/social/statistics'),
          api.get('/api/social/achievements'),
          api.get('/api/social/leaderboard?period=all'),
        ]);
        if (socialData.status === 'fulfilled') setSocial(socialData.value);
        if (achData.status === 'fulfilled') setAchievements(achData.value);
        if (lbData.status === 'fulfilled') setLeaderboard(lbData.value.leaderboard || []);
        const firstErr = [socialData, achData, lbData].find(r => r.status === 'rejected');
        if (firstErr && socialData.status !== 'fulfilled' && achData.status !== 'fulfilled') {
          setError(firstErr.reason?.message || 'Failed to load profile');
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const u = app.user || {};
  const s = social?.user_stats || app.stats || {};
  const rank = social?.rank;
  const totalUnlocked = achievements?.total_unlocked || 0;

  const groups = achievements?.achievements || {};
  const groupOrder = ['score', 'consistency', 'mastery', 'special'];
  const groupLabel = { score: 'Score', consistency: 'Consistency', mastery: 'Mastery', special: 'Special' };

  const topLeaders = (leaderboard || []).slice(0, 8);
  const meId = u.id;

  return (
    <div className="content">
      <div style={{marginBottom:28}}>
        <div className="eyebrow" style={{marginBottom:10}}>Your account</div>
        <h1 className="page-title">Profile</h1>
      </div>

      <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:32}}>
        <div className="card" style={{padding:22}}>
          <div className="eyebrow" style={{marginBottom:8}}>Account</div>
          <div style={{fontSize:18, fontWeight:500}}>{u.name || '—'}</div>
          <div className="mono" style={{fontSize:12, color:'var(--ink-3)', marginTop:4}}>{u.email || ''}</div>
          {u.created_at && (
            <div style={{fontSize:12, color:'var(--ink-3)', marginTop:10}}>
              Joined {new Date(u.created_at).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
            </div>
          )}
          <div style={{marginTop:18, display:'flex', gap:8, flexWrap:'wrap'}}>
            <button onClick={() => navigate('settings')} className="btn btn-ghost btn-sm">Settings</button>
            <button onClick={() => { if (window.confirm('Sign out?')) app.signOut(); }} className="btn btn-ghost btn-sm">Sign out</button>
          </div>
        </div>
        <div className="card" style={{padding:22}}>
          <div className="eyebrow" style={{marginBottom:8}}>At a glance</div>
          <div style={{display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:12}}>
            <div>
              <div className="mono" style={{fontSize:22, fontWeight:500}}>{s.total_tests || 0}</div>
              <div style={{fontSize:11.5, color:'var(--ink-3)'}}>Tests completed</div>
            </div>
            <div>
              <div className="mono" style={{fontSize:22, fontWeight:500}}>{Math.round(s.avg_score || 0)}%</div>
              <div style={{fontSize:11.5, color:'var(--ink-3)'}}>Average score</div>
            </div>
            <div>
              <div className="mono" style={{fontSize:22, fontWeight:500}}>{Math.round(s.best_score || 0)}%</div>
              <div style={{fontSize:11.5, color:'var(--ink-3)'}}>Best score</div>
            </div>
            <div>
              <div className="mono" style={{fontSize:22, fontWeight:500}}>{rank ? `#${rank}` : '—'}</div>
              <div style={{fontSize:11.5, color:'var(--ink-3)'}}>Global rank</div>
            </div>
          </div>
        </div>
      </div>

      {loading && <div style={{padding:20, textAlign:'center', color:'var(--ink-3)'}}>Loading profile…</div>}
      {error && !loading && <div style={{padding:20, color:'var(--danger)', fontSize:13.5}}>Couldn't load profile data: {error}</div>}

      {/* Subject performance */}
      {social?.subject_performance?.length > 0 && (
        <div style={{marginBottom:32}}>
          <div className="section-title">
            <span>Performance by test type</span>
            <span className="rule"/>
          </div>
          <div className="card" style={{padding:22}}>
            {social.subject_performance.map((row, i) => {
              const score = Math.round(Number(row.avg_score || 0));
              return (
                <div key={i} style={{display:'flex', alignItems:'center', gap:12, padding:'8px 0', borderBottom: i < social.subject_performance.length - 1 ? '1px solid var(--rule-2)' : 'none'}}>
                  <span style={{fontSize:13.5, flex:1, color:'var(--ink-2)'}}>{row.test_type}</span>
                  <span className="mono" style={{fontSize:11.5, color:'var(--ink-3)'}}>{row.test_count} {Number(row.test_count) === 1 ? 'test' : 'tests'}</span>
                  <div style={{flex:'0 0 140px', height:4, background:'var(--rule-2)', borderRadius:999}}>
                    <div style={{width: `${Math.min(100,score)}%`, height:'100%',
                         background: score >= 80 ? 'var(--accent)' : score >= 65 ? 'var(--ink-2)' : 'var(--warn)',
                         borderRadius:999}}/>
                  </div>
                  <span className="mono" style={{fontSize:12, minWidth:30, textAlign:'right'}}>{score}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Achievements */}
      {achievements && (
        <div style={{marginBottom:32}}>
          <div className="section-title">
            <span>Achievements</span>
            <span className="count">{totalUnlocked} unlocked</span>
            <span className="rule"/>
          </div>
          <div style={{display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:14}}>
            {groupOrder.map(gk => (
              <div key={gk} className="card" style={{padding:18}}>
                <div className="eyebrow" style={{marginBottom:10}}>{groupLabel[gk]}</div>
                <div style={{display:'flex', flexDirection:'column', gap:10}}>
                  {(groups[gk] || []).map((a, i) => (
                    <div key={i} style={{display:'flex', alignItems:'center', gap:12, opacity: a.unlocked ? 1 : 0.55}}>
                      <span style={{fontSize:20, width:26, textAlign:'center'}}>{a.icon}</span>
                      <div style={{flex:1, minWidth:0}}>
                        <div style={{fontSize:13.5, fontWeight:500}}>
                          {a.name}
                          {a.unlocked && <span style={{marginLeft:8, fontSize:11, color:'var(--accent-ink)', fontFamily:'var(--font-mono)'}}>unlocked</span>}
                        </div>
                        <div style={{fontSize:11.5, color:'var(--ink-3)'}}>{a.description}</div>
                      </div>
                      <div style={{flex:'0 0 60px', height:3, background:'var(--rule-2)', borderRadius:999}}>
                        <div style={{width: `${Math.min(100, Number(a.progress || 0))}%`, height:'100%', background: a.unlocked ? 'var(--accent)' : 'var(--ink-3)', borderRadius:999}}/>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Leaderboard */}
      {topLeaders.length > 0 && (
        <div>
          <div className="section-title">
            <span>Leaderboard</span>
            <span className="count">{topLeaders.length} shown</span>
            <span className="rule"/>
          </div>
          <div style={{border:'1px solid var(--rule)', borderRadius:8, overflow:'hidden', background:'var(--bg-elev)'}}>
            {topLeaders.map((r, i) => {
              const isMe = meId && r.id === meId;
              return (
                <div key={r.id || i} style={{
                  padding:'12px 18px', display:'grid',
                  gridTemplateColumns:'40px 1fr 70px 70px 80px',
                  gap:16, alignItems:'center',
                  background: isMe ? 'var(--accent-soft)' : 'transparent',
                  borderBottom: i < topLeaders.length - 1 ? '1px solid var(--rule-2)' : 'none'
                }}>
                  <span className="mono" style={{fontSize:14, color:'var(--ink-3)'}}>#{r.rank}</span>
                  <span style={{fontSize:14, fontWeight: isMe ? 600 : 500}}>
                    {r.badge ? `${r.badge} ` : ''}{r.name}{isMe ? ' · you' : ''}
                  </span>
                  <span className="mono" style={{fontSize:12, color:'var(--ink-3)', textAlign:'right'}}>{r.test_count} tests</span>
                  <span className="mono" style={{fontSize:12, color:'var(--ink-3)', textAlign:'right'}}>avg {Math.round(Number(r.avg_score || 0))}</span>
                  <span className="mono" style={{fontSize:14, fontWeight:500, textAlign:'right'}}>{Math.round(Number(r.best_score || 0))}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

window.Profile = Profile;

// ============ Settings ============

const Settings = ({ navigate }) => {
  const app = useApp();
  const u = app.user || {};
  return (
    <div className="content narrow">
      <div style={{marginBottom:28}}>
        <div className="eyebrow" style={{marginBottom:10}}>Account</div>
        <h1 className="page-title">Settings</h1>
        <p className="page-sub">Only a few knobs for now. More coming.</p>
      </div>

      <div style={{display:'flex', flexDirection:'column', gap:22}}>
        <div className="card" style={{padding:22}}>
          <div className="eyebrow" style={{marginBottom:8}}>Signed in as</div>
          <div style={{fontSize:16, fontWeight:500}}>{u.name || '—'}</div>
          <div className="mono" style={{fontSize:12, color:'var(--ink-3)', marginTop:4}}>{u.email || ''}</div>
        </div>

        <div className="card" style={{padding:22}}>
          <div className="eyebrow" style={{marginBottom:8}}>Appearance</div>
          <p style={{fontSize:13, color:'var(--ink-3)', lineHeight:1.5, marginBottom:10}}>
            Open the Tweaks panel (bottom-left) to change accent color, typography, and dashboard hero layout. Changes persist on reload.
          </p>
        </div>

        <div className="card" style={{padding:22}}>
          <div className="eyebrow" style={{marginBottom:8}}>Danger zone</div>
          <p style={{fontSize:13, color:'var(--ink-3)', lineHeight:1.5, marginBottom:14}}>
            Signing out clears your session on this device. Your materials and history stay intact on the server.
          </p>
          <button onClick={() => { if (window.confirm('Sign out?')) app.signOut(); }}
                  className="btn btn-ghost btn-sm">
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
};

window.Settings = Settings;


// ============ App Entry ============

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "theme": "green",
  "typePair": "editorial",
  "heroVariant": "a",
  "direction": "focused"
}/*EDITMODE-END*/;

const SCREENS = [
  {id:'landing',    label:'Landing page',    crumb:['Marketing', 'Landing']},
  {id:'auth',       label:'Sign in',         crumb:['Auth', 'Sign in']},
  {id:'dashboard',  label:'Dashboard',       crumb:['Dashboard']},
  {id:'tests',      label:'New test',        crumb:['Tests', 'New']},
  {id:'taking',     label:'Taking a test',   crumb:['Tests', 'In progress']},
  {id:'results',    label:'Results',         crumb:['Tests', 'Results']},
  {id:'materials',  label:'Materials',       crumb:['Materials']},
  {id:'history',    label:'History',         crumb:['History']},
  {id:'analytics',  label:'Analytics',       crumb:['Analytics']},
  {id:'ask',        label:'Ask',             crumb:['Ask']},
  {id:'profile',    label:'Profile',         crumb:['You', 'Profile']},
  {id:'settings',   label:'Settings',        crumb:['You', 'Settings']},
];

function App() {
  const [tweaks, setTweaks] = React.useState(() => {
    try {
      const saved = localStorage.getItem('testai.tweaks');
      return saved ? {...TWEAK_DEFAULTS, ...JSON.parse(saved)} : TWEAK_DEFAULTS;
    } catch { return TWEAK_DEFAULTS; }
  });
  const [screen, setScreen] = React.useState(() => {
    // URL-based routing: /app → dashboard, / → landing
    const path = window.location.pathname;
    if (path === '/app') return 'dashboard';
    if (path === '/') return 'landing';
    return localStorage.getItem('testai.screen') || window.__DEFAULT_SCREEN || 'dashboard';
  });
  const [tweaksOn, setTweaksOn] = React.useState(false);

  // ---- Session / data state ----
  const [user, setUser] = React.useState(null);
  const [authChecked, setAuthChecked] = React.useState(false);
  const [materials, setMaterials] = React.useState([]);
  const [materialsState, setMaterialsState] = React.useState({ loading: false, error: null });
  const [selectedMaterial, setSelectedMaterial] = React.useState(null);
  const [session, setSession] = React.useState(null);
  const [results, setResults] = React.useState(null);
  const [stats, setStats] = React.useState(null);
  const [history, setHistory] = React.useState([]);
  const [toast, setToast] = React.useState(null); // {kind, msg}

  const flashToast = React.useCallback((kind, msg) => {
    setToast({ kind, msg });
    setTimeout(() => setToast(null), 3200);
  }, []);

  const refreshMaterials = React.useCallback(async () => {
    if (!getToken()) return;
    setMaterialsState({ loading: true, error: null });
    try {
      const data = await api.get('/api/tests/materials');
      setMaterials(data.materials || []);
      setMaterialsState({ loading: false, error: null });
    } catch (err) {
      setMaterialsState({ loading: false, error: err.message });
    }
  }, []);

  const refreshHistory = React.useCallback(async () => {
    if (!getToken()) return;
    try {
      const data = await api.get('/api/tests/history?limit=30');
      setHistory(data.attempts || []);
    } catch {}
  }, []);

  const refreshStats = React.useCallback(async () => {
    if (!getToken()) return;
    try {
      const data = await api.get('/api/tests/stats');
      setStats(data.statistics || null);
    } catch {}
  }, []);

  const signOut = React.useCallback(() => {
    setToken(null);
    setUser(null);
    setMaterials([]);
    setSelectedMaterial(null);
    setSession(null);
    setResults(null);
    setStats(null);
    setHistory([]);
    setScreen('landing');
  }, []);

  React.useEffect(() => { localStorage.setItem('testai.screen', screen); }, [screen]);
  React.useEffect(() => { localStorage.setItem('testai.tweaks', JSON.stringify(tweaks)); }, [tweaks]);

  // Verify stored token on mount; if valid, hydrate user + fetch materials/stats/history
  React.useEffect(() => {
    const tok = getToken();
    if (!tok) { setAuthChecked(true); return; }
    (async () => {
      try {
        const data = await apiCall('POST', '/api/auth/verify', {});
        setUser(data.user || null);
        refreshMaterials();
        refreshStats();
        refreshHistory();
      } catch {
        setToken(null);
        setUser(null);
      } finally {
        setAuthChecked(true);
      }
    })();
  }, [refreshMaterials, refreshStats, refreshHistory]);

  // Apply theme attrs
  React.useEffect(() => {
    document.documentElement.setAttribute('data-theme', tweaks.theme);
    document.documentElement.setAttribute('data-type-pair', tweaks.typePair);
  }, [tweaks]);

  // Edit mode wiring
  React.useEffect(() => {
    const onMsg = (e) => {
      if (e.data?.type === '__activate_edit_mode') setTweaksOn(true);
      if (e.data?.type === '__deactivate_edit_mode') setTweaksOn(false);
    };
    window.addEventListener('message', onMsg);
    window.parent.postMessage({type: '__edit_mode_available'}, '*');
    return () => window.removeEventListener('message', onMsg);
  }, []);

  const setTweak = (k, v) => {
    const next = {...tweaks, [k]: v};
    setTweaks(next);
    window.parent.postMessage({type: '__edit_mode_set_keys', edits: {[k]: v}}, '*');
  };

  // Full-viewport screens (no app chrome)
  const fullScreen = ['landing', 'auth', 'taking'].includes(screen);

  const navigate = (s) => {
    setScreen(s);
    window.history.pushState({}, '', s === 'landing' ? '/' : s === 'dashboard' ? '/app' : '/app#' + s);
  };

  // Gate protected screens behind auth (except landing + auth)
  const effectiveScreen = (() => {
    if (!authChecked) return screen; // wait for verify
    if (user) return screen;
    if (screen === 'landing' || screen === 'auth') return screen;
    return 'auth';
  })();
  const effectiveFullScreen = ['landing', 'auth', 'taking'].includes(effectiveScreen);

  const ctxValue = {
    user, setUser,
    authChecked,
    materials, materialsState, refreshMaterials,
    selectedMaterial, setSelectedMaterial,
    session, setSession,
    results, setResults,
    stats, refreshStats,
    history, refreshHistory,
    signOut,
    flashToast,
    navigate,
  };

  const Body = () => {
    switch (effectiveScreen) {
      case 'landing':   return <Landing navigate={navigate}/>;
      case 'auth':      return <Auth navigate={navigate}/>;
      case 'taking':    return <TestTaking navigate={navigate}/>;
      case 'dashboard': return <Dashboard heroVariant={tweaks.heroVariant} navigate={navigate}/>;
      case 'tests':     return <TestSetup navigate={navigate}/>;
      case 'materials': return <Materials navigate={navigate}/>;
      case 'history':   return <History navigate={navigate}/>;
      case 'analytics': return <Analytics navigate={navigate}/>;
      case 'results':   return <Results navigate={navigate}/>;
      case 'ask':       return <Ask navigate={navigate}/>;
      case 'profile':   return <Profile navigate={navigate}/>;
      case 'settings':  return <Settings navigate={navigate}/>;
      default:          return <Dashboard heroVariant={tweaks.heroVariant} navigate={navigate}/>;
    }
  };

  const current = SCREENS.find(s => s.id === effectiveScreen) || SCREENS[0];

  return (
    <AppCtx.Provider value={ctxValue}>
      {effectiveFullScreen ? (
        <div data-screen-label={current.label}>
          <Body/>
        </div>
      ) : (
        <div className="app" data-screen-label={current.label}>
          <Sidebar screen={effectiveScreen} setScreen={setScreen}/>
          <div className="main">
            <Topbar crumbs={current.crumb}/>
            <Body/>
          </div>
        </div>
      )}
      {toast && (
        <div style={{
          position:'fixed', bottom:20, right:20, zIndex:200,
          padding:'10px 14px', borderRadius:8, fontSize:13,
          background: toast.kind === 'error' ? 'var(--danger)' : 'var(--ink)',
          color:'white', boxShadow:'var(--shadow-md)', maxWidth:380
        }}>{toast.msg}</div>
      )}

      {/* Screen jump (always present, top-left) */}
      <ScreenSwitcher screen={screen} setScreen={setScreen} screens={SCREENS}/>

      {/* Tweaks panel */}
      <div className={`tweaks ${tweaksOn ? 'on' : ''}`}>
        <h4>Tweaks</h4>

        <div className="tweak-row">
          <div className="tweak-label">Accent</div>
          <div className="tweak-opts">
            {[['green','Green'],['blue','Blue'],['orange','Orange'],['paper','Paper']].map(([v,l]) => (
              <button key={v} className={tweaks.theme === v ? 'on' : ''}
                      onClick={() => setTweak('theme', v)}>{l}</button>
            ))}
          </div>
        </div>

        <div className="tweak-row">
          <div className="tweak-label">Type pairing</div>
          <div className="tweak-opts">
            {[['geometric','Sans'],['editorial','Serif titles'],['mono-heavy','Mono']].map(([v,l]) => (
              <button key={v} className={tweaks.typePair === v ? 'on' : ''}
                      onClick={() => setTweak('typePair', v)}>{l}</button>
            ))}
          </div>
        </div>

        <div className="tweak-row">
          <div className="tweak-label">Dashboard hero</div>
          <div className="tweak-opts">
            {[['a','Upload-first'],['b','From library'],['c','Prompt']].map(([v,l]) => (
              <button key={v} className={tweaks.heroVariant === v ? 'on' : ''}
                      onClick={() => setTweak('heroVariant', v)}>{l}</button>
            ))}
          </div>
        </div>

        <div style={{fontSize:11, color:'var(--ink-4)', fontFamily:'var(--font-mono)', marginTop:12, lineHeight:1.5}}>
          Changes persist on reload. Try combining <b>Paper + Serif titles</b>.
        </div>
      </div>
    </AppCtx.Provider>
  );
}

function ScreenSwitcher({screen, setScreen, screens}) {
  const [open, setOpen] = React.useState(false);
  const current = screens.find(s => s.id === screen);
  return (
    <div style={{
      position:'fixed', bottom:20, left:20, zIndex:100,
    }}>
      {open && (
        <div style={{
          position:'absolute', bottom:44, left:0,
          background:'var(--bg-elev)', border:'1px solid var(--rule)',
          borderRadius:10, padding:6, minWidth:220,
          boxShadow:'var(--shadow-md)',
        }}>
          <div style={{
            fontSize:10.5, color:'var(--ink-4)', padding:'8px 10px 4px',
            fontFamily:'var(--font-mono)', textTransform:'uppercase', letterSpacing:'0.12em'
          }}>Jump to screen</div>
          {screens.map((s, i) => (
            <button key={s.id}
              onClick={() => { setScreen(s.id); setOpen(false); }}
              style={{
                display:'flex', width:'100%', padding:'7px 10px', borderRadius:6,
                background: s.id === screen ? 'var(--bg-sunken)' : 'transparent',
                color: s.id === screen ? 'var(--ink)' : 'var(--ink-2)',
                fontSize:13, fontWeight: s.id === screen ? 500 : 400,
                alignItems:'center', gap:8,
              }}>
              <span className="mono" style={{fontSize:10.5, color:'var(--ink-4)', minWidth:18}}>{(i+1).toString().padStart(2,'0')}</span>
              <span>{s.label}</span>
            </button>
          ))}
        </div>
      )}
      <button onClick={() => setOpen(!open)}
              style={{
                display:'flex', alignItems:'center', gap:10,
                padding:'8px 14px',
                background:'var(--bg-elev)', border:'1px solid var(--rule)',
                borderRadius:999, fontSize:12.5, color:'var(--ink-2)',
                boxShadow:'var(--shadow-sm)',
              }}>
        <span className="dot" style={{width:6,height:6,background:'var(--accent)',borderRadius:'50%'}}/>
        <span>{current?.label || 'Screens'}</span>
        <span className="mono" style={{fontSize:10.5, color:'var(--ink-4)'}}>⌃.</span>
      </button>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App/>);