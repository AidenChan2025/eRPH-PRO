@switch($icon ?? 'question')
    @case('rocket')
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M14.5 4.5c2.1-2.1 5-2.5 6-2.5 0 1-.4 3.9-2.5 6L13 13l-2-2 3.5-6.5Z"/><path d="m9 13-4 1-2 4 4-2 1-3Z"/><path d="m11 15 1 4-3 3-1-4 3-3Z"/><circle cx="16.5" cy="7.5" r="1.5"/></svg>
        @break
    @case('lock')
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/><path d="M12 14v3"/></svg>
        @break
    @case('document')
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M6 3h8l4 4v14H6z"/><path d="M14 3v5h5M9 13h6M9 17h6"/></svg>
        @break
    @case('mail')
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m4 7 8 6 8-6"/></svg>
        @break
    @default
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M9.7 9a2.4 2.4 0 1 1 4 1.8c-1.2.8-1.7 1.2-1.7 2.7M12 17h.01"/></svg>
@endswitch
