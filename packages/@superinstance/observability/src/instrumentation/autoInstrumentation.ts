/**
 * Auto Instrumentation - Automatic Instrumentation Setup
 *
 * Provides automatic instrumentation for common libraries and frameworks.
 * Includes HTTP, fetch, WebSocket, and database instrumentation.
 */

import { registerInstrumentations } from '@opentelemetry/instrumentation';
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http';
import { FetchInstrumentation } from '@opentelemetry/instrumentation-fetch';
import { WebSocketInstrumentation } from '@opentelemetry/instrumentation-ws';
import { PropsInterface } from '@opentelemetry/instrumentation-fetch/build/src/types';

import type { ObservabilityConfig, ServiceIdentity } from '../types';
import { Tracer } from '../tracing/Tracer';
import { Logger } from '../logging/Logger';
import { MetricsManager } from '../metrics/Metrics';

// ============================================================================
// AutoInstrumentation Class
// ============================================================================

export class AutoInstrumentation {
  private config: ObservabilityConfig;
  private tracer: Tracer;
  private logger: Logger;
  private metrics: MetricsManager;

  constructor(
    service: ServiceIdentity,
    config: ObservabilityConfig
  ) {
    this.config = config;

    // Initialize components
    this.tracer = new Tracer(service);
    this.logger = new Logger(service.name, config.logging);
    this.metrics = new MetricsManager(service, config.metrics);

    // Register instrumentations
    this.register();
  }

  /**
   * Register all instrumentations
   */
  private register(): void {
    const instrumentations = [];

    // HTTP instrumentation
    if (this.hasInstrumentation('http')) {
      instrumentations.push(
        new HttpInstrumentation({
          applyCustomAttributesOnSpan: (span) => {
            this.applyCustomAttributes(span);
          },
        })
      );
    }

    // Fetch instrumentation
    if (this.hasInstrumentation('fetch')) {
      const fetchOptions: PropsInterface = {
        enableRequestTracking: true,
        enableResponseTracking: true,
        applyCustomAttributesOnSpan: (span) => {
          this.applyCustomAttributes(span);
        },
      };

      instrumentations.push(new FetchInstrumentation(fetchOptions));
    }

    // WebSocket instrumentation
    if (this.hasInstrumentation('ws')) {
      instrumentations.push(
        new WebSocketInstrumentation({
          applyCustomAttributesOnSpan: (span) => {
            this.applyCustomAttributes(span);
          },
        })
      );
    }

    // Register instrumentations
    if (instrumentations.length > 0) {
      registerInstrumentations({
        instrumentations,
      });

      this.logger.info('Auto-instrumentation registered', {
        instrumentations: instrumentations.map((i) => i.instrumentationName),
      });
    }
  }

  /**
   * Check if instrumentation is enabled
   */
  private hasInstrumentation(type: string): boolean {
    return (
      this.config.tracing?.instrumentations?.some(
        (i) => i.type === type && i.enabled
      ) ?? true
    );
  }

  /**
   * Apply custom attributes to spans
   */
  private applyCustomAttributes(span: any): void {
    // Add correlation context
    const correlation = this.logger.getCorrelationContext();
    if (correlation.correlationId) {
      span.setAttribute('app.correlation.id', correlation.correlationId);
    }
    if (correlation.sessionId) {
      span.setAttribute('app.session.id', correlation.sessionId);
    }
    if (correlation.userId) {
      span.setAttribute('app.user.id', correlation.userId);
    }
    if (correlation.projectId) {
      span.setAttribute('app.project.id', correlation.projectId);
    }
  }

  // ========================================================================
  // Public API
  // ========================================================================

  /**
   * Get tracer instance
   */
  getTracer(): Tracer {
    return this.tracer;
  }

  /**
   * Get logger instance
   */
  getLogger(): Logger {
    return this.logger;
  }

  /**
   * Get metrics instance
   */
  getMetrics(): MetricsManager {
    return this.metrics;
  }
}

// ============================================================================
// Factory Function
// ============================================================================

export function setupAutoInstrumentation(
  service: ServiceIdentity,
  config: ObservabilityConfig
): AutoInstrumentation {
  return new AutoInstrumentation(service, config);
}
