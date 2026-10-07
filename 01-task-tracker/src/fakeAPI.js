// this file will represent boundary between React UI and API

// make a function finish later
//  fakeCreateTask does not take two seconds to return, it returns Promise { pending } almost immediately
export function fakeCreateTask(){
    // promise is an object representing: A result that may become available later
    return new Promise ((resolve) => {  // resolve: "here's your done button, I'll call it resolve"
        // brower, arrange for this function to run after at least approximately 2 second
        setTimeout(() => {  
            console.log("API operation finished")
            resolve({
                id: 99,
                name: "Server-created task",
                created_by: "Fake Server"
            })   
        }, 2000)
    })
}