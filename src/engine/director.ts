/**
 * PROVENIQ ORIGINS — Director State Machine
 * 
 * Show-runner machine defining episode flow:
 * GreenRoom → ActLive → CommercialBreak → RevealSequence → Wrap
 * 
 * Moves operate INSIDE these states, not as separate persona machines.
 */

import {
    HostMove,
    EpisodeState,
    EarpieceFeed,
    PatternSignal,
    RevealPlan,
    RiskLevelSchema,
} from './schemas';

// =============================================================================
// DIRECTOR STATE MACHINE
// =============================================================================

export type DirectorState =
    | 'green_room'      // Pre-interview warmup
    | 'act_live'        // Active interview
    | 'commercial_break' // Synthesis pause
    | 'reveal_sequence' // Executing approved reveal
    | 'wrap'            // Episode conclusion
    | 'safety_hold';    // Safety escalation override

export interface DirectorContext {
    currentState: DirectorState;
    currentAct: number;
    currentTurn: number;
    turnsInAct: number;
    consecutiveFollowupsOnTopic: number;
    lastTopicId: string | null;
    pendingReveal: RevealPlan | null;
    safetyOverride: boolean;
}

// =============================================================================
// MOVE AVAILABILITY PER STATE
// =============================================================================

export const MOVE_AVAILABILITY: Record<DirectorState, HostMove[]> = {
    green_room: [
        'MIRROR_LANGUAGE',
        'OFFER_FORK',
        'SILENCE',
    ],
    act_live: [
        'PIN_TO_SPECIFICS',
        'MIRROR_LANGUAGE',
        'NAME_THE_SHIFT',
        'STATE_AND_STOP',
        'OFFER_FORK',
        'RETURN_TO_OPEN_LOOP',
        'BRIDGE_THREAD',
        'LIGHT_PRESS',
        'UTILITARIAN_CHECK',
        'PATTERN_PAUSE',
        'SILENCE',
    ],
    commercial_break: [
        'COMMERCIAL_BREAK',
    ],
    reveal_sequence: [
        'EARNED_REVEAL',
        'OFFER_FORK',
        'SILENCE',
    ],
    wrap: [
        'WRAP',
        'OFFER_FORK',
    ],
    safety_hold: [
        'SAFETY_GROUND',
    ],
};

// =============================================================================
// PRESSURE CAPS (S&P Enforced)
// =============================================================================

export interface PressureCaps {
    maxFollowupsOnTopic: number;      // Default: 3
    recursionLimit: number;            // Default: 2
    minTurnsBetweenReveals: number;    // Default: 5
    maxPatternsPerAct: number;         // Disclosure limit per act
    silenceAfterHeavyTopic: boolean;   // Require pause after trauma
}

export const DEFAULT_PRESSURE_CAPS: PressureCaps = {
    maxFollowupsOnTopic: 3,
    recursionLimit: 2,
    minTurnsBetweenReveals: 5,
    maxPatternsPerAct: 2,
    silenceAfterHeavyTopic: true,
};

// =============================================================================
// PATTERN DISCLOSURE THRESHOLDS
// =============================================================================

export interface PatternDisclosurePolicy {
    minObservations: number;           // Must see pattern ≥N times
    minTurnSpan: number;               // Spans ≥K turns apart
    requireActBoundary: boolean;       // Must span act boundary
    requireCostHint: boolean;          // Must have cost_hint defined
    blockIfCriticalRisk: boolean;      // Never disclose at critical risk
}

export const DEFAULT_PATTERN_DISCLOSURE_POLICY: PatternDisclosurePolicy = {
    minObservations: 2,
    minTurnSpan: 3,
    requireActBoundary: false,  // OR condition with turn span
    requireCostHint: true,
    blockIfCriticalRisk: true,
};

// =============================================================================
// BANNED BEHAVIORS (Hard Fail Tests)
// =============================================================================

export const BANNED_BEHAVIORS = {
    // Fake authority
    simulatedPolygraph: true,
    deceptionIndicated: true,
    audienceJury: true,
    fabricatedExperts: true,

    // Diagnosis/labeling
    clinicalDiagnosis: true,
    personalityLabeling: true,  // "narcissist", "toxic", "delusional"

    // Therapy cosplay
    therapyDisclaimer: true,    // "I'm not a therapist"
    clinicalClaims: true,

    // Cheap drama
    gotchaReveals: true,        // Reveal without permission gate
    surpriseReceipts: true,     // Receipts without tease

    // AI disclosure
    asAnAI: true,
} as const;

// =============================================================================
// DIRECTOR TRANSITIONS
// =============================================================================

export type DirectorTransition = {
    from: DirectorState;
    to: DirectorState;
    trigger: string;
    guard?: (ctx: DirectorContext, state: EpisodeState) => boolean;
};

