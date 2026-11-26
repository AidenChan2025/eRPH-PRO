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
use App\Http\Controllers\OwnerSchoolController;
use App\Http\Controllers\OwnerTeamController;
use App\Http\Controllers\OwnerRuntimeController;
use App\Http\Controllers\OwnerAccountController;
use App\Http\Controllers\OwnerSettingsController;
use App\Http\Controllers\OwnerMfaController;
use App\Http\Controllers\SupportArticleController;
use App\Http\Controllers\SupportHomeController;
use App\Http\Controllers\SupportTicketController;
use App\Http\Controllers\SchoolSupportAccessController;
use App\Http\Controllers\SchoolAcademicDataController;
use App\Http\Controllers\SchoolInspectorController;
use App\Http\Controllers\TeacherTransferController;
use App\Http\Controllers\DskpController;
use App\Http\Controllers\LocaleController;
use App\Http\Controllers\OwnerDskpController;
use Illuminate\Support\Facades\Route;

Route::get('/health', HealthController::class)->name('health');
Route::get('/robots.txt', fn () => response("User-agent: *\nAllow: /\nDisallow: /owner\nDisallow: /workspace\nDisallow: /school-admin\n", 200, [
    'Content-Type' => 'text/plain; charset=UTF-8',
]))->name('robots');
Route::get('/css/erph-design-system.css', fn () => response()->file(resource_path('css/erph-design-system.css'), [
    'Content-Type' => 'text/css; charset=UTF-8',
    'Cache-Control' => 'public, max-age=86400',
]))->name('design-system.css');
Route::view('/features', 'public.features')->name('public.features');
Route::view('/about', 'public.about')->name('public.about');
Route::view('/faq', 'public.faq')->name('public.faq');
Route::middleware('platform.host')->group(function () {
    Route::get('/owner/login', [GoogleAuthController::class, 'showOwner'])->name('owner.login');
    Route::get('/owner/auth/google/redirect', [GoogleAuthController::class, 'redirectOwner'])->name('owner.auth.google.redirect');
});
Route::get('/auth/google/callback', [GoogleAuthController::class, 'callback'])
    ->middleware(\App\Http\Middleware\PreventSensitiveResponseCaching::class)
    ->name('auth.google.callback');
Route::post('/auth/google/one-tap', [GoogleAuthController::class, 'oneTap'])->name('auth.google.one-tap')->withoutMiddleware([\App\Http\Middleware\VerifyCsrfToken::class]);
Route::post('/billing/stripe/webhook', [\App\Http\Controllers\StripeBillingController::class, 'webhook'])
    ->middleware(['platform.host', \App\Http\Middleware\PreventSensitiveResponseCaching::class])
    ->withoutMiddleware([\App\Http\Middleware\VerifyCsrfToken::class])
    ->name('billing.stripe.webhook');
