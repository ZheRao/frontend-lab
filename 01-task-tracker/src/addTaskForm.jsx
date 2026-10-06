
function AddTaskForm({name, setName, createdby, setCreatedby, addTask}){
    return (
        <div>
            <input 
              value={name}
              onChange = {(event)=>setName(event.target.value)}
            />

            <input 
              value={createdby}
              onChange={(event)=>setCreatedby(event.target.value)}
            />

            <button
              onClick={addTask}
            >
                Add Task
            </button>

        </div>
    )
}

export default AddTaskForm