
let nextId = 100

export function fakeCreateTask(name, createdby){
    return new Promise ((resolve, reject) => {  
        setTimeout(() => {  
            resolve({
                id: nextId,
                name: `${name}`,
                created_by: `${createdby}`
            })
            // reject(new Error("Fake server failed"))
            nextId = nextId + 1
        }, 2000)
    })
}

export function fakeGetTasks(){
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            resolve(
                [
                    // {id: 1, name: "Read DDIA", created_by: "Zhe"},
                    // {id: 2, name: "Practice piano", created_by: "ChatGPT"}
                ]
            )
            // reject (new Error("unable to retrieve initial task list"))
        }, 2000)
    })
}