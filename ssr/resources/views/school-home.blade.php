<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="description" content="{{ $school->name }} school workspace powered by eRPH Pro">
    <title>{{ $school->name }} · eRPH Pro</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Manrope:wght@600;700;800&display=swap" rel="stylesheet">
    <style>
        :root { color-scheme: light; --ink:#172033; --muted:#687386; --blue:#2563eb; --blue-dark:#1749b3; --line:#e5eaf2; --surface:#fff; --canvas:#f7f9fc; --orange:#f97316; }
        * { box-sizing:border-box; }
        html { background:var(--canvas); }
        body { margin:0; color:var(--ink); background:var(--canvas); font-family:"DM Sans",system-ui,sans-serif; font-size:16px; line-height:1.55; }
        a { color:inherit; text-decoration:none; }
        a:focus-visible, button:focus-visible { outline:3px solid rgba(37,99,235,.35); outline-offset:4px; }
        .shell { min-height:100vh; }
        .nav { height:76px; display:flex; align-items:center; justify-content:space-between; max-width:1240px; margin:0 auto; padding:0 30px; }
        .brand { display:flex; align-items:center; gap:12px; font-weight:700; letter-spacing:-.02em; }
        .mark { display:grid; place-items:center; width:38px; height:38px; border-radius:12px; color:#fff; background:var(--blue); box-shadow:0 8px 18px rgba(37,99,235,.2); }
        .brand small { display:block; color:var(--muted); font-size:11px; font-weight:500; letter-spacing:.08em; text-transform:uppercase; }
        .nav-link { color:var(--muted); font-size:14px; font-weight:600; }
        .nav-link:hover { color:var(--blue); }
        .hero { max-width:1240px; margin:0 auto; padding:54px 30px 80px; display:grid; grid-template-columns:minmax(0,1.1fr) minmax(360px,.9fr); gap:68px; align-items:center; }
        .eyebrow { display:inline-flex; align-items:center; gap:8px; color:var(--blue); font-size:12px; font-weight:700; letter-spacing:.13em; text-transform:uppercase; }
        .eyebrow::before { content:""; width:22px; height:2px; background:var(--orange); }
        h1, h2 { font-family:Manrope,"DM Sans",sans-serif; letter-spacing:-.055em; }
        h1 { max-width:650px; margin:18px 0 22px; font-size:clamp(42px,5vw,72px); line-height:1.02; }
        .lead { max-width:580px; margin:0; color:var(--muted); font-size:18px; }
        .actions { display:flex; flex-wrap:wrap; gap:14px; margin-top:32px; }
        .button { min-height:46px; display:inline-flex; align-items:center; justify-content:center; gap:9px; padding:0 19px; border-radius:11px; font-size:14px; font-weight:700; transition:transform 180ms ease, box-shadow 180ms ease, background 180ms ease; }
        .button:hover { transform:translateY(-2px); }
        .button-primary { color:#fff; background:var(--blue); box-shadow:0 9px 20px rgba(37,99,235,.2); }
        .button-primary:hover { background:var(--blue-dark); box-shadow:0 12px 24px rgba(37,99,235,.25); }
        .button-secondary { color:var(--ink); background:var(--surface); border:1px solid var(--line); }
        .button-secondary:hover { border-color:#b9c7dd; box-shadow:0 6px 15px rgba(23,32,51,.06); }
        .preview { position:relative; padding:16px; border:1px solid rgba(229,234,242,.9); border-radius:24px; background:rgba(255,255,255,.76); box-shadow:0 22px 60px rgba(30,49,83,.1); }
        .preview::after { content:""; position:absolute; right:-20px; bottom:26px; width:96px; height:96px; border-radius:50%; background:rgba(249,115,22,.08); z-index:-1; }
        .window { overflow:hidden; border:1px solid var(--line); border-radius:16px; background:var(--surface); }
        .window-bar { display:flex; align-items:center; gap:6px; padding:13px 16px; border-bottom:1px solid var(--line); background:#fbfcfe; }
        .dot { width:7px; height:7px; border-radius:50%; background:#c7d0df; }
        .window-body { padding:22px; }
        .mini-label { color:var(--muted); font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:.1em; }
        .mini-title { margin:7px 0 18px; font-family:Manrope,sans-serif; font-size:21px; letter-spacing:-.04em; }
        .stats { display:grid; grid-template-columns:repeat(3,1fr); gap:10px; }
        .stat { padding:14px; border-radius:12px; background:#f5f8fd; }
        .stat strong { display:block; font-family:Manrope,sans-serif; font-size:25px; letter-spacing:-.06em; }
        .stat span { color:var(--muted); font-size:11px; }
        .progress-row { display:flex; justify-content:space-between; margin-top:24px; color:var(--muted); font-size:12px; }
        .progress { height:8px; margin-top:9px; overflow:hidden; border-radius:99px; background:#edf1f7; }
        .progress i { display:block; width:72%; height:100%; border-radius:inherit; background:var(--blue); }
        .section { padding:0 30px 84px; }
        .section-inner { max-width:1240px; margin:0 auto; }
        .section-head { display:flex; align-items:end; justify-content:space-between; gap:24px; margin-bottom:22px; }
        h2 { margin:0; font-size:32px; line-height:1.1; }
        .section-head p { max-width:410px; margin:0; color:var(--muted); font-size:14px; }
        .features { display:grid; grid-template-columns:repeat(3,1fr); gap:16px; }
        .feature { min-height:190px; padding:24px; border:1px solid var(--line); border-radius:16px; background:var(--surface); transition:transform 180ms ease, box-shadow 180ms ease; }
        .feature:hover { transform:translateY(-3px); box-shadow:0 12px 26px rgba(23,32,51,.07); }
        .feature-icon { display:grid; place-items:center; width:36px; height:36px; margin-bottom:22px; border-radius:10px; color:var(--blue); background:#eaf1ff; }
        .feature h3 { margin:0 0 8px; font-family:Manrope,sans-serif; font-size:17px; letter-spacing:-.03em; }
        .feature p { margin:0; color:var(--muted); font-size:14px; }
        .footer { padding:26px 30px; border-top:1px solid var(--line); color:var(--muted); font-size:12px; }
        .footer-inner { max-width:1240px; margin:0 auto; display:flex; justify-content:space-between; gap:20px; }
        @media (max-width:820px) { .hero { grid-template-columns:1fr; gap:42px; padding-top:38px; } .features { grid-template-columns:1fr; } .section-head { display:block; } .section-head p { margin-top:12px; } }
        @media (max-width:520px) { .nav, .hero, .section { padding-left:20px; padding-right:20px; } .nav { height:68px; } h1 { font-size:43px; } .lead { font-size:16px; } .stats { gap:7px; } .stat { padding:11px; } .stat strong { font-size:22px; } .footer { padding-left:20px; padding-right:20px; } .footer-inner { display:block; } }
        @media (prefers-reduced-motion:reduce) { *, *::before, *::after { scroll-behavior:auto!important; transition-duration:.01ms!important; animation-duration:.01ms!important; } }
    </style>
</head>
<body>
<div class="shell">
    <nav class="nav" aria-label="Primary navigation">
        <a class="brand" href="{{ url('/') }}" aria-label="eRPH Pro home">
            <span class="mark" aria-hidden="true"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19V5l8-2 8 2v14l-8 2-8-2Z"/><path d="M12 3v18M4 5l8 2 8-2"/></svg></span>
            <span>eRPH Pro<small>School workspace</small></span>
        </a>
        <a class="nav-link" href="{{ route('login') }}">Staff sign in <span aria-hidden="true">→</span></a>
    </nav>
    <main>
        <section class="hero">
            <div>
                <span class="eyebrow">{{ $school->subdomain }} workspace</span>
                <h1>Make every school day easier to manage.</h1>
                <p class="lead">A calm, structured workspace for lesson planning, teacher records and school-wide visibility — designed around the way your school already works.</p>
                <div class="actions">
                    <a class="button button-primary" href="{{ route('login') }}">Sign in with Google Workspace <span aria-hidden="true">↗</span></a>
                    <a class="button button-secondary" href="#workspace">Explore workspace</a>
                </div>
            </div>
            <div class="preview" aria-label="Preview of the school dashboard">
                <div class="window">
                    <div class="window-bar"><i class="dot"></i><i class="dot"></i><i class="dot"></i></div>
                    <div class="window-body">
                        <span class="mini-label">This week</span><div class="mini-title">School overview</div>
                        <div class="stats"><div class="stat"><strong>86%</strong><span>RPH submitted</span></div><div class="stat"><strong>24</strong><span>Active teachers</span></div><div class="stat"><strong>12</strong><span>Needs review</span></div></div>
                        <div class="progress-row"><span>Weekly readiness</span><strong>Good progress</strong></div><div class="progress" role="progressbar" aria-label="Weekly readiness" aria-valuenow="72" aria-valuemin="0" aria-valuemax="100"><i></i></div>
                    </div>
                </div>
            </div>
        </section>
        <section class="section" id="workspace"><div class="section-inner">
            <div class="section-head"><h2>One clear place for school work.</h2><p>Built to reduce admin friction while keeping every record accountable, portable and easy to review.</p></div>
            <div class="features">
                <article class="feature"><div class="feature-icon" aria-hidden="true"><svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M5 4h14v16H5z"/><path d="M8 8h8M8 12h8M8 16h5"/></svg></div><h3>Structured teacher records</h3><p>Profiles, duties, training, timetable and teaching files stay organized in one secure cabinet.</p></article>
                <article class="feature"><div class="feature-icon" aria-hidden="true"><svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 19V5M4 19h16"/><path d="m7 15 3-4 3 2 5-7"/></svg></div><h3>Practical school visibility</h3><p>Management sees submission health, review queues and school activity without chasing spreadsheets.</p></article>
                <article class="feature"><div class="feature-icon" aria-hidden="true"><svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 3 5 6v5c0 4.5 3 8.2 7 10 4-1.8 7-5.5 7-10V6l-7-3Z"/><path d="m9 12 2 2 4-4"/></svg></div><h3>Secure by school</h3><p>School boundaries, role permissions and audit trails protect records from the first request.</p></article>
            </div>
        </div></section>
    </main>
    <footer class="footer"><div class="footer-inner"><span>{{ $school->name }}</span><span>Powered by eRPH Pro · Server-rendered workspace</span></div></footer>
</div>
</body>
</html>
