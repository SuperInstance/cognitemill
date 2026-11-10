/**
 * Event Emitter and Client SDK
 *
 * Client-side SDK for publishing events and managing subscriptions.
 * Provides a simple API for interacting with the event bus.
 *
 * @package @superinstance/event-bus
 */

import type {
  Event,
  EventFilter,
  EventEnvelope,
  Subscription,
  EventHandler,
  EventPriority,
} from './types.js';
import {
  createEvent,
  createDerivedEvent,
  createEventEnvelope,
  validateEvent,
  formatEventForLogging,
} from './utils.js';

// ============================================================================
// Event Emitter Configuration
// ============================================================================

export interface EventEmitterConfig {
  eventBusUrl: string;
  apiKey?: string;
  timeout?: number;
  retryAttempts?: number;
  enableMetrics?: boolean;
  enableTracing?: boolean;
}

// ============================================================================
// Event Emitter Client
// ============================================================================

/**
 * Event Emitter Client
 *
 * Main client for publishing events and managing subscriptions.
 */
export class EventEmitter {
  private config: EventEmitterConfig;
  private WebSocketClient?: WebSocket;
  private messageHandlers: Map<string, EventHandler[]> = new Map();
  private subscriptionIds: Set<string> = new Set();
  private isConnected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  constructor(config: EventEmitterConfig) {
    this.config = {
      timeout: 5000,
      retryAttempts: 3,
      enableMetrics: true,
      enableTracing: true,
      ...config,
    };
  }

  // ============================================================================
  // Connection Management
  // ============================================================================

