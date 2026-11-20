<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>{{ $school->name }} · eRPH Pro</title></head>
<body>
    <main>
        <p>eRPH Pro</p>
        <h1>{{ $school->name }}</h1>
        <p>School workspace is ready for secure server-rendered modules.</p>
        <a href="{{ route('login') }}">Sign in with Google Workspace</a>
    </main>
</body>
</html>
