
function AddTaskForm({name, setName, createdby, setCreatedby, addTask, isBusy, error}){
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

            {error && <p>{error}</p>}

        </div>
    )
}

export default AddTaskForm