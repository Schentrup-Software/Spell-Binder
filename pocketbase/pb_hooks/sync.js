const SCRYFALL_BULK_DATA_URL = "https://api.scryfall.com/bulk-data/default-cards"
const BATCH_SIZE = 1000 // Process cards in batches to avoid memory issues
const MAX_RETRIES = 3
const RETRY_DELAY = 5000 // 5 seconds

function makeRequest(url, retries = MAX_RETRIES) {
    try {
        const response = $http.send({
            url: url,
            method: "GET",
            headers: {
                "User-Agent": "Spell-Binder/1.0"
            },
            timeout: 30
        })

        if (response.statusCode !== 200) {
            throw new Error(`HTTP ${response.statusCode}: ${response.raw}`)
        }

        return JSON.parse(response.raw)
    } catch (error) {
        console.log("Request failed", { url, error: error.message, retries })

        if (retries > 0) {
            console.log(`Retrying in ${RETRY_DELAY}ms...`, { retriesLeft: retries })
            // Simple delay implementation
            const start = Date.now()
            while (Date.now() - start < RETRY_DELAY) {
                // Busy wait - not ideal but works for PocketBase hooks
            }
            return makeRequest(url, retries - 1)
        }

        throw error
    }
}

// Update sync status in database
function updateSyncStatus(dataType, status, recordsProcessed = 0, errorMessage = null) {
    try {
        let syncRecord = null

        // Try to find existing sync status record
        try {
            const records = $app.findRecordsByFilter("sync_status", `data_type = "${dataType}"`, "", 1, 0)
            if (records.length > 0) {
                syncRecord = records[0]
            }
        } catch (err) {
            // Record doesn't exist, will create new one
        }

        if (!syncRecord) {
            // Create new sync status record
            const collection = $app.findCollectionByNameOrId("sync_status")
            syncRecord = new Record(collection)
            syncRecord.set("data_type", dataType)
        }

        // Update sync status fields
        syncRecord.set("status", status)
        syncRecord.set("records_processed", recordsProcessed)
        syncRecord.set("last_sync", new DateTime())

        if (errorMessage) {
            syncRecord.set("error_message", errorMessage)
        } else {
            syncRecord.set("error_message", "")
        }

        $app.save(syncRecord)

    } catch (error) {
        console.error("Failed to update sync status: " + error.message)
    }
}

