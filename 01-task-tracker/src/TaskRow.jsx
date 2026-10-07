import {useState} from 'react'

function TaskRow({task, deleteTask}){
    // introduce local state isEditing because each TaskRow owns its own UI mode
    const [isEditing, setIsEditing] = useState(false)
    // draft for task name
    const [draftName, setDraftName] = useState(task.name)
    // reset draft state because react preserves TaskRow component's state
    const startEdit = () => {
        setIsEditing(true)
        setDraftName(task.name)
    }

    return (
        <tr>
            {isEditing ? (
                <>
                    <td>
                        <input 
                          value={draftName}
                          onChange={(event)=>(setDraftName(event.target.value))}
                        />
                    </td>
                    <td>{task.created_by}</td>
                    <td>
                        <button>
                            Save
                        </button>
                        <button
                          onClick={()=>(setIsEditing(false))}
                        >
                            Cancel
                        </button>
                    </td>
                </>
            ) : (
                <>
                    <td>{task.name}</td>
                    <td>{task.created_by}</td>
                    <td>
                        <button
                          onClick={startEdit}
                        >
                            Rename
                        </button>
                        <button
                          onClick={()=>deleteTask(task.id)}
                        >
                            Delete
                        </button>
                    </td>
                </>
            )}
        </tr>
    )
}

export default TaskRow