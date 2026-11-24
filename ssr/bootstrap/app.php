<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use App\Http\Middleware\ResolveSchool;
use App\Http\Middleware\RequireSchoolMembership;
use App\Http\Middleware\RequirePermission;
use App\Http\Middleware\RequirePlatformOwner;
use App\Http\Middleware\RequirePlatformPermission;
use App\Http\Middleware\RequirePlatformMfa;
use App\Http\Middleware\ResolveSupportHost;
use App\Http\Middleware\RequirePlatformHost;
use App\Http\Middleware\BindAuthenticatedSessionToHost;
use App\Http\Middleware\RequirePlatformAuthentication;
use App\Http\Middleware\ConfigureHostSessionCookie;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->prependToGroup('web', \App\Http\Middleware\ResolveTenantContext::class);
        $middleware->prependToGroup('web', ConfigureHostSessionCookie::class);
        $middleware->appendToGroup('web', BindAuthenticatedSessionToHost::class);
        $middleware->appendToGroup('web', \App\Http\Middleware\SetApplicationLocale::class);
        $middleware->alias([
            'school' => ResolveSchool::class,
            'school.member' => RequireSchoolMembership::class,
            'permission' => RequirePermission::class,
            'platform.owner' => RequirePlatformOwner::class,
            'platform.permission' => RequirePlatformPermission::class,
            'platform.mfa' => RequirePlatformMfa::class,
            'platform.host' => RequirePlatformHost::class,
            'platform.auth' => RequirePlatformAuthentication::class,
            'support.host' => ResolveSupportHost::class,
            'throttle' => \Illuminate\Routing\Middleware\ThrottleRequests::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        //
    })->create();
