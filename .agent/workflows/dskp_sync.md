---
description: Manual DSKP Sync process
---

# DSKP Manual Link & Sync

The DSKP (Dokumen Standard Kurikulum dan Pentaksiran) registry in eRPH Pro is maintained via a master Google Sheet. This allows for centralized content updates without changing code.

## Prerequisites
- **Role**: Super Admin
- **Google Sheet**: Must be "Anyone with link can view"
- **Data Structure**: The sheet must match the CSV format (School Type, Subject, Grade, Content Standard, Learning Standard, etc.)

## Steps

1. **Access DSKP Manager**
   - Navigate to **Admin Portal** > **DSKP Management**.
   - Verify that you are in "Firebase Mode" (System Status: **Online**).

2. **Initiate Sync**
   - Click the **Map & Sync Registry** button.
   - **Step 1: Connect**: Paste the Google Sheet URL.
     - Default Master Sheet: `https://docs.google.com/spreadsheets/d/1mW401zSgjPLjtahPCaeiLFpv3Zpk3AL-2Dgc6s5sDAA/edit?usp=sharing`
   - **Step 2: Map**: Confirm the column mappings match the system fields.
   - **Step 3: Sync**: Click **Sync Now**.

3. **Monitor Progress**
   - The system will process records in chunks of 400.
   - Wait for the "✅ Sync Successful" message.
   - Duration: ~10-20 seconds for 2000 records.

4. **Verify**
   - The "Last Synced" badge in the DSKP Manager header will update.
   - Check the **Sync History** logs in Firestore if needed (`dskp_sync_logs` collection).

## Troubleshooting
- **Quota Exceeded**: This occurs if you are in "Mock Mode" (LocalStorage). Enforce Firebase usage.
- **Network Error**: Check internet connection. The sync is resume-able (append mode), but "Replace" is recommended for cleaner data.
