/**
 * PROVENIQ ORIGINS — Season 20 OMG Interview Engine
 * TypeScript Schema Pack v3.0
 * 
 * Canonical types for the dual-loop runtime:
 * - Fast Loop: Ori (host)
 * - Slow Loop: Control Room (Director, Research, Pattern, Reveal, S&P)
 */

import { z } from 'zod';

// =============================================================================
// 4.1 HOST MOVE REGISTRY (FINITE, LOCKED)
// =============================================================================

export const HostMoveSchema = z.enum([
    'PIN_TO_SPECIFICS',      // Demand concrete detail from vague statement
    'MIRROR_LANGUAGE',       // Repeat user's exact words back
    'NAME_THE_SHIFT',        // Observe change in speech pattern (not label person)
    'STATE_AND_STOP',        // Non-question statement + deliberate silence
    'OFFER_FORK',            // "Stay here or step sideways?"
    'RETURN_TO_OPEN_LOOP',   // Delayed callback to earlier thread
    'BRIDGE_THREAD',         // Connect two distant moments
    'LIGHT_PRESS',           // Single follow-up only (no recursion)
    'UTILITARIAN_CHECK',     // "How's that working?" (no shaming)
    'PATTERN_PAUSE',         // Name pattern then stop
    'EARNED_REVEAL',         // Execute approved reveal plan
    'COMMERCIAL_BREAK',      // Synthesis modal trigger
    'WRAP',                  // Recap + consent for follow-ups
    'SILENCE',               // Deliberate pause with minimal continuer
    'SAFETY_GROUND',         // Safety escalation response
]);

export type HostMove = z.infer<typeof HostMoveSchema>;

// =============================================================================
// 4.4 PATTERN SIGNAL (NON-CLINICAL, OBSERVABLE)
// =============================================================================

export const PatternKindSchema = z.enum([
    'minimization_language',        // "not a big deal", "just", "only"
    'absolutist_language',          // "always", "never", "everyone"
    'agency_shift_active_to_passive', // "I hit" -> "it happened"
    'actor_omission',               // Missing subject in sentences
    'chronology_skip',              // Jumping over time periods
    'humor_deflection',             // Jokes to avoid depth
    'over_precision_in_safe_topics', // Excessive detail on irrelevant
    'brevity_spike',                // Sudden short answers
    'repetition_loop',              // Same phrase repeated
    'inevitability_language',       // "had no choice", "forced to"
    'shame_cue',                    // "I deserved it", "my fault"
    'freeze_cue',                   // "I froze", "couldn't move"
]);

export type PatternKind = z.infer<typeof PatternKindSchema>;

export const PatternSignalSchema = z.object({
    kind: PatternKindSchema,
    evidence_turn_ids: z.array(z.string()),
    confidence_0_1: z.number().min(0).max(1),
    cost_hint: z.string().optional(),
    first_seen_turn: z.number(),
    last_seen_turn: z.number(),
    occurrence_count: z.number(),
});

export type PatternSignal = z.infer<typeof PatternSignalSchema>;

// =============================================================================
// 4.6 RECEIPT CARD / JUMBOTRON CUE
// =============================================================================

export const ReceiptCardTypeSchema = z.enum([
    'quote',        // doc ref + excerpt + highlight spans
    'timeline_snap', // date range + event + gap flag
    'photo',        // url + caption + tag
    'missing_tape', // gap start/end + description
]);

export const ReceiptCardSchema = z.object({
    type: ReceiptCardTypeSchema,
    // Quote fields
    doc_ref: z.string().optional(),
    excerpt: z.string().optional(),
    highlight_spans: z.array(z.object({ start: z.number(), end: z.number() })).optional(),
    // Timeline fields
    date_start: z.string().optional(),
    date_end: z.string().optional(),
    event_description: z.string().optional(),
    is_gap: z.boolean().optional(),
    // Photo fields
    url: z.string().optional(),
    caption: z.string().optional(),
    tag: z.string().optional(),
    // Missing tape fields
    gap_description: z.string().optional(),
});

export type ReceiptCard = z.infer<typeof ReceiptCardSchema>;

export const JumbotronTriggerTimingSchema = z.enum([
    'before_speech',
    'during_speech',
    'after_speech',
]);

export const JumbotronCueSchema = z.object({
    trigger_timing: JumbotronTriggerTimingSchema,
    payload: ReceiptCardSchema,
});

