<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use App\Http\Middleware\ResolveSchool;
use App\Http\Middleware\RequireSchoolMembership;
use App\Http\Middleware\RequirePermission;
use App\Http\Middleware\RequirePlatformOwner;
use App\Http\Middleware\RequirePlatformPermission;
use App\Http\Middleware\ResolveSupportHost;
use App\Http\Middleware\RequirePlatformHost;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->prependToGroup('web', \App\Http\Middleware\ResolveTenantContext::class);
        $middleware->alias([
            'school' => ResolveSchool::class,
            'school.member' => RequireSchoolMembership::class,
            'permission' => RequirePermission::class,
            'platform.owner' => RequirePlatformOwner::class,
            'platform.permission' => RequirePlatformPermission::class,
            'platform.host' => RequirePlatformHost::class,
            'support.host' => ResolveSupportHost::class,
            'throttle' => \Illuminate\Routing\Middleware\ThrottleRequests::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        //
    })->create();
