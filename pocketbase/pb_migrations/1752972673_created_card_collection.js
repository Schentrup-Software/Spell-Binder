/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = new Collection({
    "createRule": null,
    "deleteRule": null,
    "fields": [
      {
        "autogeneratePattern": "",
        "hidden": false,
        "id": "text3208210256",
        "max": 0,
        "min": 0,
        "name": "id",
        "pattern": "^[a-z0-9]+$",
        "presentable": false,
        "primaryKey": true,
        "required": true,
        "system": true,
        "type": "text"
      },
      {
        "autogeneratePattern": "",
        "hidden": false,
        "id": "_clone_JgNT",
        "max": 36,
        "min": 36,
        "name": "scryfall_id",
        "pattern": "",
        "presentable": false,
        "primaryKey": false,
        "required": true,
        "system": false,
        "type": "text"
      },
      {
        "autogeneratePattern": "",
        "hidden": false,
        "id": "_clone_2MQv",
        "max": 255,
        "min": 1,
        "name": "name",
        "pattern": "",
        "presentable": false,
        "primaryKey": false,
        "required": true,
        "system": false,
        "type": "text"
      },
      {
        "autogeneratePattern": "",
        "hidden": false,
        "id": "_clone_dXlf",
        "max": 10,
        "min": 1,
        "name": "set_code",
        "pattern": "",
        "presentable": false,
        "primaryKey": false,
        "required": true,
        "system": false,
        "type": "text"
      },
      {
        "autogeneratePattern": "",
        "hidden": false,
        "id": "_clone_f9P6",
        "max": 255,
        "min": 1,
        "name": "set_name",
        "pattern": "",
        "presentable": false,
        "primaryKey": false,
        "required": true,
        "system": false,
        "type": "text"
      },
      {
        "hidden": false,
        "id": "_clone_IBwt",
        "maxSelect": 0,
        "name": "rarity",
        "presentable": false,
        "required": true,
        "system": false,
        "type": "select",
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
        "autogeneratePattern": "",
        "hidden": false,
        "id": "_clone_K7Kx",
        "max": 100,
        "min": 0,
        "name": "mana_cost",
        "pattern": "",
        "presentable": false,
        "primaryKey": false,
        "required": false,
        "system": false,
        "type": "text"
      },
      {
        "autogeneratePattern": "",
        "hidden": false,
        "id": "_clone_CZHO",
        "max": 255,
        "min": 1,
        "name": "type_line",
        "pattern": "",
        "presentable": false,
        "primaryKey": false,
        "required": true,
        "system": false,
        "type": "text"
      },
      {
        "hidden": false,
        "id": "_clone_ri38",
        "maxSize": 0,
        "name": "colors",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "json"
      },
      {
        "hidden": false,
        "id": "_clone_j0fh",
        "maxSize": 0,
        "name": "image_uris",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "json"
      },
      {
        "hidden": false,
        "id": "_clone_DpQH",
        "maxSelect": 1,
        "maxSize": 5242880,
        "mimeTypes": [
          "image/jpeg",
          "image/png",
          "image/webp"
        ],
        "name": "image_file",
        "presentable": false,
        "protected": false,
        "required": false,
        "system": false,
        "thumbs": null,
        "type": "file"
      },
      {
        "hidden": false,
        "id": "_clone_gklV",
        "max": null,
        "min": 0,
        "name": "price_usd",
        "onlyInt": false,
        "presentable": false,
        "required": false,
        "system": false,
        "type": "number"
      },
      {
        "hidden": false,
        "id": "_clone_K6vV",
        "max": "",
        "min": "",
        "name": "last_updated",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "date"
      },
      {
        "cascadeDelete": false,
        "collectionId": "pbc_601157786",
        "hidden": false,
        "id": "relation1363760893",
        "maxSelect": 1,
        "minSelect": 0,
        "name": "collection_id",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "relation"
      },
      {
        "cascadeDelete": false,
        "collectionId": "_pb_users_auth_",
        "hidden": false,
        "id": "_clone_psBG",
        "maxSelect": 1,
        "minSelect": 0,
        "name": "collection_user",
        "presentable": false,
        "required": true,
        "system": false,
        "type": "relation"
      },
      {
        "cascadeDelete": false,
        "collectionId": "pbc_3481593366",
        "hidden": false,
        "id": "_clone_DW2I",
        "maxSelect": 1,
        "minSelect": 0,
        "name": "collection_card",
        "presentable": false,
        "required": true,
        "system": false,
        "type": "relation"
      },
      {
        "hidden": false,
        "id": "_clone_okzp",
        "max": null,
        "min": 1,
        "name": "collection_quantity",
        "onlyInt": false,
        "presentable": false,
        "required": true,
        "system": false,
        "type": "number"
      },
      {
        "hidden": false,
        "id": "_clone_wPsG",
        "maxSelect": 0,
        "name": "collection_condition",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "select",
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
        "hidden": false,
        "id": "_clone_QyNW",
        "name": "collection_foil",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "bool"
      },
      {
        "hidden": false,
        "id": "_clone_MUWZ",
        "max": "",
        "min": "",
        "name": "collection_acquired_date",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "date"
      },
      {
        "autogeneratePattern": "",
        "hidden": false,
        "id": "_clone_emmR",
        "max": 1000,
        "min": 0,
        "name": "collection_notes",
        "pattern": "",
        "presentable": false,
        "primaryKey": false,
        "required": false,
        "system": false,
        "type": "text"
      }
    ],
    "id": "pbc_3270162626",
    "indexes": [],
    "listRule": "@request.auth.id = collection_user",
    "name": "card_collection",
    "system": false,
    "type": "view",
    "updateRule": null,
    "viewQuery": "SELECT\n    c.id,\n    c.scryfall_id,\n    c.name,\n    c.set_code,\n    c.set_name,\n    c.rarity,\n    c.mana_cost,\n    c.type_line,\n    c.colors,\n    c.image_uris,\n    c.image_file,\n    c.price_usd,\n    c.last_updated,\n    col.id as collection_id,\n    col.user as collection_user,\n    col.card as collection_card,\n    col.quantity as collection_quantity,\n    col.condition as collection_condition,\n    col.foil as collection_foil,\n    col.acquired_date as collection_acquired_date,\n    col.notes as collection_notes\nFROM collections col\n  JOIN cards c ON col.card = c.id",
    "viewRule": "@request.auth.id = collection_user"
  });

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_3270162626");

  return app.delete(collection);
})
