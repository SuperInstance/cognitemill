/**
 * SuperInstance.AI - Dependency Injection System
 *
 * A lightweight, featureful dependency injection framework designed for
 * loose coupling in the SuperInstance.AI platform.
 *
 * @packageDocumentation
 */

// Core types and interfaces
export type {
  // DI Core
  DIContainer,
  DIContainerOptions,
  ServiceIdentifier,
  Binding,
  Scope,

  // Service Interfaces
  ISecurityService,
  ILoggingService,
  IConfigService,
  IHttpService,
  IStorageService,
  IMetricsService,
  IAgentService,
  IMemoryService,
  IEventBus,
  IValidationService,

  // Supporting Types
  IDisposable,
  InjectableMetadata,
  SecurityEvent,
  ValidationOptions,
  ValidationResult,
  AgentState,
  AgentTask,
  TaskResult,
  Memory,
  DomainEvent,
  EventHandler,
  ValidationSchema,

  // Error Types
  ServiceNotFoundError,
  CircularDependencyError,
  ServiceResolutionError,
} from './types.js';

// Enums
export { Scope } from './types.js';

// Core implementation
export {
  DIContainerImpl,
  getRootContainer,
  resetRootContainer,
  registerService,
  registerServiceClass,
  registerServiceValue,
  resolveService,
  hasService,
  unregisterService,
} from './DIContainer.js';

// Decorators
export {
  Injectable,
  inject,
  ScopeDecorator,
  named,
  isInjectable,
  getInjectableMetadata,
  getInjectMetadata,
  setInjectMetadata,
  getInjectIdentifier,
  getScope,
  isServiceIdentifier,
  isNewable,
  getConstructorParams,
  resolveConstructorParam,
  autoRegister,
} from './decorators.js';
