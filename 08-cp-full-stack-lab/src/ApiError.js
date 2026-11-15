
export class ApiError extends Error {
    constructor(type, code, message, options = {}) {
        super(message, options)

        this.name = "ApiError"
        this.type = type 
        this.code = code
    }
}

export function unknownMutationOutcome(cause) {
    return new ApiError(
        "unknown",
        "UNKNOWN_OUTCOME",
        "The operation's outcome could not be confirmed, Refresh before attempting another change",
        { cause }
    )
}

