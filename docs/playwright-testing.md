# Playwright E2E Testing Guide

This document explains how to run the Playwright end-to-end tests for the FeatureBoard SDKs.

## Overview

The Playwright tests verify that the OpenFeature React SDK integration works correctly across different browsers (Chromium, Firefox, WebKit). The tests run against a test React app that demonstrates feature flag functionality.

## Prerequisites

- Node.js 18+ and pnpm installed
- All dependencies installed (`pnpm install` from root)
- Playwright browsers installed (`npx playwright install`)

## Quick Start

### Option 1: Use Nx Commands (Recommended)

```bash
# Run all e2e tests
nx run e2e

# Or use the npm script
pnpm test:e2e
```

This will automatically:

1. Start the test app on the correct port
2. Run all Playwright tests
3. Generate a test report
4. Clean up the test app

### Option 2: Use Bootstrap Scripts (Backup)

If you encounter issues with the Nx commands, you can use the backup bootstrap scripts:

```bash
# Node.js bootstrap script
pnpm test:e2e:bootstrap

# Bash bootstrap script (Unix systems)
pnpm test:e2e:bootstrap:sh
```

These scripts provide the same functionality but use a different approach to starting the test app and running tests.

### Option 3: Manual Process

#### Step 1: Start the Test App

```bash
# Navigate to the test app directory
cd apps/test-app

# Start the development server
pnpm dev
```

The app will start on `http://localhost:3000/` (or the next available port if 3000 is in use).

#### Step 2: Run the Playwright Tests

In a new terminal, from the project root:

```bash
# Run all tests
npx playwright test

# Run with verbose output
npx playwright test --reporter=list

# Run in headed mode (see browser)
npx playwright test --headed

# Run specific browser
npx playwright test --project=chromium
```

#### Step 3: View Test Results

```bash
# Open the HTML report
npx playwright show-report
```

## Available Nx Commands

The following Nx targets are available for running e2e tests:

```bash
# Basic e2e tests
nx run e2e

# Run tests in headed mode
nx run e2e:headed
pnpm test:e2e:headed

# Run tests in debug mode
nx run e2e:debug
pnpm test:e2e:debug

# Run tests with Playwright UI
nx run e2e:ui
pnpm test:e2e:ui
```

## Test Configuration

### Playwright Config (`playwright.config.ts`)

- **Test Directory**: `./e2e`
- **Base URL**: `http://localhost:3000`
- **Browsers**: Chromium, Firefox, WebKit
- **Web Server**: Automatically starts `npm run start:test-app`

### Test App Configuration (`apps/test-app/`)

- **Framework**: React 19 + Vite
- **Feature Flags**: OpenFeature React SDK integration
- **Environment**: Uses `test-key` as fallback environment key

## Test Scenarios

The tests verify:

1. **Default Values**: Features display default values when not configured
2. **Boolean Flags**: Boolean feature flags show/hide content correctly
3. **String Flags**: String feature flags display custom values
4. **Number Flags**: Number feature flags display custom values
5. **Error Handling**: API errors are handled gracefully

## Troubleshooting

### Common Issues

#### 1. React Version Mismatch

**Error**: `Cannot read properties of undefined (reading 'S')`

**Solution**: Ensure React and React DOM versions match in `apps/test-app/package.json`:

```json
{
  "dependencies": {
    "react": "^19.1.0",
    "react-dom": "^19.1.0"
  }
}
```

#### 2. Process Not Defined

**Error**: `Uncaught ReferenceError: process is not defined`

**Solution**: Ensure `apps/test-app/vite.config.ts` includes:

```typescript
define: {
  'process.env': {},
  global: 'globalThis',
}
```

#### 3. Port Already in Use

**Message**: `Port 3000 is in use, trying another one...`

**Solution**: The app will automatically find the next available port. Update the Playwright config if needed.

#### 4. 401 Unauthorized Errors

**Error**: `GET https://client.featureboard.app/effective?audiences= 401 (Unauthorized)`

**Expected**: This is normal when using the test environment key. The app falls back to default values.

### Debugging

#### Run Tests in Debug Mode

```bash
nx run e2e:debug
```

#### Run with UI

```bash
nx run e2e:ui
```

#### Check Test App Manually

1. Start the test app: `cd apps/test-app && pnpm dev`
2. Open `http://localhost:3000/` in browser
3. Check browser console for errors
4. Verify feature flag components are visible

## Test App Structure

```
apps/test-app/
├── src/
│   ├── App.tsx          # Main test app with feature flags
│   ├── main.tsx         # React entry point
│   └── index.css        # Styles
├── package.json         # Dependencies and scripts
├── vite.config.ts       # Vite configuration
└── tsconfig.json        # TypeScript configuration
```

## Continuous Integration

The tests are configured to run in CI environments with:

- Retry logic for flaky tests
- HTML report generation
- Screenshot capture on failure
- Video recording for debugging

## Maintenance

### Updating Dependencies

When updating React or other dependencies:

1. Update versions in `apps/test-app/package.json`
2. Run `pnpm install` in the test app directory
3. Verify the app still starts correctly
4. Run the Playwright tests to ensure everything works

### Adding New Tests

1. Add test files to the `e2e/` directory
2. Follow the existing test patterns
3. Use `data-testid` attributes for reliable element selection
4. Test across all browsers (Chromium, Firefox, WebKit)

## Additional Resources

- [Playwright Documentation](https://playwright.dev/)
- [OpenFeature React SDK](https://openfeature.dev/docs/reference/technologies/client/react)
- [FeatureBoard Documentation](https://docs.featureboard.app/)
- [FeatureBoard React SDK](https://docs.featureboard.app/docs/react-sdk)
