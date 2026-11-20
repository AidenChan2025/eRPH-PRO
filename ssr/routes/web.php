<?php

use App\Http\Controllers\Auth\GoogleAuthController;
use App\Http\Controllers\SchoolHomeController;
use App\Http\Controllers\WorkspaceController;
use App\Http\Controllers\SchoolAdminController;
use App\Http\Controllers\LessonPlanController;
use App\Http\Controllers\SchoolReportController;
use Illuminate\Support\Facades\Route;

Route::middleware('school')->group(function () {
    Route::get('/login', [GoogleAuthController::class, 'show'])->name('login');
    Route::get('/auth/google/redirect', [GoogleAuthController::class, 'redirect'])->name('auth.google.redirect');
    Route::get('/auth/google/callback', [GoogleAuthController::class, 'callback'])->name('auth.google.callback');
    Route::middleware(['auth', 'school.member'])->get('/workspace', WorkspaceController::class)->name('workspace.dashboard');
    Route::middleware(['auth', 'school.member'])->group(function () {
        Route::get('/rph/create', [LessonPlanController::class, 'create'])->name('rph.create');
        Route::post('/rph', [LessonPlanController::class, 'store'])->name('rph.store');
    });
    Route::middleware(['auth', 'school.member:school_admin,principal,vice_principal'])->get('/reports', SchoolReportController::class)->name('school.reports');
    Route::middleware(['auth', 'school.member:school_admin,principal,vice_principal'])->group(function () {
        Route::get('/admin', SchoolAdminController::class)->name('school.admin');
        Route::post('/admin/people', [SchoolAdminController::class, 'store'])->name('school.admin.people.store');
    });
    Route::get('/', SchoolHomeController::class)->name('school.home');
});