Route::middleware(['platform.host', 'platform.auth', 'platform.permission:platform.dashboard.view', \App\Http\Middleware\PreventSensitiveResponseCaching::class])->group(function () {
    Route::get('/owner/mfa/setup', [OwnerMfaController::class, 'setup'])->name('owner.mfa.setup');
    Route::middleware('throttle:5,1')->post('/owner/mfa/setup', [OwnerMfaController::class, 'confirm'])->name('owner.mfa.confirm');
    Route::get('/owner/mfa/challenge', [OwnerMfaController::class, 'challenge'])->name('owner.mfa.challenge');
    Route::middleware('throttle:5,1')->post('/owner/mfa/challenge', [OwnerMfaController::class, 'verifyChallenge'])->name('owner.mfa.challenge.verify');
    Route::get('/owner/mfa/recover', fn () => view('owner.mfa.recover'))->name('owner.mfa.recover');
    Route::middleware('throttle:5,1')->post('/owner/mfa/recover', [OwnerMfaController::class, 'recover'])->name('owner.mfa.recover.submit');
    Route::post('/owner/logout', [GoogleAuthController::class, 'logoutPlatform'])->name('owner.logout');
});
Route::middleware(['platform.host', 'platform.auth', 'platform.permission:platform.dashboard.view', 'platform.mfa'])->get('/owner', OwnerController::class)->name('owner.dashboard');
Route::middleware(['platform.host', 'platform.auth', 'platform.permission:platform.schools.view', 'platform.mfa'])->prefix('owner/schools')->group(function () {
    Route::get('/', [OwnerSchoolController::class, 'index'])->name('owner.schools.index');
});
Route::middleware(['platform.host', 'platform.auth', 'platform.permission:platform.schools.manage', 'platform.mfa'])->prefix('owner/schools')->group(function () {
    Route::get('/create', [OwnerSchoolController::class, 'create'])->name('owner.schools.create');
    Route::post('/', [OwnerSchoolController::class, 'store'])->name('owner.schools.store');
    Route::post('/{school}/invite', [OwnerSchoolController::class, 'inviteAdmin'])->name('owner.schools.invite');
    Route::post('/{school}/invitations/{user}/revoke', [OwnerSchoolController::class, 'revokeInvitation'])->name('owner.schools.invite.revoke');
    Route::post('/{school}/invitations/{user}/resend', [OwnerSchoolController::class, 'resendInvitation'])->name('owner.schools.invite.resend');
    Route::get('/{school}/edit', [OwnerSchoolController::class, 'edit'])->name('owner.schools.edit');
    Route::put('/{school}', [OwnerSchoolController::class, 'update'])->name('owner.schools.update');
    Route::post('/{school}/toggle', [OwnerSchoolController::class, 'toggle'])->name('owner.schools.toggle');
    Route::post('/{school}/archive', [OwnerSchoolController::class, 'archive'])->name('owner.schools.archive');
    Route::post('/{school}/restore', [OwnerSchoolController::class, 'restore'])->name('owner.schools.restore');
});
Route::middleware(['platform.host', 'platform.auth', 'platform.permission:platform.team.manage', 'platform.mfa'])->prefix('owner/team')->group(function () {
    Route::get('/', [OwnerTeamController::class, 'index'])->name('owner.team.index');
    Route::post('/{user}/role', [OwnerTeamController::class, 'updateRole'])->name('owner.team.role');
    Route::post('/{user}/reset-mfa', [OwnerTeamController::class, 'resetMfa'])->name('owner.team.reset-mfa');
});
Route::middleware(['platform.host', 'platform.auth', 'platform.permission:platform.audit.view', 'platform.mfa'])->get('/owner/audit', OwnerAuditController::class)->name('owner.audit');
Route::middleware(['platform.host', 'platform.auth', 'platform.permission:platform.runtime.view', 'platform.mfa'])->get('/owner/runtime', OwnerRuntimeController::class)->name('owner.runtime');
Route::middleware(['platform.host', 'platform.auth', 'platform.permission:platform.accounts.manage', 'platform.mfa'])->prefix('owner/accounts')->group(function () {
    Route::get('/', [OwnerAccountController::class, 'index'])->name('owner.accounts.index');
    Route::post('/{user}/assign', [OwnerAccountController::class, 'assign'])->name('owner.accounts.assign');
});
Route::middleware(['platform.host', 'platform.auth', 'platform.permission:platform.settings.manage', 'platform.mfa'])->get('/owner/settings', OwnerSettingsController::class)->name('owner.settings');
Route::middleware(['platform.host', 'platform.auth', 'platform.permission:platform.settings.manage', 'platform.mfa', \App\Http\Middleware\PreventSensitiveResponseCaching::class])->group(function () {
    Route::get('/owner/billing', [\App\Http\Controllers\OwnerBillingController::class, 'index'])->name('owner.billing');
    Route::put('/owner/billing/{school}', [\App\Http\Controllers\OwnerBillingController::class, 'update'])->name('owner.billing.update');
    Route::post('/owner/dskp', [OwnerDskpController::class, 'store'])->name('owner.dskp.store');
});
Route::middleware(['platform.host', 'platform.auth', 'platform.permission:platform.support.view', 'platform.mfa'])->prefix('owner/support')->group(function () {
    Route::get('/', [OwnerSupportController::class, 'index'])->name('owner.support.index');
    Route::get('/{publicId}', [OwnerSupportController::class, 'show'])->name('owner.support.show');
    Route::middleware('platform.permission:platform.support.write')->group(function () {
        Route::put('/{publicId}', [OwnerSupportController::class, 'update'])->name('owner.support.update');
        Route::post('/{publicId}/reply', [OwnerSupportController::class, 'reply'])->name('owner.support.reply');
    });
});

