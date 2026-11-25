// features/forecast-years/forecastYearsApi.test.js

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { getForecastYears } from './forecastYearsApi'
import { ApiError } from '../../ApiError'

const FORECAST_YEARS_URL = 'http://127.0.0.1:8000/forecast/years'

const apiYear = {
    forecast_year: 2026, modified_by: 'Zhe', modified_at: '2026-11-16T10:00:00Z',
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

describe('getForecastYears', () => {
    it('requests the forecast years endpoint', async () => {
        fetch.mockResolvedValue(fakeReply([apiYear], 200))

        await getForecastYears()

        expect(fetch).toHaveBeenCalledTimes(1)
        expect(fetch).toHaveBeenCalledWith(FORECAST_YEARS_URL)
    })

    it('returns valid years unchanged and in order', async () => {
        const second = { ...apiYear, forecast_year: 2027 }
        fetch.mockResolvedValue(fakeReply([apiYear, second], 200))

        await expect(getForecastYears()).resolves.toEqual([apiYear, second])
    })

    it('returns [] for an empty list', async () => {
        fetch.mockResolvedValue(fakeReply([], 200))

        await expect(getForecastYears()).resolves.toEqual([])
    })

    it.each([500, 503, 404])('a %i gives REFRESH_ERROR', async (status) => {
        fetch.mockResolvedValue(fakeReply([], status))

        await expectRefreshError(getForecastYears())
    })

    it('a network failure gives REFRESH_ERROR', async () => {
        fetch.mockRejectedValue(new TypeError('Failed to fetch'))

        await expectRefreshError(getForecastYears())
    })

    it('a body that is not an array gives REFRESH_ERROR', async () => {
        fetch.mockResolvedValue(fakeReply({ years: [apiYear] }, 200))

        await expectRefreshError(getForecastYears())
    })

    it('malformed JSON gives REFRESH_ERROR', async () => {
        fetch.mockResolvedValue(new Response('not JSON', { status: 200 }))

        await expectRefreshError(getForecastYears())
    })

    it('a null element gives REFRESH_ERROR, not a raw TypeError', async () => {
        fetch.mockResolvedValue(fakeReply([apiYear, null], 200))

        await expectRefreshError(getForecastYears())
    })

    it.each([
        ['a string year', { forecast_year: '2026' }],
        ['a decimal year', { forecast_year: 2026.5 }],
        ['a missing year', { forecast_year: undefined }],
        ['year 2025', { forecast_year: 2025 }],   // boundary: update if the > 2025 rule changes
        ['a non-string modified_by', { modified_by: 42 }],
        ['a missing modified_at', { modified_at: undefined }],
    ])('rejects the whole list when one year has %s', async (_description, override) => {
        fetch.mockResolvedValue(fakeReply([apiYear, { ...apiYear, ...override }], 200))

        await expectRefreshError(getForecastYears())
    })
})