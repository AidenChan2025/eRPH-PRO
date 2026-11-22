<?php

return [
    'host' => env('SUPPORT_HOST', 'support.erphpro.com'),
    'admin_email' => env('SUPPORT_ADMIN_EMAIL', 'admin@erphpro.com'),
    'ai_enabled' => filter_var(env('SUPPORT_AI_ANALYSIS_ENABLED', false), FILTER_VALIDATE_BOOL)
        && ! in_array(strtolower((string) env('DEEPSEEK_API_KEY', '')), ['', 'null'], true),
    'ai_min_confidence' => (float) env('SUPPORT_AI_MIN_CONFIDENCE', 0.86),
];
