// this file will represent boundary between React UI and API

// make a function finish later
//  fakeCreateTask does not take two seconds to return, it returns Promise { pending } almost immediately
export function fakeCreateTask(){
    // promise is an object representing: A result that may become available later
    return new Promise ((resolve) => {  // resolve: "here's your done button, I'll call it resolve"
        // brower, arrange for this function to run after at least approximately 2 second
        setTimeout(() => {  // "in 2 seconds ..."
            console.log("API operation finished")
            resolve()   // "... press the done button"
                        // also if you have 'resolve(4)', then whoever is doing 'await' gets '4' back
        }, 2000)
    })
}