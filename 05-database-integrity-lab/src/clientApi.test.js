import { describe, it, expect, vi, afterEach } from "vitest"
import { createClient, getClients, editClient, deleteClient } from "./clientApi.js"
import { ApiError } from "./ApiError.js"

const CLIENTS_URL = "http://127.0.0.1:8000/clients"

//  --- helpers ------------------------------------------------------------

function jsonResponse(status, body) {
    return new Response(JSON.stringify(body), {
        status,
        headers: { "Content-Type": "application/json" }
    })
}

function errorEnvelope(status, code, message = "Server explanation") {
    return jsonResponse(status, { detail: { code, message } })
}

function respondWith(response) {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(response))
}

function failNetwork(error = new TypeError("failed to fetch")) {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(error))
}

async function caughtError(promise) {
    try {
        await promise
    } catch (err) {
        return err
    }
    throw new Error("Expected the promise to reject, but it resolved")
}

async function expectApiError(promise, expected) {
    const error = await caughtError(promise)
    expect(error).toBeInstanceOf(ApiError)
    expect(error).toMatchObject(expected)
    return error        // returned so a test can check more, e.g., error.cause
}

afterEach(() => {
    vi.unstubAllGlobals()
})

//  --- create: success -------------------------------------------------------------
describe("createClient: success", () => {
    it("sends a POST with the name as JSON", async () => {
        respondWith(jsonResponse(201, { id: 3, name: "Farm A", modified_by: "Test User" }))
        await createClient("Farm A")
        expect(fetch).toHaveBeenCalledTimes(1)
        expect(fetch).toHaveBeenCalledWith(
            CLIENTS_URL,
            expect.objectContaining({
                method: "POST",
                body: JSON.stringify({ name: "Farm A" })
            })
        )
    })

    it("returns a valid created client unchanged", async () => {
        const client = { id: 3, name: "Farm A", modified_by: "Test User" }
        respondWith(jsonResponse(201, client))
        await expect(createClient("Farm A")).resolves.toEqual(client)
    })
})

//  --- create: confirmed rejections    ------------------------------------------------
describe("createClient: confirmed rejections", () => {
    it.each([
        [409, "DUPLICATE_CLIENT"],
        [422, "INVALID_CLIENT_NAME"],
        [503, "SERVICE_BUSY"],  // fails until the adapter has a 503 branch
    ]) ("%i %s is a non-retryable ApiError", async (status, code) => {
        respondWith(errorEnvelope(status, code, "Server explanation"))
        const error = await caughtError(createClient("Farm A"))
        expect(error).toBeInstanceOf(ApiError)
        expect(error).toMatchObject({
            type: "non-retryable",
            code,
            message: "Server explanation"
        })
    })
})

//  --- create: unknown outcomes    ------------------------------------------------------
describe("createClient: unknown outcomes", () => {
    it.each([
        ["201 with a malformed client", () => jsonResponse(201, { id: "x", name: "Farm A", modified_by: "Test User" })],
        ["200 instead of 201", () => jsonResponse(200, { id: 3, name: "Farm A", modified_by: "Test User" })],
        ["409 without a recognized code", () => jsonResponse(409, { detail: "conflict" })],
        ["409 with another endpoint's code", () => jsonResponse(409, "CLIENT_REFERENCED")],
        ["422 in FastAPI's default shape", () => jsonResponse(422, { detail: [{ msg: "field required" }] })],
        ["500 carrying a valid-looking envelope", () => errorEnvelope(500, "DUPLICATE_CLIENT")]
    ])("%s", async(_label, makeResponse) => {
        respondWith(makeResponse())
        const error = await caughtError(createClient("Farm A"))
        expect(error).toBeInstanceOf(ApiError)
        expect(error).toMatchObject({ type: "unknown", code: "UNKNOWN_OUTCOME" })
    })
    it("network failure keeps the original error as the cause", async () => {
        failNetwork()
        const error = await caughtError(createClient("Farm A"))
        expect(error).toMatchObject({ type: "unknown" })
        expect(error.cause).toBeInstanceOf(TypeError)
    })

    it("plain-text 500 keeps the JSON parsing error as the cause", async () => {
        respondWith(new Response("Internal Server Error", { status: 500 }))
        const error = await caughtError(createClient("Farm A"))
        expect(error).toMatchObject({ type: "unknown" })
        expect(error.cause).toBeInstanceOf(SyntaxError)
    })
})

