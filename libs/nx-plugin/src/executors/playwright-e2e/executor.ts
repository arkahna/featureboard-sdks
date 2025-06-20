import { ExecutorContext, joinPathFragments } from '@nx/devkit'
import { execSync, spawn } from 'child_process'
import { existsSync } from 'fs'

export interface PlaywrightE2EExecutorSchema {
    headed?: boolean
    debug?: boolean
    ui?: boolean
    reporter?: string
    project?: string
    port?: number
}

export async function playwrightE2EExecutor(
    options: PlaywrightE2EExecutorSchema,
    context: ExecutorContext,
) {
    const testAppDir = joinPathFragments(context.root, 'apps', 'test-app')

    if (!existsSync(testAppDir)) {
        throw new Error('Test app directory not found at apps/test-app')
    }

    console.log('🚀 Starting Playwright E2E Tests...\n')

    // Start the test app
    console.log('📋 Starting test app...')
    const testAppProcess = spawn('pnpm', ['dev'], {
        cwd: testAppDir,
        stdio: 'pipe',
        shell: true,
    })

    let appStarted = false
    let startupTimeout: NodeJS.Timeout

    // Wait for app to start
    await new Promise<void>((resolve, reject) => {
        startupTimeout = setTimeout(() => {
            if (!appStarted) {
                testAppProcess.kill()
                reject(new Error('Test app failed to start within 30 seconds'))
            }
        }, 30000)

        testAppProcess.stdout?.on('data', (data) => {
            const output = data.toString()
            console.log(output.trim())

            if (
                output.includes('Local:') &&
                output.includes('http://localhost:')
            ) {
                appStarted = true
                clearTimeout(startupTimeout)
                console.log('✅ Test app started successfully')
                resolve()
            }
        })

        testAppProcess.stderr?.on('data', (data) => {
            const output = data.toString()
            if (!output.includes('Deprecation') && !output.includes('WARN')) {
                console.log(output.trim())
            }
        })

        testAppProcess.on('error', (error) => {
            clearTimeout(startupTimeout)
            reject(error)
        })
    })

    // Wait a bit more for the app to fully initialize
    await new Promise((resolve) => setTimeout(resolve, 3000))

    try {
        // Build Playwright command
        const playwrightArgs = ['test']

        if (options.headed) {
            playwrightArgs.push('--headed')
        }

        if (options.debug) {
            playwrightArgs.push('--debug')
        }

        if (options.ui) {
            playwrightArgs.push('--ui')
        }

        if (options.reporter) {
            playwrightArgs.push(`--reporter=${options.reporter}`)
        } else {
            playwrightArgs.push('--reporter=list')
        }

        if (options.project) {
            playwrightArgs.push(`--project=${options.project}`)
        }

        console.log('📋 Running Playwright tests...')
        console.log(`Command: npx playwright ${playwrightArgs.join(' ')}`)

        execSync(`npx playwright ${playwrightArgs.join(' ')}`, {
            cwd: context.root,
            stdio: 'inherit',
        })

        console.log('✅ Playwright tests completed successfully')

        return {
            success: true,
        }
    } catch (error) {
        console.error('❌ Playwright tests failed')
        throw error
    } finally {
        // Cleanup
        console.log('📋 Cleaning up...')
        try {
            testAppProcess.kill()
            console.log('✅ Test app stopped')
        } catch (error) {
            console.warn('⚠️ Failed to stop test app cleanly')
        }
    }
}

export default playwrightE2EExecutor
