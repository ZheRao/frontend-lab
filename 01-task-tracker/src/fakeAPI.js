


export function fakeCreateTask(){
    return new Promise ((resolve) => {  
        setTimeout(() => {  
            resolve({
                id: 99,
                name: "Server-created task",
                created_by: "Fake Server"
            })   
        }, 2000)
    })
}