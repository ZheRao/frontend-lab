import {useState} from 'react'

function TaskRow({task, deleteTask, renameTask, isBusy}){
    // modify 'isEditing' state to 'mode' state that takes 'view' or 'edit'
    const [mode, setMode] = useState('view')
    // draft for task name
    const [draftName, setDraftName] = useState(task.name)
    // reset draft state because react preserves TaskRow component's state
    const startEdit = () => {
        setMode('edit')
        setDraftName(task.name)
    }
    // save commits draft and set mode to 'view'
    const saveEdit = async () => {
        const isSuccess = await renameTask(task.id, draftName, saveEdit)
        // retry misses this set 'mode' to 'view' step
        if (isSuccess) {
            setMode('view')
        }
        
    }

    return (
        <tr>
            {mode==='edit' ? (
                <>
                    <td>
                        <input 
                          value={draftName}
                          onChange={(event)=>(setDraftName(event.target.value))}
                        />
                    </td>
                    <td>{task.created_by}</td>
                    <td>
                        <button
                          onClick={saveEdit}
                          disabled={isBusy}
                        >
                            {isBusy ? 'Saving...' : 'Save'}
                        </button>
                        <button
                          onClick={()=>(setMode('view'))}
                          disabled={isBusy}
                        >
                            Cancel
                        </button>
                    </td>
                </>
            ) : mode==='view' ? (
                <>
                    <td>{task.name}</td>
                    <td>{task.created_by}</td>
                    <td>
                        <button
                          onClick={startEdit}
                          disabled={isBusy}
                        >
                            Rename
                        </button>
                        <button
                          onClick={()=>deleteTask(task.id)}
                          disabled={isBusy}
                        >
                            Delete
                        </button>
                    </td>
                </>
            ) : null}
        </tr>
    )
}

export default TaskRow