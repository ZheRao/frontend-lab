// features/crop-plan/CropCard.jsx

// crop -> {id, name}
// fields -> { "unit_prce": { id, revisionId, isInherited, history, ... } , ... }
// categories -> { key, label, cropYear, unit } 

import { Link, useSearchParams } from 'react-router'
import { ChevronRight } from 'lucide-react'

import { cardGroups } from "./sampleData"
import CropField from './CropField'

function CropCard ({ crop, fields, categories, onFieldSelect }) {

    const [searchParams] = useSearchParams()

    return (
        <section className="crop-card">
            <header className="crop-card__header">
                <h3 className="crop-card__name">{crop.name}</h3>
                {/* <Link
                    className="crop-card__edit"
                    to={{ pathname: `/crop-plans/${crop.id}`, search: searchParams.toString() }}
                >
                    Edit inputs <ChevronRight size={16} aria-hidden="true" />
                </Link> */}
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
                                    onSelect={() => onFieldSelect(crop, catInfo, fieldInfo)}
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