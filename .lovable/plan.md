

## Plan: Add Storage Bucket RLS Policies

### Goal
Secure file storage by adding granular RLS policies on `storage.objects` for each bucket, ensuring users can only manage their own files.

### Steps

1. **Create a migration** with storage policies for each bucket:
   - **avatars**: Users can upload/read/delete only their own avatar (path pattern: `{user_id}/*`)
   - **profile-images**: Same owner-scoped access
   - **message-attachments**: Users can upload their own; read access scoped to conversation participants

2. **Mark the storage RLS finding as resolved** in the security manager, noting that bucket-level policies enforce access control.

### Technical Details

- Policies use `auth.uid()::text` matched against the first path segment (`(storage.foldername(name))[1]`)
- Public read access on avatars/profile-images (since profile photos are typically visible)
- Insert/update/delete restricted to the file owner
- Message attachments: insert by authenticated users, select scoped to owner (conversation-scoped read can be added later)

