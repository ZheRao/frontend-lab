// features/crop-plan/helpers.js

export function urlStates ({ rawClientId, clientList, rawForecastYear, yearList, rawRevisionId, revisionList }) {
    const clientId = rawClientId === null ? null : Number(rawClientId)
    const forecastYear = rawForecastYear === null ? null : Number(rawForecastYear)
    const revisionId = rawRevisionId === null ? null : Number(rawRevisionId)
    if (!clientId || !forecastYear) {
        return 'partial'
    } else if (!(clientList.includes(clientId)) || !(yearList.includes(forecastYear)) || !(revisionList.includes(revisionId))) {
        return 'invalid'
    } else {
        return 'valid'
    }
}

function mergeCategory (sorted, categories) {
    const categoryLookUp = new Map(categories.map(category => [category.key, { label:category.label, unit:category.unit }] ))
    const merged = sorted.map((row) => {
        const matched = categoryLookUp.get(row.categoryKey)
        return {
            ...row,
            ...matched
        }
    })
    return merged
}

function sortRawDataOnRevision (filtered) {
    // sort all records once, so when they are being allocated into the data shape frontend expects, no re-ording nor re-allocation required
    const sorted = [...filtered].sort((a,b) => {
        if (a.revisionId !== b.revisionId) {
            return b.order - a.order
        } else {
            return b.id - a.id
        }
    })
    return sorted
}

function filterRawDataOnRevision (rawData, targetRevisionOrder, revisions, categories) {
    const revisionLookUp = new Map(revisions.map(revision => [revision.id, revision.order]))
    const mergedData = rawData.map((row) => {
        const matched = {order: revisionLookUp.get(row.revisionId)}
        return {
            ...row,
            ...matched
        }
    })
    const filteredData = mergedData.filter((row) => (row.order <= targetRevisionOrder))
    const sortedData = sortRawDataOnRevision(filteredData)
    const categoryMerged = mergeCategory(sortedData, categories)
    return categoryMerged
}


export function resolver(rawData, targetRevision, revisions, categories) {
    if (rawData.length === 0) return {}   //safeguard against empty raw data due to filtering
    const targetRevisionOrder = revisions.find(revision => (revision.id === targetRevision))?.order
    if (targetRevisionOrder === undefined) return {} //safeguard against invalid revisions
    const processedData = filterRawDataOnRevision(rawData, targetRevisionOrder, revisions, categories)
    const resolvedData = {}
    for (const data of processedData) {
        const { clientId, forecastYear, cropId, categoryKey, ...dataSubset} = data
        if (resolvedData[cropId] === undefined) {
            resolvedData[cropId] = {}
        }
        // the rows are already sorted DESC, if a category is empty, the first record filling the category would be the latest one
        //  other rows would be pushed to the category's history, also in descending order, works out perfectly
        if (resolvedData[cropId][categoryKey] === undefined) {
            resolvedData[cropId][categoryKey] = dataSubset
            const isInherited = dataSubset.revisionId !== targetRevision
            resolvedData[cropId][categoryKey]["isInherited"] = isInherited
            resolvedData[cropId][categoryKey]["history"] = []
            if (!isInherited) {
                const { history, isInherited, ...dataSubsetSelf} = dataSubset
                resolvedData[cropId][categoryKey]["history"].push(dataSubsetSelf)
            }
        } else {
            if (dataSubset.revisionId === targetRevision) {
                resolvedData[cropId][categoryKey]["history"].push(dataSubset)
            }
        }
         
        
    }
    // console.log(resolvedData)
    return resolvedData
}

