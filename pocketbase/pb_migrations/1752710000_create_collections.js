/// <reference path="../pb_data/types.d.ts" />

migrate((db) => {
    const cardsCollection = new Collection({
        "name": "cards",
        "type": "base",
        "system": false,
        "fields": [
            {
                "name": "scryfall_id",
                "type": "text",
                "required": true,
                "min": 36,
                "max": 36
            },
            {
                "name": "oracle_id",
                "type": "text",
                "required": false,
                "min": 36,
                "max": 36
            },
            {
                "name": "name",
                "type": "text",
                "required": true,
                "min": 1,
                "max": 255
            },
            {
                "name": "lang",
                "type": "text",
                "required": false,
                "min": 2,
                "max": 5
            },
            {
                "name": "released_at",
                "type": "date",
                "required": false
            },
            {
                "name": "layout",
                "type": "select",
                "required": false,
                "values": [
                    "normal", "split", "flip", "transform", "modal_dfc", "meld",
                    "leveler", "saga", "adventure", "planar", "scheme", "vanguard",
                    "token", "double_faced_token", "emblem", "augment", "host",
                    "art_series", "double_sided", "case", "mutate", "reversible_card",
                    "prototype", "class"
                ]
            },
            {
                "name": "highres_image",
                "type": "bool",
                "required": false
            },
            {
                "name": "image_status",
                "type": "select",
                "required": false,
                "values": ["missing", "placeholder", "lowres", "highres_scan"]
            },
            {
                "name": "cmc",
                "type": "number",
                "required": false,
                "min": 0
            },
            {
                "name": "type_line",
                "type": "text",
                "required": true,
                "min": 1,
                "max": 255
            },
            {
                "name": "color_identity",
                "type": "json",
                "required": false
            },
            {
                "name": "colors",
                "type": "json",
                "required": false
            },
            {
                "name": "keywords",
                "type": "json",
                "required": false
            },
            {
                "name": "mana_cost",
                "type": "text",
                "required": false,
                "max": 100
            },
            {
                "name": "oracle_text",
                "type": "text",
                "required": false,
                "max": 2000
            },
            {
                "name": "power",
                "type": "text",
                "required": false,
                "max": 10
            },
            {
                "name": "toughness",
                "type": "text",
                "required": false,
                "max": 10
            },
            {
                "name": "loyalty",
                "type": "text",
                "required": false,
                "max": 10
            },
            {
                "name": "defense",
                "type": "text",
                "required": false,
                "max": 10
            },
            {
                "name": "card_faces",
                "type": "json",
                "required": false
            },
            {
                "name": "legalities",
                "type": "json",
                "required": false
            },
            {
                "name": "games",
                "type": "json",
                "required": false
            },
            {
                "name": "reserved",
                "type": "bool",
                "required": false
            },
            {
                "name": "foil",
                "type": "bool",
                "required": false
            },
            {
                "name": "nonfoil",
                "type": "bool",
                "required": false
            },
            {
                "name": "finishes",
                "type": "json",
                "required": false
            },
            {
                "name": "oversized",
                "type": "bool",
                "required": false
            },
            {
                "name": "promo",
                "type": "bool",
                "required": false
            },
            {
                "name": "reprint",
                "type": "bool",
                "required": false
            },
            {
                "name": "variation",
                "type": "bool",
                "required": false
            },
            {
                "name": "set_id",
                "type": "text",
                "required": false,
                "min": 36,
                "max": 36
            },
            {
                "name": "set_code",
                "type": "text",
                "required": true,
                "min": 1,
                "max": 10
            },
            {
                "name": "set_name",
                "type": "text",
                "required": true,
                "min": 1,
                "max": 255
            },
            {
                "name": "set_type",
                "type": "text",
                "required": false,
                "max": 50
            },
            {
                "name": "collector_number",
                "type": "text",
                "required": false,
                "max": 20
            },
            {
                "name": "digital",
                "type": "bool",
                "required": false
            },
            {
                "name": "rarity",
                "type": "select",
                "required": true,
                "values": [
                    "common",
                    "uncommon",
                    "rare",
                    "mythic",
                    "special",
                    "bonus"
                ]
            },
            {
                "name": "artist",
                "type": "text",
                "required": false,
                "max": 255
            },
            {
                "name": "artist_ids",
                "type": "json",
                "required": false
            },
            {
                "name": "border_color",
                "type": "select",
                "required": false,
                "values": ["black", "white", "borderless", "silver", "gold", "yellow"]
            },
            {
                "name": "frame",
                "type": "text",
                "required": false,
                "max": 20
            },
            {
                "name": "security_stamp",
                "type": "select",
                "required": false,
                "values": ["oval", "triangle", "acorn", "arena", "heart", "circle"]
            },
            {
                "name": "full_art",
                "type": "bool",
                "required": false
            },
            {
                "name": "textless",
                "type": "bool",
                "required": false
            },
            {
                "name": "booster",
                "type": "bool",
                "required": false
            },
            {
                "name": "story_spotlight",
                "type": "bool",
                "required": false
            },
            {
                "name": "edhrec_rank",
                "type": "number",
                "required": false,
                "min": 0
            },
            {
                "name": "penny_rank",
                "type": "number",
                "required": false,
                "min": 0
            },
            {
                "name": "prices",
                "type": "json",
                "required": false
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
                "name": "related_uris",
                "type": "json",
                "required": false
            },
            {
                "name": "purchase_uris",
                "type": "json",
                "required": false
            },
            {
                "name": "image_uris",
                "type": "json",
                "required": false
            },
            {
                "name": "image_file",
                "type": "file",
                "required": false,
                "maxSelect": 1,
                "maxSize": 5242880,
                "mimeTypes": ["image/jpeg", "image/png", "image/webp"]
            },
            {
                "name": "multiverse_ids",
                "type": "json",
                "required": false
            },
            {
                "name": "mtgo_id",
                "type": "number",
                "required": false,
                "min": 0
            },
            {
                "name": "arena_id",
                "type": "number",
                "required": false,
                "min": 0
            },
            {
                "name": "tcgplayer_id",
                "type": "number",
                "required": false,
                "min": 0
            },
            {
                "name": "cardmarket_id",
                "type": "number",
                "required": false,
                "min": 0
            },
            {
                "name": "preview_info",
                "type": "json",
                "required": false
            },
            {
                "name": "all_parts",
                "type": "json",
                "required": false
            },
            {
                "name": "last_updated",
                "type": "date",
                "required": false
            }
        ],
        "indexes": [
            "CREATE UNIQUE INDEX idx_cards_scryfall_id ON cards (scryfall_id)",
            "CREATE INDEX idx_cards_name ON cards (name)",
            "CREATE INDEX idx_cards_set_code ON cards (set_code)",
            "CREATE INDEX idx_cards_oracle_id ON cards (oracle_id)",
            "CREATE INDEX idx_cards_collector_number ON cards (collector_number)",
            "CREATE INDEX idx_cards_released_at ON cards (released_at)",
            "CREATE INDEX idx_cards_rarity ON cards (rarity)",
            "CREATE INDEX idx_cards_artist ON cards (artist)",
            "CREATE INDEX idx_cards_cmc ON cards (cmc)",
            "CREATE INDEX idx_cards_name_search ON cards (name COLLATE NOCASE)"
        ]
    });

    db.save(cardsCollection);

    // Create Collections collection
    const collectionsCollection = new Collection({
        "name": "collections",
        "type": "base",
        "listRule": "@request.auth.id = user.id",
        "viewRule": "@request.auth.id = user.id",
        "createRule": "@request.auth.id = user.id",
        "updateRule": "@request.auth.id = user.id",
        "deleteRule": "@request.auth.id = user.id",
        "fields": [
            {
                "name": "user",
                "type": "relation",
                "required": true,
                "maxSelect": 1,
                "collectionId": "_pb_users_auth_"
            },
            {
                "name": "card",
                "type": "relation",
                "required": true,
                "maxSelect": 1,
                "collectionId": db.findCollectionByNameOrId("cards").id
            },
            {
                "name": "quantity",
                "type": "number",
                "required": true,
                "min": 1
            },
            {
                "name": "condition",
                "type": "select",
                "required": false,
                "values": [
                    "Mint",
                    "Near Mint",
                    "Lightly Played",
                    "Moderately Played",
                    "Heavily Played",
                    "Damaged"
                ]
            },
            {
                "name": "foil",
                "type": "bool",
                "required": true
            },
            {
                "name": "acquired_date",
                "type": "date",
                "required": false
            },
            {
                "name": "notes",
                "type": "text",
                "required": false,
                "max": 1000
            }
        ]
    });

    db.save(collectionsCollection);

    const syncStatusCollection = new Collection({
        "name": "sync_status",
        "type": "base",
        "fields": [
            {
                "name": "data_type",
                "type": "select",
                "required": true,
                "values": [
                    "cards",
                    "sets",
                    "prices",
                    "images"
                ]
            },
            {
                "name": "last_sync",
                "type": "date",
                "required": false
            },
            {
                "name": "status",
                "type": "select",
                "required": true,
                "values": [
                    "success",
                    "failed",
                    "in_progress",
                    "partial"
                ]
            },
            {
                "name": "records_processed",
                "type": "number",
                "required": false,
                "min": 0
            },
            {
                "name": "error_message",
                "type": "text",
                "required": false,
                "max": 2000
            }
        ],
        "indexes": [
            "CREATE UNIQUE INDEX idx_sync_status_data_type ON sync_status (data_type)",
            "CREATE INDEX idx_sync_status_last_sync ON sync_status (last_sync)"
        ]
    });

    db.save(syncStatusCollection);
}, (db) => {
    db.deleteCollection("collections");
    db.deleteCollection("cards");
    db.deleteCollection("sync_status");
});
