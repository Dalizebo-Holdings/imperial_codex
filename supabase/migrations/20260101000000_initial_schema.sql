-- Imperial Codex v16 — Initial Supabase Schema
-- Migration: 20260101000000_initial_schema.sql
-- Creates all 9 tables required by the AI agent and Supabase persistence layer.

-- ============================================================
-- 1. audit_log
-- Replaces /vault/AUDIT_LOG.jsonl
-- ============================================================
CREATE TABLE IF NOT EXISTS audit_log (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         TEXT,
  resource        TEXT,
  clearance_level INTEGER,
  decision        TEXT,
  timestamp       TIMESTAMPTZ NOT NULL DEFAULT now(),
  details         JSONB
);

-- ============================================================
-- 2. loop_execution_log
-- Replaces /core/LOOP_EXECUTION_LOG.jsonl
-- ============================================================
CREATE TABLE IF NOT EXISTS loop_execution_log (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  loop_id           TEXT NOT NULL,
  triggered_at      TIMESTAMPTZ NOT NULL,
  condition_matched TEXT,
  target_slug       TEXT,
  output_action     TEXT,
  outcome           TEXT,
  triggered_by      TEXT
);

-- ============================================================
-- 3. instruments
-- Replaces /instruments/{DH-RES-YYYY-NNN}.md
-- ============================================================
CREATE TABLE IF NOT EXISTS instruments (
  id                TEXT PRIMARY KEY,  -- format: DH-RES-YYYY-NNN
  title             TEXT,
  issuing_authority TEXT,
  content           TEXT,
  generated_at      TIMESTAMPTZ NOT NULL,
  status            TEXT NOT NULL DEFAULT 'active',
  generated_by      TEXT  -- 'claude-engine' | 'template-fallback' | 'background-agent'
);

-- ============================================================
-- 4. instrument_registry
-- Replaces /instruments/registry.json
-- year is a generated column derived from generated_at
-- ============================================================
CREATE TABLE IF NOT EXISTS instrument_registry (
  id                TEXT PRIMARY KEY,  -- format: DH-RES-YYYY-NNN
  title             TEXT,
  issuing_authority TEXT,
  generated_at      TIMESTAMPTZ NOT NULL,
  status            TEXT,
  year              INTEGER GENERATED ALWAYS AS (EXTRACT(YEAR FROM generated_at)::INTEGER) STORED
);

-- ============================================================
-- 5. capital_allocations
-- Replaces /core/CAPITAL_ALLOCATIONS.json
-- ============================================================
CREATE TABLE IF NOT EXISTS capital_allocations (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  growth_pct      NUMERIC NOT NULL CHECK (growth_pct >= 0 AND growth_pct <= 100),
  operational_pct NUMERIC NOT NULL CHECK (operational_pct >= 0 AND operational_pct <= 100),
  reserve_pct     NUMERIC NOT NULL CHECK (reserve_pct >= 0 AND reserve_pct <= 100),
  approved_by     TEXT NOT NULL,
  os_module_slug  TEXT NOT NULL,
  approved_at     TIMESTAMPTZ NOT NULL,
  CONSTRAINT capital_allocations_sum_check
    CHECK (growth_pct + operational_pct + reserve_pct = 100)
);

-- ============================================================
-- 6. capital_allocation_failures
-- Replaces /core/CAPITAL_ALLOCATION_FAILURES.json
-- ============================================================
CREATE TABLE IF NOT EXISTS capital_allocation_failures (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submitted_by     TEXT,
  submitted_at     TIMESTAMPTZ NOT NULL,
  payload          JSONB NOT NULL,
  validation_errors JSONB NOT NULL
);

-- ============================================================
-- 7. vault
-- Replaces /vault/CLEARANCE_CODES.json
-- Single-row table enforced by CHECK (id = 1)
-- ============================================================
CREATE TABLE IF NOT EXISTS vault (
  id                  INTEGER PRIMARY KEY DEFAULT 1,
  encrypted_envelope  TEXT NOT NULL,
  updated_at          TIMESTAMPTZ NOT NULL,
  CONSTRAINT vault_single_row CHECK (id = 1)
);

-- Enable Row Level Security on vault BEFORE applying any policy
ALTER TABLE vault ENABLE ROW LEVEL SECURITY;

-- Service role only — no anon or authenticated access
CREATE POLICY vault_service_role_only ON vault
  USING (auth.role() = 'service_role');

-- ============================================================
-- 8. agent_conversations
-- Stores AI chat session metadata
-- ============================================================
CREATE TABLE IF NOT EXISTS agent_conversations (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    TEXT NOT NULL,
  title      TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for fast user session lookups ordered by updated_at
CREATE INDEX IF NOT EXISTS idx_agent_conversations_user_updated
  ON agent_conversations (user_id, updated_at DESC);

-- ============================================================
-- 9. agent_messages
-- Stores individual chat turns within a conversation
-- ON DELETE CASCADE ensures messages are removed with their conversation
-- ============================================================
CREATE TABLE IF NOT EXISTS agent_messages (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES agent_conversations(id) ON DELETE CASCADE,
  role            TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'tool')),
  content         TEXT NOT NULL,
  tool_calls      JSONB,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for fast message retrieval ordered by creation time
CREATE INDEX IF NOT EXISTS idx_agent_messages_conversation_created
  ON agent_messages (conversation_id, created_at ASC);
