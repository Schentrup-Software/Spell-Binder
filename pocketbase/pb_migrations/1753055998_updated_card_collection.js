/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_3270162626")

  // update collection data
  unmarshal({
    "viewQuery": "SELECT\n    c.id,\n    c.scryfall_id,\n    c.name,\n    c.oracle_text,\n    c.set_code,\n    c.set_name,\n    c.rarity,\n    c.mana_cost,\n    c.type_line,\n    c.colors,\n    c.image_uris,\n    c.image_file,\n    c.price_usd,\n    c.last_updated,\n    col.id as collection_id,\n    col.user as collection_user,\n    col.card as collection_card,\n    col.quantity as collection_quantity,\n    col.condition as collection_condition,\n    col.foil as collection_foil,\n    col.acquired_date as collection_acquired_date,\n    col.notes as collection_notes\nFROM collections col\n  JOIN cards c ON col.card = c.id"
  }, collection)

  // remove field
  collection.fields.removeById("_clone_cikq")

  // remove field
  collection.fields.removeById("_clone_6PCA")

  // remove field
  collection.fields.removeById("_clone_t7yc")

  // remove field
  collection.fields.removeById("_clone_QRen")

  // remove field
  collection.fields.removeById("_clone_JazJ")

  // remove field
  collection.fields.removeById("_clone_8DQw")

  // remove field
  collection.fields.removeById("_clone_Nhwc")

  // remove field
  collection.fields.removeById("_clone_TWAS")

  // remove field
  collection.fields.removeById("_clone_lct2")

  // remove field
  collection.fields.removeById("_clone_GDsJ")

  // remove field
  collection.fields.removeById("_clone_4J36")

  // remove field
  collection.fields.removeById("_clone_XaTU")

  // remove field
  collection.fields.removeById("_clone_8dpj")

  // remove field
  collection.fields.removeById("_clone_3uAt")

  // remove field
  collection.fields.removeById("_clone_LfFC")

  // remove field
  collection.fields.removeById("_clone_NhCc")

  // remove field
  collection.fields.removeById("_clone_UHhv")

  // remove field
  collection.fields.removeById("_clone_VBQF")

  // remove field
  collection.fields.removeById("_clone_XVMq")

  // add field
  collection.fields.addAt(1, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "_clone_6Lnx",
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
    "id": "_clone_ObVo",
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
    "id": "_clone_hAZI",
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
    "id": "_clone_mgHN",
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
    "id": "_clone_kTDQ",
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
    "id": "_clone_JtWk",
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
    "id": "_clone_S8oy",
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
    "id": "_clone_Jvy6",
    "max": 255,
    "min": 1,
    "name": "type_line",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": true,
    "system": false,
    "type": "text"
  }))

  // add field
  collection.fields.addAt(9, new Field({
    "hidden": false,
    "id": "_clone_gris",
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
    "id": "_clone_OL0T",
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
    "id": "_clone_1bnX",
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
    "id": "_clone_6k0v",
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
    "id": "_clone_IfH5",
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
    "id": "_clone_a0aY",
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
    "id": "_clone_mVir",
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
    "id": "_clone_dNHo",
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
    "id": "_clone_2n8e",
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
    "id": "_clone_zizi",
    "name": "collection_foil",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "bool"
  }))

  // add field
  collection.fields.addAt(20, new Field({
    "hidden": false,
    "id": "_clone_4FDN",
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
    "id": "_clone_5Sr3",
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
    "viewQuery": "SELECT\n    c.id,\n    c.scryfall_id,\n    c.name,\n    c.set_code,\n    c.set_name,\n    c.rarity,\n    c.mana_cost,\n    c.type_line,\n    c.colors,\n    c.image_uris,\n    c.image_file,\n    c.price_usd,\n    c.last_updated,\n    col.id as collection_id,\n    col.user as collection_user,\n    col.card as collection_card,\n    col.quantity as collection_quantity,\n    col.condition as collection_condition,\n    col.foil as collection_foil,\n    col.acquired_date as collection_acquired_date,\n    col.notes as collection_notes\nFROM collections col\n  JOIN cards c ON col.card = c.id"
  }, collection)

  // add field
  collection.fields.addAt(1, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "_clone_cikq",
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
    "id": "_clone_6PCA",
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
    "id": "_clone_t7yc",
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
  collection.fields.addAt(4, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "_clone_QRen",
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
  collection.fields.addAt(5, new Field({
    "hidden": false,
    "id": "_clone_JazJ",
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
  collection.fields.addAt(6, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "_clone_8DQw",
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
  collection.fields.addAt(7, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "_clone_Nhwc",
    "max": 255,
    "min": 1,
    "name": "type_line",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": true,
    "system": false,
    "type": "text"
  }))

  // add field
  collection.fields.addAt(8, new Field({
    "hidden": false,
    "id": "_clone_TWAS",
    "maxSize": 0,
    "name": "colors",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "json"
  }))

  // add field
  collection.fields.addAt(9, new Field({
    "hidden": false,
    "id": "_clone_lct2",
    "maxSize": 0,
    "name": "image_uris",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "json"
  }))

  // add field
  collection.fields.addAt(10, new Field({
    "hidden": false,
    "id": "_clone_GDsJ",
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
  collection.fields.addAt(11, new Field({
    "hidden": false,
    "id": "_clone_4J36",
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
  collection.fields.addAt(12, new Field({
    "hidden": false,
    "id": "_clone_XaTU",
    "max": "",
    "min": "",
    "name": "last_updated",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "date"
  }))

  // add field
  collection.fields.addAt(14, new Field({
    "cascadeDelete": false,
    "collectionId": "_pb_users_auth_",
    "hidden": false,
    "id": "_clone_8dpj",
    "maxSelect": 1,
    "minSelect": 0,
    "name": "collection_user",
    "presentable": false,
    "required": true,
    "system": false,
    "type": "relation"
  }))

  // add field
  collection.fields.addAt(15, new Field({
    "cascadeDelete": false,
    "collectionId": "pbc_3481593366",
    "hidden": false,
    "id": "_clone_3uAt",
    "maxSelect": 1,
    "minSelect": 0,
    "name": "collection_card",
    "presentable": false,
    "required": true,
    "system": false,
    "type": "relation"
  }))

  // add field
  collection.fields.addAt(16, new Field({
    "hidden": false,
    "id": "_clone_LfFC",
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
  collection.fields.addAt(17, new Field({
    "hidden": false,
    "id": "_clone_NhCc",
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
  collection.fields.addAt(18, new Field({
    "hidden": false,
    "id": "_clone_UHhv",
    "name": "collection_foil",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "bool"
  }))

  // add field
  collection.fields.addAt(19, new Field({
    "hidden": false,
    "id": "_clone_VBQF",
    "max": "",
    "min": "",
    "name": "collection_acquired_date",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "date"
  }))

  // add field
  collection.fields.addAt(20, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "_clone_XVMq",
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
  collection.fields.removeById("_clone_6Lnx")

  // remove field
  collection.fields.removeById("_clone_ObVo")

  // remove field
  collection.fields.removeById("_clone_hAZI")

  // remove field
  collection.fields.removeById("_clone_mgHN")

  // remove field
  collection.fields.removeById("_clone_kTDQ")

  // remove field
  collection.fields.removeById("_clone_JtWk")

  // remove field
  collection.fields.removeById("_clone_S8oy")

  // remove field
  collection.fields.removeById("_clone_Jvy6")

  // remove field
  collection.fields.removeById("_clone_gris")

  // remove field
  collection.fields.removeById("_clone_OL0T")

  // remove field
  collection.fields.removeById("_clone_1bnX")

  // remove field
  collection.fields.removeById("_clone_6k0v")

  // remove field
  collection.fields.removeById("_clone_IfH5")

  // remove field
  collection.fields.removeById("_clone_a0aY")

  // remove field
  collection.fields.removeById("_clone_mVir")

  // remove field
  collection.fields.removeById("_clone_dNHo")

  // remove field
  collection.fields.removeById("_clone_2n8e")

  // remove field
  collection.fields.removeById("_clone_zizi")

  // remove field
  collection.fields.removeById("_clone_4FDN")

  // remove field
  collection.fields.removeById("_clone_5Sr3")

  return app.save(collection)
})