export type JumbotronCue = z.infer<typeof JumbotronCueSchema>;

// =============================================================================
// 4.5 REVEAL PLAN (TEASE → PERMISSION → REVEAL → INTEGRATE)
// =============================================================================

export const RevealPlanSchema = z.object({
    id: z.string(),
    tease_line: z.string(),  // Ori can say without showing anything
    permission_gate: z.object({
        required: z.boolean(),
        ask_copy: z.string(),
    }),
    trigger: z.string(),  // What user confirmation unlocks this
    payload: ReceiptCardSchema,
    integration_prompt: z.string(),  // What Ori asks after reveal
    vetoable: z.literal(true),  // S&P may always block
    status: z.enum(['pending', 'teased', 'permission_granted', 'revealed', 'vetoed', 'declined']),
});

export type RevealPlan = z.infer<typeof RevealPlanSchema>;

// =============================================================================
// 4.2 EARPIECE FEED (Control Room → Ori)
// =============================================================================

export const PostureSchema = z.enum([
    'lean_in',
    'lean_back',
    'silence',
    'confront_soft',
    'confront_firm',
]);

export const ToneSchema = z.enum([
    'warm_authority',
    'gentle_curiosity',
    'skeptical_precision',
]);

export const RiskLevelSchema = z.enum(['low', 'elevated', 'critical']);

export const SafetyModeSchema = z.enum(['normal', 'cautious', 'stop_and_ground']);

export const StatusSchema = z.enum(['live', 'commercial_break', 'wrap']);

export const EarpieceFeedSchema = z.object({
    status: StatusSchema,
    act: z.string(),  // Theme-driven, not generic
    move: HostMoveSchema,
    posture: PostureSchema,
    tone: ToneSchema,
    instruction: z.string(),  // Single actionable line
    alternates: z.array(z.object({
        move: HostMoveSchema,
        instruction: z.string(),
    })).max(2),
    pressure_caps: z.object({
        max_followups_on_topic: z.number(),
        recursion_limit: z.number(),
    }),
    guardrails: z.object({
        forbidden_initiations: z.array(z.string()),
        permission_required_topics: z.array(z.string()),
        risk_level: RiskLevelSchema,
        safety_mode: SafetyModeSchema,
    }),
    pattern_state: z.object({
        detected: z.array(PatternSignalSchema),
        disclosure_allowed: z.boolean(),
        disclosure_reason: z.string().optional(),
    }),
    inevitability: z.object({
        score: z.number().min(0).max(1),
        rationale: z.string(),
        threshold_for_reveal: z.number(),
    }),
    reveal_plan: RevealPlanSchema.nullable().optional(),
    jumbotron_cue: JumbotronCueSchema.nullable().optional(),
});

export type EarpieceFeed = z.infer<typeof EarpieceFeedSchema>;

// =============================================================================
// 4.3 EPISODE STATE (Control Room Memory)
// =============================================================================

export const CharacterSchema = z.object({
    id: z.string(),
    name: z.string(),
    relationship: z.string().optional(),
    mentions: z.array(z.object({
        turn_id: z.string(),
        context: z.string(),
    })),
});

export const PlaceSchema = z.object({
    id: z.string(),
    name: z.string(),
    significance: z.string().optional(),
    mentions: z.array(z.string()),  // turn_ids
});

export const MomentSchema = z.object({
    id: z.string(),
    description: z.string(),
    date: z.string().optional(),
    emotional_weight: z.number().min(0).max(1),
    turn_ids: z.array(z.string()),
});

export const StoryMapSchema = z.object({
    characters: z.array(CharacterSchema),
    places: z.array(PlaceSchema),
    moments: z.array(MomentSchema),
});

export const TimelineEventSchema = z.object({
    id: z.string(),
    date: z.string(),
    description: z.string(),
    evidence_refs: z.array(z.string()),  // doc ids, turn ids
    confidence: z.enum(['confirmed', 'stated', 'inferred']),
});

export const OpenLoopSchema = z.object({
    id: z.string(),
    topic: z.string(),
    opened_at_turn: z.number(),
    priority: z.number().min(1).max(10),
    status: z.enum(['open', 'partially_addressed', 'closed']),
    related_patterns: z.array(PatternKindSchema),
});

export const EchoPhraseSchema = z.object({
    id: z.string(),
    phrase: z.string(),
    turn_id: z.string(),
    category: z.enum(['minimizer', 'inevitability', 'shame', 'agency', 'freeze']),
    eligible_after_act: z.number(),
    eligible_after_turn: z.number(),
    used: z.boolean(),
});