//  --- edit ----------------------------------------------------------------------------------------
describe("editClient: success", () => {
    it("sends a PATH to the client's URL with the name as JSON", async () => {
        respondWith(jsonResponse(200, { id: 7, name: "Farm Z", modified_by: "Test User" }))
        await editClient(7, "Farm Z")
        expect(fetch).toHaveBeenCalledWith(
            `${CLIENTS_URL}/7`,
            expect.objectContaining({ method: "PATCH", body: JSON.stringify({ name: "Farm Z" })})
        )
    })

    it("returns the updated client unchanged", async () => {
        const client = { id: 7, name: "Farm Z", modified_by: "Test User" }
        respondWith(jsonResponse(200, client))
        await expect(editClient(7, "Farm Z")).resolves.toEqual(client)
    })
})

describe("editClient: confirmed rejections", () => {
    it.each([
        [404, "CLIENT_NOT_FOUND"],
        [409, "DUPLICATE_CLIENT"],
        [422, "INVALID_CLIENT_NAME"],
        [503, "SERVICE_BUSY"],
    ])("%i %s is a non-retryable ApiError", async (status, code) => {
        respondWith(errorEnvelope(status, code, "Server explanation"))
        await expectApiError(editClient(7, "Farm Z"), {
            type: "non-retryable",
            code,
            message: "Server explanation"
        })
    })
})

describe("editClient: unknown outcomes", () => {
    it.each([
        ["200 describing a different client", ()=>jsonResponse(200, { id: 8, name: "Farm Z", modified_by: "Test User" })],
        ["200 with a malformed client", ()=>jsonResponse(200, { id: 7, name: 42, modified_by: "Test User" })],
        ["201 instead of 200", ()=>jsonResponse(201, { id: 7, name: "Farm Z", modified_by: "Test User" })],
        ["409 with another endpoint's code", ()=>errorEnvelope(409, "CLIENT_REFERENCED")],
        ["404 in FastAPI's default shape", ()=>jsonResponse(404, { detail: "Not Found" })],
        ["500 plain text", ()=>new Response("Internal Server Error", { status:500 })]
    ])("%s", async(_label, makeResponse) => {
        respondWith(makeResponse())
        await expectApiError(editClient(7, "Farm Z"), { type: "unknown", code: "UNKNOWN_OUTCOME" })
    })
    it("network failure keeps the original error as the cause", async () => {
        failNetwork()
        const error = await expectApiError(editClient(7, "Farm Z"), { type: "unknown" })
        expect(error.cause).toBeInstanceOf(TypeError)
    })
})

//  --- deleteClient    ---------------------------------------------------------------------------
describe("deleteClient: success", ()=>{
    it("sends a Delete to the client's URL", async () => {
        // a 204 has no body, so the body argument must be null
        const fakeResponse = new Response(null, { status: 204 })
        vi.stubGlobal("fetch", vi.fn().mockResolvedValue(fakeResponse))
        await deleteClient(7)
        expect(fetch).toHaveBeenCalledTimes(1)
        expect(fetch).toHaveBeenCalledWith(
            `${CLIENTS_URL}/7`,
            expect.objectContaining({ method: "DELETE" })
        )
    })

    it("204 resolves with nothing", async () => {
        const fakeResponse = new Response(null, { status: 204 })
        vi.stubGlobal("fetch", vi.fn().mockResolvedValue(fakeResponse))
        const result = await deleteClient(7)
        // deleteClient ends with a bare `return`, which gives undefined (Python's None)
        expect(result).toBeUndefined()
    })
})

