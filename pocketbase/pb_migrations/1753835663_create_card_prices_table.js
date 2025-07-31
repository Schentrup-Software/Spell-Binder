/// <reference path="../pb_data/types.d.ts" />

migrate((app) => {
    // Create the new card_prices collection
    const cardPricesCollection = new Collection({
        "name": "card_prices",
        "type": "base",
        "system": false,
        "listRule": "",
        "viewRule": "",
        "fields": [
            {
                "name": "card_id",
                "type": "relation",
                "required": true,
                "collectionId": app.findCollectionByNameOrId("cards").id,
                "maxSelect": 1,
            },
            {
                "name": "price_usd",
                "type": "number",
                "required": false,
                "min": 0
            },
            {
                "name": "price_usd_foil",
                "type": "number",
                "required": false,
                "min": 0
            },
            {
                "name": "price_eur",
                "type": "number",
                "required": false,
                "min": 0
            },
            {
                "name": "price_tix",
                "type": "number",
                "required": false,
                "min": 0
            },
            {
                "name": "last_updated",
                "type": "date",
                "required": false
            }
        ],
        "indexes": [
            "CREATE INDEX idx_card_prices_updated ON card_prices (last_updated)",
            "CREATE INDEX idx_card_prices_usd ON card_prices (price_usd)",
            "CREATE INDEX idx_card_prices_eur ON card_prices (price_eur)"
        ]
    })

    app.save(cardPricesCollection)

    // Drop price columns

    try {
        app.db().newQuery(`ALTER TABLE cards DROP COLUMN prices;`).execute()
    } catch (error) {
        console.error("Error dropping prices column:", error.message)
    }
    try {
        app.db().newQuery(`ALTER TABLE cards DROP COLUMN price_usd;`).execute()
    } catch (error) {
        console.error("Error dropping price_usd column:", error.message)
    }
    try {
        app.db().newQuery(`ALTER TABLE cards DROP COLUMN price_usd_foil;`).execute()
    } catch (error) {
        console.error("Error dropping price_usd_foil column:", error.message)
    }
    try {
        app.db().newQuery(`ALTER TABLE cards DROP COLUMN price_eur;`).execute()
    } catch (error) {
        console.error("Error dropping price_eur column:", error.message)
    }
    try {
        app.db().newQuery(`ALTER TABLE cards DROP COLUMN price_tix;`).execute()
    } catch (error) {
        console.error("Error dropping price_tix column:", error.message)
    }
}, (app) => {
    // Rollback migration - drop the card_prices table
    const cardPricesCollection = app.findCollectionByNameOrId("card_prices")
    app.delete(cardPricesCollection)

    // Re-add price columns to cards
    try {
        app.db().newQuery(`ALTER TABLE cards ADD COLUMN prices JSON DEFAULT NULL;`).execute()
    } catch (error) {
        console.error("Error re-adding price columns:", error.message)
    }

    try {
        app.db().newQuery(`ALTER TABLE cards ADD COLUMN price_usd REAL DEFAULT NULL;`).execute()
    } catch (error) {
        console.error("Error re-adding price columns:", error.message)
    }

    try {
        app.db().newQuery(`ALTER TABLE cards ADD COLUMN price_usd_foil REAL DEFAULT NULL;`).execute()
    } catch (error) {
        console.error("Error re-adding price columns:", error.message)
    }

    try {
        app.db().newQuery(`ALTER TABLE cards ADD COLUMN price_eur REAL DEFAULT NULL;`).execute()
    } catch (error) {
        console.error("Error re-adding price columns:", error.message)
    }

    try {
        app.db().newQuery(`ALTER TABLE cards ADD COLUMN price_tix REAL DEFAULT NULL;`).execute()
    } catch (error) {
        console.error("Error re-adding price columns:", error.message)
    }
})
