#!/usr/bin/env node

const { spawn, execSync } = require('child_process')
const path = require('path')
const fs = require('fs')

console.log('🚀 Starting Playwright E2E Test Bootstrap...\n')

// Configuration
const TEST_APP_DIR = path.join(__dirname, '..', 'apps', 'test-app')
const ROOT_DIR = path.join(__dirname, '..')

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
}

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

function logStep(step) {
  log(`\n📋 ${step}`, 'blue')
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green')
}

function logError(message) {
  log(`❌ ${message}`, 'red')
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow')
}

// Check if we're in the right directory
if (!fs.existsSync(TEST_APP_DIR)) {
  logError(
    'Test app directory not found. Please run this script from the project root.',
  )
  process.exit(1)
}

// Step 1: Check dependencies
logStep('Checking dependencies...')
try {
  execSync('pnpm install', { cwd: ROOT_DIR, stdio: 'inherit' })
  logSuccess('Dependencies installed')
} catch (error) {
  logError('Failed to install dependencies')
  process.exit(1)
}

// Step 2: Install Playwright browsers if not already installed
logStep('Checking Playwright browsers...')
try {
  execSync('npx playwright install', { cwd: ROOT_DIR, stdio: 'inherit' })
  logSuccess('Playwright browsers ready')
} catch (error) {
  logError('Failed to install Playwright browsers')
  process.exit(1)
}

// Step 3: Verify test app dependencies
logStep('Verifying test app dependencies...')
try {
  execSync('pnpm install', { cwd: TEST_APP_DIR, stdio: 'inherit' })
  logSuccess('Test app dependencies ready')
} catch (error) {
  logError('Failed to install test app dependencies')
  process.exit(1)
}

// Step 4: Start the test app
logStep('Starting test app...')
let testAppProcess

try {
  testAppProcess = spawn('pnpm', ['dev'], {
    cwd: TEST_APP_DIR,
    stdio: 'pipe',
    shell: true,
  })

  // Wait for the app to start
  let appStarted = false
  let startupTimeout

  testAppProcess.stdout.on('data', (data) => {
    const output = data.toString()
    console.log(output.trim())

    if (output.includes('Local:') && output.includes('http://localhost:')) {
      appStarted = true
      clearTimeout(startupTimeout)
      logSuccess('Test app started successfully')
    }
  })

  testAppProcess.stderr.on('data', (data) => {
    const output = data.toString()
    if (!output.includes('Deprecation') && !output.includes('WARN')) {
      console.log(output.trim())
    }
  })

  // Set a timeout for app startup
  startupTimeout = setTimeout(() => {
    if (!appStarted) {
      logError('Test app failed to start within 30 seconds')
      testAppProcess.kill()
      process.exit(1)
    }
  }, 30000)

  // Wait a bit more for the app to fully initialize
  await new Promise((resolve) => setTimeout(resolve, 5000))
} catch (error) {
  logError('Failed to start test app')
  process.exit(1)
}

// Step 5: Run Playwright tests
logStep('Running Playwright tests...')
try {
  execSync('npx playwright test --reporter=list', {
    cwd: ROOT_DIR,
    stdio: 'inherit',
  })
  logSuccess('Playwright tests completed')
} catch (error) {
  logError('Playwright tests failed')
  testAppProcess.kill()
  process.exit(1)
}

// Step 6: Cleanup
logStep('Cleaning up...')
try {
  testAppProcess.kill()
  logSuccess('Test app stopped')
} catch (error) {
  logWarning('Failed to stop test app cleanly')
}

// Step 7: Show results
logStep('Test Results')
logSuccess('All tests completed!')
log('📊 To view detailed results, run: npx playwright show-report', 'blue')
log('🔧 To run tests in debug mode: npx playwright test --debug', 'blue')
log('🌐 To run tests with UI: npx playwright test --ui', 'blue')

console.log('\n🎉 Bootstrap process completed successfully!')
