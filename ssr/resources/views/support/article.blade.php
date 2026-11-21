@extends('support.layout')

@section('title', $article->title)
@section('content')
<main class="shell"><article class="article"><a class="muted" href="{{ request()->getScheme() }}://{{ config('support.host') }}/">← Back to solutions</a><div style="margin-top:34px"><span class="eyebrow">{{ $article->category?->name ?: 'Solution' }}</span><h1>{{ $article->title }}</h1><p class="muted">{{ $article->excerpt }}</p></div><div class="article-body">{{ $article->body }}</div><div class="callout" style="margin-top:22px"><div><strong>Did this solve it?</strong><p>If not, include this article in a ticket and we will continue with you.</p></div><a class="button" href="{{ request()->getScheme() }}://{{ config('support.host') }}/tickets/new">Contact support</a></div></article></main>
@endsection
