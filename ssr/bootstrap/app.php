<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use App\Http\Middleware\ResolveSchool;
use App\Http\Middleware\RequireSchoolMembership;
use App\Http\Middleware\RequirePermission;
use App\Http\Middleware\RequirePlatformOwner;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->alias([
            'school' => ResolveSchool::class,
            'school.member' => RequireSchoolMembership::class,
            'permission' => RequirePermission::class,
            'platform.owner' => RequirePlatformOwner::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        //
    })->create();
