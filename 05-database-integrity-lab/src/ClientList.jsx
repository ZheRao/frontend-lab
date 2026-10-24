import ClientRow from './ClientRow.jsx'

function ClientList({ clients, onEdit, onDelete }) {
    return (
        <ul className="list">
            {clients.map(
                (client) => (
                    <ClientRow 
                        key={client.id}
                        client={client}
                        onEdit={onEdit}
                        onDelete={onDelete}
                    />
                )
            )}
        </ul>
    )
}

export default ClientList