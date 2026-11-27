<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <title>Set up MFA · eRPH Pro</title>
    <style>
        :root{--ink:#172033;--muted:#687386;--blue:#2563eb;--line:#e5eaf2;--canvas:#f7f9fc;--error:#b42318}
        *{box-sizing:border-box}
        body{margin:0;background:var(--canvas);color:var(--ink);font:15px/1.6 system-ui,sans-serif}
        .main{width:clamp(80vw,90vw,1800px);max-width:none;margin-inline:auto;padding:64px 24px}
        .eyebrow{color:var(--blue);font-size:11px;font-weight:700;letter-spacing:.14em;text-transform:uppercase}
        .title{margin:8px 0;font-size:34px;letter-spacing:-.05em}
        .muted{color:var(--muted)}
        .card{margin-top:24px;padding:24px;border:1px solid var(--line);border-radius:16px;background:#fff}
        .qr{display:grid;place-items:center;margin:20px auto;padding:16px;width:max-content;border:1px solid var(--line);border-radius:12px;background:#fff}
        .qr img{display:block;width:220px;height:220px}
        .secret{display:block;margin:16px 0;padding:14px;border-radius:9px;background:#f1f5f9;font:700 20px ui-monospace,monospace;letter-spacing:.1em;word-break:break-all}
        .field{display:grid;gap:7px;margin-top:20px}
        .field input{width:100%;padding:12px;border:1px solid #cbd5e1;border-radius:9px;font:inherit;letter-spacing:.2em}
        .button{margin-top:18px;border:0;border-radius:9px;background:var(--blue);color:#fff;padding:12px 16px;font:inherit;font-weight:700;cursor:pointer}
        .error{color:var(--error)}
        .recovery{display:inline-block;margin-top:16px;color:var(--blue)}
        details{margin-top:18px}
        summary{cursor:pointer;color:var(--blue);font-weight:700}
    </style>
</head>
<body>
<main class="main">
    <span class="eyebrow">platform security</span>
    <h1 class="title">Set up authenticator MFA</h1>
    <p class="muted">Scan this QR code with your authenticator app, then enter the current six-digit code. The QR is generated locally by eRPH Pro.</p>
    <section class="card">
        <div class="qr"><img src="{{ $qrDataUri }}" alt="MFA setup QR code" width="220" height="220"></div>
        <details>
            <summary>Use manual setup instead</summary>
            <p class="muted">If scanning is unavailable, enter this setup key manually:</p>
            <code class="secret">{{ $secret }}</code>
        </details>
        @if($errors->any())<p class="error">{{ $errors->first() }}</p>@endif
        <form method="post" action="{{ route('owner.mfa.confirm') }}">
            @csrf
            <div class="field">
                <label for="code">Authenticator code</label>
                <input id="code" name="code" inputmode="numeric" autocomplete="one-time-code" pattern="[0-9]{6}" maxlength="6" required>
            </div>
            <button class="button" type="submit">Confirm MFA</button>
        </form>
        <a class="recovery" href="{{ route('owner.mfa.recover') }}">Use a recovery code instead</a>
    </section>
</main>
</body>
</html>
