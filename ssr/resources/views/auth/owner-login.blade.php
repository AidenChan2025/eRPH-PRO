<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Platform owner sign in · eRPH Pro</title>
    <style>
        :root{--ink:#172033;--muted:#687386;--blue:#2563eb;--line:#e5eaf2;--canvas:#f7f9fc}
        *{box-sizing:border-box}body{margin:0;min-height:100vh;display:grid;place-items:center;color:var(--ink);background:var(--canvas);font-family:Arial,sans-serif}
        .card{width:min(100% - 32px,460px);padding:42px;border:1px solid var(--line);border-radius:24px;background:#fff;box-shadow:0 24px 70px #1e315314}
        .mark{display:grid;place-items:center;width:42px;height:42px;border-radius:13px;color:#fff;background:var(--blue);font-weight:800}
        .eyebrow{margin-top:28px;color:var(--blue);font-size:12px;font-weight:700;letter-spacing:.13em;text-transform:uppercase}
        h1{margin:10px 0;font-size:32px;letter-spacing:-.04em}.muted{color:var(--muted);font-size:14px;line-height:1.6}
        a{display:flex;align-items:center;justify-content:center;min-height:50px;margin-top:26px;border-radius:11px;color:#fff;background:var(--blue);font-weight:700;text-decoration:none}
        .notice{margin-top:18px;padding:13px 14px;border-radius:10px;background:#fff7ed;color:#9a4d0b;font-size:12px;line-height:1.5}
    </style>
</head>
<body><main class="card"><div class="mark" aria-hidden="true">eR</div><div class="eyebrow">Platform owner</div><h1>eRPH Pro control centre.</h1><p class="muted">Use the authorized Google Workspace account to review platform health and provide time-limited support to schools.</p><a href="{{ route('owner.auth.google.redirect') }}">Continue with Google Workspace</a>@if(!config('services.google.client_id'))<div class="notice">Google Workspace login is not configured on this development environment yet.</div>@endif</main></body>
</html>
