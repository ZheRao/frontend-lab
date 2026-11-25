// features/crop-plan/cropPlanApi.test.js

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { getCropPlan, createCropPlan } from './cropPlanApi'
import { ApiError } from '../../ApiError'

const CROP_PLAN_URL = "http://127.0.0.1:8000/forecast/inputs/crop-plan"

const apiRow = {
    id: 1, client_id: 1, forecast_year: 2026, crop_id: 1, revision_id: 1, 
    category_key: 'acres', value: 5000, modified_by: 'Test User', memo: "test", 
    created_at: '2026-11-16T10:00:00Z'
}

const apiRowNoMemo = {
    id: 1, client_id: 1, forecast_year: 2026, crop_id: 1, revision_id: 1, 
    category_key: 'acres', value: 5000, modified_by: 'Test User', memo: null,
    created_at: '2026-11-16T10:00:00Z'
}

const requestBody = {
    id:1 , clientId: 1, forecastYear: 2026, cropId: 1, revisionId: 1, categoryKey: 'acres', value: 5000,
    memo: "test"
}

beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn())
})

afterEach(() => {
    vi.unstubAllGlobals()
})

const fakeReply = (body, status) => (
    new Response(
        JSON.stringify(body), { status }
    )
)

const fakeErrorReply = (status, code, message="Server explanation") => {
    return new Response(
        JSON.stringify({ detail: { code, message } }), { status }
    )
}

const raiseError = async (fakeResponse, api) => {
    fetch.mockResolvedValue(fakeResponse)
    try {
        await api()
    } catch (err) {
        return err
    }
    throw new Error("Expected the promise to reject, but it resolved")
}

const checkError = (error, errorObj, checkCause) => {
    expect(error).toBeInstanceOf(ApiError)
    expect(error).toMatchObject(errorObj)
    checkCause && expect(error.cause).toBeDefined()
}

describe('getCropPlan', () => {
    it('maps valid rows to camelCase', async () => {
        const fakeResponse = new Response(
            JSON.stringify([apiRow]), { status: 200 }
        )
        fetch.mockResolvedValue(fakeResponse)

        const rows = await getCropPlan(1, 2026) 

        expect(rows).toEqual([{
            id: 1, clientId: 1, forecastYear: 2026, cropId: 1, revisionId: 1, categoryKey: "acres", value: 5000, 
            createdBy: "Test User", memo: "test", createdAt: '2026-11-16T10:00:00Z'
        }])
    })

    it('turns a network failure into a refresh error', async () => {
        fetch.mockRejectedValue(new TypeError("Failed to fetch"))

        await expect(getCropPlan(1, 2026)).rejects.toMatchObject({
            type: "refresh", code: "REFRESH_ERROR"
        })
    })

    it('a 200 with [] returns []', async () => {
        const fakeResponse = new Response(
            JSON.stringify([]),
            { status: 200 }
        )
        fetch.mockResolvedValue(fakeResponse)

        const rows = await getCropPlan(1, 2026)

        expect(rows).toEqual([])
    })

    it('a row with memo: null passes validation', async () => {
        fetch.mockResolvedValue(fakeReply([apiRowNoMemo], 200))

        const rows = await getCropPlan(1, 2026)

        expect(rows).toEqual([{
            id: 1, clientId: 1, forecastYear: 2026, cropId: 1, revisionId: 1, categoryKey: "acres", value: 5000, 
            createdBy: "Test User", memo: null, createdAt: '2026-11-16T10:00:00Z'
        }])
    })

    it('a 500 gives REFRESH_ERROR', async () => {
        const error = await raiseError(fakeReply([], 500), ()=>getCropPlan(1, 2026))
        checkError(error, {type: "refresh", code: "REFRESH_ERROR"}, true)
    })

    it('a 503 gives REFRESH_ERROR', async () => {
        const error = await raiseError(fakeReply([], 503), ()=>getCropPlan(1, 2026))
        checkError(error, {type: "refresh", code: "REFRESH_ERROR"}, true)
    })

    it('a body not an array gives REFRESH_ERROR', async () => {
        const error = await raiseError(fakeReply({}, 200), ()=>getCropPlan(1, 2026))
        checkError(error, {type: "refresh", code: "REFRESH_ERROR"}, true)
    })

    it.each([
        ["non-integer id", { id: "1" }],
        ["zero client ID", { client_id: 0 }],
        ["negative value", { value: -10 }],
        ["non-numeric value", { value: "10" }],
        ["missing category key", { category_key: undefined }],
        ["missing created at", { created_at: undefined }],
        ["invalid memo", { memo: 123 }]
    ]) (
        'rejects the entire bundle when a row is %s', async (description, override) => {
            const invalidRow = {
                ...apiRow,
                ...override
            }
            const invalidBundle = [
                apiRow,
                invalidRow
            ]
            const error = await raiseError(fakeReply(invalidBundle, 200), ()=>getCropPlan(1, 2026))
            checkError(error, {type: "refresh", code: "REFRESH_ERROR"}, true)
        }
    )

    it('malformed JSON gives REFRESH_ERROR', async () => {
        const error = await raiseError(new Response('not JSON', { status: 200 }), ()=>getCropPlan(1,2026))
        checkError(error, {type: "refresh", code: "REFRESH_ERROR"}, true)
    })

    it('builds the GET URL from clientId and forecastYear', async () => {
        fetch.mockResolvedValue(fakeReply([], 200))
        await getCropPlan(7, 2026)
        expect(fetch).toHaveBeenCalledWith(`${CROP_PLAN_URL}/7/2026`)
    })
})


