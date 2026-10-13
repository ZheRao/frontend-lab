import ClientRow from './ClientRow.jsx'

function ClientList({ clients, onEdit }) {
    return (
        <ul className="list">
            {clients.map(
                (client) => (
                    <ClientRow 
                        key={client.id}
                        client={client}
                        onEdit={onEdit}
                    />
                )
            )}
        </ul>
    )
}

export default ClientList