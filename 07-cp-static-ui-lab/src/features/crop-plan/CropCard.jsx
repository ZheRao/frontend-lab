// features/crop-plan/CropCard.jsx

// crop -> {id, name}
// fields -> { "unit_prce": { id, revisionId, isInherited, history, ... } , ... }
// categories -> { key, label, cropYear, unit } 

import { cardGroups } from "./sampleData"
import CropField from './CropField'

function CropCard ({ crop, fields, categories, onFieldSelect }) {

    return (
        <section className="crop-card">
            <header className="crop-card__header">
                <h3 className="crop-card__name">{crop.name}</h3>
                {Object.keys(fields).length===0 && <span className="history-entry__badge">Draft</span>}
            </header>

            {cardGroups.map((group) => (
                <section key={group.label} className="crop-card__group">
                    <h3 className="crop-card__group-title">{group.label}</h3>
                    <div className="crop-card__fields">
                        {group.keys.map((cat) => {
                            const catInfo = categories.find((category) => category.key === cat)
                            const fieldInfo = fields[cat] 
                            return (
                                <CropField 
                                    key={cat}
                                    label={catInfo.label}
                                    unit={catInfo.unit}
                                    field={fieldInfo}
                                    onSelect={() => onFieldSelect(crop, catInfo)}
                                />
                            )
                        })}
                    </div>
                </section>
            ))}
        </section>
    )
}

export default CropCard