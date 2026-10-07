
let nextId = 100

export function fakeCreateTask(name, createdby){
    return new Promise ((resolve) => {  
        setTimeout(() => {  
            resolve({
                id: nextId,
                name: `${name}`,
                created_by: `${createdby}`
            })   
            nextId = nextId + 1
        }, 2000)
    })
}