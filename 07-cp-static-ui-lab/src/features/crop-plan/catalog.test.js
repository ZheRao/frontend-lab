// features/crop-plan/catalog.test.js

import { describe, test, expect } from "vitest"
import { categories, cardGroups, crops, revisions } from "./sampleData.js"

describe("catalog consistency", () => {
    test("every cardGroup key exists in categories", () => {
        const categoryKeys = categories.map((category) => category.key)

        for (const group of cardGroups) {
            for (const key of group.keys) {
                expect(categoryKeys).toContain(key)
            }
        }
    })

    test("every category appears in exactly one card group", () => {
        const allGroupKeys = cardGroups.flatMap((group)=>group.keys)

        for (const category of categories) {
            const appearances = allGroupKeys.filter((key) => key===category.key).length 
            expect(appearances).toBe(1)
        }
    })

    test("category keys are unique", () => {
        const allKeys = categories.map((cat) => (cat.key))
        const uniqueKeys = new Set(allKeys)

        expect(allKeys.length).toEqual(uniqueKeys.size)
    })

    test("prior key prefix matches cropYear", () => {
        for (const category of categories) {
            expect(category.key.startsWith("prior."))
                .toBe(category.cropYear === "prior")
        }
    })


    test("IDs are unique in crops, revisions", () => {
        const checkIdUniqueness = (records) => {
            const allId = records.map((record) => (record.id))
            const uniqueId = new Set(allId) 
            return allId.length === uniqueId.size
        }
        expect(checkIdUniqueness(crops)).toBe(true)
        expect(checkIdUniqueness(revisions)).toBe(true)
    })

    test("revision order values are unique", () => {
        const allOrder = revisions.map((revision) => (revision.order))
        const uniqueOrder = new Set(allOrder)
        expect(allOrder.length).toBe(uniqueOrder.size)
    })
})