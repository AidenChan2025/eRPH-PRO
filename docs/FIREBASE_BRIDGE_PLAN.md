# Firebase disposition

## Decision: do not connect Firebase

The new eRPH Pro system will not connect to Firebase. This decision supersedes the earlier bridge proposal. Laravel SSR + MySQL/MariaDB is the sole production architecture.

The old Firebase application is retained only as a read-only historical reference while the new SQL system is built. No Firebase Admin credentials should be requested, stored or deployed for this project.

The remaining sections explain why the old bridge was rejected and what is explicitly out of scope.

## Current finding

The existing React/Vite application uses Firebase Web SDK for Google/email authentication and Firestore. Its connection is environment-driven through `VITE_FIREBASE_*` variables; no Firebase Admin credential is committed in this repository.

## Rejected migration boundary

The following is not being implemented:

```text
existing Firebase Auth / Firestore
          │ one-time controlled import
          ▼
Laravel import service → MySQL/MariaDB
          │
          └── Laravel SSR is the only production write path
```

It is replaced by direct entry/import into the new SQL schema after the school administrator approves the fields. There will be no automatic Firebase-to-SQL migration job.

## Out of scope

- Firebase Auth
- Firestore
- Firebase Storage
- Firebase Admin SDK
- Firebase-to-SQL dual writes
- automatic Firebase data import

## Replacement data entry path

Existing official data will be entered through SQL-backed administrator screens or a reviewed CSV/Google Sheet import tool that writes directly to the new schema. The web config and old collection names are not part of the new system contract.

The first migration targets should be users, teacher profile fields, RPH records, DSKP/reference data and approval-related records. Firebase documents for future modules should remain untouched until their SQL schema exists.

## Cost and operational decision

Removing Firebase entirely is cheaper and simpler for the target Plesk environment. It keeps tenant boundaries, audit logs, exports and future student/discipline modules under one SQL authorization model.
