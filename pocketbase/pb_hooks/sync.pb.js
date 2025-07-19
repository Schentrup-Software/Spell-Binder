// Bulk data synchronization system for Spell Binder
// Downloads and processes Scryfall bulk data to populate local Cards collection

//TODO: Add authentication https://pocketbase.io/docs/js-routing/#retrieving-the-current-auth-state

cronAdd("daily_sync", "0 2 * * *", () => {
    console.log("Daily sync job triggered")

    const sync = require(`${__hooks}/sync.js`)
    sync.syncBulkCardData();
});


// API endpoint to trigger manual sync
routerAdd("POST", "/api/sync/cards", (c) => {
    try {
        console.log("Manual card sync triggered via API")
        const sync = require(`${__hooks}/sync.js`)
        const result = sync.syncBulkCardData()

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
        const sync = require(`${__hooks}/sync.js`)

        // Check if a sync is already in progress
        const inProgressRecords = $app.findRecordsByFilter("sync_status", `status = "in_progress"`, "", 1, 0)

        if (inProgressRecords.length > 0) {
            return c.json(409, {
                success: false,
                error: "Sync already in progress"
            })
        }

        console.log("Scheduled card sync triggered")
        const result = sync.syncBulkCardData()

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

// API endpoint to download images for cards that don't have them yet
routerAdd("POST", "/api/sync/images", (c) => {
    const sync = require(`${__hooks}/sync.js`)

    try {
        const sync = require(`${__hooks}/sync.js`)

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
        sync.updateSyncStatus("images", "in_progress", 0)

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
            const downloadSuccess = sync.downloadCardImage(cardId, imageUrl)

            if (downloadSuccess) {
                successCount++
            } else {
                failCount++
            }

            // Update progress every 10 cards
            if ((successCount + failCount + skippedCount) % 10 === 0) {
                sync.updateSyncStatus("images", "in_progress", successCount)
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

        sync.updateSyncStatus("images", finalStatus, successCount, errorMessage)

        return c.json(200, {
            success: true,
            message: `Downloaded ${successCount} images, ${failCount} failed, ${skippedCount} skipped`,
            processed: successCount,
            failed: failCount,
            skipped: skippedCount
        })

    } catch (error) {
        logger.error("Image sync error", { error: error.message })
        sync.updateSyncStatus("images", "failed", 0, error.message)

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