// Process a batch of cards and insert/update them in the database
function processBatch(cards, batchNumber, totalBatches) {
    const cardsCollection = $app.findCollectionByNameOrId("cards")
    let processedCount = 0
    let errorCount = 0

    let batchOfSearchableCards = []
    let batchOfPrices = []
    let existingRecords = arrayOf(new Record);
    $app.recordQuery("cards")
        .where($dbx.in("scryfall_id", ...cards.map(card => card.id)))
        .all(existingRecords)

    const existingCardIds = new Map(existingRecords.map(record => [record.get("scryfall_id"), record]))

    for (const cardData of cards) {
        try {
            // Skip cards without required fields
            if (!cardData.id || !cardData.name || !cardData.set) {
                console.log("Skipping " + (cardData.name || cardData.id) + " with missing required fields: " + (
                    !cardData.id ? "id" : "") + (!cardData.name ? ", name" : "") + (!cardData.set ? ", set" : "")
                )
                continue
            }

            // Check if card already exists
            let cardRecord = existingCardIds.get(cardData.id) || null
            if (!cardRecord) {
                cardRecord = new Record(cardsCollection)
                cardRecord.set("scryfall_id", cardData.id)
            } else {
                batchOfPrices.push({
                    card_id: cardRecord.id,
                    prices: cardData.prices || {},
                });
                continue;
            }

            // Basic card information
            cardRecord.set("name", cardData.name)
            cardRecord.set("oracle_id", cardData.oracle_id || "")
            cardRecord.set("lang", cardData.lang || "en")

            // Date and layout information
            if (cardData.released_at) {
                cardRecord.set("released_at", cardData.released_at)
            }
            cardRecord.set("layout", cardData.layout || "normal")

            // Image information
            cardRecord.set("highres_image", cardData.highres_image || false)
            cardRecord.set("image_status", cardData.image_status || "missing")

            // Game mechanics
            cardRecord.set("cmc", cardData.cmc || 0)
            cardRecord.set("type_line", cardData.type_line || "")
            cardRecord.set("color_identity", cardData.color_identity || [])
            cardRecord.set("colors", cardData.colors || [])
            cardRecord.set("keywords", cardData.keywords || [])
            cardRecord.set("mana_cost", cardData.mana_cost || "")
            cardRecord.set("oracle_text", cardData.oracle_text || "")

            // Power/Toughness/Loyalty/Defense
            cardRecord.set("power", cardData.power || "")
            cardRecord.set("toughness", cardData.toughness || "")
            cardRecord.set("loyalty", cardData.loyalty || "")
            cardRecord.set("defense", cardData.defense || "")

            // Card faces for double-sided cards
            if (cardData.card_faces && cardData.card_faces.length > 0) {
                cardRecord.set("card_faces", cardData.card_faces)
            }

            // Legalities
            cardRecord.set("legalities", cardData.legalities || {})
            cardRecord.set("games", cardData.games || [])

            // Card properties
            cardRecord.set("reserved", cardData.reserved || false)
            cardRecord.set("foil", cardData.foil || false)
            cardRecord.set("nonfoil", cardData.nonfoil || false)
            cardRecord.set("finishes", cardData.finishes || [])
            cardRecord.set("oversized", cardData.oversized || false)
            cardRecord.set("promo", cardData.promo || false)
            cardRecord.set("reprint", cardData.reprint || false)
            cardRecord.set("variation", cardData.variation || false)

            // Set information
            cardRecord.set("set_id", cardData.set_id || "")
            cardRecord.set("set_code", cardData.set)
            cardRecord.set("set_name", cardData.set_name || "")
            cardRecord.set("set_type", cardData.set_type || "")
            cardRecord.set("collector_number", cardData.collector_number || "")
            cardRecord.set("digital", cardData.digital || false)
            cardRecord.set("rarity", cardData.rarity || "common")

            // Artist information
            cardRecord.set("artist", cardData.artist || "")
            cardRecord.set("artist_ids", cardData.artist_ids || [])

            // Card frame and appearance
            cardRecord.set("border_color", cardData.border_color || "black")
            cardRecord.set("frame", cardData.frame || "")
            cardRecord.set("security_stamp", cardData.security_stamp || "")
            cardRecord.set("full_art", cardData.full_art || false)
            cardRecord.set("textless", cardData.textless || false)
            cardRecord.set("booster", cardData.booster || false)
            cardRecord.set("story_spotlight", cardData.story_spotlight || false)

            // Rankings
            if (cardData.edhrec_rank) {
                cardRecord.set("edhrec_rank", cardData.edhrec_rank)
            }
            if (cardData.penny_rank) {
                cardRecord.set("penny_rank", cardData.penny_rank)
            }

            // URIs and external links
            cardRecord.set("related_uris", cardData.related_uris || {})
            cardRecord.set("purchase_uris", cardData.purchase_uris || {})

            // Store image URLs for later download
            if (cardData.image_uris) {
                cardRecord.set("image_uris", cardData.image_uris)
            } else if (cardData.card_faces && cardData.card_faces[0] && cardData.card_faces[0].image_uris) {
                // For double-faced cards, store the front face image URIs
                cardRecord.set("image_uris", cardData.card_faces[0].image_uris)
            }

            // External IDs
            cardRecord.set("multiverse_ids", cardData.multiverse_ids || [])
            if (cardData.mtgo_id) {
                cardRecord.set("mtgo_id", cardData.mtgo_id)
            }
            if (cardData.arena_id) {
                cardRecord.set("arena_id", cardData.arena_id)
            }
            if (cardData.tcgplayer_id) {
                cardRecord.set("tcgplayer_id", cardData.tcgplayer_id)
            }
            if (cardData.cardmarket_id) {
                cardRecord.set("cardmarket_id", cardData.cardmarket_id)
            }

            // Preview information
            if (cardData.preview) {
                cardRecord.set("preview_info", cardData.preview)
            }

            // Related parts (for cards with tokens, etc.)
            if (cardData.all_parts) {
                cardRecord.set("all_parts", cardData.all_parts)
            }

            // Update timestamp
            cardRecord.set("last_updated", new DateTime())
            $app.saveNoValidate(cardRecord)

            // Add card set to all_card_sets collection if it has set information
            if (cardData.set && cardData.set_name) {
                insertOrUpdateCardSet(cardData.set, cardData.set_name)
            }

            batchOfSearchableCards.push({
                card_id: cardData.id,
                name: cardData.name,
                oracle_text: cardData.oracle_text
            })

            processedCount++
        } catch (error) {
            errorCount++
            console.error("Error processing card " + cardData?.name + ": " + error.message)
        }
    }

    insertSearchData(batchOfSearchableCards, batchNumber, totalBatches)
    batchProcessPrices(batchOfPrices, batchNumber, totalBatches)

    return processedCount
}

