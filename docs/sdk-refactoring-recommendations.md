# FeatureBoard SDK Refactoring Recommendations

## Executive Summary

This document analyzes the current FeatureBoard SDK monorepo structure and provides recommendations for simplification, deduplication, and improved maintainability.

**Key Findings:**
- ~82 source files across 8 packages (excluding tests)
- Significant code duplication between js-sdk and node-sdk
- Inconsistent patterns across packages
- Opportunities to extract ~300 lines into shared core

---

## Current Architecture

```
@featureboard/contracts        (4 files)  - Types & error classes
@featureboard/live-connection  (5 files)  - WebSocket handling
@featureboard/js-sdk          (27 files)  - Browser client
@featureboard/node-sdk        (21 files)  - Server client  
@featureboard/react-sdk        (5 files)  - React hooks
@featureboard/api-authentication (5 files) - Auth helpers
@featureboard/code-generator   (9 files)  - Code gen CLI
@featureboard/openfeature-node-provider (6 files) - OpenFeature adapter
```

### Dependency Graph

```
contracts ◄─────────────────────────────┐
    │                                   │
    ▼                                   │
live-connection ◄──────┐                │
    │                  │                │
    ▼                  │                │
js-sdk ◄───────────────┼────────────────┤
    │                  │                │
    ├──────────────────┼───► node-sdk ──┘
    │                  │         │
    │                  │         ▼
    │                  │    openfeature-node-provider
    │                  │
    ▼                  │
react-sdk ◄────────────┘
```

---

## Code Duplication Analysis

### 1. HTTP Error Handling (429 Response) - HIGH PRIORITY

**Location:** Identical ~25 lines in both files
- `libs/js-sdk/src/utils/fetchFeaturesConfiguration.ts` (lines 33-58)
- `libs/node-sdk/src/utils/fetchFeaturesConfiguration.ts` (lines 28-53)

```typescript
// DUPLICATED CODE - handle 429 Too Many Requests
if (response.status === 429) {
    const retryAfterHeader = response.headers.get('Retry-After')
    const retryAfterInt = retryAfterHeader
        ? parseInt(retryAfterHeader, 10)
        : 60
    const retryAfter = retryAfterHeader && !retryAfterInt
        ? new Date(retryAfterHeader)
        : new Date()

    if (retryAfterInt) {
        const retryAfterTime = retryAfter.getTime() + retryAfterInt * 1000
        retryAfter.setTime(retryAfterTime)
    }

    throw new TooManyRequestsError(...)
}
```

**Recommendation:** Extract to `@featureboard/core/http/handle-rate-limit.ts`

---

### 2. Polling Updates Logic - MEDIUM PRIORITY

**Location:** Similar implementations
- `libs/js-sdk/src/utils/pollingUpdates.ts`
- `libs/node-sdk/src/utils/pollingUpdates.ts`

Both implement interval-based update polling with slight variations.

**Recommendation:** Create `@featureboard/core/polling.ts` with configurable options

---

### 3. Interval Utilities - LOW PRIORITY

**Location:**
- `libs/js-sdk/src/interval.ts` (8 lines - browser-compatible)
- `libs/node-sdk/src/interval.ts` (4 lines - Node-only)

```typescript
// js-sdk - handles browser context
export const interval = {
    set: typeof window !== 'undefined' ? setInterval.bind(window) : setInterval,
    clear: typeof window !== 'undefined' ? clearInterval.bind(window) : clearInterval,
}

// node-sdk - simpler
export const interval = {
    set: setInterval,
    clear: clearInterval,
}
```

**Recommendation:** Use js-sdk version everywhere (it handles both contexts)

---

### 4. Debug Logging Pattern - LOW PRIORITY

**Location:** Each package has its own `log.ts`:
- `libs/js-sdk/src/log.ts`
- `libs/node-sdk/src/log.ts`
- `libs/react-sdk/src/log.ts`
- `libs/live-connection/src/log.ts`
- `libs/openfeature-node-provider/src/log.ts`

All follow the same pattern:
```typescript
import debug from 'debug'
export const debugLog = debug('@featureboard/<package-name>')
```

