<!doctype html>
<html lang="en"><head><meta charset="utf-8"><title>DSKP catalogue</title></head><body>
<main>
    <h1>DSKP catalogue</h1>
    <form method="get" action="{{ route('dskp.index') }}">
        <input name="q" value="{{ request('q') }}" placeholder="Search title or code">
        <input name="school_type" value="{{ request('school_type') }}" placeholder="School type">
        <input name="grade_level" value="{{ request('grade_level') }}" placeholder="Grade level">
        <input name="subject" value="{{ request('subject') }}" placeholder="Subject">
        <button type="submit">Search</button>
    </form>
    @forelse ($items as $item)
        <article><h2>{{ $item->title }}</h2><p>{{ $item->description }}</p><p>{{ $item->curriculum_version }} · {{ $item->school_type }} · {{ $item->grade_level }} · {{ $item->subject }}</p><p>{{ $item->sk_code }} {{ $item->sp_code }}</p></article>
    @empty <p>No DSKP items found.</p> @endforelse
    {{ $items->links() }}
</main></body></html>
