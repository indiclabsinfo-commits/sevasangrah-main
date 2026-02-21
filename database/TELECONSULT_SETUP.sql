-- =====================================================
-- TELECONSULT LINK SUPPORT - SQL SETUP
-- =====================================================
-- Adds consultation_mode and join_url columns to
-- future_appointments and opd_queue tables.
--
-- consultation_mode values: 'physical', 'google_meet', 'zoom', 'whatsapp'
-- join_url: The meeting link (Google Meet URL, Zoom URL, or wa.me link)
--
-- Run this in Supabase SQL Editor.
-- =====================================================

-- Add teleconsult columns to future_appointments
ALTER TABLE future_appointments
  ADD COLUMN IF NOT EXISTS consultation_mode TEXT DEFAULT 'physical',
  ADD COLUMN IF NOT EXISTS join_url TEXT;

-- Add teleconsult columns to opd_queue
ALTER TABLE opd_queue
  ADD COLUMN IF NOT EXISTS consultation_mode TEXT DEFAULT 'physical',
  ADD COLUMN IF NOT EXISTS join_url TEXT;

-- Create indexes for filtering teleconsult appointments
CREATE INDEX IF NOT EXISTS idx_future_appointments_consultation_mode
  ON future_appointments(consultation_mode);

CREATE INDEX IF NOT EXISTS idx_opd_queue_consultation_mode
  ON opd_queue(consultation_mode);