**Recommendation:** Could create factory in core, but low value - current approach is fine

---

### 5. Update Strategy Implementations - MEDIUM PRIORITY

**Location:**
- `libs/js-sdk/src/update-strategies/` (7 files)
- `libs/node-sdk/src/update-strategies/` (8 files)

Similar patterns for:
- Manual strategy
- Polling strategy
- Live strategy (WebSocket)
- On-request strategy (node-sdk only)

**Key Differences:**
| Aspect | js-sdk | node-sdk |
|--------|--------|----------|
| State Store | `EffectiveFeatureStateStore` | `AllFeatureStateStore` |
| Endpoint | `/effective?audiences=...` | `/all` |
| Audience Handling | Client-side | Server evaluates per-request |

**Recommendation:** Extract common strategy interface and base implementations

---

### 6. HTTP Client Debug Logging - LOW PRIORITY

**Location:**
- `libs/js-sdk/src/utils/http-log.ts`
- `libs/node-sdk/src/utils/http-log.ts`

Identical files:
```typescript
import { debugLog } from '../log'
export const httpClientDebug = debugLog.extend('http-client')
```

**Recommendation:** Minor - could share but not worth the complexity

---

## Bloat / Complexity Issues

### 1. js-sdk createBrowserClient (218 lines) - HIGH

**File:** `libs/js-sdk/src/create-browser-client.ts`

**Issues:**
- Single function with too many responsibilities
- Nested promise handling is complex
- `updateAudiences()` logic is intertwined with initialization

**Recommendation:** Split into:
- `browser-client-factory.ts` - Factory function
- `browser-client-state.ts` - Initialization state machine
- `audience-updater.ts` - Audience update logic

---

### 2. node-sdk server-client (208 lines) - MEDIUM

**File:** `libs/node-sdk/src/server-client.ts`

**Issues:**
- `syncRequest()` is embedded in same file
- `addUserWarnings()` is a workaround for async ergonomics
- Mixed concerns: client creation, request handling, state management

**Recommendation:** Split into:
- `server-client-factory.ts`
- `request-client.ts`

---

### 3. live-connection (258 lines) - MEDIUM

**File:** `libs/live-connection/src/live-connection.ts`

**Issues:**
- Complex reconnection logic
- Ping/pong handling mixed with business logic
- Hard to test individual behaviors

**Recommendation:** Extract:
- `websocket-connection.ts` - Low-level connection management
- `reconnection-strategy.ts` - Retry/backoff logic
- `message-handler.ts` - Message parsing

---

### 4. Exported Internal APIs - LOW

**File:** `libs/js-sdk/src/index.ts`

```typescript
// TODO We should make these 'internal' and not export them
export { createEnsureSingleWithBackoff } from './ensure-single'
export { featureBoardHostedService } from './featureboard-service-urls'
export { retry } from './utils/retry'
```

**Issues:**
- These are implementation details used by node-sdk
- Breaking changes to these affect node-sdk

**Recommendation:** Move to `@featureboard/core` as internal shared code

---

## Inconsistencies

### 1. Package.json Configurations

| Package | Type | Exports Pattern | Build Tool |
|---------|------|-----------------|------------|
| js-sdk | `module` | publishConfig.exports | tsup |
| node-sdk | `module` | publishConfig.exports | tsup |
| react-sdk | `module` | publishConfig.exports | tsup |
| contracts | `module` | publishConfig.exports | tsup |
| live-connection | `module` | publishConfig.exports | tsup |
| code-generator | (missing) | - | tsc only |
| api-authentication | (missing) | - | tsc only |

**Recommendation:** Standardize all packages to use same build configuration

---

### 2. ESLint Configurations

Some packages use `.eslintrc.cjs`, others use `.eslintrc.json`. The openfeature-node-provider was missing an eslint config entirely.

**Recommendation:** Standardize on `.eslintrc.cjs` for all packages

---

### 3. Test File Patterns

