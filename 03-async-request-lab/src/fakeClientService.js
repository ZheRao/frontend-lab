
let callCount = 0 
let nextId = 3

export function fakeCreateClient(name) {
    callCount++
    const shouldFail = callCount % 2 === 1
    return new Promise((resolve, reject) => {
        setTimeout(()=>{
            if (shouldFail) {
                reject(new Error("Fake error, client cannot be created, please try again"))
            } else {
                resolve({
                    id: nextId,
                    name: name,
                    modified_by: `Test User ${nextId}`
                })
                nextId++
            }
        }, 1000)
    })
}