describe("deleteClient: confirmed rejections", () => {
    it("404 CLIENT_NOT_FOUND is a non-retryable ApiError", async () => {
        const fakeResponse = new Response(
            JSON.stringify({ detail: {code: "CLIENT_NOT_FOUND", message: "Server explanation" } }),
            { status: 404, headers: { "Content-Type": "application/json" } }
        )
        vi.stubGlobal("fetch", vi.fn().mockResolvedValue(fakeResponse))

        let error 
        try {
            await deleteClient(7)
        } catch (err) {
            error = err
        }

        expect(error).toBeInstanceOf(ApiError)
        expect(error).toMatchObject({
            type: "non-retryable",
            code: "CLIENT_NOT_FOUND",
            message: "Server explanation"
        })
    })

    it("409 CLIENT_REFERENCED is a non-retryable ApiError", async () => {
        const fakeResponse = new Response(
            JSON.stringify({ detail: {code: "CLIENT_REFERENCED", message: "Server explanation" } }),
            { status: 409, headers: { "Content-Type": "application/json" } }
        )
        vi.stubGlobal("fetch", vi.fn().mockResolvedValue(fakeResponse))

        let error 
        try {
            await deleteClient(7)
        } catch (err) {
            error = err 
        }

        expect(error).toBeInstanceOf(ApiError)
        expect(error).toMatchObject({
            type: "non-retryable",
            code: "CLIENT_REFERENCED",
            message: "Server explanation"
        })
    })

    it("503 SERVICE_BUSY is a non-retryable ApiError", async () => {
        const fakeResponse = new Response(
            JSON.stringify({ detail: {code: "SERVICE_BUSY", message: "Server explanation" } }),
            { status: 503, headers: { "Content-Type": "application/json" }}
        )
        vi.stubGlobal("fetch", vi.fn().mockResolvedValue(fakeResponse))

        let error 
        try {
            await deleteClient(7)
        } catch (err) {
            error = err
        }

        expect(error).toBeInstanceOf(ApiError)
        expect(error).toMatchObject({
            type: "non-retryable",
            code: "SERVICE_BUSY",
            message: "Server explanation"
        })
    })
})

describe("deleteClient: unknown outcomes", () => {
    it("200 instead of 204 is unknown", async () => {
        const fakeResponse = new Response(
            JSON.stringify({ id: 7 }),
            { status: 200, headers: { "Content-Type": "application/json" }}
        )
        vi.stubGlobal("fetch", vi.fn().mockResolvedValue(fakeResponse))

        let error 
        try {
            await deleteClient(7)
        } catch (err) {
            error = err
        }

        expect(error).toBeInstanceOf(ApiError)
        expect(error).toMatchObject({ type: "unknown", code: "UNKNOWN_OUTCOME" })
    })

    it("409 with another endpoint's code is unknown", async () => {
        const fakeResponse = new Response(
            JSON.stringify({ detail: { code: "DUPLICATE_CLIENT", message: "Server explanation" }}),
            { status: 409, headers: { "Content-Type": "application/json" }}
        )
        vi.stubGlobal("fetch", vi.fn().mockResolvedValue(fakeResponse))

        let error 
        try {
            await deleteClient(7)
        } catch (err) {
            error = err
        }

        expect(error).toBeInstanceOf(ApiError)
        expect(error).toMatchObject({ type: "unknown", code: "UNKNOWN_OUTCOME" })
    })

    it("404 in FastAPI's default shape is unknown, not CLIENT_NOT_FOUND", async () => {
        const fakeResponse = new Response(
            JSON.stringify({ detail: "Not Found" }),
            { status: 404, headers: { "Content-Type": "application/json" } }
        )
        vi.stubGlobal("fetch", vi.fn().mockResolvedValue(fakeResponse))

        let error 
        try {
            await deleteClient(7)
        } catch (err) {
            error = err 
        }

        expect(error).toBeInstanceOf(ApiError)
        expect(error).toMatchObject({ type: "unknown", code: "UNKNOWN_OUTCOME" })
    })

    it("plain-text 500 is unknown and keeps the JSON parsing error as the cause", async () => {
        const fakeResponse = new Response("Internal Server Error", { status:500 })
        vi.stubGlobal("fetch", vi.fn().mockResolvedValue(fakeResponse))

        let error 
        try {
            await deleteClient(7)
        } catch (err) {
            error = err
        }

        expect(error).toBeInstanceOf(ApiError)
        expect(error).toMatchObject({ type: "unknown", code: "UNKNOWN_OUTCOME" })
        expect(error.cause).toBeInstanceOf(SyntaxError)
    })

    it("network failure is unknown and keeps the original error as the cause", async () => {
        vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("Failed to fetch")))

        let error 
        try {
            await deleteClient(7)
        } catch (err) {
            error = err
        }

        expect(error).toBeInstanceOf(ApiError)
        expect(error).toMatchObject({ type: "unknown", code: "UNKNOWN_OUTCOME" })
        expect(error.cause).toBeInstanceOf(TypeError)
    })
})

