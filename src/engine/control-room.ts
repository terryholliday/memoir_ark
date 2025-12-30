/**
 * PROVENIQ ORIGINS — Control Room
 * 
 * Slow Loop: Runs every turn to compute state and propose moves
 * 
 * Responsibilities:
 * 1. Compute Pattern signals
 * 2. Compute Inevitability score
 * 3. Propose primary move + 2 alternates
 * 4. Create RevealPlan
 * 5. Route through S&P Governor for veto
 * 6. Emit EarpieceFeed
 */

import {
    EpisodeState,
    EarpieceFeed,
    PatternSignal,
    PatternKind,
    RevealPlan,
    ReceiptCard,
    HostMove,
    OpenLoopSchema,
    EchoPhraseSchema,
    ClaimSchema,
    ContradictionSchema,
    SafetySignal,
} from './schemas';
import { Director, DirectorContext, BANNED_BEHAVIORS } from './director';

// =============================================================================
// PATTERN ENGINE
// =============================================================================

interface PatternDetection {
    kind: PatternKind;
    confidence: number;
    evidence: string;
}

const PATTERN_DETECTORS: Record<PatternKind, (text: string) => PatternDetection | null> = {
    minimization_language: (text) => {
        const patterns = /\b(just|only|not a big deal|no big deal|it's fine|it was nothing|barely)\b/gi;
        const matches = text.match(patterns);
        if (matches && matches.length > 0) {
            return {
                kind: 'minimization_language',
                confidence: Math.min(0.5 + matches.length * 0.1, 0.9),
                evidence: matches.join(', '),
            };
        }
        return null;
    },

    absolutist_language: (text) => {
        const patterns = /\b(always|never|everyone|no one|everything|nothing|completely|totally)\b/gi;
        const matches = text.match(patterns);
        if (matches && matches.length > 0) {
            return {
                kind: 'absolutist_language',
                confidence: Math.min(0.4 + matches.length * 0.15, 0.85),
                evidence: matches.join(', '),
            };
        }
        return null;
    },

    agency_shift_active_to_passive: (text) => {
        const passivePatterns = /\b(it happened|things happened|it just|was done|got done|ended up)\b/gi;
        const matches = text.match(passivePatterns);
        if (matches) {
            return {
                kind: 'agency_shift_active_to_passive',
                confidence: 0.6,
                evidence: matches.join(', '),
            };
        }
        return null;
    },

    actor_omission: (text) => {
        // Sentences that describe actions without subjects
        const omissionPatterns = /\b(was hit|got hurt|was said|things were|it was decided)\b/gi;
        const matches = text.match(omissionPatterns);
        if (matches) {
            return {
                kind: 'actor_omission',
                confidence: 0.55,
                evidence: matches.join(', '),
            };
        }
        return null;
    },

    chronology_skip: (_text) => {
        // Would need timeline context to detect
        return null;
    },

    humor_deflection: (text) => {
        const humorPatterns = /\b(haha|lol|just kidding|jk|anyway|but yeah|so anyway)\b/gi;
        const matches = text.match(humorPatterns);
        if (matches) {
            return {
                kind: 'humor_deflection',
                confidence: 0.5,
                evidence: matches.join(', '),
            };
        }
        return null;
    },

    over_precision_in_safe_topics: (_text) => {
        // Would need topic classification to detect
        return null;
    },

    brevity_spike: (text) => {
        const wordCount = text.split(/\s+/).length;
        if (wordCount < 5) {
            return {
                kind: 'brevity_spike',
                confidence: 0.4,
                evidence: `${wordCount} words`,
            };
        }
        return null;
    },

    repetition_loop: (_text) => {
        // Would need conversation history to detect
        return null;
    },

    inevitability_language: (text) => {
        const patterns = /\b(had no choice|no other option|forced to|couldn't|had to|no way out|trapped)\b/gi;
        const matches = text.match(patterns);
        if (matches) {
            return {
                kind: 'inevitability_language',
                confidence: 0.7,
                evidence: matches.join(', '),
            };
        }
        return null;
    },

    shame_cue: (text) => {
        const patterns = /\b(my fault|i deserved|should have known|stupid of me|i'm so|ashamed|embarrassed)\b/gi;
        const matches = text.match(patterns);
        if (matches) {
            return {
                kind: 'shame_cue',
                confidence: 0.75,
                evidence: matches.join(', '),
            };
        }
        return null;
    },

    freeze_cue: (text) => {
        const patterns = /\b(i froze|couldn't move|couldn't speak|went blank|shut down|paralyz)\b/gi;
        const matches = text.match(patterns);
        if (matches) {
            return {
                kind: 'freeze_cue',
                confidence: 0.8,
                evidence: matches.join(', '),
            };
        }
        return null;
    },
};

export class PatternEngine {
    /**
     * Detect patterns in a single turn
     */
    detectPatterns(text: string, turnId: string, turnNumber: number): PatternSignal[] {
        const signals: PatternSignal[] = [];

        for (const [kind, detector] of Object.entries(PATTERN_DETECTORS)) {
            const detection = detector(text);
            if (detection) {
                signals.push({
                    kind: detection.kind,
                    evidence_turn_ids: [turnId],
                    confidence_0_1: detection.confidence,
                    cost_hint: this.getCostHint(detection.kind),
                    first_seen_turn: turnNumber,
                    last_seen_turn: turnNumber,
                    occurrence_count: 1,
                });
            }
        }

        return signals;
    }

    /**
     * Merge new signals with existing episode patterns
     */
    mergePatterns(existing: PatternSignal[], newSignals: PatternSignal[]): PatternSignal[] {
        const merged = [...existing];

        for (const signal of newSignals) {
            const existingIndex = merged.findIndex(s => s.kind === signal.kind);
            if (existingIndex >= 0) {
                // Update existing
                merged[existingIndex] = {
                    ...merged[existingIndex],
                    evidence_turn_ids: [...merged[existingIndex].evidence_turn_ids, ...signal.evidence_turn_ids],
                    confidence_0_1: Math.min((merged[existingIndex].confidence_0_1 + signal.confidence_0_1) / 2 + 0.1, 0.95),
                    last_seen_turn: signal.last_seen_turn,
                    occurrence_count: merged[existingIndex].occurrence_count + 1,
                };
            } else {
                merged.push(signal);
            }
        }

        return merged;
    }

    private getCostHint(kind: PatternKind): string | undefined {
        const costHints: Partial<Record<PatternKind, string>> = {
            minimization_language: 'May be protecting yourself from the weight of what happened',
            agency_shift_active_to_passive: 'The language shifts away from who did what',
            shame_cue: 'Carrying responsibility that may not be yours',
            freeze_cue: 'A survival response, not a choice',
            inevitability_language: 'Framing removes the possibility of alternatives',
        };
        return costHints[kind];
    }
}

// =============================================================================
// INEVITABILITY ENGINE
// =============================================================================

export interface InevitabilityScore {
    score: number;  // 0-1
    rationale: string;
    thresholdForReveal: number;
    thresholdForConfrontSoft: number;
    thresholdForConfrontFirm: number;
}

export class InevitabilityEngine {
    /**
     * Compute inevitability score for a potential truth/reveal
     */
    compute(
        episodeState: EpisodeState,
        targetTopic: string
    ): InevitabilityScore {
        let score = 0;
        const factors: string[] = [];

        // Factor 1: Independent evidentiary anchors
        const relatedClaims = episodeState.claims_ledger.filter(c =>
            c.statement.toLowerCase().includes(targetTopic.toLowerCase())
        );
        const anchorCount = relatedClaims.length;
        if (anchorCount >= 2) {
            score += 0.2;
            factors.push(`${anchorCount} independent mentions`);
        }

        // Factor 2: Contradictions pointing to topic
        const relatedContradictions = episodeState.contradiction_index.filter(c => !c.addressed);
        if (relatedContradictions.length > 0) {
            score += 0.15 * Math.min(relatedContradictions.length, 2);
            factors.push(`${relatedContradictions.length} unresolved contradictions`);
        }

        // Factor 3: Pattern repetition
        const avoidancePatterns = episodeState.pattern_signals.filter(p =>
            p.occurrence_count >= 2 &&
            ['minimization_language', 'agency_shift_active_to_passive', 'humor_deflection'].includes(p.kind)
        );
        if (avoidancePatterns.length > 0) {
            score += 0.1 * avoidancePatterns.length;
            factors.push(`${avoidancePatterns.length} avoidance patterns detected`);
        }

        // Factor 4: Echo phrases related to topic
        const eligibleEchoes = episodeState.echo_phrases.filter(e =>
            !e.used &&
            e.eligible_after_turn <= episodeState.metrics.current_turn
        );
        if (eligibleEchoes.length > 0) {
            score += 0.1;
            factors.push(`${eligibleEchoes.length} echo phrases eligible`);
        }

        // Factor 5: Prior emotional acknowledgment without naming
        const openLoops = episodeState.open_loops.filter(l =>
            l.status === 'open' && l.priority >= 7
        );
        if (openLoops.length > 0) {
            score += 0.15;
            factors.push('High-priority open loop present');
        }

        // Cap at 1.0
        score = Math.min(score, 1.0);

        return {
            score,
            rationale: factors.length > 0 ? factors.join('; ') : 'No convergence signals',
            thresholdForReveal: 0.7,
            thresholdForConfrontSoft: 0.5,
            thresholdForConfrontFirm: 0.8,
        };
    }
}

// =============================================================================
// ECHO PHRASE ENGINE
// =============================================================================

export class EchoPhraseEngine {
    private echoPatterns = [
        { pattern: /not a big deal/gi, category: 'minimizer' as const },
        { pattern: /no choice/gi, category: 'inevitability' as const },
        { pattern: /had to/gi, category: 'inevitability' as const },
        { pattern: /i deserved/gi, category: 'shame' as const },
        { pattern: /my fault/gi, category: 'shame' as const },
        { pattern: /i froze/gi, category: 'freeze' as const },
        { pattern: /couldn't move/gi, category: 'freeze' as const },
        { pattern: /i just.*let/gi, category: 'agency' as const },
    ];

    /**
     * Capture echo phrases from user text
     */
    capture(
        text: string,
        turnId: string,
        currentAct: number,
        currentTurn: number
    ): Array<{
        phrase: string;
        turnId: string;
        category: 'minimizer' | 'inevitability' | 'shame' | 'agency' | 'freeze';
        eligibleAfterAct: number;
        eligibleAfterTurn: number;
    }> {
        const captured: Array<{
            phrase: string;
            turnId: string;
            category: 'minimizer' | 'inevitability' | 'shame' | 'agency' | 'freeze';
            eligibleAfterAct: number;
            eligibleAfterTurn: number;
        }> = [];

        for (const { pattern, category } of this.echoPatterns) {
            const matches = text.match(pattern);
            if (matches) {
                for (const match of matches) {
                    captured.push({
                        phrase: match,
                        turnId,
                        category,
                        eligibleAfterAct: currentAct + 1,
                        eligibleAfterTurn: currentTurn + 5,
                    });
                }
            }
        }

        return captured;
    }

    /**
     * Get eligible echo phrases for callback
     */
    getEligible(
        echoPhrases: EpisodeState['echo_phrases'],
        currentAct: number,
        currentTurn: number
    ): EpisodeState['echo_phrases'] {
        return echoPhrases.filter(e =>
            !e.used &&
            (e.eligible_after_act <= currentAct || e.eligible_after_turn <= currentTurn)
        );
    }
}

// =============================================================================
// REVEAL ENGINE
// =============================================================================

export class RevealEngine {
    /**
     * Create a reveal plan for a receipt
     */
    createRevealPlan(
        id: string,
        receipt: ReceiptCard,
        topic: string,
        requirePermission: boolean
    ): RevealPlan {
        const teaseLine = this.generateTeaseLine(receipt, topic);
        const integrationPrompt = this.generateIntegrationPrompt(receipt);

        return {
            id,
            tease_line: teaseLine,
            permission_gate: {
                required: requirePermission,
                ask_copy: requirePermission
                    ? `There's something here that might help us understand this better. Would you like me to share it?`
                    : '',
            },
            trigger: 'user_permission',
            payload: receipt,
            integration_prompt: integrationPrompt,
            vetoable: true,
            status: 'pending',
        };
    }

    private generateTeaseLine(receipt: ReceiptCard, topic: string): string {
        switch (receipt.type) {
            case 'quote':
                return `Earlier, you said something about ${topic} that I've been thinking about.`;
            case 'timeline_snap':
                return `I notice there's a period we haven't explored yet.`;
            case 'missing_tape':
                return `There's a gap in the timeline I'm curious about.`;
            case 'photo':
                return `There's an image here that connects to what you're saying.`;
            default:
                return `Something you shared earlier might be relevant here.`;
        }
    }

    private generateIntegrationPrompt(receipt: ReceiptCard): string {
        switch (receipt.type) {
            case 'quote':
                return `What comes up for you hearing that now?`;
            case 'timeline_snap':
            case 'missing_tape':
                return `What was happening during that time?`;
            case 'photo':
                return `What do you remember about this?`;
            default:
                return `How does that land with you?`;
        }
    }
}

// =============================================================================
// MISSING TAPES ENGINE (MVP)
// =============================================================================

export interface TimelineGap {
    startDate: string;
    endDate: string;
    gapDays: number;
    description: string;
    suggestedTease: string;
}

export class MissingTapesEngine {
    private gapThresholdDays = 180;  // 6 months

    /**
     * Analyze timeline for significant gaps
     */
    findGaps(timeline: EpisodeState['timeline']): TimelineGap[] {
        if (timeline.length < 2) return [];

        // Sort by date
        const sorted = [...timeline].sort((a, b) =>
            new Date(a.date).getTime() - new Date(b.date).getTime()
        );

        const gaps: TimelineGap[] = [];

        for (let i = 0; i < sorted.length - 1; i++) {
            const current = new Date(sorted[i].date);
            const next = new Date(sorted[i + 1].date);
            const diffDays = (next.getTime() - current.getTime()) / (1000 * 60 * 60 * 24);

            if (diffDays >= this.gapThresholdDays) {
                gaps.push({
                    startDate: sorted[i].date,
                    endDate: sorted[i + 1].date,
                    gapDays: Math.round(diffDays),
                    description: `${Math.round(diffDays / 30)} months between "${sorted[i].description}" and "${sorted[i + 1].description}"`,
                    suggestedTease: this.generateTease(diffDays, sorted[i].description, sorted[i + 1].description),
                });
            }
        }

        // Sort by gap size (largest first)
        return gaps.sort((a, b) => b.gapDays - a.gapDays);
    }

    /**
     * Create a Missing Tape receipt card
     */
    createReceiptCard(gap: TimelineGap): ReceiptCard {
        return {
            type: 'missing_tape',
            date_start: gap.startDate,
            date_end: gap.endDate,
            is_gap: true,
            gap_description: gap.description,
        };
    }

    private generateTease(gapDays: number, before: string, after: string): string {
        const months = Math.round(gapDays / 30);
        if (months >= 12) {
            const years = Math.round(months / 12);
            return `There's about ${years} year${years > 1 ? 's' : ''} between ${before} and ${after}. I'm curious what was happening then.`;
        }
        return `There's about ${months} months between ${before} and ${after}. What was that time like?`;
    }
}

// =============================================================================
// S&P GOVERNOR (Standards & Practices)
// =============================================================================

export interface SPVeto {
    vetoed: boolean;
    reason?: string;
    alternativeMove?: HostMove;
}

export class SPGovernor {
    /**
     * Check if a move should be vetoed
     */
    reviewMove(
        move: HostMove,
        instruction: string,
        context: DirectorContext,
        riskLevel: 'low' | 'elevated' | 'critical'
    ): SPVeto {
        // Critical risk: only allow safety moves
        if (riskLevel === 'critical' && move !== 'SAFETY_GROUND') {
            return {
                vetoed: true,
                reason: 'Critical risk level - safety protocol required',
                alternativeMove: 'SAFETY_GROUND',
            };
        }

        // Check for banned phrases in instruction
        if (this.containsBannedBehavior(instruction)) {
            return {
                vetoed: true,
                reason: 'Instruction contains banned behavior',
                alternativeMove: 'MIRROR_LANGUAGE',
            };
        }

        // Max pressure check
        if (context.consecutiveFollowupsOnTopic >= 3 && move === 'LIGHT_PRESS') {
            return {
                vetoed: true,
                reason: 'Pressure cap reached on topic',
                alternativeMove: 'OFFER_FORK',
            };
        }

        return { vetoed: false };
    }

    /**
     * Check if a reveal should be vetoed
     */
    reviewReveal(
        reveal: RevealPlan,
        inevitabilityScore: number
    ): SPVeto {
        // Reveal without permission gate for sensitive content
        if (!reveal.permission_gate.required && reveal.payload.type === 'quote') {
            return {
                vetoed: true,
                reason: 'Quote reveals require permission gate',
            };
        }

        // Inevitability too low
        if (inevitabilityScore < 0.5) {
            return {
                vetoed: true,
                reason: 'Truth not yet inevitable - more groundwork needed',
                alternativeMove: 'RETURN_TO_OPEN_LOOP',
            };
        }

        return { vetoed: false };
    }

    private containsBannedBehavior(text: string): boolean {
        const bannedPatterns = [
            /polygraph/i,
            /deception indicated/i,
            /the audience/i,
            /viewers think/i,
            /narcissist/i,
            /toxic/i,
            /delusional/i,
            /as an ai/i,
            /i'm not a therapist/i,
        ];

        return bannedPatterns.some(p => p.test(text));
    }
}

// =============================================================================
// SAFETY ENGINE
// =============================================================================

export class SafetyEngine {
    private crisisPatterns = [
        { pattern: /\b(kill myself|end my life|suicide|want to die)\b/i, type: 'imminent_self_harm' as const },
        { pattern: /\b(going to hurt|going to kill|harm them|attack)\b/i, type: 'imminent_harm_to_others' as const },
        { pattern: /\b(child|minor|kid).*(abuse|molest|touch)/i, type: 'child_exploitation_disclosure' as const },
        { pattern: /\b(can't go on|no point|give up|end it)\b/i, type: 'acute_crisis' as const },
    ];

    /**
     * Detect safety signals in text
     */
    detect(text: string, turnId: string): SafetySignal | null {
        for (const { pattern, type } of this.crisisPatterns) {
            if (pattern.test(text)) {
                return {
                    type,
                    confidence: 0.8,
                    evidence_turn_id: turnId,
                    triggered_at: new Date().toISOString(),
                };
            }
        }
        return null;
    }

    /**
     * Generate safety response
     */
    getResponse(signal: SafetySignal): string {
        switch (signal.type) {
            case 'imminent_self_harm':
                return "I want to pause here. What you're sharing sounds really heavy. If you're having thoughts of hurting yourself, please reach out to a crisis line: 988 (US) or text HOME to 741741. I'm here to listen, but your safety matters most right now.";
            case 'imminent_harm_to_others':
                return "I need to pause. If you or someone else is in immediate danger, please contact emergency services. We can continue when you're safe.";
            case 'child_exploitation_disclosure':
                return "I need to pause here. What you're describing is serious. If a child is in danger, please contact local authorities or the Childhelp National Child Abuse Hotline: 1-800-422-4453.";
            case 'acute_crisis':
                return "I hear that you're struggling. That takes courage to share. If you're in crisis, please know that support is available: 988 Suicide & Crisis Lifeline. I'm here when you're ready to continue.";
        }
    }
}

// =============================================================================
// CONTROL ROOM (Main Orchestrator)
// =============================================================================

export interface MoveProposal {
    primary: { move: HostMove; instruction: string };
    alternates: Array<{ move: HostMove; instruction: string }>;
}

export class ControlRoom {
    private director: Director;
    private patternEngine: PatternEngine;
    private inevitabilityEngine: InevitabilityEngine;
    private echoPhraseEngine: EchoPhraseEngine;
    private revealEngine: RevealEngine;
    private missingTapesEngine: MissingTapesEngine;
    private spGovernor: SPGovernor;
    private safetyEngine: SafetyEngine;

    constructor() {
        this.director = new Director();
        this.patternEngine = new PatternEngine();
        this.inevitabilityEngine = new InevitabilityEngine();
        this.echoPhraseEngine = new EchoPhraseEngine();
        this.revealEngine = new RevealEngine();
        this.missingTapesEngine = new MissingTapesEngine();
        this.spGovernor = new SPGovernor();
        this.safetyEngine = new SafetyEngine();
    }

    /**
     * Process a turn and emit EarpieceFeed
     */
    async processTurn(
        userMessage: string,
        turnId: string,
        episodeState: EpisodeState
    ): Promise<{ feed: EarpieceFeed; updatedState: EpisodeState }> {
        const turnNumber = episodeState.metrics.current_turn + 1;
        const currentAct = episodeState.metrics.current_act;

        // 1. Safety check first
        const safetySignal = this.safetyEngine.detect(userMessage, turnId);
        if (safetySignal) {
            this.director.triggerSafety();
            return {
                feed: this.createSafetyFeed(safetySignal, episodeState),
                updatedState: {
                    ...episodeState,
                    safety_incidents: [...episodeState.safety_incidents, {
                        turn_id: turnId,
                        type: safetySignal.type,
                        response: this.safetyEngine.getResponse(safetySignal),
                    }],
                },
            };
        }

        // 2. Detect patterns
        const newPatterns = this.patternEngine.detectPatterns(userMessage, turnId, turnNumber);
        const mergedPatterns = this.patternEngine.mergePatterns(episodeState.pattern_signals, newPatterns);

        // 3. Capture echo phrases
        const newEchoes = this.echoPhraseEngine.capture(userMessage, turnId, currentAct, turnNumber);

        // 4. Compute inevitability for open loops
        const topOpenLoop = episodeState.open_loops.find(l => l.status === 'open');
        const inevitability = topOpenLoop
            ? this.inevitabilityEngine.compute(episodeState, topOpenLoop.topic)
            : { score: 0, rationale: 'No open loops', thresholdForReveal: 0.7, thresholdForConfrontSoft: 0.5, thresholdForConfrontFirm: 0.8 };

        // 5. Check for eligible echo callbacks
        const eligibleEchoes = this.echoPhraseEngine.getEligible(
            episodeState.echo_phrases,
            currentAct,
            turnNumber
        );

        // 6. Propose moves
        const proposal = this.proposeMove(userMessage, episodeState, mergedPatterns, eligibleEchoes, inevitability);

        // 7. S&P review
        const riskLevel = this.assessRiskLevel(mergedPatterns, safetySignal);
        const spReview = this.spGovernor.reviewMove(
            proposal.primary.move,
            proposal.primary.instruction,
            this.director.getContext(),
            riskLevel
        );

        const finalMove = spReview.vetoed && spReview.alternativeMove
            ? { move: spReview.alternativeMove, instruction: 'Pivot to safer ground.' }
            : proposal.primary;

        // 8. Check pattern disclosure eligibility
        const disclosablePatterns = mergedPatterns.filter(p =>
            this.director.isPatternDisclosureAllowed(p, riskLevel)
        );

        // 9. Record turn
        this.director.recordTurn(topOpenLoop?.id || null);

        // 10. Build EarpieceFeed
        const feed: EarpieceFeed = {
            status: this.director.getCurrentState() === 'commercial_break' ? 'commercial_break'
                : this.director.getCurrentState() === 'wrap' ? 'wrap'
                    : 'live',
            act: `Act ${currentAct}: ${topOpenLoop?.topic || 'Opening'}`,
            move: finalMove.move,
            posture: this.determinePosture(finalMove.move, inevitability.score),
            tone: this.determineTone(finalMove.move, riskLevel),
            instruction: finalMove.instruction,
            alternates: proposal.alternates.slice(0, 2),
            pressure_caps: {
                max_followups_on_topic: 3,
                recursion_limit: 2,
            },
            guardrails: {
                forbidden_initiations: ['polygraph', 'diagnosis', 'therapy'],
                permission_required_topics: episodeState.open_loops
                    .filter(l => l.priority >= 8)
                    .map(l => l.topic),
                risk_level: riskLevel,
                safety_mode: safetySignal ? 'stop_and_ground' : 'normal',
            },
            pattern_state: {
                detected: mergedPatterns,
                disclosure_allowed: disclosablePatterns.length > 0,
                disclosure_reason: disclosablePatterns.length > 0
                    ? `${disclosablePatterns[0].kind} observed ${disclosablePatterns[0].occurrence_count} times`
                    : undefined,
            },
            inevitability: {
                score: inevitability.score,
                rationale: inevitability.rationale,
                threshold_for_reveal: inevitability.thresholdForReveal,
            },
            reveal_plan: null,
            jumbotron_cue: null,
        };

        // 11. Update state
        const updatedState: EpisodeState = {
            ...episodeState,
            pattern_signals: mergedPatterns,
            echo_phrases: [
                ...episodeState.echo_phrases,
                ...newEchoes.map((e, i) => ({
                    id: `echo-${turnNumber}-${i}`,
                    phrase: e.phrase,
                    turn_id: e.turnId,
                    category: e.category,
                    eligible_after_act: e.eligibleAfterAct,
                    eligible_after_turn: e.eligibleAfterTurn,
                    used: false,
                })),
            ],
            metrics: {
                ...episodeState.metrics,
                current_turn: turnNumber,
            },
        };

        return { feed, updatedState };
    }

    private proposeMove(
        userMessage: string,
        state: EpisodeState,
        patterns: PatternSignal[],
        eligibleEchoes: EpisodeState['echo_phrases'],
        inevitability: InevitabilityScore
    ): MoveProposal {
        const wordCount = userMessage.split(/\s+/).length;
        const availableMoves = this.director.getAvailableMoves();

        // Short/vague response → PIN_TO_SPECIFICS
        if (wordCount < 10 && availableMoves.includes('PIN_TO_SPECIFICS')) {
            return {
                primary: {
                    move: 'PIN_TO_SPECIFICS',
                    instruction: 'Ask for the specific moment or image.',
                },
                alternates: [
                    { move: 'MIRROR_LANGUAGE', instruction: 'Reflect their words back.' },
                    { move: 'SILENCE', instruction: 'Wait. Let them fill the space.' },
                ],
            };
        }

        // Echo phrase eligible → RETURN_TO_OPEN_LOOP
        if (eligibleEchoes.length > 0 && availableMoves.includes('RETURN_TO_OPEN_LOOP')) {
            return {
                primary: {
                    move: 'RETURN_TO_OPEN_LOOP',
                    instruction: `Callback to: "${eligibleEchoes[0].phrase}"`,
                },
                alternates: [
                    { move: 'MIRROR_LANGUAGE', instruction: 'Reflect first, callback later.' },
                    { move: 'BRIDGE_THREAD', instruction: 'Connect this to the earlier moment.' },
                ],
            };
        }

        // Pattern detected with disclosure allowed → PATTERN_PAUSE
        const disclosable = patterns.find(p =>
            this.director.isPatternDisclosureAllowed(p, 'low')
        );
        if (disclosable && availableMoves.includes('PATTERN_PAUSE')) {
            return {
                primary: {
                    move: 'PATTERN_PAUSE',
                    instruction: `Name the pattern: ${disclosable.cost_hint || disclosable.kind}`,
                },
                alternates: [
                    { move: 'STATE_AND_STOP', instruction: 'Make an observation, then silence.' },
                    { move: 'OFFER_FORK', instruction: 'Give them a choice to go deeper or sideways.' },
                ],
            };
        }

        // High inevitability → prepare for reveal
        if (inevitability.score >= inevitability.thresholdForConfrontSoft) {
            return {
                primary: {
                    move: 'STATE_AND_STOP',
                    instruction: 'Make an observation about what you\'re hearing. Then stop.',
                },
                alternates: [
                    { move: 'UTILITARIAN_CHECK', instruction: 'Ask how this is working for them.' },
                    { move: 'LIGHT_PRESS', instruction: 'One gentle follow-up.' },
                ],
            };
        }

        // Default: MIRROR_LANGUAGE
        return {
            primary: {
                move: 'MIRROR_LANGUAGE',
                instruction: 'Reflect their exact words. Let them hear themselves.',
            },
            alternates: [
                { move: 'SILENCE', instruction: 'Wait. Give them space.' },
                { move: 'OFFER_FORK', instruction: 'Stay here or explore something else?' },
            ],
        };
    }

    private assessRiskLevel(patterns: PatternSignal[], safetySignal: SafetySignal | null): 'low' | 'elevated' | 'critical' {
        if (safetySignal) return 'critical';

        const highRiskPatterns = patterns.filter(p =>
            ['shame_cue', 'freeze_cue'].includes(p.kind) && p.confidence_0_1 > 0.7
        );

        if (highRiskPatterns.length > 0) return 'elevated';
        return 'low';
    }

    private determinePosture(move: HostMove, inevitability: number): EarpieceFeed['posture'] {
        if (move === 'SILENCE') return 'silence';
        if (move === 'STATE_AND_STOP') return 'lean_back';
        if (move === 'LIGHT_PRESS' || move === 'PIN_TO_SPECIFICS') return 'lean_in';
        if (inevitability > 0.7) return 'confront_soft';
        return 'lean_in';
    }

    private determineTone(move: HostMove, riskLevel: string): EarpieceFeed['tone'] {
        if (riskLevel === 'elevated') return 'gentle_curiosity';
        if (move === 'PIN_TO_SPECIFICS' || move === 'UTILITARIAN_CHECK') return 'skeptical_precision';
        return 'warm_authority';
    }

    private createSafetyFeed(signal: SafetySignal, state: EpisodeState): EarpieceFeed {
        return {
            status: 'live',
            act: 'Safety Hold',
            move: 'SAFETY_GROUND',
            posture: 'lean_back',
            tone: 'warm_authority',
            instruction: this.safetyEngine.getResponse(signal),
            alternates: [],
            pressure_caps: { max_followups_on_topic: 0, recursion_limit: 0 },
            guardrails: {
                forbidden_initiations: ['all'],
                permission_required_topics: [],
                risk_level: 'critical',
                safety_mode: 'stop_and_ground',
            },
            pattern_state: { detected: [], disclosure_allowed: false },
            inevitability: { score: 0, rationale: 'Safety override', threshold_for_reveal: 1 },
            reveal_plan: null,
            jumbotron_cue: null,
        };
    }
}
