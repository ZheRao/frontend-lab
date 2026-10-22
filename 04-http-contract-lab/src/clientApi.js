import { unknownMutationOutcome, ApiError } from "./ApiError"

const baseURL = 'http://127.0.0.1:8000'

const isValidClient = (client) => 
    Number.isInteger(client?.id) && 
    client.id > 0 && 
    typeof client?.name === "string" && 
    typeof client?.modified_by === "string"

const isValidErrorData = (data, error_code) => 
    (data?.detail?.code === error_code) &&
    (typeof data?.detail?.message === "string")

export async function getClients() {
    try {
        const response = await fetch(`${baseURL}/clients`)

        if (response.status !== 200) {
            throw new Error("Unexpected GET status.")
        }

        const data = await response.json()

        if (!Array.isArray(data) || !data.every(isValidClient)) {
            throw new Error("Invalid client list response.")
        }
        return data
    } catch (err) {
        throw new ApiError(
            "refresh",
            "REFRESH_ERROR",
            "The client list could not be retrieved.",
            { cause: err }
        )
    }
}

export async function createClient(name) {
    let response 
    let data

    try {
        response = await fetch(
            `${baseURL}/clients`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({name})
            }
        )

        data = await response.json()
    } catch (err) {
        throw unknownMutationOutcome(err)    // if either fetch or json parsing throws, unknown error, preserved 'Error.cause' for diagnostic reasons
    }

    console.log("HTTP status: ", response.status)
    console.log("Response body: ", data)

    if (response.status === 201) {
        if (isValidClient(data)) {
            return data
        } else {
            throw unknownMutationOutcome()  // status code says CREATED, but JSON body is malformed
        }
    } else if (response.status === 409) {
        if (isValidErrorData(data, "DUPLICATE_CLIENT")) {
            throw new ApiError(
                "non-retryable",
                "DUPLICATE_CLIENT",
                data.detail.message
            )
        } else {
            throw unknownMutationOutcome()  // status code says CONFLICT, but JSON body is malformed
        }
    } else {
        throw unknownMutationOutcome()  
    }
}

export async function editClient(clientId, name) {
    let response
    let data

    try {
        response = await fetch(
            `${baseURL}/clients/${clientId}`,
            {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({name})
            }
        )

        data = await response.json()
    } catch (err) {
        throw unknownMutationOutcome(err)
    }

    console.log("HTTP status: ", response.status)
    console.log("Response body: ", data)

    if (response.status === 200) {
        if (isValidClient(data) && data.id === clientId) {
            return data
        } else {
            throw unknownMutationOutcome()
        }
    } else if (response.status === 409) {
        if (isValidErrorData(data, "DUPLICATE_CLIENT")) {
            throw new ApiError(
                "non-retryable",
                "DUPLICATE_CLIENT",
                data.detail.message
            )
        } else {
            throw unknownMutationOutcome()
        }
    } else if (response.status === 404) {
        if (isValidErrorData(data, "CLIENT_NOT_FOUND")) {
            throw new ApiError(
                "non-retryable",
                "CLIENT_NOT_FOUND",
                data.detail.message
            )
        } else {
            throw unknownMutationOutcome()
        }
    } else {
        throw unknownMutationOutcome()
    }
}

export async function deleteClient(clientId) {
    let response 
    let data 

    try {
        response = await fetch(
            `${baseURL}/clients/${clientId}`,
            {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json"
                }
            }
        )
    } catch (err) {
        throw unknownMutationOutcome(err)
    }

    console.log("HTTP status: ", response.status)

    if (response.status === 204) {
        return
    } else {
        try {
            data = await response.json()
        } catch (err) {
            throw unknownMutationOutcome(err)
        }
        
        console.log("Response body: ", data)

        if (response.status === 409) {
            if (isValidErrorData(data, "CLIENT_REFERENCED")) {
                throw new ApiError(
                    "non-retryable",
                    "CLIENT_REFERENCED",
                    data.detail.message
                )
            } else {
                throw unknownMutationOutcome()
            }
        } else if (response.status === 404) {
            if (isValidErrorData(data, "CLIENT_NOT_FOUND")) {
                throw new ApiError(
                    "non-retryable",
                    "CLIENT_NOT_FOUND",
                    data.detail.message
                )
            } else {
                throw unknownMutationOutcome()
            }
        } else {
            throw unknownMutationOutcome()
        }
    }
}