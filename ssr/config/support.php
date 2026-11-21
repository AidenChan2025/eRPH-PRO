<?php

return [
    'host' => env('SUPPORT_HOST', 'support.erphpro.com'),
    'admin_email' => env('SUPPORT_ADMIN_EMAIL', 'admin@erphpro.com'),
    'ai_enabled' => (bool) env('DEEPSEEK_API_KEY'),
    'ai_auto_reply' => filter_var(env('SUPPORT_AI_AUTO_REPLY', false), FILTER_VALIDATE_BOOL),
    'ai_min_confidence' => (float) env('SUPPORT_AI_MIN_CONFIDENCE', 0.86),
];
