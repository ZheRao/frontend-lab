// features/crop-plan/CropField.jsx

import { Pencil } from "lucide-react"
import { formatValue } from "./helpers"

function CropField({ label, unit, field, onSelect }){
    const status = 
        field === undefined ? "no input"
        : field.isInherited ? "inherited" 
        : "saved in this revision"
    
    const spokenValue = field === undefined ? "no value": `${formatValue(field.value)} ${unit}`

    return (
        <button 
            type="button"
            className="crop-field"
            onClick={onSelect}
            aria-label={`${label}: ${spokenValue}, ${status}. Edit`}
        >
            <span className="crop-field__label">
                {label}
                {field && (
                    <span 
                        className={field.isInherited ? "indicator indicator--inherited" : "indicator indicator--local"}
                        aria-hidden="true"
                    />
                )}
                <Pencil className="crop-field__edit-icon" size={12} aria-hidden="true" />
            </span>
            <span className={field ? "crop-field__value" : "crop-field__value crop-field__value--missing"}>
                {field ? formatValue(field.value) : '—'}
                {field && <span className="crop-field__unit">{unit}</span>}
            </span>
        </button>
    )
}

export default CropField