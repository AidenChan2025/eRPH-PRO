<?php

return [
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
