import TaskRow from './TaskRow.jsx'

function TaskList({tasks,deleteTask,renameTask}){
    return (
        <table>
            <thead>
                <tr>
                    <th>Name</th>
                    <th>Created By</th>
                    <th>Action</th>
                </tr>
            </thead>

            <tbody>
                {
                    tasks.map((task) =>
                        <TaskRow 
                            key={task.id}
                            task={task}
                            deleteTask={deleteTask}
                            renameTask={renameTask}
                        />
                    )
                }
            </tbody>
        </table>
    )
}

export default TaskList