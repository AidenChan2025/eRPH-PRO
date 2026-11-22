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
use App\Http\Controllers\LessonPlanReviewController;
use App\Http\Controllers\OwnerController;
use App\Http\Controllers\OwnerAuditController;
use App\Http\Controllers\OwnerSupportController;
use App\Http\Controllers\SupportArticleController;
use App\Http\Controllers\SupportHomeController;
use App\Http\Controllers\SupportTicketController;
use App\Http\Controllers\SchoolSupportAccessController;
use Illuminate\Support\Facades\Route;

Route::get('/health', HealthController::class)->name('health');
Route::view('/features', 'public.features')->name('public.features');
Route::view('/about', 'public.about')->name('public.about');
Route::view('/faq', 'public.faq')->name('public.faq');
Route::get('/owner/login', [GoogleAuthController::class, 'showOwner'])->name('owner.login');
Route::get('/owner/auth/google/redirect', [GoogleAuthController::class, 'redirectOwner'])->name('owner.auth.google.redirect');
Route::get('/auth/google/callback', [GoogleAuthController::class, 'callback'])
    ->middleware(\App\Http\Middleware\PreventSensitiveResponseCaching::class)
    ->name('auth.google.callback');
Route::post('/auth/google/one-tap', [GoogleAuthController::class, 'oneTap'])->name('auth.google.one-tap')->withoutMiddleware([\App\Http\Middleware\VerifyCsrfToken::class]);
Route::middleware(['auth', 'platform.owner'])->get('/owner', OwnerController::class)->name('owner.dashboard');
Route::middleware(['auth', 'platform.owner'])->get('/owner/audit', OwnerAuditController::class)->name('owner.audit');
Route::middleware(['auth', 'platform.owner'])->prefix('owner/support')->group(function () {
    Route::get('/', [OwnerSupportController::class, 'index'])->name('owner.support.index');
    Route::get('/{publicId}', [OwnerSupportController::class, 'show'])->name('owner.support.show');
    Route::put('/{publicId}', [OwnerSupportController::class, 'update'])->name('owner.support.update');
    Route::post('/{publicId}/reply', [OwnerSupportController::class, 'reply'])->name('owner.support.reply');
});

Route::domain(config('support.host'))->middleware('support.host')->group(function () {
    Route::get('/', SupportHomeController::class)->name('support.home');
    Route::get('/solutions', SupportHomeController::class)->name('support.solutions');
    Route::get('/solutions/{slug}', [SupportArticleController::class, 'show'])->name('support.article');
    Route::middleware(\App\Http\Middleware\PreventSensitiveResponseCaching::class)->group(function () {
        Route::get('/tickets/new', [SupportTicketController::class, 'create'])->name('support.ticket.create');
        Route::middleware('throttle:5,1')->post('/tickets', [SupportTicketController::class, 'store'])->name('support.ticket.store');
        Route::get('/tickets/{publicId}', [SupportTicketController::class, 'show'])->name('support.ticket.show');
        Route::middleware('throttle:5,1')->post('/tickets/{publicId}/recovery-code', [SupportTicketController::class, 'sendRecoveryCode'])->name('support.ticket.recovery.send');
        Route::middleware('throttle:5,1')->post('/tickets/{publicId}/recovery-verify', [SupportTicketController::class, 'verifyRecoveryCode'])->name('support.ticket.recovery.verify');
        Route::middleware('throttle:10,1')->post('/tickets/{publicId}/reply', [SupportTicketController::class, 'reply'])->name('support.ticket.reply');
    });
});

Route::domain(config('app.school_base_domain', 'erphpro.com'))->middleware('school')->get('/', SchoolHomeController::class)->name('public.home');

Route::middleware('school')->group(function () {
    Route::get('/login', [GoogleAuthController::class, 'show'])->name('login');
    Route::get('/auth/google/redirect', [GoogleAuthController::class, 'redirect'])->name('auth.google.redirect');
    Route::middleware('auth')->get('/auth/google/link', [GoogleAuthController::class, 'redirectLink'])->name('auth.google.link');
    Route::middleware(['auth', 'school.member'])->get('/workspace', WorkspaceController::class)->name('workspace.dashboard');
    Route::middleware(['auth'])->post('/logout', [GoogleAuthController::class, 'logout'])->name('logout');
    Route::middleware(['auth', 'school.member'])->group(function () {
        Route::get('/account/identities', [GoogleAuthController::class, 'identities'])->name('account.identities');
        Route::delete('/account/identities/{identity}', [GoogleAuthController::class, 'unlinkIdentity'])->name('account.identities.unlink');
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
        Route::middleware('throttle:10,1')->post('/admin/support-access', [SchoolSupportAccessController::class, 'store'])->name('school.support-access.store');
        Route::post('/admin/support-access/{grant}/revoke', [SchoolAdminController::class, 'revokeSupportAccess'])->name('school.support-access.revoke');
        Route::get('/admin', SchoolAdminController::class)->name('school.admin');
        Route::post('/admin/people', [SchoolAdminController::class, 'store'])->name('school.admin.people.store');
        Route::put('/admin/people/{user}', [SchoolAdminController::class, 'updateMember'])->name('school.admin.people.update');
        Route::get('/admin/access', [SchoolAdminController::class, 'access'])->name('school.admin.access');
        Route::post('/admin/access', [SchoolAdminController::class, 'grantAccess'])->name('school.admin.access.grant');
        Route::get('/admin/settings', [SchoolSettingsController::class, 'edit'])->name('school.settings');
        Route::put('/admin/settings', [SchoolSettingsController::class, 'update'])->name('school.settings.update');
        Route::post('/admin/settings/timetable', [SchoolSettingsController::class, 'addSlot'])->name('school.settings.timetable.add');
    });
    Route::middleware(['auth', 'school.member:school_admin,principal,vice_principal', 'permission:lesson_plans.review'])->group(function () {
        Route::get('/admin/rph/{lessonPlan}/review', [LessonPlanReviewController::class, 'show'])->name('rph.review');
        Route::post('/admin/rph/{lessonPlan}/review', [LessonPlanReviewController::class, 'decide'])->name('rph.review.decide');
    });
    Route::get('/', SchoolHomeController::class)->name('school.home');
});
