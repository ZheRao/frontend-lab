function AddTaskForm({name, setName, createdby, setCreatedby, addTask, isBusy}){
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
              disabled={isBusy}
            >
                {isBusy ? 'Adding...' : 'Add Task'}
            </button>
        </div>
    )
}

export default AddTaskForm