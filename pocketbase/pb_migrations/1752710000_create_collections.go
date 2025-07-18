package migrations

import (
	"encoding/json"

	"github.com/pocketbase/dbx"
	"github.com/pocketbase/pocketbase/daos"
	m "github.com/pocketbase/pocketbase/migrations"
	"github.com/pocketbase/pocketbase/models"
)

func init() {
	m.Register(func(db dbx.Builder) error {
		dao := daos.New(db)

		// Create Collections collection
		collectionsCollection := &models.Collection{}
		json.Unmarshal([]byte(`{
			"id": "collections_id",
			"name": "collections",
			"type": "base",
			"system": false,
			"schema": [
				{
					"id": "user_id_field",
					"name": "user_id",
					"type": "text",
					"system": false,
					"required": true,
					"options": {
						"min": 1,
						"max": 255
					}
				},
				{
					"id": "card_id_field",
					"name": "card_id",
					"type": "text",
					"system": false,
					"required": true,
					"options": {
						"min": 1,
						"max": 255
					}
				},
				{
					"id": "quantity_field",
					"name": "quantity",
					"type": "number",
					"system": false,
					"required": true,
					"options": {
						"min": 1
					}
				},
				{
					"id": "condition_field",
					"name": "condition",
					"type": "select",
					"system": false,
					"required": true,
					"options": {
						"values": ["NM", "LP", "MP", "HP", "DMG"]
					}
				},
				{
					"id": "foil_field",
					"name": "foil",
					"type": "bool",
					"system": false,
					"required": false
				},
				{
					"id": "acquired_date_field",
					"name": "acquired_date",
					"type": "date",
					"system": false,
					"required": false
				},
				{
					"id": "notes_field",
					"name": "notes",
					"type": "text",
					"system": false,
					"required": false,
					"options": {
						"max": 1000
					}
				}
			],
			"indexes": [
				"CREATE INDEX idx_collections_user_id ON collections (user_id)",
				"CREATE INDEX idx_collections_card_id ON collections (card_id)",
				"CREATE INDEX idx_collections_user_card ON collections (user_id, card_id)"
			]
		}`), collectionsCollection)

		if err := dao.SaveCollection(collectionsCollection); err != nil {
			return err
		}

		// Create Cards collection
		cardsCollection := &models.Collection{}
		json.Unmarshal([]byte(`{
			"id": "cards_id",
			"name": "cards",
			"type": "base",
			"system": false,
			"schema": [
				{
					"id": "scryfall_id_field",
					"name": "scryfall_id",
					"type": "text",
					"system": false,
					"required": true,
					"options": {
						"min": 1,
						"max": 255
					}
				},
				{
					"id": "name_field",
					"name": "name",
					"type": "text",
					"system": false,
					"required": true,
					"options": {
						"min": 1,
						"max": 255
					}
				},
				{
					"id": "set_code_field",
					"name": "set_code",
					"type": "text",
					"system": false,
					"required": true,
					"options": {
						"min": 1,
						"max": 10
					}
				},
				{
					"id": "set_name_field",
					"name": "set_name",
					"type": "text",
					"system": false,
					"required": true,
					"options": {
						"min": 1,
						"max": 255
					}
				},
				{
					"id": "rarity_field",
					"name": "rarity",
					"type": "select",
					"system": false,
					"required": true,
					"options": {
						"values": ["common", "uncommon", "rare", "mythic", "special", "bonus"]
					}
				},
				{
					"id": "mana_cost_field",
					"name": "mana_cost",
					"type": "text",
					"system": false,
					"required": false,
					"options": {
						"max": 50
					}
				},
				{
					"id": "type_line_field",
					"name": "type_line",
					"type": "text",
					"system": false,
					"required": true,
					"options": {
						"min": 1,
						"max": 255
					}
				},
				{
					"id": "colors_field",
					"name": "colors",
					"type": "json",
					"system": false,
					"required": false
				},
				{
					"id": "image_file_field",
					"name": "image_file",
					"type": "file",
					"system": false,
					"required": false,
					"options": {
						"maxSelect": 1,
						"maxSize": 5242880,
						"mimeTypes": ["image/jpeg", "image/png", "image/webp"]
					}
				},
				{
					"id": "price_usd_field",
					"name": "price_usd",
					"type": "number",
					"system": false,
					"required": false,
					"options": {
						"min": 0
					}
				},
				{
					"id": "last_updated_field",
					"name": "last_updated",
					"type": "date",
					"system": false,
					"required": false
				}
			],
			"indexes": [
				"CREATE UNIQUE INDEX idx_cards_scryfall_id ON cards (scryfall_id)",
				"CREATE INDEX idx_cards_name ON cards (name)",
				"CREATE INDEX idx_cards_set_code ON cards (set_code)",
				"CREATE INDEX idx_cards_type_line ON cards (type_line)",
				"CREATE INDEX idx_cards_name_search ON cards (name COLLATE NOCASE)",
				"CREATE INDEX idx_cards_set_name ON cards (set_name)"
			]
		}`), cardsCollection)

		if err := dao.SaveCollection(cardsCollection); err != nil {
			return err
		}

		// Create Sync_Status collection
		syncStatusCollection := &models.Collection{}
		json.Unmarshal([]byte(`{
			"id": "sync_status_id",
			"name": "sync_status",
			"type": "base",
			"system": false,
			"schema": [
				{
					"id": "data_type_field",
					"name": "data_type",
					"type": "select",
					"system": false,
					"required": true,
					"options": {
						"values": ["cards", "sets", "prices"]
					}
				},
				{
					"id": "last_sync_field",
					"name": "last_sync",
					"type": "date",
					"system": false,
					"required": false
				},
				{
					"id": "status_field",
					"name": "status",
					"type": "select",
					"system": false,
					"required": true,
					"options": {
						"values": ["success", "failed", "in_progress"]
					}
				},
				{
					"id": "records_processed_field",
					"name": "records_processed",
					"type": "number",
					"system": false,
					"required": false,
					"options": {
						"min": 0
					}
				},
				{
					"id": "error_message_field",
					"name": "error_message",
					"type": "text",
					"system": false,
					"required": false,
					"options": {
						"max": 1000
					}
				}
			],
			"indexes": [
				"CREATE UNIQUE INDEX idx_sync_status_data_type ON sync_status (data_type)",
				"CREATE INDEX idx_sync_status_last_sync ON sync_status (last_sync)"
			]
		}`), syncStatusCollection)

		if err := dao.SaveCollection(syncStatusCollection); err != nil {
			return err
		}

		return nil
	}, func(db dbx.Builder) error {
		dao := daos.New(db)

		// Delete collections in reverse order
		collection, _ := dao.FindCollectionByNameOrId("sync_status")
		if collection != nil {
			if err := dao.DeleteCollection(collection); err != nil {
				return err
			}
		}

		collection, _ = dao.FindCollectionByNameOrId("cards")
		if collection != nil {
			if err := dao.DeleteCollection(collection); err != nil {
				return err
			}
		}

		collection, _ = dao.FindCollectionByNameOrId("collections")
		if collection != nil {
			if err := dao.DeleteCollection(collection); err != nil {
				return err
			}
		}

		return nil
	})
}