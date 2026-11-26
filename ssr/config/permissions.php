<?php

return [
    'platform_modules' => [
        'overview' => ['platform.dashboard.view'],
        'schools' => ['platform.schools.view'],
        'platform_team' => ['platform.team.manage'],
        'account_assignment' => ['platform.accounts.manage'],
        'security_audit' => ['platform.audit.view'],
        'runtime_health' => ['platform.runtime.view'],
    ],
    'platform_roles' => [
        'owner' => [
            'platform.dashboard.view',
            'platform.schools.view',
            'platform.schools.manage',
            'platform.team.manage',
            'platform.accounts.manage',
            'platform.audit.view',
            'platform.support.view',
            'platform.support.write',
            'platform.runtime.view',
            'platform.settings.manage',
        ],
        'security' => [
            'platform.dashboard.view',
            'platform.schools.view',
            'platform.audit.view',
            'platform.runtime.view',
        ],
        'support' => [
            'platform.dashboard.view',
            'platform.schools.view',
            'platform.support.view',
        ],
        'operations' => [
            'platform.dashboard.view',
            'platform.schools.view',
            'platform.runtime.view',
        ],
        'content' => [
            'platform.dashboard.view',
        ],
    ],
    'roles' => [
        'teacher' => [
            'teacher.records.view_own',
            'lesson_plans.create',
            'lesson_plans.submit_own',
        ],
        'school_admin' => [
            'lesson_plans.create',
            'teacher.records.view',
            'teacher.records.manage',
            'school.users.manage',
            'lesson_plans.review',
            'reports.view',
            'reports.export',
        ],
        'principal' => [
            'lesson_plans.create',
            'teacher.records.view',
            'teacher.records.manage',
            'school.users.manage',
            'lesson_plans.review',
            'reports.view',
            'reports.export',
            'support.access.approve',
        ],
        'vice_principal' => [
            'lesson_plans.create',
            'teacher.records.view',
            'teacher.records.manage',
            'lesson_plans.review',
            'reports.view',
            'reports.export',
        ],
        'inspector' => [
            'teacher.records.view',
            'lesson_plans.review',
            'reports.view',
        ],
    ],
];