| Package | Test Location | Naming |
|---------|--------------|--------|
| js-sdk | `src/tests/` | `*.spec.ts` |
| node-sdk | `src/tests/` | `*.spec.ts` |
| react-sdk | `src/tests/` | `*.spec.tsx` |
| contracts | (no tests) | - |
| live-connection | `src/__tests__/` | `*.spec.ts` |

**Recommendation:** Standardize on `src/tests/*.spec.ts`

---

## Proposed New Structure

### Option A: Internal Core Package (Recommended)

```
libs/
├── core/                    # NEW - Internal shared code
│   ├── package.json         # private: true
│   ├── src/
│   │   ├── http/
│   │   │   ├── handle-rate-limit.ts
│   │   │   ├── fetch-with-etag.ts
│   │   │   └── http-log.ts
│   │   ├── retry.ts
│   │   ├── interval.ts
│   │   ├── polling.ts
│   │   └── index.ts
│   
├── contracts/               # Types (published)
├── live-connection/         # WebSocket (published, slimmed)
├── js-sdk/                  # Browser (published, uses core)
├── node-sdk/                # Server (published, uses core)
├── react-sdk/               # React (published)
├── openfeature-node-provider/ # OpenFeature (published)
├── openfeature-core/        # Future - shared OpenFeature utils
├── api-authentication/      # Auth helpers (published)
└── code-generator/          # CLI (published)
```

### Migration Steps

1. Create `libs/core/` with shared code
2. Update js-sdk to import from core
3. Update node-sdk to import from core (stop importing from js-sdk)
4. Remove duplicated code from js-sdk and node-sdk
5. Update build to bundle core into published packages

---

## Priority Recommendations

### High Priority (Do First)
| Item | Effort | Impact | Description |
|------|--------|--------|-------------|
| Extract 429 handling | 2h | High | Remove copy-pasted HTTP error code |
| Fix exported internals | 1h | High | Stop exposing implementation details |
| Add missing eslint configs | 30m | Medium | openfeature-node-provider needs .eslintrc.cjs |

### Medium Priority (Next Sprint)
| Item | Effort | Impact | Description |
|------|--------|--------|-------------|
| Create core package | 4h | High | Foundation for deduplication |
| Split createBrowserClient | 4h | Medium | Improve maintainability |
| Standardize build configs | 2h | Medium | Consistent package.json across packages |
| Consolidate interval.ts | 1h | Low | Minor deduplication |

### Low Priority (Backlog)
| Item | Effort | Impact | Description |
|------|--------|--------|-------------|
| Split live-connection | 6h | Medium | Better testability |
| Split server-client | 3h | Medium | Better maintainability |
| Standardize test patterns | 2h | Low | Consistency |
| Extract polling logic | 3h | Low | Minor deduplication |

---

## Estimated Impact

### Lines of Code Reduction
- 429 handling extraction: ~50 lines (25 duplicated)
- Interval consolidation: ~8 lines
- HTTP log consolidation: ~6 lines
- **Total deduplication: ~65 lines**

### Complexity Reduction
- Split createBrowserClient: 218 → 3 files @ ~80 lines each
- Split server-client: 208 → 2 files @ ~100 lines each
- **Result:** Smaller, focused files easier to understand and test

### Maintenance Benefits
- Single place to fix HTTP error handling bugs
- Clear separation between published API and internal implementation
- Consistent patterns across all packages

---

## Questions to Consider

1. **Do we need both js-sdk and node-sdk?**
   - They serve different purposes (browser vs server)
   - Different state models (effective values vs all features)
   - Keep separate but share more code

2. **Should contracts be expanded?**
   - Currently just types and error classes
   - Could include more shared types
   - Keep focused on API contracts only

3. **Is api-authentication still needed?**
   - Small package (5 files)
   - Used for CLI authentication
   - Could be merged into code-generator if only used there

4. **Should we version core?**
   - No - keep as internal private package
   - Gets bundled into published packages
   - No semver concerns

---

## Next Steps

1. Review this document with the team
2. Decide on priority items to tackle
3. Create issues/tasks for approved items
4. Start with high-priority, low-effort wins
5. Plan medium-priority items for next sprint

---

*Generated: January 2, 2026*
