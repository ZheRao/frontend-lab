// features/crop-plan/Overview.jsx

import { useSearchParams, useNavigate } from 'react-router'
import { 
    clients
} from './sampleData.js'



function Overview() {
    const forecastYears = [ 2026, 2027, 2028, 2029 ]  // accepted limitation: hard coded forecast year, later maybe a separate year table?
    const [searchParams, setSearchParams] = useSearchParams()

    // read URL state
    const clientId = searchParams.get("client")
    const forecastYear = searchParams.get("year")


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
                            value={client.id}
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
            
            {!clientId || !forecastYear ? (
                    <p>Select a client and a forecast year to begin.</p>
                ) : (
                    <p>workspace selected: Client {clientId}, Year {forecastYear}</p>
                )
            }
        </div>
    )
}

export default Overview