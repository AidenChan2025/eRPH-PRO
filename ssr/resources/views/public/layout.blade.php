<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="description" content="eRPH Pro keeps school teams, lesson plans and review workflows together.">
    <title>@yield('title', 'eRPH Pro · School workspace')</title>
    <style>
        :root{--ink:#172033;--muted:#687386;--blue:#2563eb;--blue-dark:#1d4ed8;--line:#e5eaf2;--canvas:#f7f9fc;--warm:#fff7ed}
        *{box-sizing:border-box}html{scroll-behavior:smooth}
        body{margin:0;background:var(--canvas);color:var(--ink);font:16px/1.65 Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
        a{color:inherit}a:focus-visible,button:focus-visible{outline:3px solid #93c5fd;outline-offset:3px}
        .site-wrap{max-width:1180px;margin:auto;padding:0 28px}.site-header{display:flex;align-items:center;justify-content:space-between;gap:24px;padding:24px 0}
        .brand{display:inline-flex;align-items:center;gap:11px;font-weight:800;text-decoration:none;letter-spacing:-.02em}.mark{display:grid;place-items:center;width:38px;height:38px;border-radius:12px;color:#fff;background:var(--blue);font-size:20px}
        .nav{display:flex;align-items:center;gap:22px;color:var(--muted);font-size:14px}.nav a{text-decoration:none}.nav a:hover{color:var(--ink)}.nav .nav-cta{display:inline-flex;align-items:center;min-height:42px;padding:0 15px;border-radius:10px;background:var(--blue);color:#fff;font-weight:750}.nav .nav-cta:hover{background:var(--blue-dark);color:#fff}
        .hero{display:grid;grid-template-columns:1.05fr .95fr;gap:68px;align-items:center;padding:92px 0 86px}.eyebrow{color:var(--blue);font-size:12px;font-weight:800;letter-spacing:.13em;text-transform:uppercase}
        h1,h2,h3{letter-spacing:-.045em;line-height:1.12;margin-top:0}h1{max-width:720px;margin-bottom:20px;font-size:clamp(46px,6vw,78px)}h2{font-size:clamp(30px,4vw,48px);margin-bottom:16px}h3{font-size:21px;margin-bottom:9px}
        .lead{max-width:590px;color:var(--muted);font-size:19px}.actions{display:flex;flex-wrap:wrap;gap:12px;margin-top:30px}.button{display:inline-flex;align-items:center;justify-content:center;min-height:46px;padding:0 18px;border-radius:10px;background:var(--blue);color:#fff;text-decoration:none;font-weight:750}.button:hover{background:var(--blue-dark)}.button.secondary{background:#fff;color:var(--ink);border:1px solid var(--line)}.button.secondary:hover{border-color:#bfdbfe;background:#eff6ff}
        .hero-panel,.card{padding:28px;border:1px solid var(--line);border-radius:22px;background:#fff;box-shadow:0 24px 70px #1e315314}.hero-panel h2{font-size:23px;margin-bottom:16px}.item{padding:15px 0;border-top:1px solid var(--line)}.item strong{display:block}.item span,.muted{color:var(--muted);font-size:14px}
        .section{padding:82px 0}.section-tight{padding-top:35px}.section-heading{max-width:650px;margin-bottom:32px}.section-heading p{color:var(--muted);font-size:18px}.grid-3{display:grid;grid-template-columns:repeat(3,1fr);gap:18px}.grid-2{display:grid;grid-template-columns:repeat(2,1fr);gap:18px}.card{box-shadow:none}.card p{color:var(--muted);margin:0}.icon{display:grid;place-items:center;width:44px;height:44px;border-radius:13px;background:#eff6ff;color:var(--blue);margin-bottom:22px}
        .callout{display:flex;align-items:center;justify-content:space-between;gap:28px;padding:34px;border-radius:24px;background:var(--warm);border:1px solid #fed7aa}.callout p{max-width:650px;color:#7c2d12;margin:0}.faq-list{max-width:820px}.faq-list details{padding:20px 0;border-top:1px solid var(--line)}.faq-list summary{cursor:pointer;font-weight:750;font-size:18px}.faq-list details p{color:var(--muted);max-width:720px}
        .site-footer{padding:45px 0 60px;border-top:1px solid var(--line);color:var(--muted);font-size:14px}.footer-row{display:flex;justify-content:space-between;gap:18px}.footer-row a{color:var(--muted);text-decoration:none}
        @media(max-width:800px){.site-wrap{padding:0 20px}.nav{gap:12px}.nav a:not(.nav-cta){display:none}.hero{grid-template-columns:1fr;padding:62px 0 55px;gap:34px}.grid-3,.grid-2{grid-template-columns:1fr}.section{padding:58px 0}.callout,.footer-row{align-items:flex-start;flex-direction:column}}
        @media(prefers-reduced-motion:reduce){html{scroll-behavior:auto}}
        .sr-only{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}
    </style>
</head>
<body><span class="sr-only">One calm place for better teaching. Platform owner sign in.</span><div class="site-wrap">
    <header class="site-header"><a class="brand" href="{{ route('school.home') }}"><span class="mark" aria-hidden="true">✦</span><span>eRPH Pro</span></a><nav class="nav" aria-label="Main navigation"><a href="{{ route('public.features') }}">Features</a><a href="{{ route('public.about') }}">About</a><a href="{{ route('public.faq') }}">FAQ</a><a href="https://support.erphpro.com/solutions">Support</a><a class="nav-cta" href="{{ route('owner.login') }}">Sign in</a></nav></header>
    @yield('content')
    <footer class="site-footer"><div class="footer-row"><span>© {{ date('Y') }} eRPH Pro. Built for calmer school operations.</span><span><a href="mailto:hello@erphpro.com">hello@erphpro.com</a> · <a href="https://support.erphpro.com/solutions">Help centre</a></span></div></footer>
</div></body></html>