// Insert or update a card set in the all_card_sets collection
function insertOrUpdateCardSet(setCode, setName) {
    try {
        const allCardSetsCollection = $app.findCollectionByNameOrId("all_card_sets")

        // Check if the set already exists
        let setRecord = null
        try {
            const existingSets = $app.findRecordsByFilter("all_card_sets", `set_code = "${setCode}"`, "", 1, 0)
            if (existingSets.length > 0) {
                setRecord = existingSets[0]
            }
        } catch (err) {
            // Set doesn't exist, will create new one
        }

        if (!setRecord) {
            // Create new set record
            setRecord = new Record(allCardSetsCollection)
            setRecord.set("set_code", setCode)
            setRecord.set("set_name", setName)
            $app.save(setRecord)
        }
    } catch (error) {
        console.error(`Error inserting/updating card set ${setCode}: ${error.message}`)
    }
}

function insertSearchData(batchOfSearchableCards, batchNumber, totalBatches) {
    const startTime = new Date()
    const existing = arrayOf(new DynamicModel({ "card_id": "" }));
    $app.db()
        .select("card_id")
        .from("search_text_fts")
        .where($dbx.in("card_id", ...batchOfSearchableCards.map(card => card.card_id)))
        .limit(BATCH_SIZE)
        .all(existing)

    // Turn into ditionary for faster lookup
    const existingCardIds = new Set(existing.map(record => record.card_id))

    const newCardIds = batchOfSearchableCards
        .filter(({ card_id }) => !existingCardIds.has(card_id))

    if (newCardIds.length === 0) {
        console.log(`No new search texts to insert for batch ${batchNumber}/${totalBatches}`)
        return
    }

    const result = $app.db()
        .newQuery(
            "INSERT INTO search_text_fts (card_id, name, oracle_text) VALUES " + newCardIds.map((value, index) => `({:card_id_${index}}, {:name_${index}}, {:oracle_text_${index}})`).join(", ")
        ).bind(
            newCardIds.reduce((acc, value, index) => {
                acc[`card_id_${index}`] = value.card_id;
                acc[`name_${index}`] = value.name;
                acc[`oracle_text_${index}`] = value.oracle_text;
                return acc;
            }, {})
        ).execute()
    const endTime = new Date()

    if (result.rowsAffected() === 0) {
        console.warn(`Failed to insert search text for card ${cardData.name} (${cardData.oracle_id})`)
    } else {
        const timeToRun = (endTime - startTime) / 1000 // Convert to seconds
        console.log(`Inserted ${result.rowsAffected()} search texts in batch ${batchNumber}/${totalBatches} in ${timeToRun} seconds`)
    }
}

// Batch process card prices - delete old prices and insert new ones
function batchProcessPrices(priceData, batchNumber, totalBatches) {
    const startTime = new Date()

    if (priceData.length === 0) {
        console.log(`No price data to process for batch ${batchNumber}/${totalBatches}`)
        return
    }

    try {
        // First, delete existing prices for these cards
        const deleteResult = $app.db()
            .newQuery("DELETE FROM card_prices WHERE card_id IN (" + priceData.map((_, index) => `{:card_id_${index}}`).join(", ") + ")")
            .bind(priceData.reduce((acc, price, index) => {
                acc[`card_id_${index}`] = price.card_id
                return acc
            }, {}))
            .execute()

        // Then, insert new price data
        const values = []
        const bindings = {}
        const currentTime = new DateTime()

        priceData.forEach((priceDatum, index) => {
            values.push(`({:card_id_${index}}, {:price_usd_${index}}, {:price_usd_foil_${index}}, {:price_eur_${index}}, {:price_tix_${index}}, {:last_updated_${index}})`)

            bindings[`card_id_${index}`] = priceDatum.card_id
            bindings[`price_usd_${index}`] = priceDatum.prices.usd || 0
            bindings[`price_usd_foil_${index}`] = priceDatum.prices.usd_foil || 0
            bindings[`price_eur_${index}`] = priceDatum.prices.eur || 0
            bindings[`price_tix_${index}`] = priceDatum.prices.tix || 0
            bindings[`last_updated_${index}`] = currentTime
        })

        const insertQuery = "INSERT INTO card_prices (card_id, price_usd, price_usd_foil, price_eur, price_tix, last_updated) VALUES " + values.join(", ")

        const insertResult = $app.db()
            .newQuery(insertQuery)
            .bind(bindings)
            .execute()

        const endTime = new Date()
        const timeToRun = (endTime - startTime) / 1000

        console.log(`Batch inserted ${insertResult.rowsAffected()} price records for batch ${batchNumber}/${totalBatches} in ${timeToRun} seconds`)
    } catch (error) {
        console.error(`Error in batch price processing for batch ${batchNumber}/${totalBatches}: ${error.message}`)
    }
}

