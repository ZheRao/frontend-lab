// features/crops/cropsApi.test.js

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { getCrops } from './cropsApi'
import { ApiError } from '../../ApiError'

const CROPS_URL = 'http://127.0.0.1:8000/definitions/crops'

const apiCrop = {
    id: 1, name: 'Durum', modified_by: 'Zhe', modified_at: '2026-11-16T10:00:00Z',
}

const fakeReply = (body, status) => new Response(JSON.stringify(body), { status })

const expectRefreshError = async (promise) => {
    const error = await promise.then(
        () => { throw new Error('Expected the promise to reject, but it resolved') },
        (err) => err,
    )
    expect(error).toBeInstanceOf(ApiError)
    expect(error).toMatchObject({ type: 'refresh', code: 'REFRESH_ERROR' })
    expect(error.cause).toBeDefined()
}

beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
})

afterEach(() => {
    vi.unstubAllGlobals()
})

describe('getCrops', () => {
    it('requests the crops endpoint', async () => {
        fetch.mockResolvedValue(fakeReply([apiCrop], 200))

        await getCrops()

        expect(fetch).toHaveBeenCalledTimes(1)
        expect(fetch).toHaveBeenCalledWith(CROPS_URL)
    })

    it('returns valid crops unchanged and in order', async () => {
        const second = { ...apiCrop, id: 2, name: 'Canola' }
        fetch.mockResolvedValue(fakeReply([apiCrop, second], 200))

        await expect(getCrops()).resolves.toEqual([apiCrop, second])
    })

    it('returns [] for an empty list', async () => {
        fetch.mockResolvedValue(fakeReply([], 200))

        await expect(getCrops()).resolves.toEqual([])
    })

    it.each([500, 503, 404])('a %i gives REFRESH_ERROR', async (status) => {
        fetch.mockResolvedValue(fakeReply([], status))

        await expectRefreshError(getCrops())
    })

    it('a network failure gives REFRESH_ERROR', async () => {
        fetch.mockRejectedValue(new TypeError('Failed to fetch'))

        await expectRefreshError(getCrops())
    })

    it('a body that is not an array gives REFRESH_ERROR', async () => {
        fetch.mockResolvedValue(fakeReply({ crops: [apiCrop] }, 200))

        await expectRefreshError(getCrops())
    })

    it('malformed JSON gives REFRESH_ERROR', async () => {
        fetch.mockResolvedValue(new Response('not JSON', { status: 200 }))

        await expectRefreshError(getCrops())
    })

    it.each([
        ['a string id', { id: '1' }],
        ['a zero id', { id: 0 }],
        ['a missing name', { name: undefined }],
        ['a non-string name', { name: 42 }],
        ['a non-string modified_by', { modified_by: null }],
        ['a missing modified_at', { modified_at: undefined }],
    ])('rejects the whole list when one crop has %s', async (_description, override) => {
        fetch.mockResolvedValue(fakeReply([apiCrop, { ...apiCrop, ...override }], 200))

        await expectRefreshError(getCrops())
    })
})