//  --- getClients  -------------------------------------------------------------------
//  read path rule: every failure becomes REFRESH_ERROR, with the reason kept in `cause`

describe("getClients: success", ()=> {
    it("returns a valid list unchanged", async () => {
        const fakeResponse = new Response(
            JSON.stringify([
                { id:1, name: "Farm A", modified_by: "Alex" },
                { id:2, name: "Farm B", modified_by: "Bob" }
            ]),
            { status:200, headers: { "Content-Type": "application/json" }}
        )
        vi.stubGlobal("fetch", vi.fn().mockResolvedValue(fakeResponse))
        const result = await getClients()
        expect(result).toEqual([
            { id:1, name: "Farm A", modified_by: "Alex" },
            { id:2, name: "Farm B", modified_by: "Bob" }
        ])
    })

    it("returns an empty list", async () => {
        const fakeResponse = new Response(
            JSON.stringify([]),
            { status: 200, headers: { "Content-Type": "application/json" } }
        )
        vi.stubGlobal("fetch", vi.fn().mockResolvedValue(fakeResponse))
        const result = await getClients()
        expect(result).toEqual([])
    })
})

describe("getClients: every failure is a refresh error", () => {
    it("503 SERVICE_BUSY is a refresh error", async () => {
        const fakeResponse = new Response(
            JSON.stringify({ detail: { code: "SERVICE_BUSY", message: "Server explanation" } }),
            { status: 503, headers: { "Content-Type": "application/json" } }
        )
        vi.stubGlobal("fetch", vi.fn().mockResolvedValue(fakeResponse))

        let error 
        try {
            await getClients()
        } catch (err) {
            error = err
        }

        expect(error).toBeInstanceOf(ApiError)
        expect(error).toMatchObject({ type: "refresh", code: "REFRESH_ERROR" })
        expect(error.cause).toBeDefined()
    })

    it("plain-text 500 is a refresh error", async () => {
        const fakeResponse = new Response("Internal Server Error", { status:500 })
        vi.stubGlobal("fetch", vi.fn().mockResolvedValue(fakeResponse))

        let error 
        try {
            await getClients()
        } catch (err) {
            error = err 
        }

        expect(error).toBeInstanceOf(ApiError)
        expect(error).toMatchObject({ type: "refresh", code: "REFRESH_ERROR" })
        expect(error.cause).toBeDefined()
    })

    it("200 with an object instead of a list is a refresh error", async () => {
        const fakeResponse = new Response(
            JSON.stringify({ clients: [] }),
            { status: 200, headers: { "Content-Type": "application/json" } }
        )
        vi.stubGlobal("fetch", vi.fn().mockResolvedValue(fakeResponse))

        let error 
        try {
            await getClients()
        } catch (err) {
            error = err
        }

        expect(error).toBeInstanceOf(ApiError)
        expect(error).toMatchObject({ type: "refresh", code: "REFRESH_ERROR" })
        expect(error.cause).toBeDefined()
    })

    it("200 with one invalid client rejects the whole list", async () => {
        const fakeResponse = new Response(
            JSON.stringify([
                { id:1, name:"Farm A", modified_by:"Alex" },
                { id: "x" }
            ]),
            { status:200, headers: { "Content-Type": "application/json" } }
        )
        vi.stubGlobal("fetch", vi.fn().mockResolvedValue(fakeResponse))

        let error 
        try {
            await getClients()
        } catch (err) {
            error = err
        }

        expect(error).toBeInstanceOf(ApiError)
        expect(error).toMatchObject({ type: "refresh", code: "REFRESH_ERROR" })
        expect(error.cause).toBeDefined()
    })

    it("network failure is a refresh error and keeps the original error as the cause", async () => {
        vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("Failed to fetch")))

        let error 
        try {
            await getClients()
        } catch (err) {
            error = err
        }

        expect(error).toBeInstanceOf(ApiError)
        expect(error).toMatchObject({ type: "refresh", code: "REFRESH_ERROR" })
        expect(error.cause).toBeInstanceOf(TypeError)
    })
})