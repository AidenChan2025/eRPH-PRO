<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>eRPH Pro · School workspace</title>
    <style>
        :root{--ink:#172033;--muted:#687386;--blue:#2563eb;--line:#e5eaf2;--canvas:#f7f9fc}
        *{box-sizing:border-box}
        body{margin:0;background:var(--canvas);color:var(--ink);font:16px/1.6 system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
        .wrap{max-width:1120px;margin:auto;padding:28px 24px 70px}
        .top{display:flex;align-items:center;justify-content:space-between;gap:20px}
        .brand{display:flex;align-items:center;gap:11px;font-weight:800}
        .mark{display:grid;place-items:center;width:38px;height:38px;border-radius:12px;color:#fff;background:var(--blue)}
        .top a{color:var(--muted);text-decoration:none;font-size:14px}
        .hero{display:grid;grid-template-columns:1.1fr .9fr;gap:48px;align-items:center;padding:100px 0 76px}
        .eyebrow{color:var(--blue);font-size:12px;font-weight:800;letter-spacing:.13em;text-transform:uppercase}
        h1{max-width:680px;margin:13px 0 18px;font-size:clamp(42px,6vw,76px);line-height:1.02;letter-spacing:-.065em}
        .lead{max-width:570px;color:var(--muted);font-size:19px}
        .actions{display:flex;flex-wrap:wrap;gap:12px;margin-top:28px}
        .button{display:inline-flex;align-items:center;justify-content:center;min-height:46px;padding:0 18px;border-radius:10px;background:var(--blue);color:#fff;text-decoration:none;font-weight:750}
        .button.secondary{background:#fff;color:var(--ink);border:1px solid var(--line)}
        .panel{padding:28px;border:1px solid var(--line);border-radius:22px;background:#fff;box-shadow:0 24px 70px #1e315314}
        .panel h2{margin:0 0 16px;font-size:22px;letter-spacing:-.035em}
        .item{padding:15px 0;border-top:1px solid var(--line)}
        .item strong{display:block}.item span{color:var(--muted);font-size:14px}
        .footer{color:var(--muted);font-size:13px}
        @media(max-width:760px){.hero{grid-template-columns:1fr;padding:70px 0 46px;gap:30px}.top{align-items:flex-start}.top a{font-size:13px}h1{font-size:48px}}
    </style>
</head>
<body>
<div class="wrap">
    <header class="top">
        <div class="brand"><span class="mark" aria-hidden="true">✦</span><span>eRPH Pro</span></div>
        <a href="{{ route('owner.login') }}">Platform owner sign in</a>
    </header>
    <main class="hero">
        <section>
            <span class="eyebrow">School workspace</span>
            <h1>One calm place for better teaching.</h1>
            <p class="lead">eRPH Pro keeps school teams, teacher records, lesson plans and review workflows together in a secure, school-specific workspace.</p>
            <div class="actions">
                <a class="button" href="mailto:hello@erphpro.com">Contact eRPH Pro</a>
                <a class="button secondary" href="mailto:admin@erphpro.com">Administrator help</a>
            </div>
        </section>
        <aside class="panel">
            <h2>Built for accountable school work</h2>
            <div class="item"><strong>School-scoped access</strong><span>Every school workspace stays separated by its own address and membership rules.</span></div>
            <div class="item"><strong>RPH from draft to review</strong><span>Teachers prepare, submit and improve lesson plans with a clear audit trail.</span></div>
            <div class="item"><strong>Google Workspace sign-in</strong><span>Use the school account assigned by your administrator.</span></div>
        </aside>
    </main>
    <p class="footer">Need a school workspace? Contact your eRPH Pro administrator for the correct school address.</p>
</div>
</body>
</html>
