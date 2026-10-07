import {useState} from 'react'

function TaskRow({task, deleteTask}){
    // introduce local state isEditing because each TaskRow owns its own UI mode
    const [isEditing, setIsEditing] = useState(false)

    return (
        <tr>
            {isEditing ? (
                <>
                    <td>Editting!!!</td>
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
                          onClick={()=>(setIsEditing(true))}
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