
let db = [
    { id: 1, clientId: 1, forecastYear: 2026, cropId: 1, revisionId: 1, categoryKey: "prior.quantity_inventory", value: 132456, createdAt: "2026-01-01T00:00:00Z", createdBy: "Test User", memo: null },
    { id: 2, clientId: 1, forecastYear: 2026, cropId: 1, revisionId: 1, categoryKey: "prior.unit_price", value: 7, createdAt: "2026-01-01T00:00:00Z", createdBy: "Test User", memo: null },
    { id: 3, clientId: 1, forecastYear: 2026, cropId: 1, revisionId: 1, categoryKey: "acres", value: 5000, createdAt: "2026-01-01T00:00:00Z", createdBy: "Test User", memo: "Test" },
    { id: 4, clientId: 1, forecastYear: 2026, cropId: 1, revisionId: 1, categoryKey: "yield", value: 70, createdAt: "2026-01-01T00:00:00Z", createdBy: "Test User", memo: null },
    { id: 5, clientId: 1, forecastYear: 2026, cropId: 1, revisionId: 1, categoryKey: "unit_price", value: 7.75, createdAt: "2026-01-01T00:00:00Z", createdBy: "Test User", memo: null },
    { id: 6, clientId: 1, forecastYear: 2026, cropId: 1, revisionId: 1, categoryKey: "seed_cost", value: 19, createdAt: "2026-01-01T00:00:00Z", createdBy: "Test User", memo: null },
    { id: 7, clientId: 1, forecastYear: 2026, cropId: 1, revisionId: 1, categoryKey: "fert_cost", value: 110, createdAt: "2026-01-01T00:00:00Z", createdBy: "Test User", memo: null },
    { id: 8, clientId: 1, forecastYear: 2026, cropId: 1, revisionId: 1, categoryKey: "chem_cost", value: 43.25, createdAt: "2026-01-01T00:00:00Z", createdBy: "Test User", memo: null },
    { id: 9, clientId: 1, forecastYear: 2026, cropId: 1, revisionId: 1, categoryKey: "fuel_cost", value: 11.8, createdAt: "2026-01-01T00:00:00Z", createdBy: "Test User", memo: null },
    { id: 10, clientId: 1, forecastYear: 2026, cropId: 1, revisionId: 1, categoryKey: "rent_cost", value: 35, createdAt: "2026-01-01T00:00:00Z", createdBy: "Test User", memo: null },
    { id: 11, clientId: 1, forecastYear: 2026, cropId: 1, revisionId: 2, categoryKey: "unit_price", value: 8.25, createdAt: "2026-05-01T00:00:00Z", createdBy: "Test User", memo: null },
    { id: 12, clientId: 1, forecastYear: 2026, cropId: 1, revisionId: 2, categoryKey: "unit_price", value: 80, createdAt: "2026-05-12T00:00:00Z", createdBy: "Test User", memo: "making the number absurd so that it really stands out to people you know?" },
    // { id: 13, clientId: 1, forecastYear: 2026, cropId: 2, revisionId: 1, categoryKey: "prior.quantity_inventory", value: 132456, createdAt: "2026-01-01T00:00:00Z", createdBy: "Test User", memo: null },
    { id: 14, clientId: 1, forecastYear: 2026, cropId: 2, revisionId: 1, categoryKey: "prior.unit_price", value: 7, createdAt: "2026-01-01T00:00:00Z", createdBy: "Test User", memo: null },
    { id: 15, clientId: 1, forecastYear: 2026, cropId: 2, revisionId: 1, categoryKey: "acres", value: 5000, createdAt: "2026-01-01T00:00:00Z", createdBy: "Test User", memo: null },
    { id: 16, clientId: 1, forecastYear: 2026, cropId: 2, revisionId: 1, categoryKey: "yield", value: 70, createdAt: "2026-01-01T00:00:00Z", createdBy: "Test User", memo: null },
    { id: 17, clientId: 1, forecastYear: 2026, cropId: 2, revisionId: 1, categoryKey: "unit_price", value: 7.75, createdAt: "2026-01-01T00:00:00Z", createdBy: "Test User", memo: null },
    { id: 18, clientId: 1, forecastYear: 2026, cropId: 2, revisionId: 1, categoryKey: "seed_cost", value: 19, createdAt: "2026-01-01T00:00:00Z", createdBy: "Test User", memo: null },
    { id: 19, clientId: 1, forecastYear: 2026, cropId: 2, revisionId: 1, categoryKey: "fert_cost", value: 110, createdAt: "2026-01-01T00:00:00Z", createdBy: "Test User", memo: null },
    { id: 20, clientId: 1, forecastYear: 2026, cropId: 2, revisionId: 1, categoryKey: "chem_cost", value: 43.25, createdAt: "2026-01-01T00:00:00Z", createdBy: "Test User", memo: null },
    { id: 21, clientId: 1, forecastYear: 2026, cropId: 2, revisionId: 1, categoryKey: "fuel_cost", value: 11.8, createdAt: "2026-01-01T00:00:00Z", createdBy: "Test User", memo: null },
    { id: 22, clientId: 1, forecastYear: 2026, cropId: 2, revisionId: 1, categoryKey: "rent_cost", value: 35, createdAt: "2026-01-01T00:00:00Z", createdBy: "Test User", memo: null },
    { id: 23, clientId: 1, forecastYear: 2026, cropId: 2, revisionId: 2, categoryKey: "unit_price", value: 8.25, createdAt: "2026-05-01T00:00:00Z", createdBy: "Test User", memo: null },
    { id: 24, clientId: 1, forecastYear: 2026, cropId: 2, revisionId: 2, categoryKey: "unit_price", value: 80, createdAt: "2026-05-12T00:00:00Z", createdBy: "Test User", memo: null },
]

let callCount = 0
let nextId = 25

export function getCropPlan (clientId, forecastYear) {
    const data = db.filter((record)=> (record.clientId === Number(clientId) && record.forecastYear === Number(forecastYear)))
    // callCount++
    const shouldFail = callCount % 2 === 0
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            if (false) {
                reject(new Error("fake error: cannot retrieve crop-plan"))
            } else {
                resolve([...data])
            }
        }, 1000)
    })
}