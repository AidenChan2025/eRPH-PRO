<?php

use App\Http\Controllers\Auth\GoogleAuthController;
use App\Http\Controllers\SchoolHomeController;
use App\Http\Controllers\WorkspaceController;
use App\Http\Controllers\SchoolAdminController;
use App\Http\Controllers\LessonPlanController;
use App\Http\Controllers\SchoolReportController;
use App\Http\Controllers\HealthController;
use App\Http\Controllers\TeacherProfileController;
use App\Http\Controllers\SchoolSettingsController;
use Illuminate\Support\Facades\Route;

Route::get('/health', HealthController::class)->name('health');

Route::middleware('school')->group(function () {
    Route::get('/login', [GoogleAuthController::class, 'show'])->name('login');
    Route::get('/auth/google/redirect', [GoogleAuthController::class, 'redirect'])->name('auth.google.redirect');
    Route::get('/auth/google/callback', [GoogleAuthController::class, 'callback'])->name('auth.google.callback');
    Route::middleware(['auth', 'school.member'])->get('/workspace', WorkspaceController::class)->name('workspace.dashboard');
    Route::middleware(['auth', 'school.member'])->group(function () {
        Route::get('/profile', [TeacherProfileController::class, 'edit'])->name('teacher.profile.edit');
        Route::put('/profile', [TeacherProfileController::class, 'update'])->name('teacher.profile.update');
    });
    Route::middleware(['auth', 'school.member', 'permission:lesson_plans.create'])->group(function () {
        Route::get('/rph/create', [LessonPlanController::class, 'create'])->name('rph.create');
        Route::post('/rph', [LessonPlanController::class, 'store'])->name('rph.store');
        Route::get('/rph/{lessonPlan}/edit', [LessonPlanController::class, 'edit'])->name('rph.edit');
        Route::put('/rph/{lessonPlan}', [LessonPlanController::class, 'update'])->name('rph.update');
        Route::post('/rph/{lessonPlan}/submit', [LessonPlanController::class, 'submit'])->name('rph.submit');
    });
    Route::middleware(['auth', 'school.member:school_admin,principal,vice_principal', 'permission:reports.view'])->get('/reports', SchoolReportController::class)->name('school.reports');
    Route::middleware(['auth', 'school.member:school_admin,principal,vice_principal', 'permission:school.users.manage'])->group(function () {
        Route::get('/admin', SchoolAdminController::class)->name('school.admin');
        Route::post('/admin/people', [SchoolAdminController::class, 'store'])->name('school.admin.people.store');
        Route::get('/admin/access', [SchoolAdminController::class, 'access'])->name('school.admin.access');
        Route::post('/admin/access', [SchoolAdminController::class, 'grantAccess'])->name('school.admin.access.grant');
        Route::get('/admin/settings', [SchoolSettingsController::class, 'edit'])->name('school.settings');
        Route::put('/admin/settings', [SchoolSettingsController::class, 'update'])->name('school.settings.update');
        Route::post('/admin/settings/timetable', [SchoolSettingsController::class, 'addSlot'])->name('school.settings.timetable.add');
    });
    Route::get('/', SchoolHomeController::class)->name('school.home');
});
