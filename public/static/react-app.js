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
  const items = [
    { id: 'dashboard', label: 'Dashboard', icon: Icon.home, kbd: 'D' },
    { id: 'tests',     label: 'Tests',     icon: Icon.tests, kbd: 'T' },
    { id: 'history',   label: 'History',   icon: Icon.history },
    { id: 'analytics', label: 'Analytics', icon: Icon.chart },
    { id: 'materials', label: 'Materials', icon: Icon.folder, count: 24 },
    { id: 'ask',       label: 'Ask',       icon: Icon.chat },
  ];
  const footer = [
    { id: 'profile',  label: 'Profile',  icon: Icon.user },
    { id: 'settings', label: 'Settings', icon: Icon.gear },
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

      <div className="nav-section">You</div>
      {footer.map(it => (
        <div key={it.id}
             className={`nav-item ${screen === it.id ? 'active' : ''}`}
             onClick={() => setScreen(it.id)}>
          <it.icon/>
          <span>{it.label}</span>
        </div>
      ))}

      <div className="sidebar-foot">
        <span className="pip"/>
        <span>3 day streak</span>
        <span style={{marginLeft:'auto', color:'var(--ink-4)', fontFamily:'var(--font-mono)', fontSize:'11px'}}>·</span>
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

const Greeting = () => (
  <div style={{marginBottom:28}}>
    <div className="eyebrow" style={{marginBottom:8}}>Friday · April 17</div>
    <h1 className="page-title">Good afternoon, Maya.</h1>
    <p className="page-sub">
      You've been chipping at thermodynamics for a week.
      Three weak spots left before your midterm Thursday.
    </p>
  </div>
);

// Variant A — Upload is literally the hero
const HeroA = () => (
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
          <button className="btn btn-ghost btn-sm">Paste text</button>
          <button className="btn btn-ghost btn-sm">From library</button>
        </div>
      </div>

      <div style={{
        marginTop:24,
        border:'1.5px dashed oklch(80% 0.008 80)',
        borderRadius:10,
        padding:'36px 24px',
        textAlign:'center',
        background:'var(--bg-elev)'
      }}>
        <Icon.upload size={26}/>
        <div style={{marginTop:12, fontSize:16, fontWeight:500}}>
          Drop any PDF, DOCX, or notes file here
        </div>
        <div style={{marginTop:4, fontSize:13, color:'var(--ink-3)'}}>
          or <span style={{color:'var(--accent-ink)', fontWeight:500, borderBottom:'1px solid var(--accent-ink)'}}>browse files</span> — up to 200 pages
        </div>
      </div>
    </div>

    <div style={{padding:'14px 20px', display:'flex', alignItems:'center', gap:14, fontSize:12.5, color:'var(--ink-3)'}}>
      <span className="mono">Recent:</span>
      <span style={{color:'var(--ink-2)', cursor:'pointer'}}>lecture_7_thermo.pdf</span>
      <span>·</span>
      <span style={{color:'var(--ink-2)', cursor:'pointer'}}>ch04_cell_bio.pdf</span>
      <span>·</span>
      <span style={{color:'var(--ink-2)', cursor:'pointer'}}>statmech_wk3.md</span>
    </div>
  </div>
);

// Variant B — Pick from library
const HeroB = ({ navigate }) => {
  const items = [
    {t:'Thermodynamics', s:'Lecture 7 · 34 pages', progress:68, subj:'physics'},
    {t:'Cell Biology', s:'Chapter 4 · 52 pages', progress:42, subj:'biology'},
    {t:'Statistical Mechanics', s:'Week 3 notes · 18 pages', progress:15, subj:'physics'},
  ];
  return (
    <div style={{marginBottom:32}}>
      <div style={{display:'flex', alignItems:'baseline', gap:12, marginBottom:16}}>
        <h2 style={{fontSize:18, fontWeight:500}}>Start a test from…</h2>
        <span className="mono" style={{fontSize:12, color:'var(--ink-3)'}}>3 materials in progress</span>
        <button className="btn btn-ghost btn-sm" style={{marginLeft:'auto'}}>
          <Icon.upload size={12}/> Upload new
        </button>
      </div>
      <div style={{display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:14}}>
        {items.map((it, i) => (
          <div key={i} className="card" style={{padding:20, cursor:'pointer',
               borderTop:`3px solid var(--${it.subj})`,
               borderColor:'var(--rule)'}}>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start'}}>
              <span className={`chip ${it.subj}`} style={{fontFamily:'var(--font-sans)', fontWeight:500}}>
                <span className={`subj-dot ${it.subj}`} style={{width:6, height:6}}/>
                {it.subj === 'physics' ? 'Physics' : 'Biology'}
              </span>
              <span className="mono" style={{fontSize:10.5, color:'var(--ink-4)', textTransform:'uppercase', letterSpacing:'0.1em'}}>{it.progress}%</span>
            </div>
            <div style={{marginTop:16, fontSize:15.5, fontWeight:500, letterSpacing:'-0.01em'}}>{it.t}</div>
            <div style={{fontSize:12, color:'var(--ink-3)', marginTop:2}}>{it.s}</div>
            <div className="progress" style={{marginTop:14}}>
              <span style={{width: it.progress + '%', background:`var(--${it.subj})`}}/>
            </div>
            <div style={{marginTop:14, fontSize:13, color:`var(--${it.subj}-ink)`, fontWeight:500, display:'flex', alignItems:'center', gap:6}}>
              <span onClick={() => navigate('tests')} style={{cursor:'pointer'}}>Start a test <Icon.arrow size={12}/></span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Variant C — single command prompt
const HeroC = ({ navigate }) => (
  <div style={{marginBottom:32}}>
    <div className="card" style={{padding:'32px 30px'}}>
      <div className="eyebrow" style={{marginBottom:14}}>What do you want to study?</div>
      <div style={{
        display:'flex', alignItems:'center', gap:14,
        padding:'16px 18px', border:'1px solid var(--rule)', borderRadius:8,
        background:'var(--bg)'
      }}>
        <Icon.sparkle size={16}/>
        <span className="display" style={{fontSize:20, color:'var(--ink-3)', fontWeight:400, flex:1}}>
          e.g. "15 hard MCQs on chapter 4, timed for 20 min"
        </span>
        <span className="kbd-key">⏎</span>
      </div>
      <div style={{display:'flex', gap:8, marginTop:14, flexWrap:'wrap'}}>
        {[
          'Quick 10 from thermo notes',
          'Review what I got wrong yesterday',
          'Hard questions on citric acid cycle',
          'Upload something new',
        ].map((s, i) => (
          <button key={i} className="chip outline" style={{padding:'5px 11px', cursor:'pointer'}}>
            {i === 3 ? <Icon.upload size={10}/> : <Icon.sparkle size={10}/>}
            {s}
          </button>
        ))}
      </div>
    </div>
  </div>
);

const ContinueBar = ({ navigate }) => (
  <div className="card" style={{padding:'14px 18px', marginBottom:32,
       display:'flex', alignItems:'center', gap:16,
       background:'var(--physics-soft)',
       borderColor:'var(--physics)',
       borderLeft:'3px solid var(--physics)', borderRadius:'0 8px 8px 0'}}>
    <div style={{flex:1}}>
      <div style={{fontSize:14, fontWeight:500}}>Pick up where you stopped</div>
      <div style={{fontSize:12.5, color:'var(--ink-3)', marginTop:2}}>
        Thermodynamics — 8 of 15 questions done, 12 min left on the clock
      </div>
    </div>
    <span className="mono" style={{fontSize:11, color:'var(--ink-3)'}}>2h ago</span>
    <button onClick={() => navigate('taking')} className="btn btn-primary btn-sm">Resume <Icon.arrow size={12}/></button>
  </div>
);

const RecentTests = ({ navigate }) => {
  const rows = [
    {name:'Thermodynamics · Quick 10', when:'Yesterday', score:80, q:10, took:'11:02', subj:'physics'},
    {name:'Cell biology · Ch. 4 hard', when:'2d ago', score:64, q:20, took:'24:18', subj:'biology'},
    {name:'Statmech · Review wrong', when:'Apr 12', score:92, q:8, took:'06:44', subj:'physics'},
    {name:'Thermodynamics · Timed', when:'Apr 11', score:71, q:15, took:'19:55', subj:'physics'},
  ];
  return (
    <div>
      <div className="section-title">
        <span>Recent tests</span>
        <span className="count">4 this week</span>
        <span className="rule"/>
        <span onClick={() => navigate('history')} style={{fontSize:12, color:'var(--ink-3)', cursor:'pointer'}}>See all →</span>
      </div>
      <div style={{border:'1px solid var(--rule)', borderRadius:8, overflow:'hidden', background:'var(--bg-elev)'}}>
        {rows.map((r, i) => (
          <div key={i} style={{
            padding:'14px 18px',
            borderBottom: i < rows.length-1 ? '1px solid var(--rule)' : 'none',
            display:'grid', gridTemplateColumns:'14px 1fr 100px 80px 70px 24px',
            alignItems:'center', gap:16
          }}>
            <span className={`subj-dot ${r.subj}`}/>
            <div>
              <div style={{fontSize:14, fontWeight:500}}>{r.name}</div>
              <div style={{fontSize:12, color:'var(--ink-3)', marginTop:2}}>{r.when} · {r.q} questions</div>
            </div>
            <div className="mono" style={{fontSize:12, color:'var(--ink-3)'}}>{r.took}</div>
            <div style={{display:'flex', alignItems:'center', gap:8}}>
              <div style={{flex:1, height:3, background:'var(--rule-2)', borderRadius:999}}>
                <div style={{width:r.score+'%', height:'100%', background: r.score >= 80 ? 'var(--accent)' : r.score >= 70 ? 'var(--warn)' : 'var(--danger)', borderRadius:999}}/>
              </div>
            </div>
            <div className="mono" style={{fontSize:14, fontWeight:500, textAlign:'right'}}>{r.score}</div>
            <Icon.arrow size={12}/>
          </div>
        ))}
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

const Dashboard = ({ heroVariant, navigate }) => {
  const Hero = heroVariant === 'a' ? HeroA : heroVariant === 'b' ? () => <HeroB navigate={navigate}/> : () => <HeroC navigate={navigate}/>;
  return (
    <div className="content">
      <Greeting/>
      <Hero/>
      <ContinueBar navigate={navigate}/>
      <RecentTests navigate={navigate}/>
      <div style={{height:40}}/>
      <WeakSpots navigate={navigate}/>
    </div>
  );
};

window.Dashboard = Dashboard;
// Materials library + upload

const Materials = () => {
  const files = [
    {name:'Lecture 7 — Thermodynamics', type:'PDF', pages:34, added:'Apr 15', tests:4, subject:'Physics', subj:'physics', covered:82},
    {name:'Chapter 4 — Cell biology', type:'PDF', pages:52, added:'Apr 14', tests:2, subject:'Biology', subj:'biology', covered:41},
    {name:'Statistical mechanics — week 3', type:'MD', pages:18, added:'Apr 12', tests:3, subject:'Physics', subj:'physics', covered:58},
    {name:'Lecture 6 — Entropy', type:'PDF', pages:28, added:'Apr 10', tests:2, subject:'Physics', subj:'physics', covered:95},
    {name:'Orgo — Functional groups', type:'DOCX', pages:22, added:'Apr 8', tests:5, subject:'Chemistry', subj:'chem', covered:72},
    {name:'My notes — Citric acid cycle', type:'TXT', pages:6, added:'Apr 6', tests:1, subject:'Biology', subj:'biology', covered:30},
    {name:'Midterm study guide', type:'PDF', pages:11, added:'Apr 3', tests:0, subject:'Physics', subj:'physics', covered:0},
    {name:'Problem set 4 solutions', type:'PDF', pages:8, added:'Apr 1', tests:0, subject:'Physics', subj:'physics', covered:0},
  ];
  return (
    <div className="content">
      <div style={{marginBottom:28, display:'flex', alignItems:'flex-end', gap:24}}>
        <div>
          <div className="eyebrow" style={{marginBottom:8}}>Your material</div>
          <h1 className="page-title">Materials</h1>
          <p className="page-sub">Everything you've uploaded. Tests pull questions from here — nothing else.</p>
        </div>
        <div style={{marginLeft:'auto', display:'flex', gap:8}}>
          <button className="btn btn-ghost"><Icon.plus size={12}/> New folder</button>
          <button className="btn btn-primary"><Icon.upload size={12}/> Upload</button>
        </div>
      </div>

      {/* Upload zone */}
      <div style={{
        border:'1.5px dashed var(--rule)', borderRadius:10,
        padding:'28px 24px', marginBottom:32,
        background:'var(--bg-sunken)',
        display:'flex', alignItems:'center', gap:24
      }}>
        <div style={{
          width:44, height:44, borderRadius:'50%',
          background:'var(--bg-elev)', border:'1px solid var(--rule)',
          display:'flex', alignItems:'center', justifyContent:'center'
        }}>
          <Icon.upload size={18}/>
        </div>
        <div style={{flex:1}}>
          <div style={{fontSize:14.5, fontWeight:500}}>Drop files here or paste a link</div>
          <div style={{fontSize:12.5, color:'var(--ink-3)', marginTop:2}}>
            PDF, DOCX, Markdown, plain text · up to 200 pages per file · we parse it in under a minute
          </div>
        </div>
        <div className="mono" style={{fontSize:11, color:'var(--ink-3)'}}>
          4.2 / 10 GB used
        </div>
      </div>

      {/* Filters */}
      <div style={{display:'flex', alignItems:'center', gap:8, marginBottom:16}}>
        <button className="chip ink">All · 24</button>
        <button className="chip outline" style={{padding:'3px 10px'}}>Physics · 12</button>
        <button className="chip outline" style={{padding:'3px 10px'}}>Biology · 6</button>
        <button className="chip outline" style={{padding:'3px 10px'}}>Chemistry · 4</button>
        <button className="chip outline" style={{padding:'3px 10px'}}>Untested · 2</button>
        <div style={{marginLeft:'auto', fontSize:12.5, color:'var(--ink-3)'}}>
          Sort: <span style={{color:'var(--ink)'}}>Most recent</span>
        </div>
      </div>

      {/* File list */}
      <div style={{border:'1px solid var(--rule)', borderRadius:8, overflow:'hidden', background:'var(--bg-elev)'}}>
        <div style={{
          padding:'10px 18px', display:'grid',
          gridTemplateColumns:'1fr 100px 110px 100px 90px 40px',
          gap:16, fontSize:11, color:'var(--ink-3)',
          fontFamily:'var(--font-mono)', textTransform:'uppercase', letterSpacing:'0.1em',
          borderBottom:'1px solid var(--rule)', background:'var(--bg-sunken)'
        }}>
          <span>Name</span><span>Subject</span><span>Added</span><span>Tests</span><span style={{textAlign:'right'}}>Covered</span><span/>
        </div>
        {files.map((f, i) => (
          <div key={i} style={{
            padding:'14px 18px', display:'grid',
            gridTemplateColumns:'1fr 100px 110px 100px 90px 40px',
            gap:16, alignItems:'center',
            borderBottom: i < files.length-1 ? '1px solid var(--rule-2)' : 'none',
            cursor:'pointer'
          }}>
            <div style={{display:'flex', alignItems:'center', gap:12, minWidth:0}}>
              <div style={{
                width:30, height:36, borderRadius:3, flexShrink:0,
                background:`var(--${f.subj}-soft)`,
                border:`1px solid var(--${f.subj})`,
                display:'flex', alignItems:'center', justifyContent:'center',
                fontSize:9, fontFamily:'var(--font-mono)', color:`var(--${f.subj}-ink)`, fontWeight:600
              }}>{f.type}</div>
              <div style={{minWidth:0}}>
                <div style={{fontSize:14, fontWeight:500, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis'}}>{f.name}</div>
                <div className="mono" style={{fontSize:11, color:'var(--ink-3)', marginTop:2}}>{f.pages} pages</div>
              </div>
            </div>
            <span style={{fontSize:12.5}}>
              <span className={`chip ${f.subj}`} style={{fontFamily:'var(--font-sans)', fontWeight:500, fontSize:11.5}}>
                <span className={`subj-dot ${f.subj}`} style={{width:6, height:6}}/>
                {f.subject}
              </span>
            </span>
            <span className="mono" style={{fontSize:12, color:'var(--ink-3)'}}>{f.added}</span>
            <span style={{fontSize:12.5, color:'var(--ink-2)'}}>{f.tests} {f.tests === 1 ? 'test' : 'tests'}</span>
            <div style={{display:'flex', alignItems:'center', gap:8, justifyContent:'flex-end'}}>
              <div style={{width:40, height:3, background:'var(--rule-2)', borderRadius:999}}>
                <div style={{width:f.covered+'%', height:'100%', background: f.covered > 70 ? 'var(--accent)' : f.covered > 0 ? 'var(--ink-2)' : 'transparent', borderRadius:999}}/>
              </div>
              <span className="mono" style={{fontSize:11, color: f.covered === 0 ? 'var(--ink-4)' : 'var(--ink-2)', minWidth:26, textAlign:'right'}}>
                {f.covered === 0 ? '—' : f.covered + '%'}
              </span>
            </div>
            <div style={{color:'var(--ink-3)', textAlign:'center'}}><Icon.dots size={14}/></div>
          </div>
        ))}
      </div>
    </div>
  );
};

window.Materials = Materials;
// Test setup — NOT a stack of dropdowns. Opinionated, minimal.

const TestSetup = ({ navigate }) => {
  const [count, setCount] = React.useState(15);
  // Keyboard shortcut: Cmd/Ctrl+Enter to start
  React.useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') navigate('taking');
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);
  const [difficulty, setDifficulty] = React.useState('mixed');
  const [types, setTypes] = React.useState({mcq:true, tf:true, short:false});
  const [timed, setTimed] = React.useState(true);
  const [minutes, setMinutes] = React.useState(20);

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

  return (
    <div className="content narrow">
      <div style={{marginBottom:40}}>
        <div className="eyebrow" style={{marginBottom:10}}>New test</div>
        <h1 className="page-title">Testing on Lecture 7 — Thermodynamics.</h1>
        <p className="page-sub">34 pages · covered 82% in past sessions. Tweak below, or just hit start.</p>
      </div>

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
            <b>{count} {difficulty === 'mixed' ? 'mixed' : difficulty} questions</b> from <b>Lecture 7</b>
            {Object.values(types).filter(Boolean).length < 3 && <> · {Object.entries(types).filter(([,v])=>v).map(([k])=>({mcq:'MCQ',tf:'T/F',short:'short answer'}[k])).join(', ')}</>}
            {timed ? <> · timed {minutes} min</> : <> · untimed</>}
          </div>
        </div>

        <div style={{display:'flex', gap:12, alignItems:'center'}}>
          <button onClick={() => navigate('taking')} className="btn btn-accent btn-lg" style={{flex:1, justifyContent:'center'}}>
            Start test <Icon.arrow size={14}/>
          </button>
          <button className="btn btn-ghost btn-lg">Save as template</button>
        </div>
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
  const questions = [
    {k:'A', t:'W = nRT ln(2)'},
    {k:'B', t:'W = nRT (2 − 1) = nRT'},
    {k:'C', t:'W = nC_v(T₂ − T₁)'},
    {k:'D', t:'W = 0, since temperature is constant'},
  ];
  const questionText = 'A gas undergoes an isothermal expansion from volume V₁ to 2V₁ at temperature T. Which expression gives the work done by the gas?';
  const totalQ = 15;
  const [currentQ, setCurrentQ] = React.useState(0);
  const [answers, setAnswers] = React.useState({});
  const [flagged, setFlagged] = React.useState({});

  const selected = answers[currentQ] || null;
  const isFlagged = flagged[currentQ] || false;

  const selectAnswer = (k) => setAnswers({...answers, [currentQ]: k});
  const toggleFlag = () => setFlagged({...flagged, [currentQ]: !isFlagged});
  const goNext = () => { if (currentQ < totalQ - 1) setCurrentQ(currentQ + 1); else navigate('results'); };
  const goPrev = () => { if (currentQ > 0) setCurrentQ(currentQ - 1); };

  // Keyboard shortcuts
  React.useEffect(() => {
    const handler = (e) => {
      if (e.key === 'ArrowRight' || e.key === 'Enter') goNext();
      if (e.key === 'ArrowLeft') goPrev();
      if (['a','b','c','d'].includes(e.key.toLowerCase())) selectAnswer(e.key.toUpperCase());
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [currentQ, answers, flagged]);

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
        <div style={{display:'flex', alignItems:'center', gap:10}}>
          <span style={{width:8, height:8, background:'white', borderRadius:'50%'}}/>
          <span style={{fontSize:13, fontWeight:500}}>Thermodynamics</span>
          <span className="mono" style={{fontSize:11.5, opacity:0.75}}>Q {currentQ + 1} of {totalQ}</span>
        </div>

        <div style={{margin:'0 auto', display:'flex', alignItems:'center', gap:10}}>
          <Icon.clock size={12}/>
          <span className="mono" style={{fontSize:15, fontWeight:500, letterSpacing:'0.02em'}}>
            13:42
          </span>
          <span className="mono" style={{fontSize:11, opacity:0.7}}>remaining</span>
        </div>

        <div style={{display:'flex', alignItems:'center', gap:10, fontSize:12.5, opacity:0.85}}>
          <button onClick={() => navigate('dashboard')} className="btn-bare" style={{fontSize:12.5, color:'white'}}>Exit</button>
          <span>·</span>
          <button className="btn-bare" style={{fontSize:12.5, color:'white'}}>Pause</button>
        </div>
      </div>

      {/* Progress dots */}
      <div style={{
        padding:'12px 40px', background:'var(--bg-elev)', borderBottom:'1px solid var(--rule)',
        display:'flex', gap:4, justifyContent:'center'
      }}>
        {Array.from({length:totalQ}).map((_,i) => (
          <div key={i} onClick={() => setCurrentQ(i)} style={{
            width: i === currentQ ? 20 : 6, height:6, borderRadius:3,
            background: answers[i] ? 'var(--accent)' : i === currentQ ? 'var(--chem)' : 'var(--rule)',
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
            Question {(currentQ + 1).toString().padStart(2, '0')} — Multiple choice
          </div>

          <div className="display" style={{
            fontSize:26, lineHeight:1.35, letterSpacing:'-0.015em', fontWeight:400,
            marginBottom:40
          }}>
            {questionText}
          </div>

          {questions.map(opt => (
            <button key={opt.k}
              onClick={() => selectAnswer(opt.k)}
              style={{
                display:'flex', gap:18, alignItems:'flex-start',
                width:'100%', textAlign:'left',
                padding:'16px 20px', marginBottom:8,
                borderRadius:8,
                border:'1px solid ' + (selected === opt.k ? 'var(--ink)' : 'var(--rule)'),
                background: selected === opt.k ? 'var(--bg-elev)' : 'transparent',
                transition:'all 0.12s'
              }}>
              <span className="mono" style={{
                fontSize:12, color: selected === opt.k ? 'var(--bg)' : 'var(--ink-3)',
                background: selected === opt.k ? 'var(--ink)' : 'var(--bg-sunken)',
                width:22, height:22, borderRadius:4,
                display:'flex', alignItems:'center', justifyContent:'center',
                flexShrink:0, marginTop:1, fontWeight:500,
              }}>
                {opt.k}
              </span>
              <span style={{fontSize:15.5, lineHeight:1.45}}>{opt.t}</span>
            </button>
          ))}
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
          <span><span className="kbd-key">A–D</span> to answer</span>
          <span><span className="kbd-key">→</span> next</span>
        </div>
        <button onClick={goNext} className="btn btn-primary btn-sm">
          {currentQ === totalQ - 1 ? 'Finish test' : 'Next question'} <Icon.arrow size={12}/>
        </button>
      </div>
    </div>
  );
};

window.TestTaking = TestTaking;
// Results — debrief, not KPI dashboard. Narrative + per-question review with citations.

const Results = ({ navigate }) => {
  const questions = [
    {n:1, correct:true,  topic:'First law', q:'Which quantity is conserved in an isolated system?', your:'A', right:'A', page:12},
    {n:2, correct:true,  topic:'Heat capacity', q:'C_p is always greater than C_v because…', your:'C', right:'C', page:15},
    {n:3, correct:false, topic:'Entropy', q:'In an irreversible process, total entropy…', your:'B', right:'D', page:21,
          why:'You picked "decreases" — that\'s only possible for the system, not the universe. Total entropy always increases in irreversible processes. This is the second law stated precisely.',
          cite:'p. 21, §3.4 — "for any spontaneous change in an isolated system, ΔS ≥ 0"'},
    {n:4, correct:true,  topic:'Entropy', q:'The Carnot efficiency depends only on…', your:'B', right:'B', page:23},
    {n:5, correct:false, topic:'Gibbs energy', q:'At constant T and P, a spontaneous reaction has…', your:'A', right:'C', page:28,
          why:'ΔG < 0 for spontaneity at constant T, P. You picked ΔH < 0, which is neither sufficient nor necessary — a reaction can be endothermic and still spontaneous if entropy gain is large enough.',
          cite:'p. 28, eq. 4.11 — "ΔG = ΔH − TΔS"'},
    {n:6, correct:true,  topic:'Phase transitions', q:'The Clausius-Clapeyron equation relates…', your:'D', right:'D', page:34},
    {n:7, correct:true,  topic:'Work', q:'For isothermal expansion, W by the gas is…', your:'A', right:'A', page:14},
    {n:8, correct:false, topic:'Second law', q:'Which statement of the second law is equivalent to…', your:'A', right:'B', page:19,
          why:'The Kelvin and Clausius statements are equivalent, but you picked the weaker form about heat flow. The right answer tracks the impossibility of a perfect engine.',
          cite:'p. 19, §3.2 — "no process is possible whose sole result is the complete conversion of heat into work"'},
    {n:9, correct:true,  topic:'State functions', q:'Which of the following is not a state function?', your:'C', right:'C', page:9},
    {n:10, correct:true, topic:'First law', q:'For an adiabatic process, Q equals…', your:'A', right:'A', page:13},
  ];
  const correct = questions.filter(q => q.correct).length;
  const pct = Math.round(correct / questions.length * 100);

  return (
    <div className="content narrow">
      {/* Header */}
      <div style={{marginBottom:44}}>
        <div className="eyebrow" style={{marginBottom:12}}>Done · April 17, 2:48 pm</div>
        <h1 className="page-title">
          You got <span className="mono" style={{fontSize:'0.9em', fontWeight:500}}>{correct}</span> of <span className="mono" style={{fontSize:'0.9em', fontWeight:500}}>{questions.length}</span>.
        </h1>
        <p className="page-sub" style={{fontSize:16, marginTop:12, maxWidth:'58ch'}}>
          Better than last time on this material (you had 6/10 on April 14).
          The three you missed were all in the <b>second half</b> — entropy, Gibbs, and the second law.
          Spend a focused 15 minutes on pages 19–28 and you'll have it.
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
          {v: pct + '%',    l:'Score',         s: '+20 vs. last session', bg:'var(--biology-soft)', fg:'var(--biology-ink)'},
          {v:'18:04',       l:'Time taken',    s:'2 min under limit', bg:'var(--physics-soft)', fg:'var(--physics-ink)'},
          {v:'3',           l:'Weak spots',    s:'all pages 19–28', bg:'var(--danger-soft)', fg:'var(--danger)'},
          {v:'2',           l:'Flagged',       s:'both correct', bg:'var(--hum-soft)', fg:'var(--hum-ink)'},
        ].map((s,i) => (
          <div key={i} style={{background:s.bg, padding:'22px 20px'}}>
            <div className="mono" style={{fontSize:28, fontWeight:500, letterSpacing:'-0.01em', color:s.fg}}>{s.v}</div>
            <div style={{fontSize:11, color:s.fg, marginTop:4, opacity:0.8,
                         fontFamily:'var(--font-mono)', textTransform:'uppercase', letterSpacing:'0.1em', fontWeight:600}}>{s.l}</div>
            <div style={{fontSize:12.5, color:'var(--ink-2)', marginTop:8}}>{s.s}</div>
          </div>
        ))}
      </div>

      {/* Section — what to focus on */}
      <div style={{marginBottom:40}}>
        <div className="section-title">
          <span>What to look at</span>
          <span className="rule"/>
        </div>
        <div style={{padding:'26px 28px', background:'var(--accent)', color:'white', borderRadius:12}}>
          <div style={{fontSize:16, lineHeight:1.55}}>
            The pattern is clear: <b>entropy and its consequences</b>. You answered the
            definitional questions (Q1, Q2) correctly, but missed the three that
            ask you to <em style={{fontFamily:'var(--font-serif)', fontStyle:'italic'}}>apply</em> the second law.
          </div>
          <div style={{marginTop:20, display:'flex', gap:10, flexWrap:'wrap'}}>
            <button className="btn btn-sm" style={{background:'white', color:'var(--accent-ink)', fontWeight:600}}>
              <Icon.sparkle size={12}/> 5-question drill on pages 19–28
            </button>
            <button className="btn btn-sm" style={{background:'oklch(1 0 0 / 0.15)', color:'white'}}>Re-read those pages</button>
            <button className="btn btn-sm" style={{background:'oklch(1 0 0 / 0.15)', color:'white'}}>Ask about this material</button>
          </div>
        </div>
      </div>

      {/* Per-question review */}
      <div>
        <div className="section-title">
          <span>Question by question</span>
          <span className="count">{correct} right · {questions.length - correct} wrong</span>
          <span className="rule"/>
        </div>

        <div style={{display:'flex', flexDirection:'column', gap:2}}>
          {questions.map(q => (
            <div key={q.n} style={{
              borderLeft: '2px solid ' + (q.correct ? 'var(--accent)' : 'var(--danger)'),
              padding:'14px 18px',
              background: q.correct ? 'transparent' : 'oklch(98% 0.015 25 / 0.4)',
              borderRadius:'0 6px 6px 0',
            }}>
              <div style={{display:'flex', alignItems:'baseline', gap:12}}>
                <span className="mono" style={{fontSize:11.5, color:'var(--ink-3)', minWidth:28}}>Q{q.n.toString().padStart(2,'0')}</span>
                <span className="chip" style={{fontSize:10.5}}>{q.topic}</span>
                <span style={{flex:1, fontSize:14, lineHeight:1.4}}>{q.q}</span>
                <span className="mono" style={{fontSize:11, color:'var(--ink-3)'}}>p.{q.page}</span>
                <span className={q.correct ? '' : ''} style={{
                  fontSize:11.5, fontFamily:'var(--font-mono)', minWidth:60, textAlign:'right',
                  color: q.correct ? 'var(--accent-ink)' : 'var(--danger)',
                  fontWeight:500,
                }}>
                  {q.correct ? '✓ correct' : '✗ ' + q.your + ' → ' + q.right}
                </span>
              </div>
              {!q.correct && q.why && (
                <div style={{
                  marginTop:12, marginLeft:40,
                  padding:'14px 16px',
                  background:'var(--bg-elev)', borderRadius:6,
                  border:'1px solid var(--rule)'
                }}>
                  <div className="eyebrow" style={{marginBottom:6, color:'var(--ink-3)'}}>Why</div>
                  <div style={{fontSize:13.5, lineHeight:1.55}}>{q.why}</div>
                  <div style={{
                    marginTop:12, padding:'8px 12px',
                    background:'var(--bg-sunken)', borderRadius:4,
                    fontSize:12.5, color:'var(--ink-2)', display:'flex', gap:10, alignItems:'flex-start'
                  }}>
                    <Icon.book size={12}/>
                    <span style={{fontFamily:'var(--font-serif)', fontStyle:'italic', fontSize:13}}>{q.cite}</span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Closing */}
      <div style={{
        marginTop:40, padding:'24px', textAlign:'center',
        borderTop:'1px solid var(--rule)'
      }}>
        <div style={{fontSize:14, color:'var(--ink-3)', marginBottom:16}}>
          Next session suggested for <span className="mono" style={{color:'var(--ink)'}}>Saturday morning</span> — spaced repetition works.
        </div>
        <button onClick={() => navigate('dashboard')} className="btn btn-primary">Schedule a follow-up · Sat 9am</button>
      </div>
    </div>
  );
};

window.Results = Results;
// Analytics — study journal, not KPI dashboard

const Analytics = () => {
  const weeks = [
    {w:'Apr 13–17', tests:4, score:77, topics:['Thermo', 'Cell bio'], note:'Big jump on thermo mid-week. Cell bio is still shaky.'},
    {w:'Apr 6–12',  tests:5, score:68, topics:['Thermo', 'Statmech'], note:'Started doing hard-difficulty runs. Expected dip.'},
    {w:'Mar 30–5',  tests:3, score:74, topics:['Orgo', 'Thermo'], note:'Lighter week, midterms in two other classes.'},
    {w:'Mar 23–29', tests:7, score:81, topics:['Orgo'], note:'Orgo exam prep — drilled functional groups hard.'},
  ];

  // sparkline data
  const series = [62, 58, 71, 68, 74, 70, 81, 78, 74, 68, 77, 80];

  return (
    <div className="content">
      <div style={{marginBottom:36}}>
        <div className="eyebrow" style={{marginBottom:10}}>The last 30 days</div>
        <h1 className="page-title">Your study, in review.</h1>
        <p className="page-sub" style={{fontSize:16, maxWidth:'60ch'}}>
          You've taken <b>19 tests</b> across <b>7 materials</b>. Average score is up 9
          points since last month. Here's what's changing, and what isn't.
        </p>
      </div>

      {/* Trend + topic map row */}
      <div style={{display:'grid', gridTemplateColumns:'1.4fr 1fr', gap:20, marginBottom:32}}>
        {/* Trend */}
        <div className="card" style={{padding:24}}>
          <div style={{display:'flex', justifyContent:'space-between', alignItems:'baseline'}}>
            <div>
              <div style={{fontSize:15, fontWeight:500}}>Score over time</div>
              <div style={{fontSize:12.5, color:'var(--ink-3)', marginTop:2}}>Rolling average, last 12 sessions</div>
            </div>
            <div className="mono" style={{fontSize:11, color:'var(--ink-3)', textTransform:'uppercase', letterSpacing:'0.1em'}}>
              <span style={{color:'var(--accent-ink)'}}>▲ +9</span> since mar
            </div>
          </div>

          <svg viewBox="0 0 400 160" style={{width:'100%', marginTop:20, overflow:'visible'}}>
            {[60, 70, 80, 90].map(y => (
              <React.Fragment key={y}>
                <line x1="0" x2="400" y1={160 - y*1.6} y2={160 - y*1.6} stroke="var(--rule-2)" strokeWidth="0.5"/>
                <text x="-6" y={160 - y*1.6 + 3} fontFamily="var(--font-mono)" fontSize="9" fill="var(--ink-4)" textAnchor="end">{y}</text>
              </React.Fragment>
            ))}
            <path d={`M ${series.map((v, i) => `${i * (400/(series.length-1))} ${160 - v*1.6}`).join(' L ')}`}
                  fill="none" stroke="var(--accent)" strokeWidth="1.8"/>
            {series.map((v, i) => (
              <circle key={i} cx={i * (400/(series.length-1))} cy={160 - v*1.6} r="2.5" fill="var(--bg-elev)" stroke="var(--accent)" strokeWidth="1.5"/>
            ))}
            {/* highlight latest */}
            <circle cx={(series.length-1) * (400/(series.length-1))} cy={160 - series[series.length-1]*1.6} r="5" fill="var(--accent)"/>
          </svg>
          <div style={{display:'flex', justifyContent:'space-between', marginTop:8,
                       fontFamily:'var(--font-mono)', fontSize:10, color:'var(--ink-4)'}}>
            <span>Mar 19</span><span>Apr 17</span>
          </div>
        </div>

        {/* Topic strength */}
        <div className="card" style={{padding:24}}>
          <div style={{fontSize:15, fontWeight:500}}>By topic</div>
          <div style={{fontSize:12.5, color:'var(--ink-3)', marginTop:2}}>Weighted by recency</div>
          <div style={{marginTop:18, display:'flex', flexDirection:'column', gap:12}}>
            {[
              {t:'Thermo · first law', v:92},
              {t:'Orgo · func. groups', v:85},
              {t:'Statmech · partitions', v:71},
              {t:'Cell bio · membranes', v:54},
              {t:'Thermo · entropy', v:41, weak:true},
            ].map((r,i) => (
              <div key={i} style={{display:'flex', alignItems:'center', gap:12}}>
                <span style={{fontSize:12.5, flex:1, color: r.weak ? 'var(--danger)' : 'var(--ink-2)'}}>{r.t}</span>
                <div style={{flex:'0 0 120px', height:4, background:'var(--rule-2)', borderRadius:999}}>
                  <div style={{width:r.v+'%', height:'100%',
                               background: r.weak ? 'var(--danger)' : r.v > 80 ? 'var(--accent)' : 'var(--ink-2)',
                               borderRadius:999}}/>
                </div>
                <span className="mono" style={{fontSize:11.5, minWidth:24, textAlign:'right',
                             color: r.weak ? 'var(--danger)' : 'var(--ink-3)'}}>{r.v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Weekly journal */}
      <div className="section-title">
        <span>Weekly debrief</span>
        <span className="rule"/>
      </div>
      <div style={{display:'flex', flexDirection:'column', gap:0}}>
        {weeks.map((w, i) => (
          <div key={i} style={{
            padding:'20px 0',
            borderBottom: i < weeks.length-1 ? '1px solid var(--rule)' : 'none',
            display:'grid', gridTemplateColumns:'120px 1fr auto', gap:32, alignItems:'start'
          }}>
            <div>
              <div className="mono" style={{fontSize:12, color:'var(--ink-3)'}}>{w.w}</div>
              <div className="mono" style={{fontSize:26, fontWeight:500, marginTop:4}}>{w.score}</div>
              <div style={{fontSize:11.5, color:'var(--ink-3)'}}>avg. score</div>
            </div>
            <div>
              <div style={{display:'flex', gap:6, marginBottom:10, flexWrap:'wrap'}}>
                {w.topics.map(t => <span key={t} className="chip">{t}</span>)}
                <span className="chip outline" style={{padding:'2px 8px'}}>{w.tests} tests</span>
              </div>
              <div style={{fontSize:14, lineHeight:1.55, fontFamily:'var(--font-serif)', fontStyle:'italic', color:'var(--ink-2)'}}>
                {w.note}
              </div>
            </div>
            <button className="btn btn-bare btn-sm">Expand →</button>
          </div>
        ))}
      </div>

      {/* Habits strip */}
      <div style={{marginTop:40, display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:2,
                   background:'var(--rule)', border:'1px solid var(--rule)', borderRadius:10, overflow:'hidden'}}>
        {[
          {l:'Best time of day',     v:'2–5 pm',       n:'Your scores are 14% higher in afternoon sessions.', bg:'var(--chem-soft)', fg:'var(--chem-ink)'},
          {l:'Sweet spot length',    v:'15–20 min',    n:'Anything over 30 min and accuracy drops.', bg:'var(--biology-soft)', fg:'var(--biology-ink)'},
          {l:'Longest streak',       v:'12 days',      n:'Ending Mar 24. Current streak: 3.', bg:'var(--math-soft)', fg:'var(--math-ink)'},
          {l:'Avg time per question',v:'52 sec',       n:'Down from 71 sec a month ago.', bg:'var(--physics-soft)', fg:'var(--physics-ink)'},
        ].map((h, i) => (
          <div key={i} style={{padding:'22px 20px', background:h.bg}}>
            <div className="mono" style={{fontSize:10.5, color:h.fg, textTransform:'uppercase', letterSpacing:'0.12em', fontWeight:600}}>{h.l}</div>
            <div className="mono" style={{fontSize:20, fontWeight:600, marginTop:6, color:h.fg}}>{h.v}</div>
            <div style={{fontSize:12, color:'var(--ink-2)', marginTop:4, lineHeight:1.4}}>{h.n}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

window.Analytics = Analytics;
// Auth + Ask + History screens

const Auth = ({ navigate }) => (
  <div style={{minHeight:'100vh', display:'grid', gridTemplateColumns:'1fr 1fr', background:'var(--bg)'}}>
    {/* Left — form */}
    <div style={{padding:'48px', display:'flex', flexDirection:'column'}}>
      <div className="wordmark" style={{padding:0}}>
        <span className="dot"/>
        <span style={{fontSize:17}}>testai</span>
      </div>

      <div style={{margin:'auto', width:'100%', maxWidth:360}}>
        <h1 className="page-title" style={{fontSize:30}}>Welcome back.</h1>
        <p className="page-sub" style={{marginBottom:32}}>
          Sign in to pick up your tests, materials, and progress.
        </p>

        <button className="btn btn-ghost btn-lg" style={{width:'100%', justifyContent:'center', marginBottom:10}}>
          <svg width="14" height="14" viewBox="0 0 48 48"><path fill="#4285f4" d="M45.1 24.5c0-1.6-.1-2.7-.3-4H24v7.2h12c-.2 2-1.5 5-4.4 7l7.1 5.5c4.2-3.9 6.4-9.6 6.4-15.7z"/><path fill="#34a853" d="M24 46c5.8 0 10.7-1.9 14.2-5.2l-7-5.4c-1.9 1.3-4.5 2.2-7.2 2.2-5.5 0-10.2-3.6-11.8-8.7l-7.3 5.6C7.4 41 15 46 24 46z"/><path fill="#fbbc04" d="M12.2 28.8c-.4-1.2-.7-2.5-.7-3.8 0-1.3.2-2.6.6-3.8l-7.3-5.7C3.3 18 2.5 21 2.5 24s.9 6 2.4 8.5l7.3-5.7z"/><path fill="#ea4335" d="M24 10.5c3.2 0 5.3 1.4 6.6 2.6l4.9-4.8C32.5 5.4 28.7 3 24 3 15 3 7.4 8 4.9 15.5l7.3 5.7c1.6-5 6.3-8.7 11.8-8.7z"/></svg>
          Continue with Google
        </button>

        <div style={{display:'flex', alignItems:'center', gap:10, margin:'18px 0',
                     fontSize:11, color:'var(--ink-4)', fontFamily:'var(--font-mono)',
                     textTransform:'uppercase', letterSpacing:'0.12em'}}>
          <div style={{flex:1, height:1, background:'var(--rule)'}}/>
          <span>or</span>
          <div style={{flex:1, height:1, background:'var(--rule)'}}/>
        </div>

        {[
          {l:'Email', ph:'maya@utexas.edu'},
          {l:'Password', ph:'••••••••', t:'password'},
        ].map((f, i) => (
          <div key={i} style={{marginBottom:14}}>
            <div className="mono" style={{fontSize:10.5, color:'var(--ink-3)', marginBottom:6,
                         textTransform:'uppercase', letterSpacing:'0.1em'}}>{f.l}</div>
            <input type={f.t || 'text'} placeholder={f.ph}
                   style={{
                     width:'100%', padding:'10px 12px', fontSize:14,
                     border:'1px solid var(--rule)', borderRadius:6,
                     background:'var(--bg-elev)', color:'var(--ink)',
                     outline:'none',
                   }}/>
          </div>
        ))}

        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:20}}>
          <button onClick={() => navigate('dashboard')} className="btn btn-accent" style={{flex:1, justifyContent:'center'}}>
            Sign in <Icon.arrow size={12}/>
          </button>
        </div>

        <div style={{marginTop:20, fontSize:12.5, color:'var(--ink-3)', textAlign:'center'}}>
          New here? <span style={{color:'var(--ink)', fontWeight:500, borderBottom:'1px solid var(--rule)'}}>Make an account</span>
        </div>
      </div>

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

const Ask = () => (
  <div className="content narrow">
    <div style={{marginBottom:24}}>
      <div className="eyebrow" style={{marginBottom:8}}>Ask a question</div>
      <h1 className="page-title">What's on your mind?</h1>
      <p className="page-sub">Answers are pulled from your uploaded material and cite the page.</p>
    </div>

    {/* Scope selector */}
    <div style={{display:'flex', gap:8, marginBottom:20, alignItems:'center'}}>
      <span className="mono" style={{fontSize:11, color:'var(--ink-3)', textTransform:'uppercase', letterSpacing:'0.12em'}}>In:</span>
      <span className="chip ink">Lecture 7 — Thermo</span>
      <span className="chip outline" style={{padding:'3px 10px'}}>+ Ch.4 Cell Bio</span>
      <button className="btn btn-bare btn-sm" style={{fontSize:12}}>+ add material</button>
    </div>

    {/* Conversation */}
    <div style={{display:'flex', flexDirection:'column', gap:24, marginBottom:32}}>
      <div>
        <div className="mono" style={{fontSize:10.5, color:'var(--ink-3)', marginBottom:8, textTransform:'uppercase', letterSpacing:'0.1em'}}>You · 2:42pm</div>
        <div style={{fontSize:15.5, lineHeight:1.5}}>
          Why is the Gibbs free energy the right potential to use at constant T and P instead of internal energy?
        </div>
      </div>

      <div style={{
        padding:'20px 22px', background:'var(--bg-elev)',
        border:'1px solid var(--rule)', borderRadius:8
      }}>
        <div className="mono" style={{fontSize:10.5, color:'var(--ink-3)', marginBottom:8, textTransform:'uppercase', letterSpacing:'0.1em'}}>
          <span className="dot" style={{display:'inline-block', width:6, height:6, background:'var(--accent)', borderRadius:'50%', marginRight:6}}/>
          testai · from your notes
        </div>
        <div style={{fontSize:15, lineHeight:1.6, fontFamily:'var(--font-serif)', fontStyle:'normal'}}>
          Because at constant T and P, spontaneity is determined by the sign of
          ΔG = ΔH − TΔS, not ΔU. Internal energy is the right variable when
          volume is held constant; when pressure is held constant instead, the
          system can do PV work on the surroundings, and H = U + PV naturally
          absorbs that bookkeeping. Adding the −TS term then accounts for the
          entropy of the surroundings for free.
        </div>
        <div style={{marginTop:18, display:'flex', flexDirection:'column', gap:8}}>
          <div className="eyebrow" style={{color:'var(--ink-3)'}}>Sources</div>
          {[
            {p:28, q:'"At constant T and P, ΔG < 0 is both necessary and sufficient for spontaneity."', s:'Lecture 7, §4.3'},
            {p:22, q:'"The enthalpy H = U + PV accounts for work done against a constant external pressure."', s:'Lecture 7, §3.1'},
          ].map((s, i) => (
            <div key={i} style={{
              padding:'10px 14px', background:'var(--bg-sunken)', borderRadius:4,
              display:'flex', gap:12, alignItems:'flex-start'
            }}>
              <span className="mono" style={{fontSize:11, color:'var(--ink-3)', whiteSpace:'nowrap'}}>p.{s.p}</span>
              <div style={{fontSize:13, lineHeight:1.5}}>
                <span style={{fontFamily:'var(--font-serif)', fontStyle:'italic'}}>{s.q}</span>
                <span style={{color:'var(--ink-3)', marginLeft:8}}>— {s.s}</span>
              </div>
            </div>
          ))}
        </div>
        <div style={{marginTop:14, display:'flex', gap:12, fontSize:12.5, color:'var(--ink-3)'}}>
          <button className="btn-bare" style={{fontSize:12.5}}>Explain simpler</button>
          <span>·</span>
          <button className="btn-bare" style={{fontSize:12.5}}>Make a test from this</button>
          <span>·</span>
          <button className="btn-bare" style={{fontSize:12.5}}>Save to notes</button>
        </div>
      </div>
    </div>

    {/* Input */}
    <div style={{
      display:'flex', gap:10, alignItems:'center',
      padding:'14px 16px', border:'1px solid var(--rule)', borderRadius:8,
      background:'var(--bg-elev)'
    }}>
      <Icon.sparkle size={14}/>
      <span style={{flex:1, fontSize:14.5, color:'var(--ink-3)'}}>Ask a follow-up…</span>
      <span className="kbd-key">⏎</span>
    </div>
  </div>
);

const History = () => {
  const days = [
    {d:'Today · April 17', tests:[
      {t:'Thermodynamics · Quick 10', score:80, time:'2:48pm'},
    ]},
    {d:'Wednesday · April 15', tests:[
      {t:'Thermodynamics · Timed 15', score:71, time:'9:10am'},
      {t:'Review of Monday\'s wrong', score:90, time:'7:40pm'},
    ]},
    {d:'Monday · April 13', tests:[
      {t:'Cell bio · Chapter 4 hard', score:64, time:'3:15pm'},
      {t:'Statmech · Quick 8', score:92, time:'8:50am'},
    ]},
    {d:'Saturday · April 11', tests:[
      {t:'Thermodynamics · Timed 15', score:71, time:'11:20am'},
    ]},
  ];
  return (
    <div className="content narrow">
      <div style={{marginBottom:28}}>
        <div className="eyebrow" style={{marginBottom:10}}>Everything you've taken</div>
        <h1 className="page-title">History</h1>
      </div>
      {days.map((d, i) => (
        <div key={i} style={{marginBottom:28}}>
          <div style={{fontSize:12.5, color:'var(--ink-3)', marginBottom:10, fontFamily:'var(--font-mono)', letterSpacing:'0.08em', textTransform:'uppercase'}}>{d.d}</div>
          <div style={{borderTop:'1px solid var(--rule)'}}>
            {d.tests.map((t, j) => (
              <div key={j} style={{
                padding:'14px 0', borderBottom:'1px solid var(--rule-2)',
                display:'grid', gridTemplateColumns:'1fr 80px 50px 16px', gap:16, alignItems:'center',
                cursor:'pointer'
              }}>
                <div style={{fontSize:14.5}}>{t.t}</div>
                <div className="mono" style={{fontSize:12, color:'var(--ink-3)'}}>{t.time}</div>
                <div className="mono" style={{fontSize:14, fontWeight:500, textAlign:'right',
                     color: t.score >= 80 ? 'var(--accent-ink)' : t.score >= 70 ? 'var(--ink)' : 'var(--warn)'}}>{t.score}</div>
                <Icon.arrow size={12}/>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

window.Auth = Auth;
window.Ask = Ask;
window.History = History;


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

  React.useEffect(() => { localStorage.setItem('testai.screen', screen); }, [screen]);
  React.useEffect(() => { localStorage.setItem('testai.tweaks', JSON.stringify(tweaks)); }, [tweaks]);

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

  const Body = () => {
    switch (screen) {
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
      default:          return <Dashboard heroVariant={tweaks.heroVariant} navigate={navigate}/>;
    }
  };

  const current = SCREENS.find(s => s.id === screen) || SCREENS[0];

  return (
    <>
      {fullScreen ? (
        <div data-screen-label={current.label}>
          <Body/>
        </div>
      ) : (
        <div className="app" data-screen-label={current.label}>
          <Sidebar screen={screen} setScreen={setScreen}/>
          <div className="main">
            <Topbar crumbs={current.crumb}/>
            <Body/>
          </div>
        </div>
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
    </>
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