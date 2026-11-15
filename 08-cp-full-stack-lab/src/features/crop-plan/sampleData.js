// features/crop-plan/sampleData.js

// meta data

export const clients = [
    {id: 1, name: "Farm A"},
    {id: 2, name: "Farm B"}
]

export const crops = [
    {id: 1, name: "Durum"},
    {id: 2, name: "Canola"},
    {id: 3, name: "Barley"},
    {id: 4, name: "Green Lentils"},
    {id: 5, name: "Red Lentils"},
    {id: 6, name: "Wheat (HRSW)"},
    {id: 7, name: "Chick Peas"},
    {id: 8, name: "Oats"},
    {id: 9, name: "Seed Oats"},
    {id: 10, name: "Soy Beans"},
    {id: 11, name: "Flax"},
    {id: 12, name: "Maple Peas"},
    {id: 13, name: "Fenugreek"},
    {id: 14, name: "Hemp"}
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



// grouping

export const cardGroups = [
    { label: "Plant · Current Year", keys: ["acres", "unit_price", "yield"] },
    { label: "Inflow · Prior Year", keys: ["prior.quantity_inventory", "prior.unit_price"] },
    { label: "Outflow · Current Year Costs", keys: ["chem_cost", "fert_cost", "fuel_cost", "rent_cost", "seed_cost"]}
]