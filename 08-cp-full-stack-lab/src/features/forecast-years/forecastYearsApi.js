// feature/forecast-yearsforecastYearsApi.js

import { unknownMutationOutcome, ApiError } from "../../ApiError"

const baseURL = 'http://127.0.0.1:8000'

const isValidForecastYear = (year) => 
    Number.isInteger(year?.forecast_year) && 
    typeof year?.modified_by === 'string' &&
    typeof year?.modified_at === 'string' &&
    year.forecast_year > 2025

export async function getForecastYears(){
    try {
        const response = await fetch(`${baseURL}/forecast-years`)

        if (response.status !== 200) {
            throw new Error('Unrecognized status code for fetching forecast years.')
        }

        const data = await response.json()

        if (!Array.isArray(data) || !data.every(isValidForecastYear)) {
            throw new Error('Unrecognized data shape from retrieving forecast years')
        }

        return data
    } catch (err) {
        throw new ApiError(
            "refresh",
            "REFRESH_ERROR",
            "The forecast year data could not be retrieved. Please refresh again.",
            { cause: err }
        )
    }
}