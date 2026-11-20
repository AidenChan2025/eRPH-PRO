# Plesk SSR Deployment Contract

Status: preparation document; production cutover is not yet verified.

Current evidence (2026-11-21): `https://erphpro.com/health` still returns the legacy React/Firebase HTML document with `content-type: text/html`; it does not yet return the Laravel JSON health contract. Do not treat a successful GitHub Actions run as a production deployment.

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
    SESSION_DOMAIN=.erphpro.com
    GOOGLE_CLIENT_ID=<Google OAuth client id>
    GOOGLE_CLIENT_SECRET=<Google OAuth client secret>
    GOOGLE_REDIRECT_URI=https://erphpro.com/auth/google/callback
    GOOGLE_WORKSPACE_DOMAIN=<optional Workspace domain>

The session domain must cover the base domain and school subdomains so the single OAuth callback can restore the school selected before Google sign-in.

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

## Plesk operator checklist

On the subscription's **Hosting & DNS > Hosting** page, set **Document root** to the absolute path ending in `/ssr/public`, then save. Do not use `/ssr` or the repository checkout root. On **PHP Settings**, select PHP 8.3 or newer and confirm the required extensions from `scripts/deploy-ssr.sh`. On **Environment variables**, add the production values above without committing secrets. On **Git > Repository**, pull the `main` branch and run the deployment hook; retain the deployment output.

After the hook completes, verify these exact responses from outside the server:

| Check | Expected evidence |
| --- | --- |
| `GET /health` | HTTP 200, JSON, `status=ok`, `database=ok`, `cache=ok` |
| `GET /` | Laravel school landing page or controlled base-domain response, never the old React shell |
| known school host | School-specific landing page and `/login` |
| unknown school host | HTTP 404 / school-not-found response |
| OAuth callback | Exact URI `https://erphpro.com/auth/google/callback` configured in Google Cloud |

If `/health` returns HTML, stop the cutover and inspect the document root, rewrite rules and the active Plesk hosting subscription; do not debug Laravel application code against that response.

## Unverified production gates

This contract does not claim that these have been completed: live webhook execution, production document root, public health response, Google Workspace login, SSL, wildcard subdomains and confirmation that the old Firebase/React site receives no new writes.
