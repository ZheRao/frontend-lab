
let nextId = 100
let callCount = 0

export function fakeCreateTask(name, createdby){
    callCount++
    const shouldFail = callCount % 2 === 1
    return new Promise ((resolve, reject) => {  
        setTimeout(() => {  
            if (shouldFail) {
                reject(new Error("Fake server add failed"))
            } else {
                resolve({
                    id: nextId,
                    name: `${name}`,
                    created_by: `${createdby}`
                })
            }
            nextId = nextId + 1
        }, 2000)
    })
}

export function fakeGetTasks(){
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            resolve(
                [
                    {id: 1, name: "Read DDIA", created_by: "Zhe"},
                    {id: 2, name: "Practice piano", created_by: "ChatGPT"}
                ]
            )
            // reject (new Error("unable to retrieve initial task list"))
        }, 2000)
    })
}

export function fakeDeleteTasks(id) {
    callCount++
    const shouldFail = callCount % 2 === 1
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            if (shouldFail) {
                reject(new Error(`unable to delete record ${id} please try again`))
            } else {
                resolve({deleteId: id})
            }
        }, 2000)
    })
}

export function fakeRenameTask(id, newName){
    callCount++
    const shouldFail = callCount % 2 === 1
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            if (shouldFail) {
                reject(new Error(`unable to rename record ${id} to new name ${newName}`))
            } else {
                resolve({
                    id: id,
                    name: newName
                })
            }
        }, 2000)
    })
}