import ErrorPopup from "./ErrorPopup.jsx"

function AddTaskForm({name, setName, createdby, setCreatedby, addTask, isBusy, error, setError}){
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

            {error && (
              <ErrorPopup 
                message={error}
                onRetry={addTask}
                onClose={()=>setError(null)}
              />
            )}

        </div>
    )
}

export default AddTaskForm