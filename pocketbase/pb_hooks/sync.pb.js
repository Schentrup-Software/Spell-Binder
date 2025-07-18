// Bulk data synchronization system for Spell Binder
// Downloads and processes Scryfall bulk data to populate local Cards collection

const SCRYFALL_BULK_DATA_URL = "https://api.scryfall.com/bulk-data"
const BATCH_SIZE = 1000 // Process cards in batches to avoid memory issues
const MAX_RETRIES = 3
const RETRY_DELAY = 5000 // 5 seconds

// Import logging system (loaded by sync-logger.pb.js)
const logger = global.SyncLogger || {
    info: console.log,
    warn: console.warn,
    error: console.error,
    debug: console.log
}

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
            const records = $app.dao().findRecordsByFilter("sync_status", `data_type = "${dataType}"`, "", 1, 0)
            if (records.length > 0) {
                syncRecord = records[0]
            }
        } catch (err) {
            // Record doesn't exist, will create new one
        }
        
        if (!syncRecord) {
            // Create new sync status record
            const collection = $app.dao().findCollectionByNameOrId("sync_status")
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
        
        $app.dao().saveRecord(syncRecord)
        logger.info("Sync status updated", { dataType, status, recordsProcessed })
        
    } catch (error) {
        logger.error("Failed to update sync status", { dataType, status, error: error.message })
    }
}

// Process a batch of cards and insert/update them in the database
function processBatch(cards, batchNumber, totalBatches) {
    logger.info("Processing batch", { batchNumber, totalBatches, cardCount: cards.length })
    
    const cardsCollection = $app.dao().findCollectionByNameOrId("cards")
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
                const existingRecords = $app.dao().findRecordsByFilter("cards", `scryfall_id = "${cardData.id}"`, "", 1, 0)
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
            
            // Update card fields
            cardRecord.set("name", cardData.name)
            cardRecord.set("set_code", cardData.set)
            cardRecord.set("set_name", cardData.set_name || "")
            cardRecord.set("rarity", cardData.rarity || "common")
            cardRecord.set("mana_cost", cardData.mana_cost || "")
            cardRecord.set("type_line", cardData.type_line)
            cardRecord.set("colors", cardData.colors || [])
            cardRecord.set("last_updated", new DateTime())
            
            // Set price if available
            if (cardData.prices && cardData.prices.usd) {
                const price = parseFloat(cardData.prices.usd)
                if (!isNaN(price)) {
                    cardRecord.set("price_usd", price)
                }
            }
            
            // Store image URLs for later download
            if (cardData.image_uris) {
                // Store the best available image URL
                if (cardData.image_uris.normal) {
                    cardRecord.set("image_uri", cardData.image_uris.normal)
                } else if (cardData.image_uris.small) {
                    cardRecord.set("image_uri", cardData.image_uris.small)
                } else if (cardData.image_uris.large) {
                    cardRecord.set("image_uri", cardData.image_uris.large)
                }
                
                // Also store a fallback URL (smaller size for faster loading)
                if (cardData.image_uris.small) {
                    cardRecord.set("image_uri_small", cardData.image_uris.small)
                }
            } else if (cardData.card_faces && cardData.card_faces[0] && cardData.card_faces[0].image_uris) {
                // For double-faced cards, use the front face
                const frontFace = cardData.card_faces[0]
                if (frontFace.image_uris.normal) {
                    cardRecord.set("image_uri", frontFace.image_uris.normal)
                } else if (frontFace.image_uris.small) {
                    cardRecord.set("image_uri", frontFace.image_uris.small)
                }
                
                if (frontFace.image_uris.small) {
                    cardRecord.set("image_uri_small", frontFace.image_uris.small)
                }
            }
            
            $app.dao().saveRecord(cardRecord)
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
        
        // Find the default cards bulk data (one printing per card)
        let bulkDataUrl = null
        for (const dataSet of bulkDataInfo.data) {
            if (dataSet.type === "default_cards") {
                bulkDataUrl = dataSet.download_uri
                console.log(`Found default cards bulk data: ${dataSet.size} bytes, updated ${dataSet.updated_at}`)
                break
            }
        }
        
        if (!bulkDataUrl) {
            throw new Error("Default cards bulk data not found")
        }
        
        // Download bulk card data
        console.log("Downloading bulk card data...")
        const bulkCardData = makeRequest(bulkDataUrl)
        
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
        const syncRecords = $app.dao().findRecordsByFilter("sync_status", "", "-last_sync", 10, 0)
        
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
        const inProgressRecords = $app.dao().findRecordsByFilter("sync_status", `status = "in_progress"`, "", 1, 0)
        
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
        const card = $app.dao().findRecordById("cards", cardId)
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
        $app.dao().saveRecord(card)
        
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
        // Get cards that have image_uri but no image_file
        const cards = $app.dao().findRecordsByFilter(
            "cards", 
            "image_uri != '' && image_file = ''", 
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
            const imageUrl = card.get("image_uri")
            const imageUrlSmall = card.get("image_uri_small")
            
            // Try main image URL first, then fallback to small
            let downloadSuccess = false
            
            if (imageUrl) {
                downloadSuccess = downloadCardImage(cardId, imageUrl)
            }
            
            // If main image failed and we have a small image URL, try that
            if (!downloadSuccess && imageUrlSmall && imageUrlSmall !== imageUrl) {
                logger.info("Trying fallback small image", { cardId, imageUrlSmall })
                downloadSuccess = downloadCardImage(cardId, imageUrlSmall)
            }
            
            if (downloadSuccess) {
                successCount++
            } else if (!imageUrl && !imageUrlSmall) {
                skippedCount++
                logger.debug("No image URLs available for card", { cardId })
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
        const totalNeedingImages = $app.dao().findRecordsByFilter(
            "cards", 
            "image_uri != '' && image_file = ''", 
            "", 
            1, 
            0
        ).length
        
        // Get total cards with images
        const totalWithImages = $app.dao().findRecordsByFilter(
            "cards", 
            "image_file != ''", 
            "", 
            1, 
            0
        ).length
        
        // Get sync status
        const syncStatus = $app.dao().findRecordsByFilter("sync_status", `data_type = "images"`, "", 1, 0)
        
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