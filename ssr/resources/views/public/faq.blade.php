@extends('public.layout')
@section('title', 'FAQ · eRPH Pro')
@section('content')
<main>
    <section class="page-hero"><div><span class="eyebrow">Frequently asked questions</span><h1>Answers about eRPH Pro and school support.</h1><p>Start here for the common journeys. Every answer stays open so you can scan the page without opening a hidden accordion.</p><div class="page-visual-line"><i></i>Access · RPH workflow · support</div></div><aside class="faq-support"><strong>Need a private answer?</strong><p>Open a ticket in the support centre and follow the conversation through a secure link.</p><a class="button" href="https://support.erphpro.com/solutions">Open support centre</a></aside></section>
    <section class="section section-tight"><div class="faq-grid"><div class="faq-list">
        <details open><summary>How do I access my school workspace?</summary><p>Use the school-specific address provided by your administrator, then choose the Google Workspace sign-in option assigned to you.</p></details>
        <details open><summary>Can one teacher work with more than one school?</summary><p>Yes. A teacher can link approved identities across school workspaces while each school keeps its own membership and permissions.</p></details>
        <details open><summary>Who can review lesson plans?</summary><p>Review access is limited to authorised school roles such as school administrators, principals and vice principals.</p></details>
        <details open><summary>What if I cannot sign in?</summary><p>Check that you are using the correct school address and account. If the issue continues, open a private support ticket so an administrator can verify the account safely.</p></details>
        <details open><summary>Can I contact support without an account?</summary><p>Yes. The support centre accepts a ticket with an email address and gives you a private link to follow the conversation.</p></details>
        <details open><summary>Will AI make account or security decisions?</summary><p>No. DeepSeek is used only to classify tickets and prepare a possible draft. Security, billing, identity, access, deletion, legal and urgent matters require human review.</p></details>
    </div><aside class="faq-support"><strong>Still need help?</strong><p>Include the school address, the page you were using and what you expected to happen. Do not include a password.</p><div class="actions"><a class="button secondary" href="mailto:hello@erphpro.com">Email hello@erphpro.com</a></div></aside></div></section>
</main>
@endsection
