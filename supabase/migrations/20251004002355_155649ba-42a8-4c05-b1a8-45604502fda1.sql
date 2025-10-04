-- Phase 1: Database Repair - Fix misassigned auto-gifting rules
-- These rules were incorrectly created with Justin as both giver and recipient
-- Correcting recipient_id to Dua Lipa's ID

UPDATE auto_gifting_rules
SET recipient_id = '54087479-29f1-4f7f-afd0-cbdc31d6fb91', -- Dua Lipa's correct ID
    updated_at = now()
WHERE id IN (
  'f9b0135c-80e7-42a0-9c84-6310ba880a69',
  '57767cd3-9d5f-44d4-9356-20d5fcff9ccd',
  'c9e2e1d3-b409-4f9c-b61a-4dc33fe67348',
  '08cf64b9-6266-4e05-8d5e-a55e7d3b9aee',
  'b014f1d6-07ca-49e7-865d-19e06dfa9e07'
);