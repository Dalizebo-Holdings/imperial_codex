/**
 * Supabase database row types for Imperial Codex AI Agent.
 * These interfaces mirror the PostgreSQL column definitions exactly.
 */

// audit_log
export interface AuditLogRow {
  id: string; // UUID
  user_id: string | null;
  resource: string | null;
  clearance_level: number | null;
  decision: string | null; // 'granted' | 'denied'
  timestamp: string; // timestamptz → ISO 8601
  details: Record<string, unknown> | null; // jsonb
}

// loop_execution_log
export interface LoopExecutionLogRow {
  id: string; // UUID
  loop_id: string;
  triggered_at: string; // timestamptz → ISO 8601
  condition_matched: string | null;
  target_slug: string | null;
  output_action: string | null;
  outcome: string | null;
  triggered_by: string | null; // 'user' | 'background-agent' | 'background-agent-skipped'
}

// instruments
export interface InstrumentRow {
  id: string; // DH-RES-YYYY-NNN
  title: string | null;
  issuing_authority: string | null;
  content: string | null;
  generated_at: string; // timestamptz → ISO 8601
  status: string; // 'active' | 'archived'
  generated_by: string | null; // 'claude-engine' | 'template-fallback' | 'background-agent'
}

// instrument_registry
export interface InstrumentRegistryRow {
  id: string; // DH-RES-YYYY-NNN
  title: string | null;
  issuing_authority: string | null;
  generated_at: string; // timestamptz → ISO 8601
  status: string | null;
  year: number; // generated always as EXTRACT(YEAR FROM generated_at) stored
}

// capital_allocations
export interface CapitalAllocationRow {
  id: string; // UUID
  growth_pct: number;
  operational_pct: number;
  reserve_pct: number;
  approved_by: string;
  os_module_slug: string;
  approved_at: string; // timestamptz → ISO 8601
}

// capital_allocation_failures
export interface CapitalAllocationFailureRow {
  id: string; // UUID
  submitted_by: string | null;
  submitted_at: string; // timestamptz → ISO 8601
  payload: Record<string, unknown>; // jsonb
  validation_errors: Record<string, unknown>; // jsonb
}

// vault (single-row table, id always = 1)
export interface VaultRow {
  id: 1;
  encrypted_envelope: string; // base64 AES-256-GCM envelope
  updated_at: string; // timestamptz → ISO 8601
}

// agent_conversations
export interface AgentConversation {
  id: string; // UUID
  user_id: string;
  title: string | null;
  created_at: string; // timestamptz → ISO 8601
  updated_at: string; // timestamptz → ISO 8601
}

// agent_messages
export interface AgentMessage {
  id: string; // UUID
  conversation_id: string; // UUID → agent_conversations.id
  role: 'user' | 'assistant' | 'tool';
  content: string;
  tool_calls: Record<string, unknown> | null; // jsonb
  created_at: string; // timestamptz → ISO 8601
}
