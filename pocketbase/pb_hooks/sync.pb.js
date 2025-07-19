// Bulk data synchronization system for Spell Binder
// Downloads and processes Scryfall bulk data to populate local Cards collection

const SCRYFALL_BULK_DATA_URL = "https://api.scryfall.com/bulk-data/default-cards"
const BATCH_SIZE = 1000 // Process cards in batches to avoid memory issues
const MAX_RETRIES = 3
const RETRY_DELAY = 5000 // 5 seconds

// Import logging system (loaded by sync-logger.pb.js)
// Note: Use SyncLogger variable directly since it's available in the same scope
const logger = SyncLogger || {
    info: console.log,
    warn: console.warn,
    error: console.error,
    debug: console.log
}

//TODO: Add authentication https://pocketbase.io/docs/js-routing/#retrieving-the-current-auth-state

// Helper function to make HTTP requests with retry logic
function makeRequest(url, retries = MAX_RETRIES) {
    try {
        logger.debug("Making HTTP request", { url, retries })

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
        logger.error("Request failed", { url, error: error.message, retries })

        if (retries > 0) {
            logger.info(`Retrying in ${RETRY_DELAY}ms...`, { retriesLeft: retries })
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

        $app.saveRecord(syncRecord)
        logger.info("Sync status updated", { dataType, status, recordsProcessed })

    } catch (error) {
        logger.error("Failed to update sync status", { dataType, status, error: error.message })
    }
}

// Process a batch of cards and insert/update them in the database
function processBatch(cards, batchNumber, totalBatches) {
    logger.info("Processing batch", { batchNumber, totalBatches, cardCount: cards.length })

    const cardsCollection = $app.findCollectionByNameOrId("cards")
    let processedCount = 0
    let errorCount = 0

    for (const cardData of cards) {
        try {
            // Skip cards without required fields
            if (!cardData.id || !cardData.name || !cardData.set || !cardData.type_line) {
                logger.debug("Skipping card with missing required fields", {
                    cardId: cardData.id,
                    cardName: cardData.name
                })
                continue
            }

            // Check if card already exists
            let cardRecord = null
            try {
                const existingRecords = $app.findRecordsByFilter("cards", `scryfall_id = "${cardData.id}"`, "", 1, 0)
                if (existingRecords.length > 0) {
                    cardRecord = existingRecords[0]
                }
            } catch (err) {
                // Card doesn't exist, will create new one
            }

            if (!cardRecord) {
                cardRecord = new Record(cardsCollection)
                cardRecord.set("scryfall_id", cardData.id)
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
            cardRecord.set("type_line", cardData.type_line)
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

            // Price information
            cardRecord.set("prices", cardData.prices || {})
            if (cardData.prices) {
                if (cardData.prices.usd) {
                    const price = parseFloat(cardData.prices.usd)
                    if (!isNaN(price)) {
                        cardRecord.set("price_usd", price)
                    }
                }
                if (cardData.prices.usd_foil) {
                    const price = parseFloat(cardData.prices.usd_foil)
                    if (!isNaN(price)) {
                        cardRecord.set("price_usd_foil", price)
                    }
                }
                if (cardData.prices.eur) {
                    const price = parseFloat(cardData.prices.eur)
                    if (!isNaN(price)) {
                        cardRecord.set("price_eur", price)
                    }
                }
                if (cardData.prices.tix) {
                    const price = parseFloat(cardData.prices.tix)
                    if (!isNaN(price)) {
                        cardRecord.set("price_tix", price)
                    }
                }
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

            $app.saveRecord(cardRecord)
            processedCount++

        } catch (error) {
            errorCount++
            logger.error("Error processing card", {
                cardName: cardData.name || "unknown",
                cardId: cardData.id || "unknown",
                error: error.message
            })
        }
    }

    logger.info("Batch complete", { batchNumber, processedCount, errorCount })
    return processedCount
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

// API endpoint to trigger manual sync
routerAdd("POST", "/api/sync/cards", (c) => {
    try {
        console.log("Manual card sync triggered via API")
        const result = syncBulkCardData()

        if (result.success) {
            return c.json(200, {
                success: true,
                message: result.message,
                records_processed: result.recordsProcessed
            })
        } else {
            return c.json(500, {
                success: false,
                error: result.error
            })
        }

    } catch (error) {
        console.error("API sync error:", error.message)
        return c.json(500, {
            success: false,
            error: error.message
        })
    }
})

// API endpoint to get sync status
routerAdd("GET", "/api/sync/status", (c) => {
    try {
        const syncRecords = $app.findRecordsByFilter("sync_status", "", "-last_sync", 10, 0)

        const status = syncRecords.map(record => ({
            data_type: record.get("data_type"),
            status: record.get("status"),
            last_sync: record.get("last_sync"),
            records_processed: record.get("records_processed"),
            error_message: record.get("error_message")
        }))

        return c.json(200, {
            success: true,
            sync_status: status
        })

    } catch (error) {
        console.error("Error fetching sync status:", error.message)
        return c.json(500, {
            success: false,
            error: error.message
        })
    }
})

// Scheduled sync job (can be triggered by external cron or similar)
routerAdd("POST", "/api/sync/scheduled", (c) => {
    try {
        // Check if a sync is already in progress
        const inProgressRecords = $app.findRecordsByFilter("sync_status", `status = "in_progress"`, "", 1, 0)

        if (inProgressRecords.length > 0) {
            return c.json(409, {
                success: false,
                error: "Sync already in progress"
            })
        }

        console.log("Scheduled card sync triggered")
        const result = syncBulkCardData()

        if (result.success) {
            return c.json(200, {
                success: true,
                message: result.message,
                records_processed: result.recordsProcessed
            })
        } else {
            return c.json(500, {
                success: false,
                error: result.error
            })
        }

    } catch (error) {
        console.error("Scheduled sync error:", error.message)
        return c.json(500, {
            success: false,
            error: error.message
        })
    }
})

// Function to download and store card images with optimization
function downloadCardImage(cardId, imageUrl, retries = 2) {
    if (!imageUrl) {
        logger.warn("No image URL provided for card", { cardId })
        return false
    }

    try {
        logger.debug("Downloading card image", { cardId, imageUrl, retries })

        // Check if the card already has an image file
        const card = $app.findRecordById("cards", cardId)
        if (card && card.get("image_file")) {
            logger.debug("Card already has an image file", { cardId })
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
        $app.saveRecord(card)

        logger.info("Card image downloaded and saved successfully", {
            cardId,
            fileName,
            size: response.raw.length
        })
        return true

    } catch (error) {
        logger.error("Failed to download card image", {
            cardId,
            imageUrl,
            error: error.message,
            retries
        })

        // Retry with exponential backoff
        if (retries > 0) {
            logger.info(`Retrying image download in ${RETRY_DELAY}ms...`, { cardId, retriesLeft: retries })
            const start = Date.now()
            while (Date.now() - start < RETRY_DELAY) {
                // Simple delay
            }
            return downloadCardImage(cardId, imageUrl, retries - 1)
        }

        return false
    }
}

// API endpoint to download images for cards that don't have them yet
routerAdd("POST", "/api/sync/images", (c) => {
    try {
        // Get cards that have image_uris but no image_file
        const cards = $app.findRecordsByFilter(
            "cards",
            "image_uris != '' && image_file = ''",
            "",
            50, // Process 50 cards at a time to avoid overwhelming the system
            0
        )

        if (cards.length === 0) {
            return c.json(200, {
                success: true,
                message: "No cards need image downloads",
                processed: 0
            })
        }

        logger.info(`Found ${cards.length} cards needing images`)

        // Update sync status
        updateSyncStatus("images", "in_progress", 0)

        let successCount = 0
        let failCount = 0
        let skippedCount = 0

        // Process each card with rate limiting
        for (let i = 0; i < cards.length; i++) {
            const card = cards[i]
            const cardId = card.id
            const imageUris = card.get("image_uris")

            // Try to get the best available image URL
            let imageUrl = null
            if (imageUris && typeof imageUris === 'object') {
                // Priority: normal > large > small > png
                imageUrl = imageUris.normal || imageUris.large || imageUris.small || imageUris.png
            }

            if (!imageUrl) {
                logger.warn("No suitable image URL found for card", { cardId, cardName: card.get("name") })
                skippedCount++
                continue
            }

            // Download the image
            const downloadSuccess = downloadCardImage(cardId, imageUrl)

            if (downloadSuccess) {
                successCount++
            } else {
                failCount++
            }

            // Update progress every 10 cards
            if ((successCount + failCount + skippedCount) % 10 === 0) {
                updateSyncStatus("images", "in_progress", successCount)
            }

            // Add small delay between downloads to be respectful to Scryfall
            if (i < cards.length - 1) {
                const start = Date.now()
                while (Date.now() - start < 100) {
                    // 100ms delay between downloads
                }
            }
        }

        // Update final status
        const finalStatus = failCount === 0 ? "success" : (successCount > 0 ? "partial" : "failed")
        const errorMessage = failCount > 0 ? `Failed to download ${failCount} images, skipped ${skippedCount}` : ""

        updateSyncStatus("images", finalStatus, successCount, errorMessage)

        return c.json(200, {
            success: true,
            message: `Downloaded ${successCount} images, ${failCount} failed, ${skippedCount} skipped`,
            processed: successCount,
            failed: failCount,
            skipped: skippedCount
        })

    } catch (error) {
        logger.error("Image sync error", { error: error.message })
        updateSyncStatus("images", "failed", 0, error.message)

        return c.json(500, {
            success: false,
            error: error.message
        })
    }
})

// API endpoint to get image sync progress
routerAdd("GET", "/api/sync/images/progress", (c) => {
    try {
        // Get total cards that need images
        const totalNeedingImages = $app.findRecordsByFilter(
            "cards",
            "image_uris != '' && image_file = ''",
            "",
            1,
            0
        ).length

        // Get total cards with images
        const totalWithImages = $app.findRecordsByFilter(
            "cards",
            "image_file != ''",
            "",
            1,
            0
        ).length

        // Get sync status
        const syncStatus = $app.findRecordsByFilter("sync_status", `data_type = "images"`, "", 1, 0)

        let status = "not_started"
        let lastSync = null
        let recordsProcessed = 0

        if (syncStatus.length > 0) {
            const record = syncStatus[0]
            status = record.get("status")
            lastSync = record.get("last_sync")
            recordsProcessed = record.get("records_processed") || 0
        }

        return c.json(200, {
            success: true,
            progress: {
                total_needing_images: totalNeedingImages,
                total_with_images: totalWithImages,
                status: status,
                last_sync: lastSync,
                records_processed: recordsProcessed,
                completion_percentage: totalNeedingImages > 0 ?
                    Math.round((totalWithImages / (totalWithImages + totalNeedingImages)) * 100) : 100
            }
        })

    } catch (error) {
        logger.error("Error getting image sync progress", { error: error.message })
        return c.json(500, {
            success: false,
            error: error.message
        })
    }
})

console.log("Bulk data synchronization system loaded")