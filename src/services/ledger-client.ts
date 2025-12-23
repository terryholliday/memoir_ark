/**
 * PROVENIQ Ledger Client for Origins
 * 
 * Queries the ecosystem-wide Ledger for asset provenance data.
 * Origins aggregates events from all PROVENIQ apps to build complete timelines.
 */

const LEDGER_API_URL = process.env.LEDGER_API_URL || 'http://localhost:8006/api/v1';

export interface LedgerEvent {
  eventId: string;
  source: string;
  eventType: string;
  assetId?: string;
  anchorId?: string;
  actorId?: string;
  correlationId?: string;
  payload: Record<string, unknown>;
  payloadHash: string;
  entryHash: string;
  previousHash?: string;
  sequenceNumber: number;
  createdAt: string;
}

export interface ProvenanceTimeline {
  assetId: string;
  paid?: string;
  totalEvents: number;
  firstSeen: string;
  lastSeen: string;
  sources: string[];
  chainIntegrity: 'verified' | 'unverified' | 'broken';
  events: LedgerEvent[];
}

class LedgerClient {
  /**
   * Get all events for a PROVENIQ Asset ID
   */
  async getAssetEvents(assetId: string): Promise<LedgerEvent[]> {
    try {
      const response = await fetch(`${LEDGER_API_URL}/assets/${assetId}/events`);
      
      if (!response.ok) {
        if (response.status === 404) return [];
        console.warn(`[LEDGER] Asset events failed: ${response.status}`);
        return [];
      }

      const data = await response.json() as any;
      return (data.data?.events || data.events || []).map(this.mapEvent);
    } catch (error) {
      console.error('[LEDGER] Asset events error:', error);
      return [];
    }
  }

  /**
   * Get all events for an Anchor ID
   */
  async getAnchorEvents(anchorId: string): Promise<LedgerEvent[]> {
    try {
      const response = await fetch(`${LEDGER_API_URL}/anchors/${anchorId}/events`);
      
      if (!response.ok) {
        if (response.status === 404) return [];
        console.warn(`[LEDGER] Anchor events failed: ${response.status}`);
        return [];
      }

      const data = await response.json() as any;
      return (data.data?.events || data.events || []).map(this.mapEvent);
    } catch (error) {
      console.error('[LEDGER] Anchor events error:', error);
      return [];
    }
  }

  /**
   * Query events with filters
   */
  async queryEvents(filters: {
    source?: string;
    eventType?: string;
    assetId?: string;
    anchorId?: string;
    actorId?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
  }): Promise<LedgerEvent[]> {
    try {
      const params = new URLSearchParams();
      if (filters.source) params.append('source', filters.source);
      if (filters.eventType) params.append('event_type', filters.eventType);
      if (filters.assetId) params.append('asset_id', filters.assetId);
      if (filters.anchorId) params.append('anchor_id', filters.anchorId);
      if (filters.actorId) params.append('actor_id', filters.actorId);
      if (filters.startDate) params.append('start_date', filters.startDate);
      if (filters.endDate) params.append('end_date', filters.endDate);
      if (filters.limit) params.append('limit', filters.limit.toString());

      const response = await fetch(`${LEDGER_API_URL}/events?${params}`);
      
      if (!response.ok) {
        console.warn(`[LEDGER] Query events failed: ${response.status}`);
        return [];
      }

      const data = await response.json() as any;
      return (data.data?.events || data.events || []).map(this.mapEvent);
    } catch (error) {
      console.error('[LEDGER] Query events error:', error);
      return [];
    }
  }

  /**
   * Build complete provenance timeline for an asset
   */
  async buildProvenanceTimeline(assetId: string): Promise<ProvenanceTimeline> {
    const events = await this.getAssetEvents(assetId);
    
    if (events.length === 0) {
      return {
        assetId,
        totalEvents: 0,
        firstSeen: '',
        lastSeen: '',
        sources: [],
        chainIntegrity: 'unverified',
        events: [],
      };
    }

    // Sort by sequence number
    events.sort((a, b) => a.sequenceNumber - b.sequenceNumber);

    // Extract unique sources
    const sources = [...new Set(events.map(e => e.source))];

    // Verify chain integrity
    let chainIntegrity: 'verified' | 'broken' = 'verified';
    for (let i = 1; i < events.length; i++) {
      if (events[i].previousHash && events[i].previousHash !== events[i - 1].entryHash) {
        chainIntegrity = 'broken';
        break;
      }
    }

    return {
      assetId,
      totalEvents: events.length,
      firstSeen: events[0].createdAt,
      lastSeen: events[events.length - 1].createdAt,
      sources,
      chainIntegrity,
      events,
    };
  }

  /**
   * Verify ledger integrity
   */
  async verifyIntegrity(): Promise<{ valid: boolean; totalEntries: number; lastVerified: string }> {
    try {
      const response = await fetch(`${LEDGER_API_URL}/integrity/verify`);
      
      if (!response.ok) {
        return { valid: false, totalEntries: 0, lastVerified: new Date().toISOString() };
      }

      const data = await response.json() as any;
      return {
        valid: data.data?.valid ?? data.valid ?? false,
        totalEntries: data.data?.totalEntries ?? data.total_entries ?? 0,
        lastVerified: data.data?.verifiedAt ?? data.verified_at ?? new Date().toISOString(),
      };
    } catch (error) {
      console.error('[LEDGER] Integrity check error:', error);
      return { valid: false, totalEntries: 0, lastVerified: new Date().toISOString() };
    }
  }

  private mapEvent(e: any): LedgerEvent {
    return {
      eventId: e.event_id || e.eventId,
      source: e.source,
      eventType: e.event_type || e.eventType,
      assetId: e.asset_id || e.assetId,
      anchorId: e.anchor_id || e.anchorId,
      actorId: e.actor_id || e.actorId,
      correlationId: e.correlation_id || e.correlationId,
      payload: e.payload || {},
      payloadHash: e.payload_hash || e.payloadHash,
      entryHash: e.entry_hash || e.entryHash,
      previousHash: e.previous_hash || e.previousHash,
      sequenceNumber: e.sequence_number || e.sequenceNumber,
      createdAt: e.created_at || e.createdAt,
    };
  }
}

// Singleton
let ledgerClientInstance: LedgerClient | null = null;

export function getLedgerClient(): LedgerClient {
  if (!ledgerClientInstance) {
    ledgerClientInstance = new LedgerClient();
  }
  return ledgerClientInstance;
}