export const ClaimSchema = z.object({
    id: z.string(),
    statement: z.string(),
    turn_id: z.string(),
    support_level: z.enum(['supported', 'unsupported', 'unclear', 'contradicted']),
    evidence_refs: z.array(z.string()),
});

export const ContradictionSchema = z.object({
    id: z.string(),
    claim_a_id: z.string(),
    claim_b_id: z.string(),
    type: z.enum(['user_vs_user', 'user_vs_docs']),
    severity: z.enum(['minor', 'significant', 'major']),
    addressed: z.boolean(),
});

export const EpisodeMetricsSchema = z.object({
    question_density: z.number(),
    silence_utilization: z.number(),
    callback_rate: z.number(),
    earned_reveal_rate: z.number(),
    pressure_violations: z.number(),
    current_act: z.number(),
    current_turn: z.number(),
});

export const EpisodeStateSchema = z.object({
    session_id: z.string(),
    user_id: z.string(),
    story_map: StoryMapSchema,
    timeline: z.array(TimelineEventSchema),
    open_loops: z.array(OpenLoopSchema),
    echo_phrases: z.array(EchoPhraseSchema),
    claims_ledger: z.array(ClaimSchema),
    contradiction_index: z.array(ContradictionSchema),
    metrics: EpisodeMetricsSchema,
    pattern_signals: z.array(PatternSignalSchema),
    reveal_plans: z.array(RevealPlanSchema),
    safety_incidents: z.array(z.object({
        turn_id: z.string(),
        type: z.string(),
        response: z.string(),
    })),
});

export type EpisodeState = z.infer<typeof EpisodeStateSchema>;

// =============================================================================
// SAFETY SIGNALS (Deterministic Detection)
// =============================================================================

export const SafetySignalTypeSchema = z.enum([
    'imminent_self_harm',
    'imminent_harm_to_others',
    'child_exploitation_disclosure',
    'acute_crisis',
]);

export const SafetySignalSchema = z.object({
    type: SafetySignalTypeSchema,
    confidence: z.number().min(0).max(1),
    evidence_turn_id: z.string(),
    triggered_at: z.string(),  // ISO timestamp
});

export type SafetySignal = z.infer<typeof SafetySignalSchema>;

// =============================================================================
// AUDIT EVENT LOG
// =============================================================================

export const AuditEventTypeSchema = z.enum([
    'session_start',
    'turn_received',
    'pattern_detected',
    'pattern_disclosed',
    'move_selected',
    'move_executed',
    'reveal_teased',
    'reveal_permission_asked',
    'reveal_permission_granted',
    'reveal_permission_declined',
    'reveal_executed',
    'reveal_vetoed',
    'safety_triggered',
    'sp_veto',
    'commercial_break',
    'act_transition',
    'session_end',
]);

export const AuditEventSchema = z.object({
    id: z.string(),
    session_id: z.string(),
    type: AuditEventTypeSchema,
    timestamp: z.string(),
    turn_number: z.number(),
    act_number: z.number(),
    payload: z.record(z.unknown()),
});

export type AuditEvent = z.infer<typeof AuditEventSchema>;

// =============================================================================
// ORI REQUEST/RESPONSE (Fast Loop API)
// =============================================================================

export const OriRequestSchema = z.object({
    session_id: z.string(),
    user_message: z.string(),
    turn_id: z.string(),
});

export type OriRequest = z.infer<typeof OriRequestSchema>;

export const OriResponseSchema = z.object({
    response: z.string(),
    jumbotron_cue: JumbotronCueSchema.nullable().optional(),
    trigger_commercial_break: z.boolean().optional(),
    silence_mode: z.boolean().optional(),
});

export type OriResponse = z.infer<typeof OriResponseSchema>;

// =============================================================================
// COMMERCIAL BREAK PAYLOAD
// =============================================================================

export const CommercialBreakPayloadSchema = z.object({
    story_so_far: z.array(z.string()).max(3),
    open_loops: z.array(z.string()).max(2),
    coming_up: z.string().optional(),
    user_options: z.object({
        ready: z.boolean(),
        need_moment: z.boolean(),
        pivot_requested: z.boolean(),
    }),
});

export type CommercialBreakPayload = z.infer<typeof CommercialBreakPayloadSchema>;
