// features/crops/cropsApi.js

import { unknownMutationOutcome, ApiError } from "../../ApiError"

const baseURL = 'http://127.0.0.1:8000'

const isValidCropData = (crop) => 
    Number.isInteger(crop?.id) && 
    typeof crop?.name === 'string' &&
    typeof crop?.modified_by === 'string' &&
    typeof crop?.modified_at === 'string' && 
    crop.id > 0



export async function getCrops(){
    try {
        const response = await fetch(`${baseURL}/definitions/crops`)

        if (response.status !== 200) {
            throw new Error('Unrecognized status code when fetching crops.')
        }

        const data = await response.json()

        if (!Array.isArray(data) || !data.every(isValidCropData)) {
            throw new Error('Unrecognized crop data shape.')
        }

        return data 
    } catch(err) {
        throw new ApiError(
            "refresh",
            "REFRESH_ERROR",
            "The crop data could not be retrieved. Please refresh again.",
            { cause: err }
        )
    }
}