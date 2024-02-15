import { expect, it } from 'vitest'
import { retry } from './retry'

it('should retry the function and succeed', async () => {
    let attempt = 0
    const mockFn = async () => {
        if (attempt < 1) {
            attempt++
            throw new Error('Temporary failure')
        }
        return 'Success'
    }

    const result = await retry(mockFn)

    expect(result).toBe('Success')
})

it('should retry the function and fail', async () => {
    const mockFn = async () => {
        throw new Error('Temporary failure')
    }

    await expect(retry(mockFn)).rejects.toThrow('Temporary failure')
})