export const DIRECTOR_TRANSITIONS: DirectorTransition[] = [
    // GreenRoom → ActLive
    {
        from: 'green_room',
        to: 'act_live',
        trigger: 'user_engaged',
        guard: (ctx) => ctx.turnsInAct >= 2,
    },

    // ActLive → CommercialBreak
    {
        from: 'act_live',
        to: 'commercial_break',
        trigger: 'act_complete',
        guard: (ctx) => ctx.turnsInAct >= 8,  // ~8 turns per act
    },

    // CommercialBreak → ActLive
    {
        from: 'commercial_break',
        to: 'act_live',
        trigger: 'user_ready',
    },

    // ActLive → RevealSequence
    {
        from: 'act_live',
        to: 'reveal_sequence',
        trigger: 'reveal_approved',
        guard: (ctx) => ctx.pendingReveal !== null,
    },

    // RevealSequence → ActLive
    {
        from: 'reveal_sequence',
        to: 'act_live',
        trigger: 'reveal_complete',
    },

    // ActLive → Wrap
    {
        from: 'act_live',
        to: 'wrap',
        trigger: 'episode_complete',
        guard: (ctx) => ctx.currentAct >= 3,
    },

    // Any → SafetyHold
    {
        from: 'act_live',
        to: 'safety_hold',
        trigger: 'safety_signal',
    },
    {
        from: 'reveal_sequence',
        to: 'safety_hold',
        trigger: 'safety_signal',
    },
];

// =============================================================================
// DIRECTOR CLASS
// =============================================================================

export class Director {
    private context: DirectorContext;
    private pressureCaps: PressureCaps;
    private patternPolicy: PatternDisclosurePolicy;

    constructor(
        pressureCaps: PressureCaps = DEFAULT_PRESSURE_CAPS,
        patternPolicy: PatternDisclosurePolicy = DEFAULT_PATTERN_DISCLOSURE_POLICY
    ) {
        this.pressureCaps = pressureCaps;
        this.patternPolicy = patternPolicy;
        this.context = {
            currentState: 'green_room',
            currentAct: 1,
            currentTurn: 0,
            turnsInAct: 0,
            consecutiveFollowupsOnTopic: 0,
            lastTopicId: null,
            pendingReveal: null,
            safetyOverride: false,
        };
    }

    getContext(): DirectorContext {
        return { ...this.context };
    }

    getCurrentState(): DirectorState {
        return this.context.currentState;
    }

    getAvailableMoves(): HostMove[] {
        return MOVE_AVAILABILITY[this.context.currentState];
    }

    /**
     * Check if a move is allowed given current pressure caps
     */
    isMoveAllowed(move: HostMove, topicId: string): boolean {
        // Always allow safety
        if (move === 'SAFETY_GROUND') return true;

        // Check state availability
        if (!this.getAvailableMoves().includes(move)) {
            return false;
        }

        // Check pressure caps for follow-ups
        if (topicId === this.context.lastTopicId) {
            if (this.context.consecutiveFollowupsOnTopic >= this.pressureCaps.maxFollowupsOnTopic) {
                // Only OFFER_FORK or SILENCE allowed after max followups
                return move === 'OFFER_FORK' || move === 'SILENCE';
            }
        }

        return true;
    }

    /**
     * Check if pattern disclosure is allowed
     */
    isPatternDisclosureAllowed(signal: PatternSignal, riskLevel: string): boolean {
        // Block if critical risk
        if (this.patternPolicy.blockIfCriticalRisk && riskLevel === 'critical') {
            return false;
        }

        // Check minimum observations
        if (signal.occurrence_count < this.patternPolicy.minObservations) {
            return false;
        }

        // Check turn span
        const turnSpan = signal.last_seen_turn - signal.first_seen_turn;
        if (turnSpan < this.patternPolicy.minTurnSpan) {
            return false;
        }

        // Check cost hint requirement
        if (this.patternPolicy.requireCostHint && !signal.cost_hint) {
            return false;
        }

        return true;
    }

    /**
     * Transition to a new state
     */
    transition(trigger: string, episodeState: EpisodeState): boolean {
        const validTransition = DIRECTOR_TRANSITIONS.find(t =>
            t.from === this.context.currentState &&
            t.trigger === trigger &&
            (!t.guard || t.guard(this.context, episodeState))
        );

        if (validTransition) {
            this.context.currentState = validTransition.to;

            // Reset counters on state change
            if (validTransition.to === 'act_live' && validTransition.from === 'commercial_break') {
                this.context.currentAct++;
                this.context.turnsInAct = 0;
            }

            return true;
        }

        return false;
    }

    /**
     * Record a turn
     */
    recordTurn(topicId: string | null): void {
        this.context.currentTurn++;
        this.context.turnsInAct++;

        if (topicId === this.context.lastTopicId) {
            this.context.consecutiveFollowupsOnTopic++;
        } else {
            this.context.consecutiveFollowupsOnTopic = 0;
            this.context.lastTopicId = topicId;
        }
    }

    /**
     * Set pending reveal
     */
    setPendingReveal(reveal: RevealPlan | null): void {
        this.context.pendingReveal = reveal;
    }

    /**
     * Trigger safety override
     */
    triggerSafety(): void {
        this.context.safetyOverride = true;
        this.context.currentState = 'safety_hold';
    }
}