  /**
   * Connect to event bus via WebSocket
   */
  async connect(): Promise<void> {
    const wsUrl = this.config.eventBusUrl.replace('http', 'ws') + '/ws';

    return new Promise((resolve, reject) => {
      try {
        this.WebSocketClient = new WebSocket(wsUrl);

        this.WebSocketClient.addEventListener('open', () => {
          this.isConnected = true;
          this.reconnectAttempts = 0;
          console.log('[EventEmitter] Connected to event bus');
          resolve();
        });

        this.WebSocketClient.addEventListener('message', (event) => {
          this.handleMessage(event.data);
        });

        this.WebSocketClient.addEventListener('close', () => {
          this.isConnected = false;
          console.log('[EventEmitter] Disconnected from event bus');
          this.attemptReconnect();
        });

        this.WebSocketClient.addEventListener('error', (error) => {
          console.error('[EventEmitter] WebSocket error:', error);
          if (this.reconnectAttempts === 0) {
            reject(error);
          }
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Attempt to reconnect to event bus
   */
  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('[EventEmitter] Max reconnect attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

    console.log(`[EventEmitter] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);

    setTimeout(() => {
      this.connect().catch((error) => {
        console.error('[EventEmitter] Reconnect failed:', error);
      });
    }, delay);
  }

  /**
   * Disconnect from event bus
   */
  disconnect(): void {
    if (this.WebSocketClient) {
      this.WebSocketClient.close();
      this.WebSocketClient = undefined;
      this.isConnected = false;
    }
  }

  // ============================================================================
  // Event Publishing
  // ============================================================================

  /**
   * Publish a single event
   */
  async publish<T = unknown>(
    type: string,
    source: string,
    data: T,
    options?: {
      correlationId?: string;
      causationId?: string;
      priority?: EventPriority;
      ttl?: number;
      metadata?: Record<string, unknown>;
    }
  ): Promise<{ success: boolean; eventId?: string; error?: string }> {
    try {
      const event = createEvent(type, source, data, options);
      const envelope = createEventEnvelope(event, { sign: true });

      if (this.config.enableTracing) {
        console.log('[EventEmitter] Publishing event:', formatEventForLogging(event));
      }

      const response = await fetch(`${this.config.eventBusUrl}/publish`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.config.apiKey && { 'Authorization': `Bearer ${this.config.apiKey}` }),
        },
        body: JSON.stringify(envelope),
        signal: AbortSignal.timeout(this.config.timeout || 5000),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to publish event: ${error}`);
      }

      const result = await response.json();

      if (this.config.enableMetrics) {
        this.recordMetric('event_published', 1, { type, source });
      }

      return result;
    } catch (error) {
      console.error('[EventEmitter] Failed to publish event:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Publish multiple events in batch
   */
  async publishBatch<T = unknown>(
    events: Array<{
      type: string;
      source: string;
      data: T;
      options?: {
        correlationId?: string;
        causationId?: string;
        priority?: EventPriority;
        ttl?: number;
        metadata?: Record<string, unknown>;
      };
    }>
  ): Promise<{ success: boolean; count?: number; error?: string }> {
    try {
      const eventObjects = events.map(e => createEvent(e.type, e.source, e.data, e.options));
      const envelopes = eventObjects.map(e => createEventEnvelope(e, { sign: true }));

      const response = await fetch(`${this.config.eventBusUrl}/publish/batch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.config.apiKey && { 'Authorization': `Bearer ${this.config.apiKey}` }),
        },
        body: JSON.stringify(envelopes),
        signal: AbortSignal.timeout(this.config.timeout || 5000),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to publish batch: ${error}`);
      }

      const result = await response.json();

      if (this.config.enableMetrics) {
        this.recordMetric('events_published', events.length);
      }

      return result;
    } catch (error) {
      console.error('[EventEmitter] Failed to publish batch:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Create and publish a derived event
   */
  async publishDerived<T = unknown>(
    parentEvent: Event,
    type: string,
    source: string,
    data: T,
    options?: {
      priority?: EventPriority;
      ttl?: number;
      metadata?: Record<string, unknown>;
    }
  ): Promise<{ success: boolean; eventId?: string; error?: string }> {
    const event = createDerivedEvent(parentEvent, type, source, data, options);
    const envelope = createEventEnvelope(event, { sign: true });

    try {
      const response = await fetch(`${this.config.eventBusUrl}/publish`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.config.apiKey && { 'Authorization': `Bearer ${this.config.apiKey}` }),
        },
        body: JSON.stringify(envelope),
        signal: AbortSignal.timeout(this.config.timeout || 5000),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to publish derived event: ${error}`);
      }

      return await response.json();
    } catch (error) {
      console.error('[EventEmitter] Failed to publish derived event:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  // ============================================================================
  // Event Subscription
  // ============================================================================

  /**
   * Subscribe to events matching a filter
   */
  async subscribe(
    filter: EventFilter,
    handler: EventHandler
  ): Promise<{ success: boolean; subscriptionId?: string; error?: string }> {
    try {
      if (!this.isConnected || !this.WebSocketClient) {
        throw new Error('Not connected to event bus');
      }

      const subscriberId = crypto.randomUUID();
      const message = {
        type: 'subscribe',
        filter,
        subscriberId,
      };

      this.WebSocketClient.send(JSON.stringify(message));

      // Store handler locally for incoming events
      const filterKey = JSON.stringify(filter);
      if (!this.messageHandlers.has(filterKey)) {
        this.messageHandlers.set(filterKey, []);
      }
      this.messageHandlers.get(filterKey)!.push(handler);

      return { success: true, subscriptionId: subscriberId };
    } catch (error) {
      console.error('[EventEmitter] Failed to subscribe:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Subscribe to specific event types
   */
  async subscribeToTypes(
    types: string[],
    handler: EventHandler
  ): Promise<{ success: boolean; subscriptionId?: string; error?: string }> {
    return this.subscribe({ types }, handler);
  }

  /**
   * Subscribe to events from specific sources
   */
  async subscribeToSources(
    sources: string[],
    handler: EventHandler
  ): Promise<{ success: boolean; subscriptionId?: string; error?: string }> {
    return this.subscribe({ sources }, handler);
  }

  /**
   * Subscribe to events in a correlation chain
   */
  async subscribeToCorrelation(
    correlationId: string,
    handler: EventHandler
  ): Promise<{ success: boolean; subscriptionId?: string; error?: string }> {
    return this.subscribe({ correlationIds: [correlationId] }, handler);
  }

  /**
   * Unsubscribe from events
   */
  async unsubscribe(subscriptionId: string): Promise<void> {
    if (!this.isConnected || !this.WebSocketClient) {
      return;
    }

    const message = {
      type: 'unsubscribe',
      subscriptionId,
    };

    this.WebSocketClient.send(JSON.stringify(message));
    this.subscriptionIds.delete(subscriptionId);
  }

  /**
   * Unsubscribe from all events
   */
  async unsubscribeAll(): Promise<void> {
    for (const subscriptionId of this.subscriptionIds) {
      await this.unsubscribe(subscriptionId);
    }
    this.messageHandlers.clear();
  }

  // ============================================================================
  // Message Handling
  // ============================================================================

  /**
   * Handle incoming WebSocket message
   */
  private async handleMessage(data: string): Promise<void> {
    try {
      const message = JSON.parse(data);

      switch (message.type) {
        case 'event':
          await this.handleEvent(message.event);
          break;
        case 'subscribed':
          this.subscriptionIds.add(message.subscription.id);
          console.log('[EventEmitter] Subscribed:', message.subscription);
          break;
        case 'unsubscribed':
          console.log('[EventEmitter] Unsubscribed:', message.subscriptionId);
          break;
        case 'pong':
          // Handle pong if needed
          break;
        case 'error':
          console.error('[EventEmitter] Error from event bus:', message.message);
          break;
      }
    } catch (error) {
      console.error('[EventEmitter] Failed to handle message:', error);
    }
  }

  /**
   * Handle incoming event
   */
  private async handleEvent(event: Event): Promise<void> {
    if (!validateEvent(event)) {
      console.error('[EventEmitter] Invalid event received:', event);
      return;
    }

    // Find matching handlers
    for (const [filterKey, handlers] of this.messageHandlers.entries()) {
      const filter = JSON.parse(filterKey) as EventFilter;

      // Check if event matches filter
      let matches = true;
      if (filter.types && !filter.types.includes(event.type)) matches = false;
      if (filter.sources && !filter.sources.includes(event.source)) matches = false;
      if (filter.correlationIds && event.correlationId && !filter.correlationIds.includes(event.correlationId)) {
        matches = false;
      }

      if (matches) {
        for (const handler of handlers) {
          try {
            await handler(event);
          } catch (error) {
            console.error('[EventEmitter] Handler error:', error);
          }
        }
      }
    }
  }

  // ============================================================================
  // Event Querying
  // ============================================================================

  /**
   * Query historical events
   */
  async query(params: {
    types?: string[];
    sources?: string[];
    correlationId?: string;
    startTime?: number;
    endTime?: number;
    limit?: number;
  }): Promise<{ success: boolean; events?: Event[]; error?: string }> {
    try {
      const searchParams = new URLSearchParams();
      if (params.types) searchParams.set('types', params.types.join(','));
      if (params.sources) searchParams.set('sources', params.sources.join(','));
      if (params.correlationId) searchParams.set('correlationId', params.correlationId);
      if (params.startTime) searchParams.set('startTime', params.startTime.toString());
      if (params.endTime) searchParams.set('endTime', params.endTime.toString());
      if (params.limit) searchParams.set('limit', params.limit.toString());

      const response = await fetch(`${this.config.eventBusUrl}/query?${searchParams}`, {
        headers: {
          ...(this.config.apiKey && { 'Authorization': `Bearer ${this.config.apiKey}` }),
        },
        signal: AbortSignal.timeout(this.config.timeout || 5000),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to query events: ${error}`);
      }

      return await response.json();
    } catch (error) {
      console.error('[EventEmitter] Failed to query events:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Request event replay
   */
  async replay(params: {
    subscriptionId?: string;
    startTime?: number;
    endTime?: number;
    types?: string[];
  }): Promise<{ success: boolean; replayedCount?: number; error?: string }> {
    try {
      const response = await fetch(`${this.config.eventBusUrl}/replay`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.config.apiKey && { 'Authorization': `Bearer ${this.config.apiKey}` }),
        },
        body: JSON.stringify(params),
        signal: AbortSignal.timeout(this.config.timeout || 5000),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to replay events: ${error}`);
      }

      return await response.json();
    } catch (error) {
      console.error('[EventEmitter] Failed to replay events:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  // ============================================================================
  // Statistics
  // ============================================================================

  /**
   * Get event bus statistics
   */
  async getStats(): Promise<{ success: boolean; stats?: any; error?: string }> {
    try {
      const response = await fetch(`${this.config.eventBusUrl}/stats`, {
        headers: {
          ...(this.config.apiKey && { 'Authorization': `Bearer ${this.config.apiKey}` }),
        },
        signal: AbortSignal.timeout(this.config.timeout || 5000),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to get stats: ${error}`);
      }

      return await response.json();
    } catch (error) {
      console.error('[EventEmitter] Failed to get stats:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Check event bus health
   */
  async healthCheck(): Promise<{ healthy: boolean }> {
    try {
      const response = await fetch(`${this.config.eventBusUrl}/health`, {
        signal: AbortSignal.timeout(2000),
      });

      const data = await response.json();
      return { healthy: data.status === 'healthy' };
    } catch {
      return { healthy: false };
    }
  }

  // ============================================================================
  // Metrics
  // ============================================================================

  /**
   * Record a metric (placeholder for metrics integration)
   */
  private recordMetric(name: string, value: number, tags?: Record<string, string>): void {
    if (!this.config.enableMetrics) return;

    // In production, send to metrics service (e.g., Prometheus, Datadog)
    console.log(`[EventEmitter] Metric: ${name}=${value}`, tags);
  }

  // ============================================================================
  // Utility Methods
  // ============================================================================

  /**
   * Check if connected to event bus
   */
  connected(): boolean {
    return this.isConnected;
  }

  /**
   * Get current subscription IDs
   */
  getSubscriptions(): string[] {
    return Array.from(this.subscriptionIds);
  }
}

// ============================================================================
// Factory Functions
// ============================================================================

/**
 * Create an event emitter client
 */
export function createEventEmitter(config: EventEmitterConfig): EventEmitter {
  return new EventEmitter(config);
}
