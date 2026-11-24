
let callCount = 0 
let nextId = 3

let db = [
    {id: 1, name: 'Farm A', modified_by: 'Alex'},
    {id: 2, name: 'Farm B', modified_by: 'Bob'}
]

function simulate(work, errorMessage='Simulated server failure') {
    callCount++
    const shouldFail = callCount % 2 === 1
    return new Promise((resolve, reject) => {
        setTimeout(()=>{
            if (shouldFail) {
                reject(new Error(errorMessage))
            } else {
                try {
                    resolve(work())
                } catch(err) {
                    reject(err)
                }
            }
        }, 15000)
    })
}

export function fakeCreateClient(name) {
    return simulate(()=>{
        const newRecord = {
            id: nextId,
            name: name,
            modified_by: `Test User ${nextId}`
        }
        nextId++
        db = [...db, newRecord]
        return {...newRecord}
    }, "Fake error: client cannot be created, please try again")
}

export function fakeGetClient() {
    // callCount++
    const shouldFail = callCount % 2 === 0
    return new Promise((resolve, reject)=>{
        setTimeout(()=>{
            if (false) {
                reject(new Error("Fake error: Couldn't retrieve clients"))
            } else {
                resolve([...db])
            }
        }, 1000)
    })
}

export function fakeDeleteClient(id, name) {
    const error = `Fake error: client [${name}] cannot be deleted, please try again`
    return simulate(()=>{
        db = db.filter((client) => (client.id!==id))
        return {id: id}
    }, error)
}

export function fakeEditClient(id, oldName, newName) {
    const error = `Fake error: client [${oldName}] cannot be renamed to [${newName}], please try again`
    return simulate(()=>{
        db = db.map((client)=>(
            client.id===id 
                ? {...client, name:newName, modified_by:`Test User ${nextId}`} 
                : client
        ))
        nextId++
        return {
            id: id,
            name: newName,
            modified_by: `Test User ${nextId-1}`
        }
    }, error)
}



