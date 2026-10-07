
let nextId = 100

export function fakeCreateTask(name, createdby){
    return new Promise ((resolve, reject) => {  
        setTimeout(() => {  
            // resolve({
            //     id: nextId,
            //     name: `${name}`,
            //     created_by: `${createdby}`
            // })
            reject(new Error("Fake server failed"))
            nextId = nextId + 1
        }, 2000)
    })
}