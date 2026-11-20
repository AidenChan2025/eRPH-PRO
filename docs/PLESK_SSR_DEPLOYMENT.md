# Plesk SSR Deployment Contract

Status: preparation document; production cutover is not yet verified.

## Document root

The PHP document root must point to:

    <subscription-root>/ssr/public

It must not point to the repository root or to ssr/. Laravel source, config and vendor directories must not be directly web-accessible.

## Required server configuration

Keep these values in Plesk or server secrets, never in GitHub:

    APP_ENV=production
    APP_DEBUG=false
    APP_URL=https://erphpro.com
    APP_KEY=<generated Laravel application key>
    RELEASE_VERSION=<git commit or release label>
    SCHOOL_BASE_DOMAIN=erphpro.com
    DB_CONNECTION=mysql
    DB_HOST=<Plesk database host>
    DB_PORT=3306
    DB_DATABASE=<database name>
    DB_USERNAME=<database user>
    DB_PASSWORD=<database password>
    SESSION_DRIVER=database
    CACHE_STORE=database
    QUEUE_CONNECTION=database
    GOOGLE_CLIENT_ID=<Google OAuth client id>
    GOOGLE_CLIENT_SECRET=<Google OAuth client secret>
    GOOGLE_REDIRECT_URI=https://erphpro.com/auth/google/callback
    GOOGLE_WORKSPACE_DOMAIN=<optional Workspace domain>

## Git deployment

The Plesk Git webhook should deploy the main branch and invoke scripts/deploy-ssr.sh with:

    SSR_APP_DIR=<subscription-root>/ssr
    SSR_HEALTH_URL=https://erphpro.com/health

The hook installs locked dependencies, runs migrations, refreshes caches and fails if SQL or cache health is not good. Deployment logs must be retained and a failed deployment must not switch the document root or delete the previous release.

## First cutover order

1. Create a protected preview host and preview database.
2. Point its document root to ssr/public.
3. Configure SQL, cache, APP_KEY and Google OAuth.
4. Push a known commit and confirm the webhook.
5. Confirm /health returns status=ok, database=ok and cache=ok.
6. Verify school subdomains, unknown-subdomain rejection, Owner login and member permissions.
7. Back up the old site and database before switching the production document root.

## Unverified production gates

This contract does not claim that these have been completed: live webhook execution, production document root, public health response, Google Workspace login, SSL, wildcard subdomains and confirmation that the old Firebase/React site receives no new writes.
