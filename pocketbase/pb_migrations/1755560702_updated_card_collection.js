/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_3270162626")

  // update collection data
  unmarshal({
    "viewQuery": "SELECT\n    c.id,\n    c.scryfall_id,\n    c.name,\n    c.oracle_text,\n    c.set_code,\n    c.set_name,\n    c.rarity,\n    c.mana_cost,\n    c.type_line,\n    c.colors,\n    c.image_uris,\n    c.image_file,\n    cp.price_usd,\n    c.last_updated,\n    col.id as collection_id,\n    col.user as collection_user,\n    col.card as collection_card,\n    col.quantity as collection_quantity,\n    col.condition as collection_condition,\n    col.foil as collection_foil,\n    col.acquired_date as collection_acquired_date,\n    col.notes as collection_notes\nFROM collections col\n  JOIN cards c ON col.card = c.id\n  LEFT JOIN card_prices cp ON cp.card_id = c.id"
  }, collection)

  // remove field
  collection.fields.removeById("_clone_MwC2")

  // remove field
  collection.fields.removeById("_clone_tueT")

  // remove field
  collection.fields.removeById("_clone_Jco1")

  // remove field
  collection.fields.removeById("_clone_tQhB")

  // remove field
  collection.fields.removeById("_clone_JsBZ")

  // remove field
  collection.fields.removeById("_clone_kATd")

  // remove field
  collection.fields.removeById("_clone_8dFd")

  // remove field
  collection.fields.removeById("_clone_ykPk")

  // remove field
  collection.fields.removeById("_clone_PlFv")

  // remove field
  collection.fields.removeById("_clone_UYXJ")

  // remove field
  collection.fields.removeById("_clone_QBOW")

  // remove field
  collection.fields.removeById("_clone_UU4u")

  // remove field
  collection.fields.removeById("_clone_RNRn")

  // remove field
  collection.fields.removeById("_clone_EtpH")

  // remove field
  collection.fields.removeById("_clone_yLdR")

  // remove field
  collection.fields.removeById("_clone_KzAU")

  // remove field
  collection.fields.removeById("_clone_JckP")

  // remove field
  collection.fields.removeById("_clone_NttZ")

  // remove field
  collection.fields.removeById("_clone_Q0SW")

  // remove field
  collection.fields.removeById("_clone_P8xo")

  // add field
  collection.fields.addAt(1, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "_clone_GsdW",
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
    "id": "_clone_4zz7",
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
    "id": "_clone_6vir",
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
    "id": "_clone_INkp",
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
    "id": "_clone_m7uP",
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
    "id": "_clone_yKTe",
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
    "id": "_clone_lAMV",
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
    "id": "_clone_cN8f",
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
    "id": "_clone_jBn8",
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
    "id": "_clone_QrIk",
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
    "id": "_clone_7c7G",
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
    "id": "_clone_NIT5",
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
    "id": "_clone_9jJD",
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
    "id": "_clone_uhQv",
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
    "id": "_clone_TAIU",
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
    "id": "_clone_luv4",
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
    "id": "_clone_jEQt",
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
    "id": "_clone_Wxk1",
    "name": "collection_foil",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "bool"
  }))

  // add field
  collection.fields.addAt(20, new Field({
    "hidden": false,
    "id": "_clone_CQ1l",
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
    "id": "_clone_EqoP",
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
    "viewQuery": "SELECT\n    c.id,\n    c.scryfall_id,\n    c.name,\n    c.oracle_text,\n    c.set_code,\n    c.set_name,\n    c.rarity,\n    c.mana_cost,\n    c.type_line,\n    c.colors,\n    c.image_uris,\n    c.image_file,\n    c.price_usd,\n    c.last_updated,\n    col.id as collection_id,\n    col.user as collection_user,\n    col.card as collection_card,\n    col.quantity as collection_quantity,\n    col.condition as collection_condition,\n    col.foil as collection_foil,\n    col.acquired_date as collection_acquired_date,\n    col.notes as collection_notes\nFROM collections col\n  JOIN cards c ON col.card = c.id"
  }, collection)

  // add field
  collection.fields.addAt(1, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "_clone_MwC2",
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
    "id": "_clone_tueT",
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
    "id": "_clone_Jco1",
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
    "id": "_clone_tQhB",
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
    "id": "_clone_JsBZ",
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
    "id": "_clone_kATd",
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
    "id": "_clone_8dFd",
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
    "id": "_clone_ykPk",
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
    "id": "_clone_PlFv",
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
    "id": "_clone_UYXJ",
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
    "id": "_clone_QBOW",
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
    "id": "_clone_UU4u",
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
    "id": "_clone_RNRn",
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
    "id": "_clone_EtpH",
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
    "id": "_clone_yLdR",
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
    "id": "_clone_KzAU",
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
    "id": "_clone_JckP",
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
    "id": "_clone_NttZ",
    "name": "collection_foil",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "bool"
  }))

  // add field
  collection.fields.addAt(20, new Field({
    "hidden": false,
    "id": "_clone_Q0SW",
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
    "id": "_clone_P8xo",
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
  collection.fields.removeById("_clone_GsdW")

  // remove field
  collection.fields.removeById("_clone_4zz7")

  // remove field
  collection.fields.removeById("_clone_6vir")

  // remove field
  collection.fields.removeById("_clone_INkp")

  // remove field
  collection.fields.removeById("_clone_m7uP")

  // remove field
  collection.fields.removeById("_clone_yKTe")

  // remove field
  collection.fields.removeById("_clone_lAMV")

  // remove field
  collection.fields.removeById("_clone_cN8f")

  // remove field
  collection.fields.removeById("_clone_jBn8")

  // remove field
  collection.fields.removeById("_clone_QrIk")

  // remove field
  collection.fields.removeById("_clone_7c7G")

  // remove field
  collection.fields.removeById("_clone_NIT5")

  // remove field
  collection.fields.removeById("_clone_9jJD")

  // remove field
  collection.fields.removeById("_clone_uhQv")

  // remove field
  collection.fields.removeById("_clone_TAIU")

  // remove field
  collection.fields.removeById("_clone_luv4")

  // remove field
  collection.fields.removeById("_clone_jEQt")

  // remove field
  collection.fields.removeById("_clone_Wxk1")

  // remove field
  collection.fields.removeById("_clone_CQ1l")

  // remove field
  collection.fields.removeById("_clone_EqoP")

  return app.save(collection)
})
