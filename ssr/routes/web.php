<?php

use App\Http\Controllers\Auth\GoogleAuthController;
use App\Http\Controllers\SchoolHomeController;
use App\Http\Controllers\WorkspaceController;
use Illuminate\Support\Facades\Route;

Route::middleware('school')->group(function () {
    Route::get('/login', [GoogleAuthController::class, 'show'])->name('login');
    Route::get('/auth/google/redirect', [GoogleAuthController::class, 'redirect'])->name('auth.google.redirect');
    Route::get('/auth/google/callback', [GoogleAuthController::class, 'callback'])->name('auth.google.callback');
    Route::middleware(['auth', 'school.member'])->get('/workspace', WorkspaceController::class)->name('workspace.dashboard');
    Route::get('/', SchoolHomeController::class)->name('school.home');
});
