// features/revisions/revisionsApi.test.js

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { getRevisions } from './revisionsApi'
import { ApiError } from '../../ApiError'

const REVISIONS_URL = 'http://127.0.0.1:8000/revisions'

const apiRevision = {
    id: 1, name: 'Pre-seeding', revision_order: 1,
    modified_by: 'Zhe', modified_at: '2026-11-16T10:00:00Z',
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

describe('getRevisions', () => {
    it('requests the revisions endpoint', async () => {
        fetch.mockResolvedValue(fakeReply([apiRevision], 200))

        await getRevisions()

        expect(fetch).toHaveBeenCalledTimes(1)
        expect(fetch).toHaveBeenCalledWith(REVISIONS_URL)
    })

    it('returns valid revisions unchanged and in order', async () => {
        const second = { ...apiRevision, id: 2, name: 'Post-seeding', revision_order: 2 }
        fetch.mockResolvedValue(fakeReply([apiRevision, second], 200))

        await expect(getRevisions()).resolves.toEqual([apiRevision, second])
    })

    it('returns [] for an empty list', async () => {
        fetch.mockResolvedValue(fakeReply([], 200))

        await expect(getRevisions()).resolves.toEqual([])
    })

    it.each([500, 503, 404])('a %i gives REFRESH_ERROR', async (status) => {
        fetch.mockResolvedValue(fakeReply([], status))

        await expectRefreshError(getRevisions())
    })

    it('a network failure gives REFRESH_ERROR', async () => {
        fetch.mockRejectedValue(new TypeError('Failed to fetch'))

        await expectRefreshError(getRevisions())
    })

    it('a body that is not an array gives REFRESH_ERROR', async () => {
        fetch.mockResolvedValue(fakeReply({ revisions: [apiRevision] }, 200))

        await expectRefreshError(getRevisions())
    })

    it('malformed JSON gives REFRESH_ERROR', async () => {
        fetch.mockResolvedValue(new Response('not JSON', { status: 200 }))

        await expectRefreshError(getRevisions())
    })

    it('a null element gives REFRESH_ERROR, not a raw TypeError', async () => {
        fetch.mockResolvedValue(fakeReply([apiRevision, null], 200))

        await expectRefreshError(getRevisions())
    })

    it.each([
        ['a string id', { id: '1' }],
        ['a zero id', { id: 0 }],
        ['a string revision_order', { revision_order: '1' }],
        ['a missing revision_order', { revision_order: undefined }],
        ['a zero revision_order', { revision_order: 0 }],   // boundary: update if the rule becomes >= 0
        ['a missing name', { name: undefined }],
        ['a non-string modified_by', { modified_by: null }],
        ['a missing modified_at', { modified_at: undefined }],
    ])('rejects the whole list when one revision has %s', async (_description, override) => {
        fetch.mockResolvedValue(fakeReply([apiRevision, { ...apiRevision, ...override }], 200))

        await expectRefreshError(getRevisions())
    })
})