<!doctype html>
<html lang="ms">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>RPH · {{ $school->name }}</title>
    <link rel="stylesheet" href="{{ asset('css/erph-design-system.css') }}">
    <style>
        *{box-sizing:border-box}body{margin:0;color:#172033;background:#f7f9fc;font:13px Arial,sans-serif;line-height:1.45}.toolbar{position:sticky;top:0;z-index:2;display:flex;justify-content:space-between;align-items:center;gap:12px;padding:12px max(18px,calc((100vw - 980px)/2));background:#fff;border-bottom:1px solid #e5eaf2;box-shadow:0 4px 18px #1e31530a}.toolbar strong{font-size:14px}.print-button{border:0;border-radius:9px;background:#2563eb;color:#fff;padding:10px 15px;font-weight:700;cursor:pointer}.sheet{max-width:980px;margin:28px auto;padding:34px;background:#fff;box-shadow:0 10px 28px #1e315312}.masthead{text-align:center;border-bottom:2px solid #172033;padding-bottom:14px}.masthead h1{margin:0;font-size:22px}.masthead p{margin:4px 0 0}.meta{display:grid;grid-template-columns:repeat(4,1fr);border:1px solid #172033;margin-top:16px}.meta div{padding:8px;border-right:1px solid #172033}.meta div:last-child{border-right:0}.label{display:block;color:#5f6b7a;font-size:10px;font-weight:700;text-transform:uppercase}.section{margin-top:14px;border:1px solid #172033}.section h2{margin:0;padding:7px 10px;background:#eef2f6;border-bottom:1px solid #172033;font-size:13px}.rows{display:grid;grid-template-columns:180px 1fr}.rows>div{padding:8px 10px;border-bottom:1px solid #d5dbe3}.rows>div:nth-last-child(-n+2){border-bottom:0}.key{font-weight:700;background:#fafbfc;border-right:1px solid #d5dbe3}.text{white-space:pre-wrap;min-height:34px}.footer{margin-top:18px;display:flex;justify-content:space-between;color:#5f6b7a;font-size:11px}@media print{body{background:#fff}.toolbar{display:none}.sheet{max-width:none;margin:0;padding:0;box-shadow:none}.section{break-inside:avoid}.masthead,.meta{break-inside:avoid}}@page{size:A4;margin:12mm}@media(max-width:650px){.toolbar{padding:10px 14px}.sheet{margin:14px;padding:14px}.meta{grid-template-columns:repeat(2,1fr)}.meta div:nth-child(2){border-right:0}.rows{grid-template-columns:125px 1fr}}
    </style>
</head>
<body>
<div class="toolbar no-print"><strong>RPH preview</strong><button class="print-button" type="button" onclick="window.print()">Print RPH</button></div>
<main class="sheet">
    <div class="masthead"><h1>RANCANGAN PENGAJARAN HARIAN (RPH)</h1><p>{{ $school->name }} · KPM / TS25</p></div>
    @php($content = $version->content ?? [])
    <div class="meta">
        <div><span class="label">Guru</span>{{ $teacher->user->name }}</div>
        <div><span class="label">Minggu / Tarikh</span>{{ $content['week_no'] ?? '—' }} / {{ $lessonPlan->lesson_date?->format('d/m/Y') }}</div>
        <div><span class="label">Kelas</span>{{ $lessonPlan->class_name }}</div>
        <div><span class="label">Mata Pelajaran</span>{{ $lessonPlan->subject }}</div>
    </div>
    <section class="section"><h2>Maklumat Kurikulum</h2><div class="rows">
        <div class="key">Tema / Tajuk</div><div class="text">{{ $content['topic'] ?? $content['title'] ?? '—' }}{{ !empty($content['subtitle']) ? ' / '.$content['subtitle'] : '' }}</div>
        <div class="key">SK / SP / TP</div><div class="text">{{ $content['standards'] ?? $content['content_standard'] ?? '—' }}</div>
        <div class="key">Objektif Pembelajaran</div><div class="text">{{ $content['objectives'] ?? $content['learning_outcomes'] ?? '—' }}</div>
    </div></section>
    <section class="section"><h2>Pelaksanaan PdPc</h2><div class="rows">
        <div class="key">Aktiviti PdPc</div><div class="text">{{ $content['activities'] ?? $content['activity_main'] ?? '—' }}{{ !empty($content['activity_closing']) ? "\n\nPenutup:\n".$content['activity_closing'] : '' }}</div>
        <div class="key">BBM</div><div class="text">{{ $content['materials'] ?? '—' }}</div>
        <div class="key">EMK / PAK21</div><div class="text">{{ $content['emk'] ?? '—' }} / {{ $content['pak21'] ?? '—' }}</div>
        <div class="key">KBAT / Nilai</div><div class="text">{{ $content['kbat'] ?? '—' }} / {{ $content['moral_values'] ?? $content['civic_value'] ?? '—' }}</div>
    </div></section>
    <section class="section"><h2>Refleksi dan Catatan</h2><div class="rows"><div class="key">Refleksi</div><div class="text">{{ $content['reflection'] ?? '—' }}</div><div class="key">Catatan</div><div class="text">{{ $content['notes'] ?? '—' }}</div></div></section>
    <div class="footer"><span>Status: {{ ucfirst($lessonPlan->status) }}</span><span>Versi {{ $version->version }}</span></div>
</main>
</body>
</html>
