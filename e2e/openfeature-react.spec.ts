import { expect, test } from '@playwright/test'

const testFeatures = {
    booleanFeature: {
        key: 'new-feature',
        defaultValue: false,
        enabledValue: true,
        disabledValue: false,
    },
    stringFeature: {
        key: 'welcome-message',
        defaultValue: 'Hello!',
        customValue: 'Welcome to our new experience!',
    },
    numberFeature: {
        key: 'max-items',
        defaultValue: 10,
        customValue: 25,
    },
    userTypeFeature: {
        key: 'user-type',
        defaultValue: 'standard',
        premiumValue: 'premium',
    },
}

test.describe('OpenFeature React SDK E2E Tests', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/')
    })

    test('should display default values when features are not configured', async ({
        page,
    }) => {
        await expect(page.getByTestId('welcome-message')).toHaveText(
            testFeatures.stringFeature.defaultValue,
        )
        await expect(page.getByTestId('max-items')).toContainText(
            testFeatures.numberFeature.defaultValue.toString(),
        )
        await expect(page.getByTestId('legacy-feature')).toBeVisible()
        await expect(page.getByTestId('new-feature')).not.toBeVisible()
    })

    test('should display enabled feature when boolean flag is true', async ({
        page,
    }) => {
        await page.route('**/effective-values', async (route) => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    effectiveValues: [
                        {
                            featureKey: testFeatures.booleanFeature.key,
                            value: testFeatures.booleanFeature.enabledValue,
                        },
                    ],
                }),
            })
        })
        await page.reload()
        await expect(page.getByTestId('new-feature')).toBeVisible()
        await expect(page.getByTestId('legacy-feature')).not.toBeVisible()
    })

    test('should display custom string value when string flag is set', async ({
        page,
    }) => {
        await page.route('**/effective-values', async (route) => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    effectiveValues: [
                        {
                            featureKey: testFeatures.stringFeature.key,
                            value: testFeatures.stringFeature.customValue,
                        },
                    ],
                }),
            })
        })
        await page.reload()
        await expect(page.getByTestId('welcome-message')).toHaveText(
            testFeatures.stringFeature.customValue,
        )
    })

    test('should display custom number value when number flag is set', async ({
        page,
    }) => {
        await page.route('**/effective-values', async (route) => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    effectiveValues: [
                        {
                            featureKey: testFeatures.numberFeature.key,
                            value: testFeatures.numberFeature.customValue,
                        },
                    ],
                }),
            })
        })
        await page.reload()
        await expect(page.getByTestId('max-items')).toContainText(
            testFeatures.numberFeature.customValue.toString(),
        )
    })

    test('should handle API errors gracefully', async ({ page }) => {
        await page.route('**/effective-values', async (route) => {
            await route.fulfill({
                status: 500,
                contentType: 'application/json',
                body: JSON.stringify({ error: 'Internal Server Error' }),
            })
        })
        await page.reload()
        await expect(page.getByTestId('welcome-message')).toHaveText(
            testFeatures.stringFeature.defaultValue,
        )
        await expect(page.getByTestId('legacy-feature')).toBeVisible()
    })
})
