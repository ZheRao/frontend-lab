
let callCount = 0 
let nextId = 3

export function fakeCreateClient(name) {
    callCount++
    const shouldFail = callCount % 2 === 1
    return new Promise((resolve, reject) => {
        setTimeout(()=>{
            if (false) {
                reject(new Error("Fake error: client cannot be created, please try again"))
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

export function fakeUnresolvingRequest(name) {
    return new Promise((resolve, reject) => {
    })
}

export function fakeDeleteClient(id, name) {
    callCount++
    const shouldFail = callCount % 2 === 1
    return new Promise((resolve, reject) => {
        setTimeout(()=>{
            if (false) {
                reject(new Error(`Fake error: client [${name}] cannot be deleted, please try again`))
            } else {
                resolve({
                    id: id
                })
            }
        }, 1000)
    })
}

export function fakeEditClient(id, oldName, newName) {
    callCount++
    const shouldFail = callCount % 2 === 1
    return new Promise((resolve, reject) => {
        setTimeout(()=>{
            if (true) {
                reject(new Error(`Fake error: client [${oldName}] cannot be renamed to [${newName}], please try again`))
            } else {
                resolve({
                    id: id,
                    name: newName,
                    modified_by: `Test User ${nextId}`
                })
                nextId++
            }
        }, 1000)
    })
}

