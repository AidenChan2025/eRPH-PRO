# eRPH Pro

eRPH Pro is being rebuilt as a PHP SSR, SQL-backed, multi-school education platform.

## Current application

The active application is the Laravel SSR project in the ssr/ directory.

- Laravel 12 + Blade SSR
- PHP 8.3 target
- MySQL/MariaDB for production
- Google Workspace authentication
- School subdomain tenant isolation
- School roles, teacher profiles and RPH workflow
- Audit logs, reports and school-specific timetable settings

Development and deployment planning is documented in DEVELOPMENT_PLAN.md. The Plesk deployment contract is in docs/PLESK_SSR_DEPLOYMENT.md.

Run the SSR application locally:

    cd ssr
    composer install
    cp .env.example .env
    php artisan key:generate
    php artisan migrate --seed
    php artisan serve

Run the test suite:

    cd ssr
    php artisan test

## Legacy prototype

The root React/Vite/Firebase code is retained only as a historical reference for the old format and unfinished prototype. It is not the production architecture and is not connected to the new SQL application.

Netlify has been unlinked. New deployment work belongs to the Laravel SSR application on Plesk; do not add new Firebase or Netlify features to the legacy root prototype.
