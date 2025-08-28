/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_3270162626")

  // update collection data
  unmarshal({
    "listRule": "@request.auth.id = collection_user.id",
    "viewRule": "@request.auth.id = collection_user.id"
  }, collection)

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

  // add field
  collection.fields.addAt(1, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "_clone_Qekf",
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
    "id": "_clone_M1na",
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
    "id": "_clone_1iH0",
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
    "id": "_clone_IFhP",
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
    "id": "_clone_W5hT",
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
    "id": "_clone_ntWu",
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
    "id": "_clone_Mdyy",
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
    "id": "_clone_iO2g",
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
    "id": "_clone_mUhD",
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
    "id": "_clone_m1Fn",
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
    "id": "_clone_xHMY",
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
    "id": "_clone_zuD9",
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
    "id": "_clone_lN5o",
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
    "id": "_clone_uxyZ",
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
    "id": "_clone_Nmos",
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
    "id": "_clone_8YlZ",
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
    "id": "_clone_XY0u",
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
    "id": "_clone_IBOw",
    "name": "collection_foil",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "bool"
  }))

  // add field
  collection.fields.addAt(20, new Field({
    "hidden": false,
    "id": "_clone_iqy3",
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
    "id": "_clone_dr6C",
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
    "listRule": "@request.auth.id = collection_user",
    "viewRule": "@request.auth.id = collection_user"
  }, collection)

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

  // remove field
  collection.fields.removeById("_clone_Qekf")

  // remove field
  collection.fields.removeById("_clone_M1na")

  // remove field
  collection.fields.removeById("_clone_1iH0")

  // remove field
  collection.fields.removeById("_clone_IFhP")

  // remove field
  collection.fields.removeById("_clone_W5hT")

  // remove field
  collection.fields.removeById("_clone_ntWu")

  // remove field
  collection.fields.removeById("_clone_Mdyy")

  // remove field
  collection.fields.removeById("_clone_iO2g")

  // remove field
  collection.fields.removeById("_clone_mUhD")

  // remove field
  collection.fields.removeById("_clone_m1Fn")

  // remove field
  collection.fields.removeById("_clone_xHMY")

  // remove field
  collection.fields.removeById("_clone_zuD9")

  // remove field
  collection.fields.removeById("_clone_lN5o")

  // remove field
  collection.fields.removeById("_clone_uxyZ")

  // remove field
  collection.fields.removeById("_clone_Nmos")

  // remove field
  collection.fields.removeById("_clone_8YlZ")

  // remove field
  collection.fields.removeById("_clone_XY0u")

  // remove field
  collection.fields.removeById("_clone_IBOw")

  // remove field
  collection.fields.removeById("_clone_iqy3")

  // remove field
  collection.fields.removeById("_clone_dr6C")

  return app.save(collection)
})
