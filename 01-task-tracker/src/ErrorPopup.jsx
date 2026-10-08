function ErrorPopup({message, onRetry, onClose, showClose}){
    return (
        <div className="overlay">
            <div className="popup">
                <p>{message}</p>
                <button onClick={onRetry}>Try again</button>
                {showClose && (
                    <button onClick={onClose}>Close</button>
                )}
            </div>
        </div>
    )
}

export default ErrorPopup