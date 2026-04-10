

## Plan: Clean Up Duplicate Storage Policies

### Problem
The `avatars` and `message-attachments` buckets have duplicate policies -- older ones assigned to the `public` role and newer ones correctly scoped to `authenticated`. The `message-attachments` bucket is particularly concerning since its older policies allow unauthenticated access.

### Migration

A single SQL migration that drops the old, overly-permissive policies while keeping the correct `authenticated`-scoped ones from the recent security hardening:

**Drop from avatars:**
- "Anyone can view avatars" (public role duplicate of "Avatars are publicly readable")
- "Authenticated users can upload avatars" (public role -- misleading name, actually targets public)
- "Users can update their own avatars" (public role duplicate)
- "Users can delete their own avatars" (public role duplicate)

**Drop from message-attachments:**
- "Users can upload message attachments" (public role)
- "Users can view message attachments in their conversations" (public role)

### Result
Each bucket will have only the properly scoped policies from the Phase 4 migration, all targeting `authenticated` with `auth.uid()` path checks.