// Main sync function to download and process bulk card data
function syncBulkCardData() {
    console.log("Starting bulk card data synchronization...")
    updateSyncStatus("cards", "in_progress", 0)

    try {
        // Get bulk data information from Scryfall
        console.log("Fetching bulk data information...")
        const bulkDataInfo = makeRequest(SCRYFALL_BULK_DATA_URL)

        if (!bulkDataInfo.download_uri) {
            throw new Error("Bulk data download URI not found in response")
        }

        // Download bulk card data
        console.log("Downloading bulk card data...")
        const bulkCardData = makeRequest(bulkDataInfo.download_uri)

        if (!Array.isArray(bulkCardData)) {
            throw new Error("Invalid bulk data format - expected array")
        }

        console.log(`Downloaded ${bulkCardData.length} cards`)

        // Process cards in batches
        let totalProcessed = 0
        const totalBatches = Math.ceil(bulkCardData.length / BATCH_SIZE)

        for (let i = 0; i < bulkCardData.length; i += BATCH_SIZE) {
            const batch = bulkCardData.slice(i, i + BATCH_SIZE)
            const batchNumber = Math.floor(i / BATCH_SIZE) + 1

            const batchProcessed = processBatch(batch, batchNumber, totalBatches)
            totalProcessed += batchProcessed

            // Update progress
            updateSyncStatus("cards", "in_progress", totalProcessed)
        }

        // Mark sync as complete
        updateSyncStatus("cards", "success", totalProcessed)
        console.log(`Bulk card data sync completed successfully: ${totalProcessed} cards processed`)

        // Trigger image sync for cards that need images
        try {
            console.log("Triggering image sync for new cards...")
            // Make an internal request to the image sync endpoint
            const imageResponse = $http.send({
                url: "http://localhost:8090/api/sync/images",
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                }
            })

            if (imageResponse.statusCode === 200) {
                const imageResult = JSON.parse(imageResponse.raw)
                console.log(`Image sync result: ${imageResult.message || "completed"}`)
            } else {
                console.warn(`Image sync failed with status ${imageResponse.statusCode}`)
            }
        } catch (imageError) {
            console.warn(`Image sync failed: ${imageError.message}`)
            // Continue even if image sync fails - it can be retried later
        }

        return {
            success: true,
            recordsProcessed: totalProcessed,
            message: `Successfully synced ${totalProcessed} cards`
        }

    } catch (error) {
        const errorMessage = `Bulk sync failed: ${error.message}`
        console.error(errorMessage)
        updateSyncStatus("cards", "failed", 0, errorMessage)

        return {
            success: false,
            error: errorMessage
        }
    }
}

function downloadCardImage(cardId, imageUrl, retries = 2) {
    if (!imageUrl) {
        return false
    }

    try {
        // Check if the card already has an image file
        const card = $app.findRecordById("cards", cardId)
        if (card && card.get("image_file")) {
            return true
        }

        // Download the image with retry logic
        const response = $http.send({
            url: imageUrl,
            method: "GET",
            headers: {
                "User-Agent": "Spell-Binder-Catalog/1.0",
                "Accept": "image/jpeg,image/png,image/webp,image/*"
            },
            timeout: 30
        })

        if (response.statusCode !== 200) {
            throw new Error(`HTTP ${response.statusCode} when downloading image`)
        }

        // Determine file extension from URL or content type
        let fileExtension = "jpg"
        let mimeType = "image/jpeg"

        if (imageUrl.includes('.png')) {
            fileExtension = "png"
            mimeType = "image/png"
        } else if (imageUrl.includes('.webp')) {
            fileExtension = "webp"
            mimeType = "image/webp"
        }

        // Create filename with card name for better organization
        const cardName = card.get("name") || "unknown"
        const safeCardName = cardName.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 50)
        const fileName = `${safeCardName}_${cardId.substring(0, 8)}.${fileExtension}`

        // Create file object
        const imageFile = new File([response.raw], fileName, { type: mimeType })

        // Update the card record with the image file
        card.set("image_file", imageFile)
        $app.save(card)

        return true

    } catch (error) {
        console.error("Failed to download card image: " + error.message)

        // Retry with exponential backoff
        if (retries > 0) {
            const start = Date.now()
            while (Date.now() - start < RETRY_DELAY) {
                // Simple delay
            }
            return downloadCardImage(cardId, imageUrl, retries - 1)
        }

        return false
    }
}

module.exports = {
    syncBulkCardData: () => syncBulkCardData(),
    downloadCardImage: (cardId, imageUrl, retries) => downloadCardImage(cardId, imageUrl, retries)
}
