// features/revisions/revisionsApi.js

import { unknownMutationOutcome, ApiError } from "../../ApiError"

const baseURL = 'http://127.0.0.1:8000'

const isValidRevision = (rev) => 
    Number.isInteger(rev?.id) && 
    Number.isInteger(rev?.revision_order) && 
    typeof rev?.name === 'string' && 
    typeof rev?.modified_by === 'string' && 
    typeof rev?.modified_at === 'string' && 
    rev.id > 0 && 
    rev.revision_order > 0

export async function getRevisions() {
    try {
        const response = await fetch(`${baseURL}/forecast/revisions`)

        if (response.status !== 200) {
            throw new Error('Unrecognized status code for fetching revisions.')
        }

        const data = await response.json()

        if (!Array.isArray(data) || !data.every(isValidRevision)) {
            throw new Error('Unrecognized data fetched for revisions.')
        }

        return data
    } catch (err) {
        throw new ApiError(
            "refresh",
            "REFRESH_ERROR",
            "The revision data could not be retrieved. Please refresh again.",
            { cause: err }
        )
    }
}