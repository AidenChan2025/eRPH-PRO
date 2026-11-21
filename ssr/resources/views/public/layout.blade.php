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
        :root{--ink:#111315;--muted:#737a82;--line:#e1e4e7;--canvas:#f3f4f5;--surface:#fff;--accent:#ef6a4a;--soft:#eef0f2}
        *{box-sizing:border-box}html{scroll-behavior:smooth}
        body{margin:0;background:var(--canvas);color:var(--ink);font:15px/1.6 "DM Sans",ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
        a{color:inherit}a:focus-visible,button:focus-visible{outline:3px solid #f2a18f;outline-offset:4px}
        .site-wrap{max-width:1360px;margin:auto;padding:0 22px}.site-header{display:flex;align-items:center;gap:24px;width:min(100%,900px);margin:18px auto 0;padding:5px 7px 5px 17px;border:1px solid #dfe2e5;border-radius:999px;background:#fff;box-shadow:0 10px 28px #1d273308;position:relative;z-index:5}
        .brand{display:inline-flex;align-items:center;gap:9px;font-weight:800;text-decoration:none;letter-spacing:-.04em;white-space:nowrap}.mark{display:grid;place-items:center;width:29px;height:29px;border-radius:9px;color:#fff;background:var(--accent)}.mark svg{width:15px;height:15px}
        .nav{display:flex;align-items:center;gap:2px;margin-left:auto;padding:0;border:0;background:transparent;box-shadow:none;color:#6f757b;font-size:12px}.nav a{text-decoration:none;padding:8px 11px;border-radius:999px;transition:background .2s ease,color .2s ease}.nav a:hover{color:var(--ink);background:var(--soft)}.nav .nav-cta{display:inline-flex;align-items:center;min-height:32px;padding:0 13px;background:var(--ink);color:#fff;font-weight:700}.nav .nav-cta:hover{background:#32363a;color:#fff}
        h1,h2,h3{font-family:Manrope,"DM Sans",sans-serif;letter-spacing:-.065em;line-height:1.05;margin-top:0}h1{font-size:clamp(46px,7vw,100px);font-weight:800}h2{font-size:clamp(32px,5vw,64px)}h3{font-size:21px}.eyebrow{font-size:10px;font-weight:800;letter-spacing:.16em;text-transform:uppercase;color:#8a9096}
        .lead{max-width:560px;color:var(--muted);font-size:16px;line-height:1.65}.actions{display:flex;flex-wrap:wrap;gap:9px;margin-top:26px}.button{display:inline-flex;align-items:center;justify-content:center;gap:8px;min-height:43px;padding:0 16px;border:1px solid var(--ink);border-radius:8px;background:var(--ink);color:#fff;text-decoration:none;font-size:13px;font-weight:700;transition:transform .2s ease,background .2s ease}.button:hover{background:#303438;transform:translateY(-2px)}.button:active{transform:scale(.98)}.button.secondary{border-color:var(--line);background:#fff;color:var(--ink)}.button.secondary:hover{border-color:#bfc4c8;background:#f8f9fa}.button svg{width:14px;height:14px}
        .hero-panel,.card{padding:28px;border:1px solid var(--line);border-radius:22px;background:var(--surface);box-shadow:0 24px 70px #1d27330d}.hero-panel h2{font-size:23px;margin-bottom:16px}.item{padding:15px 0;border-top:1px solid var(--line)}.item strong{display:block}.item span,.muted{color:var(--muted);font-size:14px}
        .section{padding:110px 0}.section-tight{padding-top:35px}.section-heading{max-width:650px;margin-bottom:32px}.section-heading p{color:var(--muted);font-size:17px}.grid-3{display:grid;grid-template-columns:repeat(3,1fr);gap:16px}.grid-2{display:grid;grid-template-columns:repeat(2,1fr);gap:16px}.card{box-shadow:none}.card p{color:var(--muted);margin:0}.icon{display:grid;place-items:center;width:42px;height:42px;border-radius:12px;background:#f8dcd4;color:#c64e38;margin-bottom:20px}
        .callout{display:flex;align-items:center;justify-content:space-between;gap:28px;padding:32px;border-radius:25px;background:var(--ink);color:#fff}.callout p{max-width:650px;color:#c7cbd0;margin:0}.callout .button{background:var(--accent);border-color:var(--accent)}.faq-list{max-width:820px}.faq-list details{padding:20px 0;border-top:1px solid var(--line)}.faq-list summary{cursor:pointer;font-weight:750;font-size:18px}.faq-list details p{color:var(--muted);max-width:720px}
        .site-footer{padding:56px 0 38px;border-top:1px solid var(--line);color:var(--muted);font-size:13px}.footer-row{display:flex;justify-content:space-between;gap:18px}.footer-row a{color:var(--muted);text-decoration:none}.footer-row a:hover{color:var(--ink)}
        @media(max-width:760px){.site-wrap{padding:0 16px}.site-header{margin-top:12px;padding-left:12px}.nav{gap:0}.nav a:not(.nav-cta){display:none}.hero{grid-template-columns:1fr;padding:58px 0 55px;gap:34px}.grid-3,.grid-2{grid-template-columns:1fr}.section{padding:70px 0}.callout,.footer-row{align-items:flex-start;flex-direction:column}}
        @media(prefers-reduced-motion:reduce){html{scroll-behavior:auto}.button{transition:none}}
        .sr-only{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}
    </style>
</head>
<body><span class="sr-only">One calm place for better teaching. Platform owner sign in.</span><div class="site-wrap">
    <header class="site-header"><a class="brand" href="{{ route('public.home') }}"><span class="mark" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none"><path d="M12 3.5 14.2 9.8 20.5 12l-6.3 2.2L12 20.5l-2.2-6.3L3.5 12l6.3-2.2L12 3.5Z" fill="currentColor"/></svg></span><span>eRPH Pro</span></a><nav class="nav" aria-label="Main navigation"><a href="{{ route('public.features') }}">Features</a><a href="{{ route('public.about') }}">About</a><a href="{{ route('public.faq') }}">FAQ</a><a href="https://support.erphpro.com/solutions">Support</a><a href="{{ route('owner.login') }}">Sign in</a><a class="nav-cta" href="mailto:hello@erphpro.com?subject=eRPH%20Pro%20access">Request access</a></nav></header>
    @yield('content')
    <footer class="site-footer"><div class="footer-row"><span>© {{ date('Y') }} eRPH Pro. Built for calmer school operations.</span><span><a href="mailto:hello@erphpro.com">hello@erphpro.com</a> · <a href="https://support.erphpro.com/solutions">Help centre</a></span></div></footer>
</div></body></html>
