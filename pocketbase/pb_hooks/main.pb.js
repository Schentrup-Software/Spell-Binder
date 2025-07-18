// PocketBase hooks for Spell Binder
// This file will be executed when PocketBase starts

// Initialize collections after bootstrap
onAfterBootstrap((e) => {
    console.log("Spell Binder - Initializing database schema...")

    try {
        // Create Collections collection for user's card collection entries
        let collectionsCollection = null
        try {
            collectionsCollection = $app.dao().findCollectionByNameOrId("collections")
            console.log("Collections collection already exists")
        } catch (err) {
            collectionsCollection = new Collection()
            collectionsCollection.name = "collections"
            collectionsCollection.type = "base"
            collectionsCollection.schema = [
                {
                    name: "user_id",
                    type: "text",
                    required: true,
                    options: {
                        min: 1,
                        max: 255
                    }
                },
                {
                    name: "card_id",
                    type: "text",
                    required: true,
                    options: {
                        min: 1,
                        max: 255
                    }
                },
                {
                    name: "quantity",
                    type: "number",
                    required: true,
                    options: {
                        min: 1
                    }
                },
                {
                    name: "condition",
                    type: "select",
                    required: true,
                    options: {
                        values: ["NM", "LP", "MP", "HP", "DMG"]
                    }
                },
                {
                    name: "foil",
                    type: "bool",
                    required: false
                },
                {
                    name: "acquired_date",
                    type: "date",
                    required: false
                },
                {
                    name: "notes",
                    type: "text",
                    required: false,
                    options: {
                        max: 1000
                    }
                }
            ]
            collectionsCollection.indexes = [
                "CREATE INDEX idx_collections_user_id ON collections (user_id)",
                "CREATE INDEX idx_collections_card_id ON collections (card_id)",
                "CREATE INDEX idx_collections_user_card ON collections (user_id, card_id)"
            ]
            $app.dao().saveCollection(collectionsCollection)
            console.log("Collections collection created successfully")
        }

        // Create Cards collection for local Spell Binder database
        let cardsCollection = null
        try {
            cardsCollection = $app.dao().findCollectionByNameOrId("cards")
            console.log("Cards collection already exists")
        } catch (err) {
            cardsCollection = new Collection()
            cardsCollection.name = "cards"
            cardsCollection.type = "base"
            cardsCollection.schema = [
                {
                    name: "scryfall_id",
                    type: "text",
                    required: true,
                    options: {
                        min: 1,
                        max: 255
                    }
                },
                {
                    name: "name",
                    type: "text",
                    required: true,
                    options: {
                        min: 1,
                        max: 255
                    }
                },
                {
                    name: "set_code",
                    type: "text",
                    required: true,
                    options: {
                        min: 1,
                        max: 10
                    }
                },
                {
                    name: "set_name",
                    type: "text",
                    required: true,
                    options: {
                        min: 1,
                        max: 255
                    }
                },
                {
                    name: "rarity",
                    type: "select",
                    required: true,
                    options: {
                        values: ["common", "uncommon", "rare", "mythic", "special", "bonus"]
                    }
                },
                {
                    name: "mana_cost",
                    type: "text",
                    required: false,
                    options: {
                        max: 50
                    }
                },
                {
                    name: "type_line",
                    type: "text",
                    required: true,
                    options: {
                        min: 1,
                        max: 255
                    }
                },
                {
                    name: "colors",
                    type: "json",
                    required: false
                },
                {
                    name: "image_uri",
                    type: "text",
                    required: false,
                    options: {
                        max: 500
                    }
                },
                {
                    name: "image_uri_small",
                    type: "text",
                    required: false,
                    options: {
                        max: 500
                    }
                },
                {
                    name: "image_file",
                    type: "file",
                    required: false,
                    options: {
                        maxSelect: 1,
                        maxSize: 5242880,
                        mimeTypes: ["image/jpeg", "image/png", "image/webp"]
                    }
                },
                {
                    name: "price_usd",
                    type: "number",
                    required: false,
                    options: {
                        min: 0
                    }
                },
                {
                    name: "last_updated",
                    type: "date",
                    required: false
                }
            ]
            cardsCollection.indexes = [
                "CREATE UNIQUE INDEX idx_cards_scryfall_id ON cards (scryfall_id)",
                "CREATE INDEX idx_cards_name ON cards (name)",
                "CREATE INDEX idx_cards_set_code ON cards (set_code)",
                "CREATE INDEX idx_cards_type_line ON cards (type_line)",
                "CREATE INDEX idx_cards_name_search ON cards (name COLLATE NOCASE)",
                "CREATE INDEX idx_cards_set_name ON cards (set_name)"
            ]
            $app.dao().saveCollection(cardsCollection)
            console.log("Cards collection created successfully")
        }

        // Create Sync_Status collection for tracking bulk data synchronization
        let syncStatusCollection = null
        try {
            syncStatusCollection = $app.dao().findCollectionByNameOrId("sync_status")
            console.log("Sync_Status collection already exists")
        } catch (err) {
            syncStatusCollection = new Collection()
            syncStatusCollection.name = "sync_status"
            syncStatusCollection.type = "base"
            syncStatusCollection.schema = [
                {
                    name: "data_type",
                    type: "select",
                    required: true,
                    options: {
                        values: ["cards", "sets", "prices", "images"]
                    }
                },
                {
                    name: "last_sync",
                    type: "date",
                    required: false
                },
                {
                    name: "status",
                    type: "select",
                    required: true,
                    options: {
                        values: ["success", "failed", "in_progress"]
                    }
                },
                {
                    name: "records_processed",
                    type: "number",
                    required: false,
                    options: {
                        min: 0
                    }
                },
                {
                    name: "error_message",
                    type: "text",
                    required: false,
                    options: {
                        max: 1000
                    }
                }
            ]
            syncStatusCollection.indexes = [
                "CREATE UNIQUE INDEX idx_sync_status_data_type ON sync_status (data_type)",
                "CREATE INDEX idx_sync_status_last_sync ON sync_status (last_sync)"
            ]
            $app.dao().saveCollection(syncStatusCollection)
            console.log("Sync_Status collection created successfully")
        }

        console.log("Database initialization complete")
    } catch (error) {
        console.error("Error initializing database schema:", error)
    }
})