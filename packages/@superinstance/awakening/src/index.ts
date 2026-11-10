/**
 * @superinstance/awakening - Creative Awakening System
 *
 * Transform novices into confident creators through inspiring experiences.
 *
 * @example
 * ```tsx
 * import { AwakeningProvider, useAwakening } from '@superinstance/awakening';
 *
 * function App() {
 *   return (
 *     <AwakeningProvider>
 *       <YourApp />
 *     </AwakeningProvider>
 *   );
 * }
 * ```
 */

// Core
export type {
  AwakeningStage,
  CreatorPersona,
  AwakeningEventType,
  AwakeningMetrics,
  AwakeningExperience,
  DiscoveryPath,
  DiscoveryStage,
  FirstWonderConfig,
  ShowcaseItem,
  InspirationFeed,
  AwakeningState,
  AwakeningRecommendation,
} from './core/types';

export { AwakeningEngine } from './core/AwakeningEngine';

// Mechanics
export {
  Celebration,
  CelebrationPortal,
  useCelebration,
} from './mechanics/CelebrationSystem';

export {
  FirstWonder,
  useFirstWonder,
} from './mechanics/FirstWonder';

// Discovery
export {
  ProgressiveDiscovery,
  useProgressiveDiscovery,
} from './discovery/ProgressiveDiscovery';

// Utils
export { createAwakeningClient } from './utils/client';
