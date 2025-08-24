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
}, (app) => {
    // Rollback migration - drop the card_prices table
    const cardPricesCollection = app.findCollectionByNameOrId("card_prices")
    app.delete(cardPricesCollection)
})
