// features/crop-plan/cropPlanApi.js

import { unknownMutationOutcome, ApiError } from '../../ApiError'

const baseURL = 'http://127.0.0.1:8000'

const isValidCropPlan = (cp) => 
    Number.isInteger(cp?.id) && 
    Number.isInteger(cp?.client_id) && 
    Number.isInteger(cp?.forecast_year) &&
    Number.isInteger(cp?.crop_id) &&
    Number.isInteger(cp?.revision_id) &&
    Number.isFinite(cp?.value) && 
    cp.id > 0 &&
    cp.client_id > 0 && 
    cp.forecast_year > 0 && 
    cp.crop_id > 0 &&
    cp.revision_id > 0 &&
    cp.value >= 0 &&
    typeof cp?.category_key === "string" && 
    typeof cp?.modified_by === "string" &&
    typeof cp?.created_at === "string" && 
    (typeof cp?.memo === "string" || cp?.memo === null)

const isValidCropPlanCategory = (cat) => 
    typeof cat?.key === "string" &&
    typeof cat?.crop_year === "string" &&
    typeof cat?.label === "string" &&
    typeof cat?.unit === "string"

const isValidError = (parsedError, errorCode) => 
    parsedError?.detail?.code === errorCode &&
    typeof parsedError?.detail?.message === "string"

const toApiCropPlan = (row) => ({
    client_id: row.clientId,
    forecast_year: row.forecastYear,
    crop_id: row.cropId,
    revision_id: row.revisionId,
    category_key: row.categoryKey,
    value: row.value,
    memo: row?.memo
})

const fromApiCropPlan = (row) => ({
    id: row.id,
    clientId: row.client_id,
    forecastYear: row.forecast_year,
    cropId: row.crop_id,
    revisionId: row.revision_id,
    categoryKey: row.category_key,
    value: row.value,
    createdBy: row.modified_by,
    memo: row?.memo,
    createdAt: row.created_at
})

export async function getCropPlan(clientId, forecastYear) {
    try {
        const response = await fetch(`${baseURL}/crop-plan/${clientId}/${forecastYear}`)

        if (response.status !== 200) {
            throw new Error("Unexpected GET status.")
        }

        const data = await response.json()

        if (!Array.isArray(data) || !data.every(isValidCropPlan)) {
            throw new Error("Invalid crop plan response.")
        }

        return data.map((d) => (fromApiCropPlan(d)))
    } catch (err) {
        throw new ApiError(
            "refresh",
            "REFRESH_ERROR",
            "The crop plan data could not be retrieved. Please refresh again.",
            { cause: err }
        )
    }
}

export async function getCropPlanCategory() {
    try {
        const response = await fetch(`${baseURL}/crop-plan/categories`)

        if (response.status !== 200) {
            throw new Error("Unexpected GET status.")
        }

        const data = await response.json()

        if (!Array.isArray(data) || !data.every(isValidCropPlanCategory)) {
            throw new Error("Invalid crop plan category response.")
        }

        return data
    } catch (err) {
        throw new ApiError(
            "refresh",
            "REFRESH_ERROR",
            "The categories for crop plan could not be retrieved. Please refresh again.",
            { cause: err }
        )
    }
}

export async function createCropPlan({
    clientId,
    forecastYear,
    cropId,
    revisionId,
    categoryKey,
    value,
    memo
}) {
    let response 
    let data 
    try {
        response = await fetch(
            `${baseURL}/crop-plan`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(toApiCropPlan({ clientId, forecastYear, cropId, revisionId, categoryKey, value, memo }))
            }
        )

        data = await response.json()

    } catch (err) {
        throw unknownMutationOutcome(err)   // either failed to talk to the backend or unable to retrieve response from backend
    }

    if (response.status === 201) {
        if (isValidCropPlan(data)) {
            return fromApiCropPlan(data)
        } else {
            throw unknownMutationOutcome()  // status code says CREATED, but JSON is malformed
        }
    } else if (response.status === 503) {
        if (isValidError(data, "SERVICE_BUSY")) {
            throw new ApiError(
                "non-retryable",
                "SERVICE_BUSY",
                data.detail.message
            )
        } else {
            throw unknownMutationOutcome()
        }
    } else if (response.status === 422) {
        if (isValidError(data, "INVALID_VALUE")) {
            throw new ApiError(
                "non-retryable",
                "INVALID_VALUE",
                data.detail.message
            )
        } else if (isValidError(data, "INVALID_REFERENCE")) {
            throw new ApiError(
                "non-retryable",
                "INVALID_REFERENCE",
                data.detail.message
            )
        } else if (Array.isArray(data?.detail)) {
            throw new ApiError(
                "non-retryable",
                "INVALID_VALUE",
                "One of value, crop_id, revision_id has been rejected by the backend, please contact the admin with the exact scenario you are working with."
            )
        } else {
            throw unknownMutationOutcome()
        }
    } else {
        throw unknownMutationOutcome()
    }
}