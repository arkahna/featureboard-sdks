import { Page } from '@playwright/test'

export async function mockFeatureBoardAPI(
    page: Page,
    features: Record<string, any>,
) {
    await page.route('**/effective-values', async (route) => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
                effectiveValues: Object.entries(features).map(
                    ([key, value]) => ({
                        featureKey: key,
                        value,
                    }),
                ),
            }),
        })
    })
}

export async function mockContextEvaluation(
    page: Page,
    context: any,
    resolvedAudiences: string[],
) {
    await page.route('**/effective-values/context', async (route) => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
                resolvedAudiences,
                effectiveValues: resolvedAudiences.includes('premium-users')
                    ? [{ featureKey: 'new-feature', value: true }]
                    : [],
            }),
        })
    })
}

export async function mockWebSocketUpdates(
    page: Page,
    updates: Array<{ featureKey: string; value: any }>,
) {
    await page.addInitScript((updates) => {
        global.WebSocket = class MockWebSocket {
            constructor(url: string) {
                this.url = url
                this.readyState = 1
                setTimeout(() => {
                    this.onopen?.({} as Event)
                    // Send updates
                    updates.forEach((update, index) => {
                        setTimeout(
                            () => {
                                this.onmessage?.({
                                    data: JSON.stringify({
                                        type: 'feature-updated',
                                        ...update,
                                    }),
                                } as MessageEvent)
                            },
                            (index + 1) * 200,
                        )
                    })
                }, 100)
            }

            url: string
            readyState: number
            onopen?: (event: Event) => void
            onmessage?: (event: MessageEvent) => void
            close() {}
        }
    }, updates)
}

export async function mockAPIError(
    page: Page,
    status: number = 500,
    error: string = 'Internal Server Error',
) {
    await page.route('**/effective-values', async (route) => {
        await route.fulfill({
            status,
            contentType: 'application/json',
            body: JSON.stringify({ error }),
        })
    })
}

export async function mockSlowAPI(page: Page, delay: number = 2000) {
    await page.route('**/effective-values', async (route) => {
        await new Promise((resolve) => setTimeout(resolve, delay))
        await route.continue()
    })
}
