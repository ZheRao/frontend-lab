import TaskRow from './TaskRow.jsx'

function TaskList({tasks,deleteTask}){
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
                        />
                    )
                }
            </tbody>
        </table>
    )
}

export default TaskList