Route::domain(config('support.host'))->middleware('support.host')->group(function () {
    Route::middleware('throttle:30,1')->post('/locale', [LocaleController::class, 'update'])->name('locale.switch.support');
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
    Route::middleware('throttle:30,1')->post('/locale', [LocaleController::class, 'update'])->name('locale.switch');
    Route::get('/login', [GoogleAuthController::class, 'show'])->name('login');
    Route::get('/auth/google/redirect', [GoogleAuthController::class, 'redirect'])->name('auth.google.redirect');
    Route::get('/auth/google/complete', [GoogleAuthController::class, 'complete'])->name('auth.google.complete');
    Route::middleware('auth')->get('/auth/google/link', [GoogleAuthController::class, 'redirectLink'])->name('auth.google.link');
    Route::middleware(['auth', 'school.member'])->group(function () {
        Route::get('/workspace', WorkspaceController::class)->name('workspace.dashboard');
        Route::get('/workspace/maklumat-am', [WorkspaceController::class, 'maklumatAm'])->name('workspace.maklumat-am');
        Route::get('/teacher/rph/export', [TeacherTransferController::class, 'export'])->name('teacher.rph.export');
    });
    Route::middleware(['auth'])->post('/logout', [GoogleAuthController::class, 'logout'])->name('logout');
    Route::middleware(['auth', 'school.member'])->group(function () {
        Route::get('/dskp', [DskpController::class, 'index'])->name('dskp.index');
        Route::get('/account/identities', [GoogleAuthController::class, 'identities'])->name('account.identities');
        Route::delete('/account/identities/{identity}', [GoogleAuthController::class, 'unlinkIdentity'])->name('account.identities.unlink');
        Route::get('/profile', [TeacherProfileController::class, 'edit'])->name('teacher.profile.edit');
        Route::put('/profile', [TeacherProfileController::class, 'update'])->name('teacher.profile.update');
    });
    Route::middleware(['auth', 'school.member', 'permission:lesson_plans.create'])->group(function () {
        Route::get('/rph/create', [LessonPlanController::class, 'create'])->name('rph.create');
        Route::post('/rph', [LessonPlanController::class, 'store'])->name('rph.store');
        Route::post('/workspace/lesson-plans/ai-generate', [\App\Http\Controllers\LessonPlanAiController::class, 'generate'])->name('lesson-plans.ai-generate');
        Route::get('/rph/{lessonPlan}/edit', [LessonPlanController::class, 'edit'])->name('rph.edit');
        Route::put('/rph/{lessonPlan}', [LessonPlanController::class, 'update'])->name('rph.update');
        Route::post('/rph/{lessonPlan}/submit', [LessonPlanController::class, 'submit'])->name('rph.submit');
    });
    Route::middleware(['auth', 'school.member', \App\Http\Middleware\PreventSensitiveResponseCaching::class])->get('/rph/{lessonPlan}/print', [LessonPlanController::class, 'print'])->name('rph.print');
    Route::middleware(['auth', 'school.member:school_admin,principal,vice_principal', 'permission:reports.view'])->get('/reports', SchoolReportController::class)->name('school.reports');
    Route::middleware(['auth', 'school.member:school_admin,principal,vice_principal', 'permission:reports.view', \App\Http\Middleware\PreventSensitiveResponseCaching::class])->get('/reports/export', [SchoolReportController::class, 'export'])->name('school.reports.export');
    Route::middleware(['auth', 'school.member:school_admin,principal,vice_principal', 'permission:school.users.manage'])->group(function () {
        Route::middleware('throttle:10,1')->post('/admin/support-access', [SchoolSupportAccessController::class, 'store'])->name('school.support-access.store');
        Route::post('/admin/support-access/{grant}/revoke', [SchoolAdminController::class, 'revokeSupportAccess'])->name('school.support-access.revoke');
        Route::get('/admin', SchoolAdminController::class)->name('school.admin');
        Route::get('/admin/academic-data', [SchoolAcademicDataController::class, 'index'])->name('school.academic-data');
        Route::post('/admin/academic-years', [SchoolAcademicDataController::class, 'storeYear'])->name('school.academic-years.store');
        Route::post('/admin/academic-years/{academicYear}/activate', [SchoolAcademicDataController::class, 'activateYear'])->name('school.academic-years.activate');
        Route::post('/admin/academic-years/{academicYear}/archive', [SchoolAcademicDataController::class, 'archiveYear'])->name('school.academic-years.archive');
        Route::post('/admin/academic-years/copy-classes', [SchoolAcademicDataController::class, 'copyClasses'])->name('school.academic-years.copy-classes');
        Route::post('/admin/academic-years/copy-assignments', [SchoolAcademicDataController::class, 'copyAssignments'])->name('school.academic-years.copy-assignments');
        Route::post('/admin/classes', [SchoolAcademicDataController::class, 'storeClass'])->name('school.classes.store');
        Route::put('/admin/classes/{schoolClass}', [SchoolAcademicDataController::class, 'updateClass'])->name('school.classes.update');
        Route::post('/admin/teacher-assignments', [SchoolAcademicDataController::class, 'storeAssignment'])->name('school.teacher-assignments.store');
        Route::post('/admin/teacher-assignments/{assignment}/remove', [SchoolAcademicDataController::class, 'removeAssignment'])->name('school.teacher-assignments.remove');
        Route::put('/admin/teacher-assignments/{assignment}/transfer', [SchoolAcademicDataController::class, 'transferAssignment'])->name('school.teacher-assignments.transfer');
        Route::put('/admin/teachers/{teacherProfile}/transfer', [TeacherTransferController::class, 'transfer'])->name('school.teachers.transfer');
        Route::post('/admin/people', [SchoolAdminController::class, 'store'])->name('school.admin.people.store');
        Route::put('/admin/people/{user}', [SchoolAdminController::class, 'updateMember'])->name('school.admin.people.update');
        Route::get('/admin/access', [SchoolAdminController::class, 'access'])->name('school.admin.access');
        Route::post('/admin/access', [SchoolAdminController::class, 'grantAccess'])->name('school.admin.access.grant');
        Route::get('/admin/settings', [SchoolSettingsController::class, 'edit'])->name('school.settings');
        Route::put('/admin/settings', [SchoolSettingsController::class, 'update'])->name('school.settings.update');
        Route::post('/admin/settings/timetable', [SchoolSettingsController::class, 'addSlot'])->name('school.settings.timetable.add');
        Route::middleware(\App\Http\Middleware\PreventSensitiveResponseCaching::class)->group(function () {
            Route::get('/admin/billing', [\App\Http\Controllers\SchoolBillingController::class, 'index'])->name('school.billing');
            Route::middleware('throttle:10,1')->post('/admin/billing/checkout', [\App\Http\Controllers\SchoolBillingController::class, 'checkout'])->name('school.billing.checkout');
        });
    });
    Route::middleware(['auth', 'school.member:school_admin,principal,vice_principal', 'permission:lesson_plans.review'])->group(function () {
        Route::get('/admin/rph/{lessonPlan}/review', [LessonPlanReviewController::class, 'show'])->name('rph.review');
        Route::post('/admin/rph/{lessonPlan}/review', [LessonPlanReviewController::class, 'decide'])->name('rph.review.decide');
    Route::post('/admin/rph/{lessonPlan}/archive', [LessonPlanReviewController::class, 'archive'])->name('rph.review.archive');
    });
    Route::middleware(['auth', 'school.member:school_admin,principal,vice_principal,inspector', 'permission:reports.view'])->get('/school-admin/inspector-view', SchoolInspectorController::class)->name('school.inspector-view');
    Route::get('/', SchoolHomeController::class)->name('school.home');
});