describe("createCropPlan", () => {
    it("sends a POST with the expected JSON", async () => {
        const fakeResponse = new Response(
            JSON.stringify(apiRow),
            { status: 201 }
        )
        fetch.mockResolvedValue(fakeResponse)
        await createCropPlan(requestBody)
        expect(fetch).toHaveBeenCalledTimes(1)
        expect(fetch).toHaveBeenCalledWith(
            CROP_PLAN_URL,
            expect.objectContaining({
                method: "POST",
                body: JSON.stringify({...apiRow, created_at: undefined, modified_by: undefined, id: undefined})
            })
        )
    })

    it("returns a valid created crop plan unchanged", async () => {
        fetch.mockResolvedValue(fakeReply(apiRow, 201))
        await expect(createCropPlan(requestBody)).resolves.toEqual({...requestBody, createdAt: "2026-11-16T10:00:00Z", createdBy: "Test User"})
    })

    it("a 201 with memo: null succeeds", async () => {
        fetch.mockResolvedValue(fakeReply({...apiRow, memo:null}, 201))
        await expect(createCropPlan({...requestBody, memo: undefined})).resolves.toMatchObject({...requestBody, memo:null})
    })

    it("a 201 with an invalid row gives unknown error", async () => {
        const error = await raiseError(fakeReply({...apiRow, created_at: 10}, 201), ()=>createCropPlan(requestBody))
        checkError(error, { code: "UNKNOWN_OUTCOME", type: "unknown" }, false)
    })

    it("a network rejection gives unknown", async () => {
        fetch.mockRejectedValue(new TypeError("Failed to fetch"))

        await expect(createCropPlan(requestBody)).rejects.toMatchObject({
            code: "UNKNOWN_OUTCOME", type: "unknown"
        })
    })

    it("a 201 with malformed JSON gives unknown", async () => {
        const error = await raiseError(new Response('not JSON', { status: 201 }), ()=>createCropPlan(requestBody))
        checkError(error, { code: "UNKNOWN_OUTCOME", type: "unknown" }, false)
    })

    it.each([
        [503, "SERVICE_BUSY"],
        [422, "INVALID_VALUE"],
        [422, "INVALID_REFERENCE"]
    ]) ("%i %s is a non-retryable ApiError", async (status, code) => {
        const error = await raiseError(fakeErrorReply(status, code), ()=>createCropPlan(requestBody))
        checkError(error, { code: code, type: "non-retryable", message: "Server explanation"}, false)
    })

    it("a 503 without a valid detail gives unknown", async () => {
        const error = await raiseError(fakeErrorReply(503, "FAKE", 123), () => createCropPlan(requestBody))
        checkError(error, { code: "UNKNOWN_OUTCOME", type: "unknown" }, false)
    })

    it("a 422 with Pydantic auto detail gives INVALID_VALUE", async () => {
        const fakeResponse = new Response(
            JSON.stringify({
                detail: [
                    {
                        type: "float_parsing",
                        loc: ["body", "value"],
                        msg: "Input should be a valid number, unable to parse string as a number",
                        input: "abc"
                    }
                ]
            }),
            { status: 422 }
        )
        const error = await raiseError(fakeResponse, ()=>createCropPlan(requestBody))
        checkError(error, { code: "INVALID_VALUE", type: "non-retryable" }, false)
    })

    it("a 422 with unrecognized object detail gives unknown", async () => {
        const fakeResponse = new Response(
            JSON.stringify({
                detail: {
                        type: "float_parsing",
                        loc: ["body", "value"],
                        msg: "Input should be a valid number, unable to parse string as a number",
                        input: "abc"
                }
            }),
            { status: 422 }
        )
        const error = await raiseError(fakeResponse, ()=>createCropPlan(requestBody))
        checkError(error, { code: "UNKNOWN_OUTCOME", type: "unknown" }, false)
    })

    it.each([
        [500, "INTERNAL_ERROR"],
        [404, "NOT_FOUND"],
    ]) ("%i %s is a unknown ApiError", async (status, code) => {
        const error = await raiseError(fakeErrorReply(status, code), ()=>createCropPlan(requestBody))
        checkError(error, { code: "UNKNOWN_OUTCOME", type: "unknown"}, false)
    })
})
