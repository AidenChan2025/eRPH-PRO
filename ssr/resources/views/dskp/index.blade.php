<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>DSKP catalogue</title><style>
:root{--ink:#172033;--muted:#687386;--blue:#2563eb;--line:#e5eaf2;--canvas:#f7f9fc;--surface:#fff}*{box-sizing:border-box}body{margin:0;background:var(--canvas);color:var(--ink);font:15px Arial,sans-serif;line-height:1.5}.shell{width:clamp(80vw,90vw,1800px);max-width:none;margin-inline:auto;padding:clamp(24px,5vw,56px) 18px}.eyebrow{color:var(--blue);font-size:11px;font-weight:700;letter-spacing:.13em;text-transform:uppercase}h1{margin:8px 0 26px;font-size:clamp(30px,5vw,42px);letter-spacing:-.055em;line-height:1.1}.filters{display:grid;grid-template-columns:2fr repeat(3,1fr) auto;gap:9px;margin-bottom:24px;padding:16px;border:1px solid var(--line);border-radius:16px;background:var(--surface);box-shadow:0 10px 28px #1e315308}input,button{min-height:42px;border:1px solid var(--line);border-radius:10px;padding:0 12px;background:#fff;color:var(--ink);font:inherit}button{background:var(--blue);border-color:var(--blue);color:#fff;font-weight:700;cursor:pointer}.results{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}.item{padding:22px;border:1px solid var(--line);border-radius:16px;background:var(--surface);box-shadow:0 10px 28px #1e315308}.item h2{margin:0 0 8px;font-size:19px;letter-spacing:-.035em}.item p{margin:8px 0;color:var(--muted)}.codes{font-size:12px;font-weight:700;color:var(--blue)!important}.empty{padding:24px;border:1px dashed #cbd5e1;border-radius:14px;color:var(--muted)}nav[role=navigation]{margin-top:22px}@media(max-width:880px){.filters{grid-template-columns:repeat(2,1fr)}.filters input:first-child{grid-column:1/-1}.filters button{grid-column:1/-1}.results{grid-template-columns:1fr}}@media(max-width:520px){.filters{grid-template-columns:1fr}.filters input:first-child{grid-column:auto}}
</style></head><body>
<main class="shell"><span class="eyebrow">Curriculum reference</span>
    <h1>DSKP catalogue</h1>
    <form class="filters" method="get" action="{{ route('dskp.index') }}">
        <input aria-label="Search title or code" name="q" value="{{ request('q') }}" placeholder="Search title or code">
        <input aria-label="School type" name="school_type" value="{{ request('school_type') }}" placeholder="School type">
        <input aria-label="Grade level" name="grade_level" value="{{ request('grade_level') }}" placeholder="Grade level">
        <input aria-label="Subject" name="subject" value="{{ request('subject') }}" placeholder="Subject">
        <button type="submit">Search</button>
    </form>
    @forelse ($items as $item)
        <article class="item"><h2>{{ $item->title }}</h2><p>{{ $item->description }}</p><p>{{ $item->curriculum_version }} · {{ $item->school_type }} · {{ $item->grade_level }} · {{ $item->subject }}</p><p class="codes">{{ $item->sk_code }} {{ $item->sp_code }}</p></article>
    @empty <p class="empty">No DSKP items found.</p> @endforelse
    {{ $items->links() }}
</main></body></html>
<link rel="stylesheet" href="{{ asset('css/erph-design-system.css') }}">
