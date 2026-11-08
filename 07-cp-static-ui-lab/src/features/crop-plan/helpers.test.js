
import { describe, test, expect } from "vitest"
import { resolver } from "./helpers"

const revisions = [
    { id: 1, name: "Pre-seeding", order: 1 },
    { id: 2, name: "Post-seeding", order: 2 },
    { id: 3, name: "Pre-harvest", order: 3}
]

const categories = [
    { key: "unit_price", cropYear: "current", label: "Unit Price", unit: "$/bu" },
    { key: "acres", cropYear: "current", label: "Acres", unit: "ac" },
]

describe("resolver", () => {
    test("RES-07 rev2 wins at target 2 even when a rev1 row has a higher id", () => {
        const rows = [
            { id:10, clientId:1, forecastYear: 2026, cropId: 1, revisionId: 2, categoryKey: "unit_price", value: 8.25, createdAt: "2026-05-01T00:00:00Z", createdBy: "Test User", memo: null },
            { id:20, clientId:1, forecastYear: 2026, cropId: 1, revisionId: 1, categoryKey: "unit_price", value: 7.5, createdAt: "2026-05-01T00:00:00Z", createdBy: "Test User", memo: null },
        ]
        const result = resolver(rows, 2, revisions, categories)

        expect(result[1]["unit_price"].id).toBe(10)
        expect(result[1]["unit_price"].value).toBe(8.25)
        expect(result[1]["unit_price"].isInherited).toBe(false)
        expect(result[1]["unit_price"].history.map((row)=>row.id)).toEqual([10])
    })

    test("RES-01 rev1 Acres only; target 2, acres comes from rev1, isInherited true, history []", () => {
        const rows = [
            { id:10, clientId:1, forecastYear: 2026, cropId: 2, revisionId: 1, categoryKey: "acres", value: 2000, createdAt: "2026-05-01T00:00:00Z", createdBy: "Test User", memo: null },
        ]
        const result = resolver(rows, 2, revisions, categories)

        expect(result[2]["acres"].id).toBe(10)
        expect(result[2]["acres"].value).toBe(2000)
        expect(result[2]["acres"].isInherited).toBe(true)
        expect(result[2]["acres"].history).toEqual([])
    })

    test("RES-02 rev1 and rev2 Acres; target 2, rev2 wins, local, history holds only rev2", () => {
        const rows = [
            { id:10, clientId:1, forecastYear: 2026, cropId: 1, revisionId: 1, categoryKey: "acres", value: 2000, createdAt: "2026-05-01T00:00:00Z", createdBy: "Test User", memo: null },
            { id:11, clientId:1, forecastYear: 2026, cropId: 1, revisionId: 2, categoryKey: "acres", value: 3000, createdAt: "2026-05-01T00:00:00Z", createdBy: "Test User", memo: null },
        ]
        const result = resolver(rows, 2, revisions, categories)

        expect(result[1]["acres"].id).toBe(11)
        expect(result[1]["acres"].value).toBe(3000)
        expect(result[1]["acres"].isInherited).toBe(false)
        expect(result[1]["acres"].history.map(row => row.id)).toEqual([11])
    })

    test("RES-03 crop A has rows in rev1 and rev2; crop B only in rev1; target 3, each category resolves independently, so A's comes from 2 and B's from 1", () => {
        const rows = [
            { id:10, clientId:1, forecastYear: 2026, cropId: 1, revisionId: 1, categoryKey: "acres", value: 2000, createdAt: "2026-05-01T00:00:00Z", createdBy: "Test User", memo: null },
            { id:11, clientId:1, forecastYear: 2026, cropId: 1, revisionId: 2, categoryKey: "acres", value: 3000, createdAt: "2026-05-01T00:00:00Z", createdBy: "Test User", memo: null },
            { id:12, clientId:1, forecastYear: 2026, cropId: 2, revisionId: 1, categoryKey: "acres", value: 4000, createdAt: "2026-05-01T00:00:00Z", createdBy: "Test User", memo: null },
        ]
        const result = resolver(rows, 3, revisions, categories)

        expect(result[1]["acres"].id).toBe(11)
        expect(result[1]["acres"].value).toBe(3000)
        expect(result[1]["acres"].isInherited).toBe(true)
        expect(result[1]["acres"].history).toEqual([])

        expect(result[2]["acres"].id).toBe(12)
        expect(result[2]["acres"].value).toBe(4000)
        expect(result[2]["acres"].isInherited).toBe(true)
        expect(result[2]["acres"].history).toEqual([])
    })

    test("RES-04 rev2 value 0 over rev1 value 8, winner is 0, must not fall through to 8", () => {
        const rows = [
            { id:10, clientId:1, forecastYear: 2026, cropId: 1, revisionId: 1, categoryKey: "acres", value: 2000, createdAt: "2026-05-01T00:00:00Z", createdBy: "Test User", memo: null },
            { id:11, clientId:1, forecastYear: 2026, cropId: 1, revisionId: 2, categoryKey: "acres", value: 0, createdAt: "2026-05-01T00:00:00Z", createdBy: "Test User", memo: null },
        ]
        const result = resolver(rows, 2, revisions, categories)

        expect(result[1]["acres"].id).toBe(11)
        expect(result[1]["acres"].value).toBe(0)
        expect(result[1]["acres"].isInherited).toBe(false)
        expect(result[1]["acres"].history.map(row=>row.id)).toEqual([11])
    })

    test("RES-05 two rev2 rows with equal createdAt, higher id wins", () => {
        const rows = [
            { id:20, clientId:1, forecastYear: 2026, cropId: 1, revisionId: 2, categoryKey: "acres", value: 2000, createdAt: "2026-05-01T00:00:00Z", createdBy: "Test User", memo: null },
            { id:10, clientId:1, forecastYear: 2026, cropId: 1, revisionId: 2, categoryKey: "acres", value: 8000, createdAt: "2026-05-01T00:00:00Z", createdBy: "Test User", memo: null },
        ]
        const result = resolver(rows, 3, revisions, categories)

        expect(result[1]["acres"].id).toBe(20)
        expect(result[1]["acres"].value).toBe(2000)
        expect(result[1]["acres"].isInherited).toBe(true)
        expect(result[1]["acres"].history).toEqual([])
    })

    test("unmarked rev3 row; target 2, rev3 doesn't appear anywhere, not even in history", () => {
        const rows = [
            { id:20, clientId:1, forecastYear: 2026, cropId: 1, revisionId: 1, categoryKey: "acres", value: 2000, createdAt: "2026-05-01T00:00:00Z", createdBy: "Test User", memo: null },
            { id:25, clientId:1, forecastYear: 2026, cropId: 1, revisionId: 3, categoryKey: "acres", value: 9000, createdAt: "2026-05-01T00:00:00Z", createdBy: "Test User", memo: null },
        ]
        const result = resolver(rows, 2, revisions, categories)

        expect(result[1]["acres"].id).toBe(20)
        expect(result[1]["acres"].value).toBe(2000)
        expect(result[1]["acres"].isInherited).toBe(true)
        expect(result[1]["acres"].history).toEqual([])
    })

    test("RES-08 category with no rows, key is absent, so the lookup gives undefined", () => {
        const rows = [
            { id:20, clientId:1, forecastYear: 2026, cropId: 1, revisionId: 1, categoryKey: "acres", value: 2000, createdAt: "2026-05-01T00:00:00Z", createdBy: "Test User", memo: null },
            { id:25, clientId:1, forecastYear: 2026, cropId: 1, revisionId: 3, categoryKey: "acres", value: 9000, createdAt: "2026-05-01T00:00:00Z", createdBy: "Test User", memo: null },
        ]
        const result = resolver(rows, 3, revisions, categories)

        expect(result[1]["unit_price"]).toBeUndefined()
    })

    test("HIST-01 3 rev2 rows; target 2, history lists all three, newest first, winner at the top", () => {
        const rows = [
            { id:20, clientId:1, forecastYear: 2026, cropId: 1, revisionId: 2, categoryKey: "unit_price", value: 2000, createdAt: "2026-05-01T00:00:00Z", createdBy: "Test User", memo: null },
            { id:21, clientId:1, forecastYear: 2026, cropId: 1, revisionId: 2, categoryKey: "unit_price", value: 3000, createdAt: "2026-06-01T00:00:00Z", createdBy: "Test User", memo: null },
            { id:22, clientId:1, forecastYear: 2026, cropId: 1, revisionId: 2, categoryKey: "unit_price", value: 4000, createdAt: "2026-07-01T00:00:00Z", createdBy: "Test User", memo: null },
        ]
        const result = resolver(rows, 2, revisions, categories)

        expect(result[1]["unit_price"].id).toBe(22)
        expect(result[1]["unit_price"].value).toBe(4000)
        expect(result[1]["unit_price"].isInherited).toBe(false)
        expect(result[1]["unit_price"].history.map(row=>row.id)).toEqual([22,21,20])
    })

    test("HIST-02 rev1 has two rows; target 2 with no rev2 row, history [], revision 1's trail must not leak in", () => {
        const rows = [
            { id:20, clientId:1, forecastYear: 2026, cropId: 1, revisionId: 1, categoryKey: "unit_price", value: 2000, createdAt: "2026-07-01T00:00:00Z", createdBy: "Test User", memo: null },
            { id:22, clientId:1, forecastYear: 2026, cropId: 1, revisionId: 1, categoryKey: "unit_price", value: 4000, createdAt: "2026-07-01T00:00:00Z", createdBy: "Test User", memo: null },
            { id:21, clientId:1, forecastYear: 2026, cropId: 1, revisionId: 1, categoryKey: "unit_price", value: 3000, createdAt: "2026-07-01T00:00:00Z", createdBy: "Test User", memo: null },
        ]
        const result = resolver(rows, 2, revisions, categories)

        expect(result[1]["unit_price"].id).toBe(22)
        expect(result[1]["unit_price"].value).toBe(4000)
        expect(result[1]["unit_price"].isInherited).toBe(true)
        expect(result[1]["unit_price"].history).toEqual([])
    })

    test("empty [], {}", () => {
        const rows = []
        const result = resolver(rows, 3, revisions, categories)
        expect(result).toEqual({})
    })

    test("invalid target, target 9, return {}", () => {
        const rows = [
            { id:20, clientId:1, forecastYear: 2026, cropId: 1, revisionId: 1, categoryKey: "unit_price", value: 2000, createdAt: "2026-07-01T00:00:00Z", createdBy: "Test User", memo: null },
        ]
        const result = resolver(rows, 9, revisions, categories)

        expect(result).toEqual({})
    })

    test("resolver does not mutate its input rows", () => {
        const rows = [
            { id:10, clientId:1, forecastYear: 2026, cropId: 2, revisionId: 1, categoryKey: "acres", value: 2000, createdAt: "2026-05-01T00:00:00Z", createdBy: "Test User", memo: null },
            { id:11, clientId:1, forecastYear: 2026, cropId: 2, revisionId: 2, categoryKey: "acres", value: 2000, createdAt: "2026-05-02T00:00:00Z", createdBy: "Test User", memo: null },
        ]
        const snapshot = structuredClone(rows)

        resolver(rows, 2, revisions, categories)

        expect(rows).toEqual(snapshot)
    })
})