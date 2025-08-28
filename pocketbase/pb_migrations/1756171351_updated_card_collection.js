/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_3270162626")

  // update collection data
  unmarshal({
    "viewQuery": "SELECT\n    col.id,\n    c.id as card_id,\n    c.scryfall_id,\n    c.name,\n    c.oracle_text,\n    c.set_code,\n    c.set_name,\n    c.rarity,\n    c.mana_cost,\n    c.type_line,\n    c.colors,\n    c.image_uris,\n    c.image_file,\n    cp.price_usd,\n    c.last_updated,\n    col.id as collection_id,\n    col.user as collection_user,\n    col.card as collection_card,\n    col.quantity as collection_quantity,\n    col.condition as collection_condition,\n    col.foil as collection_foil,\n    col.acquired_date as collection_acquired_date,\n    col.notes as collection_notes\nFROM collections col\n  JOIN cards c ON col.card = c.id\n  LEFT JOIN card_prices cp ON cp.card_id = c.id"
  }, collection)

  // remove field
  collection.fields.removeById("_clone_nQHM")

  // remove field
  collection.fields.removeById("_clone_xyCx")

  // remove field
  collection.fields.removeById("_clone_WwHF")

  // remove field
  collection.fields.removeById("_clone_NlVt")

  // remove field
  collection.fields.removeById("_clone_2X6T")

  // remove field
  collection.fields.removeById("_clone_Z4gu")

  // remove field
  collection.fields.removeById("_clone_Piro")

  // remove field
  collection.fields.removeById("_clone_CfrR")

  // remove field
  collection.fields.removeById("_clone_4jAp")

  // remove field
  collection.fields.removeById("_clone_jODF")

  // remove field
  collection.fields.removeById("_clone_Sw47")

  // remove field
  collection.fields.removeById("_clone_9qlq")

  // remove field
  collection.fields.removeById("_clone_EY9a")

  // remove field
  collection.fields.removeById("_clone_PfE0")

  // remove field
  collection.fields.removeById("_clone_NCH9")

  // remove field
  collection.fields.removeById("_clone_exfL")

  // remove field
  collection.fields.removeById("_clone_FlfP")

  // remove field
  collection.fields.removeById("_clone_UqtR")

  // remove field
  collection.fields.removeById("_clone_FjaJ")

  // remove field
  collection.fields.removeById("_clone_3qyC")

  // add field
  collection.fields.addAt(1, new Field({
    "cascadeDelete": false,
    "collectionId": "pbc_3481593366",
    "hidden": false,
    "id": "relation1254922784",
    "maxSelect": 1,
    "minSelect": 0,
    "name": "card_id",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "relation"
  }))

  // add field
  collection.fields.addAt(2, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "_clone_8Lyg",
    "max": 36,
    "min": 36,
    "name": "scryfall_id",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": true,
    "system": false,
    "type": "text"
  }))

  // add field
  collection.fields.addAt(3, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "_clone_QOIE",
    "max": 255,
    "min": 1,
    "name": "name",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": true,
    "system": false,
    "type": "text"
  }))

  // add field
  collection.fields.addAt(4, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "_clone_JSZy",
    "max": 2000,
    "min": 0,
    "name": "oracle_text",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }))

  // add field
  collection.fields.addAt(5, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "_clone_iNKh",
    "max": 10,
    "min": 1,
    "name": "set_code",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": true,
    "system": false,
    "type": "text"
  }))

  // add field
  collection.fields.addAt(6, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "_clone_cuni",
    "max": 255,
    "min": 1,
    "name": "set_name",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": true,
    "system": false,
    "type": "text"
  }))

  // add field
  collection.fields.addAt(7, new Field({
    "hidden": false,
    "id": "_clone_Fbzi",
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
  }))

  // add field
  collection.fields.addAt(8, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "_clone_NsC3",
    "max": 100,
    "min": 0,
    "name": "mana_cost",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }))

  // add field
  collection.fields.addAt(9, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "_clone_loa7",
    "max": 255,
    "min": 1,
    "name": "type_line",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }))

  // add field
  collection.fields.addAt(10, new Field({
    "hidden": false,
    "id": "_clone_d5sI",
    "maxSize": 0,
    "name": "colors",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "json"
  }))

  // add field
  collection.fields.addAt(11, new Field({
    "hidden": false,
    "id": "_clone_izWN",
    "maxSize": 0,
    "name": "image_uris",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "json"
  }))

  // add field
  collection.fields.addAt(12, new Field({
    "hidden": false,
    "id": "_clone_AR9i",
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
  }))

  // add field
  collection.fields.addAt(13, new Field({
    "hidden": false,
    "id": "_clone_bLeO",
    "max": null,
    "min": 0,
    "name": "price_usd",
    "onlyInt": false,
    "presentable": false,
    "required": false,
    "system": false,
    "type": "number"
  }))

  // add field
  collection.fields.addAt(14, new Field({
    "hidden": false,
    "id": "_clone_5vfq",
    "max": "",
    "min": "",
    "name": "last_updated",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "date"
  }))

  // add field
  collection.fields.addAt(16, new Field({
    "cascadeDelete": false,
    "collectionId": "_pb_users_auth_",
    "hidden": false,
    "id": "_clone_sWMF",
    "maxSelect": 1,
    "minSelect": 0,
    "name": "collection_user",
    "presentable": false,
    "required": true,
    "system": false,
    "type": "relation"
  }))

  // add field
  collection.fields.addAt(17, new Field({
    "cascadeDelete": false,
    "collectionId": "pbc_3481593366",
    "hidden": false,
    "id": "_clone_8MDJ",
    "maxSelect": 1,
    "minSelect": 0,
    "name": "collection_card",
    "presentable": false,
    "required": true,
    "system": false,
    "type": "relation"
  }))

  // add field
  collection.fields.addAt(18, new Field({
    "hidden": false,
    "id": "_clone_8rrU",
    "max": null,
    "min": 1,
    "name": "collection_quantity",
    "onlyInt": false,
    "presentable": false,
    "required": true,
    "system": false,
    "type": "number"
  }))

  // add field
  collection.fields.addAt(19, new Field({
    "hidden": false,
    "id": "_clone_Tw5O",
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
  }))

  // add field
  collection.fields.addAt(20, new Field({
    "hidden": false,
    "id": "_clone_fkIQ",
    "name": "collection_foil",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "bool"
  }))

  // add field
  collection.fields.addAt(21, new Field({
    "hidden": false,
    "id": "_clone_o3FN",
    "max": "",
    "min": "",
    "name": "collection_acquired_date",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "date"
  }))

  // add field
  collection.fields.addAt(22, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "_clone_85bF",
    "max": 1000,
    "min": 0,
    "name": "collection_notes",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_3270162626")

  // update collection data
  unmarshal({
    "viewQuery": "SELECT\n    col.id,\n    c.scryfall_id,\n    c.name,\n    c.oracle_text,\n    c.set_code,\n    c.set_name,\n    c.rarity,\n    c.mana_cost,\n    c.type_line,\n    c.colors,\n    c.image_uris,\n    c.image_file,\n    cp.price_usd,\n    c.last_updated,\n    col.id as collection_id,\n    col.user as collection_user,\n    col.card as collection_card,\n    col.quantity as collection_quantity,\n    col.condition as collection_condition,\n    col.foil as collection_foil,\n    col.acquired_date as collection_acquired_date,\n    col.notes as collection_notes\nFROM collections col\n  JOIN cards c ON col.card = c.id\n  LEFT JOIN card_prices cp ON cp.card_id = c.id"
  }, collection)

  // add field
  collection.fields.addAt(1, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "_clone_nQHM",
    "max": 36,
    "min": 36,
    "name": "scryfall_id",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": true,
    "system": false,
    "type": "text"
  }))

  // add field
  collection.fields.addAt(2, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "_clone_xyCx",
    "max": 255,
    "min": 1,
    "name": "name",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": true,
    "system": false,
    "type": "text"
  }))

  // add field
  collection.fields.addAt(3, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "_clone_WwHF",
    "max": 2000,
    "min": 0,
    "name": "oracle_text",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }))

  // add field
  collection.fields.addAt(4, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "_clone_NlVt",
    "max": 10,
    "min": 1,
    "name": "set_code",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": true,
    "system": false,
    "type": "text"
  }))

  // add field
  collection.fields.addAt(5, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "_clone_2X6T",
    "max": 255,
    "min": 1,
    "name": "set_name",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": true,
    "system": false,
    "type": "text"
  }))

  // add field
  collection.fields.addAt(6, new Field({
    "hidden": false,
    "id": "_clone_Z4gu",
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
  }))

  // add field
  collection.fields.addAt(7, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "_clone_Piro",
    "max": 100,
    "min": 0,
    "name": "mana_cost",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }))

  // add field
  collection.fields.addAt(8, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "_clone_CfrR",
    "max": 255,
    "min": 1,
    "name": "type_line",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }))

  // add field
  collection.fields.addAt(9, new Field({
    "hidden": false,
    "id": "_clone_4jAp",
    "maxSize": 0,
    "name": "colors",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "json"
  }))

  // add field
  collection.fields.addAt(10, new Field({
    "hidden": false,
    "id": "_clone_jODF",
    "maxSize": 0,
    "name": "image_uris",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "json"
  }))

  // add field
  collection.fields.addAt(11, new Field({
    "hidden": false,
    "id": "_clone_Sw47",
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
  }))

  // add field
  collection.fields.addAt(12, new Field({
    "hidden": false,
    "id": "_clone_9qlq",
    "max": null,
    "min": 0,
    "name": "price_usd",
    "onlyInt": false,
    "presentable": false,
    "required": false,
    "system": false,
    "type": "number"
  }))

  // add field
  collection.fields.addAt(13, new Field({
    "hidden": false,
    "id": "_clone_EY9a",
    "max": "",
    "min": "",
    "name": "last_updated",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "date"
  }))

  // add field
  collection.fields.addAt(15, new Field({
    "cascadeDelete": false,
    "collectionId": "_pb_users_auth_",
    "hidden": false,
    "id": "_clone_PfE0",
    "maxSelect": 1,
    "minSelect": 0,
    "name": "collection_user",
    "presentable": false,
    "required": true,
    "system": false,
    "type": "relation"
  }))

  // add field
  collection.fields.addAt(16, new Field({
    "cascadeDelete": false,
    "collectionId": "pbc_3481593366",
    "hidden": false,
    "id": "_clone_NCH9",
    "maxSelect": 1,
    "minSelect": 0,
    "name": "collection_card",
    "presentable": false,
    "required": true,
    "system": false,
    "type": "relation"
  }))

  // add field
  collection.fields.addAt(17, new Field({
    "hidden": false,
    "id": "_clone_exfL",
    "max": null,
    "min": 1,
    "name": "collection_quantity",
    "onlyInt": false,
    "presentable": false,
    "required": true,
    "system": false,
    "type": "number"
  }))

  // add field
  collection.fields.addAt(18, new Field({
    "hidden": false,
    "id": "_clone_FlfP",
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
  }))

  // add field
  collection.fields.addAt(19, new Field({
    "hidden": false,
    "id": "_clone_UqtR",
    "name": "collection_foil",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "bool"
  }))

  // add field
  collection.fields.addAt(20, new Field({
    "hidden": false,
    "id": "_clone_FjaJ",
    "max": "",
    "min": "",
    "name": "collection_acquired_date",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "date"
  }))

  // add field
  collection.fields.addAt(21, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "_clone_3qyC",
    "max": 1000,
    "min": 0,
    "name": "collection_notes",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }))

  // remove field
  collection.fields.removeById("relation1254922784")

  // remove field
  collection.fields.removeById("_clone_8Lyg")

  // remove field
  collection.fields.removeById("_clone_QOIE")

  // remove field
  collection.fields.removeById("_clone_JSZy")

  // remove field
  collection.fields.removeById("_clone_iNKh")

  // remove field
  collection.fields.removeById("_clone_cuni")

  // remove field
  collection.fields.removeById("_clone_Fbzi")

  // remove field
  collection.fields.removeById("_clone_NsC3")

  // remove field
  collection.fields.removeById("_clone_loa7")

  // remove field
  collection.fields.removeById("_clone_d5sI")

  // remove field
  collection.fields.removeById("_clone_izWN")

  // remove field
  collection.fields.removeById("_clone_AR9i")

  // remove field
  collection.fields.removeById("_clone_bLeO")

  // remove field
  collection.fields.removeById("_clone_5vfq")

  // remove field
  collection.fields.removeById("_clone_sWMF")

  // remove field
  collection.fields.removeById("_clone_8MDJ")

  // remove field
  collection.fields.removeById("_clone_8rrU")

  // remove field
  collection.fields.removeById("_clone_Tw5O")

  // remove field
  collection.fields.removeById("_clone_fkIQ")

  // remove field
  collection.fields.removeById("_clone_o3FN")

  // remove field
  collection.fields.removeById("_clone_85bF")

  return app.save(collection)
})
