// features/crop-plan/Overview.jsx

import { useSearchParams, } from 'react-router'
import { 
    clients,
    revisions,
    rawData,
    categories
} from './sampleData.js'

import {
    urlStates,
    resolver
} from './helpers.js'

const cardGroups = [
    { label: "Plant · Current Year", keys: ["acres", "unit_price", "yield"] },
    { label: "Inflow · Prior Year", keys: ["prior.quantity_inventory", "prior.unit_price"] },
    { label: "Outflow · Current Year Costs", keys: ["chem_cost", "fert_cost", "fuel_cost", "rent_cost", "seed_cost"]}
]


function Overview() {
    const forecastYears = [ 2026, 2027, 2028, 2029 ]  // list of Numbers, accepted limitation: hard coded forecast year, later maybe a separate year table?
    const [searchParams, setSearchParams] = useSearchParams()
    // read URL state
    const clientId = searchParams.get("client")         //  string, event.target.value is string, URL components get string, here extraction gets string
    const forecastYear = searchParams.get("year")       //  string, event.target.value is string, URL components get string, here extraction gets string
    const revisionId = searchParams.get("revision")     //  string, event.target.value is string, URL components get string, here extraction gets string

    const extractIds = (list) => {
        return list.map((item) => (item.id))
    }
    const validClientId = extractIds(clients)       // list of Numbers
    const validRevisionId = extractIds(revisions)   // list of Numbers
    const currentUrlState = urlStates({
        rawClientId: clientId,
        clientList: validClientId,
        rawForecastYear: forecastYear,
        yearList: forecastYears,
        rawRevisionId: revisionId,
        revisionList: validRevisionId
    })

    const data = rawData.filter((row) => (row.clientId === Number(clientId) && row.forecastYear === Number(forecastYear)))
    const resolvedData = currentUrlState !== 'valid' ? {} : resolver(data, Number(revisionId), revisions, categories)
    console.log("resolved data: ", resolvedData)
    const sortedRevisions = [...revisions].sort((a,b )=> a.order - b.order)
    // helpers
    //  update URL parameter
    const updateContext = (key, value) => {
        const next = new URLSearchParams(searchParams)

        next.set(key, value)
        if (key === "client" || key === "year") {
            next.delete("revision")

            if (next.get("year") && next.get("client")) {
                next.set("revision", "1")
            }
        }

        setSearchParams(next)
    }
    

    return (
        <div>
            <h1>Crop Plan Configuration</h1>
            <div>

                <label htmlFor="client">Client</label>
                <select 
                    id="client"
                    value={clientId ?? ""} 
                    onChange={(event) => updateContext("client", event.target.value)}
                >
                    <option value="" disabled>Please select a client</option>
                    {clients.map((client) => (
                        <option 
                            key={client.id}
                            value={String(client.id)}
                        >
                            {client.name}
                        </option>
                    ))}
                </select>

                <label htmlFor="year">Forecast year</label>
                <select 
                    id="year"
                    value={forecastYear ?? ""} 
                    onChange={(event) => updateContext("year", event.target.value)}
                >
                    <option value="" disabled>Please select a forecast year</option>
                    {forecastYears.map((year) => (
                        <option key={year} value={String(year)}>{year}</option>
                    ))}
                </select>
            </div>
            
            {currentUrlState === 'partial' ? (
                    <p>Select a client and a forecast year to begin.</p>
                ) : currentUrlState === 'invalid' ? (
                    <p>Invalid client, year, or revision</p>
                ) : (
                    <div>
                        <p>workspace selected: Client {clientId}, Year {forecastYear}</p>
                        {Object.keys(resolvedData).length === 0 ? (
                            <div>
                                <p>Empty Crop Section</p>
                                <button>{revisions.find((rev)=>(rev.order===1)).name}</button>
                            </div>
                        ) : (sortedRevisions.map((rev) => (
                            <button key={rev.id} onClick={()=>updateContext("revision", rev.id)}>
                                {rev.name}
                            </button>
                        )))}
                    </div>
                )
            }
        </div>
    )
}

export default Overview