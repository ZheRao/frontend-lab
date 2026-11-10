// features/crop-plan/sampleData.js

// meta data

export const clients = [
    {id: 1, name: "Farm A"},
    {id: 2, name: "Farm B"}
]

export const crops = [
    {id: 1, name: "Durum"},
    {id: 2, name: "Canola"},
    {id: 3, name: "Flax"}
]

export const revisions = [
    {id: 1, name: "Pre-seeding", order: 1},
    {id: 2, name: "Post-seeding", order: 2},
    {id: 3, name: "Pre-harvest", order: 3},
    {id: 4, name: "Post-harvest", order: 4},
]

//  note: not handling MT yet
export const categories = [
    { key: "prior.quantity_inventory", cropYear: "prior", label: "Opening Inventory", unit: "bu" },
    { key: "prior.unit_price", cropYear: "prior", label: "Unit Price (Prior)", unit: "$/bu" },
    { key: "acres", cropYear: "current", label: "Acres", unit: "ac" },
    { key: "unit_price", cropYear: "current", label: "Unit Price", unit: "$/bu" },
    { key: "yield", cropYear: "current", label: "Yield / Acre", unit: "bu/ac" },
    { key: "chem_cost", cropYear: "current", label: "Chem", unit: "$/ac" },
    { key: "fert_cost", cropYear: "current", label: "Fert", unit: "$/ac" },
    { key: "fuel_cost", cropYear: "current", label: "Fuel", unit: "$/ac" },
    { key: "rent_cost", cropYear: "current", label: "Rent", unit: "$/ac" },
    { key: "seed_cost", cropYear: "current", label: "Seed", unit: "$/ac" },
]


// rawBundle

export const rawData = [
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


// grouping

export const cardGroups = [
    { label: "Plant · Current Year", keys: ["acres", "unit_price", "yield"] },
    { label: "Inflow · Prior Year", keys: ["prior.quantity_inventory", "prior.unit_price"] },
    { label: "Outflow · Current Year Costs", keys: ["chem_cost", "fert_cost", "fuel_cost", "rent_cost", "seed_cost"]}
]