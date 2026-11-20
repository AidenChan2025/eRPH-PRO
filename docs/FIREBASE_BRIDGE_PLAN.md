# Firebase bridge plan

## Current finding

The existing React/Vite application uses Firebase Web SDK for Google/email authentication and Firestore. Its connection is environment-driven through `VITE_FIREBASE_*` variables; no Firebase Admin credential is committed in this repository.

## Recommended migration boundary

Firebase remains the read-only migration source while the Laravel SSR application becomes the system of record:

```text
existing Firebase Auth / Firestore
          │ one-time controlled import
          ▼
Laravel import service → MySQL/MariaDB
          │
          └── Laravel SSR is the only production write path
```

Do not run permanent Firebase + SQL dual writes. That creates conflicting ownership, duplicate audit trails and difficult school-level deletion/export behavior.

## Safe connection method

1. Put the Firebase project ID and service-account JSON in Plesk environment/secrets, never GitHub.
2. Use a server-side Firebase Admin adapter only for a controlled import command.
3. Map Firebase user IDs to `users.google_subject` and preserve the original Firebase UID in migration metadata.
4. Import school-scoped Firestore documents only after a collection-to-table mapping and a backup.
5. Run a dry-run report first: document counts, unmapped fields, duplicate identities and school ownership gaps.
6. Freeze or make the old Firebase application read-only during the final cutover.

## Data mapping still required

The old project needs its actual Firebase project ID and collection inventory from Firebase Console before any import is run. The web config alone is not enough to prove Firestore permissions or collection names.

The first migration targets should be users, teacher profile fields, RPH records, DSKP/reference data and approval-related records. Firebase documents for future modules should remain untouched until their SQL schema exists.

## Cost and operational decision

The bridge is cheaper and safer than keeping Firebase as a second production database. It also keeps the new school tenant boundary, audit log, exports and future student/discipline modules under one SQL authorization model.
