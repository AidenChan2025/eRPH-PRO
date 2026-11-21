<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="description" content="eRPH Pro brings the work behind every lesson into one clear school workspace.">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Manrope:wght@600;700;800&display=swap" rel="stylesheet">
    <title>@yield('title', 'eRPH Pro · School workspace')</title>
    <style>
        :root{--ink:#202d3e;--muted:#6b7480;--accent:#e86e50;--accent-dark:#c9573e;--line:#dedbd4;--canvas:#f5f3ee;--surface:#fffdf9;--sand:#ece5da}
        *{box-sizing:border-box}html{scroll-behavior:smooth}
        body{margin:0;background:var(--canvas);color:var(--ink);font:16px/1.65 "DM Sans",ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
        a{color:inherit}a:focus-visible,button:focus-visible{outline:3px solid #f1a08a;outline-offset:4px}
        .site-wrap{max-width:1280px;margin:auto;padding:0 34px}.site-header{display:flex;align-items:center;justify-content:space-between;gap:24px;padding:24px 0}
        .brand{display:inline-flex;align-items:center;gap:11px;font-weight:800;text-decoration:none;letter-spacing:-.03em}.mark{display:grid;place-items:center;width:38px;height:38px;border-radius:13px;color:#fff;background:var(--accent);font-size:20px}.mark svg{width:18px;height:18px}
        .nav{display:flex;align-items:center;gap:6px;padding:5px;border:1px solid var(--line);border-radius:999px;background:#fffdf9cc;color:var(--muted);font-size:13px;box-shadow:0 10px 30px #2634490a}.nav a{text-decoration:none;padding:9px 13px;border-radius:999px}.nav a:hover{color:var(--ink);background:var(--sand)}.nav .nav-cta{display:inline-flex;align-items:center;min-height:38px;padding:0 16px;background:var(--accent);color:#fff;font-weight:750}.nav .nav-cta:hover{background:var(--accent-dark);color:#fff}
        .hero{display:grid;grid-template-columns:minmax(0,.84fr) minmax(500px,1.16fr);gap:clamp(38px,7vw,104px);align-items:center;padding:82px 0 92px;min-height:690px}.eyebrow{color:var(--accent-dark);font-size:11px;font-weight:800;letter-spacing:.16em;text-transform:uppercase}
        h1,h2,h3{font-family:Manrope,"DM Sans",sans-serif;letter-spacing:-.06em;line-height:1.06;margin-top:0}h1{max-width:670px;margin:16px 0 23px;font-size:clamp(48px,6.4vw,86px);font-weight:800}h2{font-size:clamp(34px,4.5vw,60px);margin-bottom:16px}h3{font-size:22px;margin-bottom:9px}
        .lead{max-width:510px;color:var(--muted);font-size:18px;line-height:1.7}.actions{display:flex;flex-wrap:wrap;gap:11px;margin-top:31px}.button{display:inline-flex;align-items:center;justify-content:center;gap:9px;min-height:47px;padding:0 18px;border-radius:9px;background:var(--accent);color:#fff;text-decoration:none;font-weight:750;transition:transform .2s ease,background .2s ease}.button:hover{background:var(--accent-dark);transform:translateY(-2px)}.button:active{transform:translateY(0) scale(.98)}.button.secondary{background:var(--surface);color:var(--ink);border:1px solid var(--line)}.button.secondary:hover{border-color:#cdb9ae;background:#fffaf4}.button svg{width:15px;height:15px}
        .hero-panel,.card{padding:28px;border:1px solid var(--line);border-radius:22px;background:var(--surface);box-shadow:0 24px 70px #26344912}.hero-panel h2{font-size:23px;margin-bottom:16px}.item{padding:15px 0;border-top:1px solid var(--line)}.item strong{display:block}.item span,.muted{color:var(--muted);font-size:14px}
        .section{padding:112px 0}.section-tight{padding-top:35px}.section-heading{max-width:650px;margin-bottom:38px}.section-heading p{color:var(--muted);font-size:18px}.grid-3{display:grid;grid-template-columns:repeat(3,1fr);gap:18px}.grid-2{display:grid;grid-template-columns:repeat(2,1fr);gap:18px}.card{box-shadow:none}.card p{color:var(--muted);margin:0}.icon{display:grid;place-items:center;width:44px;height:44px;border-radius:13px;background:#f8e6df;color:var(--accent-dark);margin-bottom:22px}
        .callout{display:flex;align-items:center;justify-content:space-between;gap:28px;padding:34px;border-radius:24px;background:#28384a;color:#fff;border:1px solid #28384a}.callout p{max-width:650px;color:#d8e0e6;margin:0}.callout .button{background:var(--accent)}.faq-list{max-width:820px}.faq-list details{padding:20px 0;border-top:1px solid var(--line)}.faq-list summary{cursor:pointer;font-weight:750;font-size:18px}.faq-list details p{color:var(--muted);max-width:720px}
        .site-footer{padding:45px 0 60px;border-top:1px solid var(--line);color:var(--muted);font-size:14px}.footer-row{display:flex;justify-content:space-between;gap:18px}.footer-row a{color:var(--muted);text-decoration:none}.footer-row a:hover{color:var(--ink)}
        @media(max-width:900px){.site-wrap{padding:0 22px}.hero{grid-template-columns:1fr;padding:62px 0 74px;gap:42px}.grid-3,.grid-2{grid-template-columns:1fr}.section{padding:76px 0}.callout,.footer-row{align-items:flex-start;flex-direction:column}}
        @media(max-width:560px){.site-wrap{padding:0 17px}.site-header{padding:18px 0}.nav{gap:0}.nav a:not(.nav-cta){display:none}.hero{padding-top:48px}.hero h1{font-size:clamp(46px,14vw,68px)}.lead{font-size:16px}.section{padding:64px 0}}
        @media(prefers-reduced-motion:reduce){html{scroll-behavior:auto}.button{transition:none}}
        .sr-only{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}
    </style>
</head>
<body><span class="sr-only">One calm place for better teaching. Platform owner sign in.</span><div class="site-wrap">
    <header class="site-header"><a class="brand" href="{{ route('public.home') }}"><span class="mark" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none"><path d="M12 3.5 14.2 9.8 20.5 12l-6.3 2.2L12 20.5l-2.2-6.3L3.5 12l6.3-2.2L12 3.5Z" fill="currentColor"/></svg></span><span>eRPH Pro</span></a><nav class="nav" aria-label="Main navigation"><a href="{{ route('public.features') }}">Features</a><a href="{{ route('public.about') }}">About</a><a href="{{ route('public.faq') }}">FAQ</a><a href="https://support.erphpro.com/solutions">Support</a><a class="nav-cta" href="{{ route('owner.login') }}">Sign in</a></nav></header>
    @yield('content')
    <footer class="site-footer"><div class="footer-row"><span>© {{ date('Y') }} eRPH Pro. Built for calmer school operations.</span><span><a href="mailto:hello@erphpro.com">hello@erphpro.com</a> · <a href="https://support.erphpro.com/solutions">Help centre</a></span></div></footer>
</div></body></html>
