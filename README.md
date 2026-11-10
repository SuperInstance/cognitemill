# Cognitemill

Educational tooling for the SuperInstance ecosystem, built on the
**Theia IDE** extension platform.

## Structure

```
apps/
  theia-ide/extensions/si-educator/src/browser/
    educator-frontend-module.ts      # Theia frontend module for the SI Educator
docs/
  education/CLASSROOM_TOOLS.md       # classroom tooling documentation
  testing/                           # testing docs
packages/
  @superinstance/awakening/          # awakening runtime
  @superinstance/minimax-integration/ # MiniMax provider integration
  @superinstance/observability/      # auto-instrumentation
  @superinstance/ui-components/      # shared UI (diff viewer)
  event-bus/                         # event emitter
  shared/di/                         # dependency injection
  simulation-visual/                 # visual editor
scripts/
  security/verify-deployment.js      # deployment verification
```

## Provenance

Recovered from `projects/cognitemill/` on 2026-11-09. This content was not
previously present in any public repository.
