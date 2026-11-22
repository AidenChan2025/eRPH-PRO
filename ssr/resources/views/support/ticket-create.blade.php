@extends('support.layout')

@section('title', 'Submit a ticket')

@section('content')
<style>
    .consent-panel{margin-top:22px;padding:20px 22px;border:1px solid var(--line);border-radius:14px;background:#f5f7fa}
    .consent-panel h2{margin:0 0 12px;font-size:15px;line-height:1.45;letter-spacing:-.015em}
    .consent-panel p{max-width:65ch;margin:0 0 10px;color:#475569;font-size:16px;line-height:1.6}
    .consent-check{display:flex;align-items:flex-start;gap:12px;min-height:44px;margin-top:14px;padding:8px 10px;border-radius:9px;color:var(--ink);font-size:14px;font-weight:700;line-height:1.5;cursor:pointer}
    .consent-check input{flex:0 0 20px;width:20px;height:20px;margin:1px 0 0;padding:0;accent-color:var(--blue)}
    .consent-check:focus-within{outline:3px solid #2563eb33;outline-offset:2px}
    .form-actions{display:flex;justify-content:flex-end;margin-top:20px}
    @media(max-width:480px){.consent-panel{padding:17px 15px}.form-actions .button{width:100%}}
</style>
<main class="shell">
    <section class="ticket-shell">
        <span class="eyebrow">Human support when you need it</span>
        <h1>Tell us what happened.</h1>
        <p class="muted">After you submit, this browser session keeps access to your ticket. Use the same browser to view updates and reply; we do not email a private access link. Security, identity, billing and access issues are always reviewed by a human.</p>

        <div class="form-panel">
            @if($errors->any())
                <div class="error" role="alert">
                    <strong>Please check the form.</strong>
                    <ul>
                        @foreach($errors->all() as $error)
                            <li>{{ $error }}</li>
                        @endforeach
                    </ul>
                </div>
            @endif

            <form method="post" action="{{ request()->getScheme() }}://{{ config('support.host') }}/tickets">
                <div class="form-grid">
                    <div class="field">
                        <label for="name">Your name</label>
                        <input id="name" name="name" value="{{ old('name') }}" required autocomplete="name">
                    </div>
                    <div class="field">
                        <label for="email">Email for replies</label>
                        <input id="email" name="email" type="email" value="{{ old('email') }}" required autocomplete="email">
                    </div>
                    <div class="field">
                        <label for="subject">Subject</label>
                        <input id="subject" name="subject" value="{{ old('subject') }}" required maxlength="240">
                    </div>
                    <div class="field">
                        <label for="category">What do you need?</label>
                        <select id="category" name="category" required>
                            <option value="general">General question</option>
                            <option value="account">Account or identity</option>
                            <option value="login">Login problem</option>
                            <option value="lesson_plans">Lesson plans / RPH</option>
                            <option value="school_admin">School administration</option>
                            <option value="email">Email or notification</option>
                            <option value="billing">Billing</option>
                            <option value="security">Security concern</option>
                            <option value="bug">Something is broken</option>
                            <option value="feature">Feature request</option>
                        </select>
                    </div>
                    <div class="field full">
                        <label for="message">Describe the issue</label>
                        <textarea id="message" name="message" required minlength="10" maxlength="12000" placeholder="What did you expect, what happened, and which school/workspace were you using?">{{ old('message') }}</textarea>
                    </div>
                </div>

                @if(config('support.ai_enabled'))
                <section class="consent-panel" aria-labelledby="ai-consent-title">
                    <h2 id="ai-consent-title">Optional AI triage · Saringan AI pilihan · AI 辅助分类（可选）</h2>
                    <div id="ai-consent-description">
                    <p lang="en">If you opt in and AI triage is enabled, this ticket’s subject and message may be sent to DeepSeek to suggest a category and reply draft. Common email, phone, Malaysian ID and long payment-number patterns are redacted first. Do not include passwords, student details, financial data or other secrets. A human reviews every draft before it is sent. Leave this unchecked for human-only handling.</p>
                    <p lang="ms">Jika anda bersetuju dan saringan AI diaktifkan, tajuk dan mesej tiket ini mungkin dihantar kepada DeepSeek untuk mencadangkan kategori dan draf balasan. Corak umum e-mel, nombor telefon, nombor pengenalan Malaysia dan nombor bayaran yang panjang akan dipadamkan dahulu. Jangan masukkan kata laluan, maklumat murid, data kewangan atau rahsia lain. Setiap draf disemak oleh manusia sebelum dihantar. Biarkan kotak ini kosong untuk pengendalian manusia sahaja.</p>
                    <p lang="zh-Hans">如果您同意且 AI 分类已启用，此工单的主题和内容可能会发送给 DeepSeek，用于建议分类和拟写回复；系统会先遮盖常见电邮、电话号码、马来西亚身份证号码及较长的支付号码格式。请勿填写密码、学生资料、财务数据或其他机密。所有草稿都会由人工审核后才发送。不勾选则仅由人工处理。</p>
                    </div>
                    <label class="consent-check" for="ai_processing_consent">
                        <input id="ai_processing_consent" name="ai_processing_consent" type="checkbox" value="1" aria-describedby="ai-consent-description" @checked(old('ai_processing_consent'))>
                        <span>I agree to optional DeepSeek processing · Saya bersetuju · 我同意由 DeepSeek 处理</span>
                    </label>
                </section>
                @endif

                <div class="form-actions">
                    <button class="button" type="submit">Create private ticket</button>
                </div>
                @csrf
            </form>
        </div>
    </section>
</main>
@endsection
