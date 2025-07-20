/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_188695556")

  // update collection data
  unmarshal({
    "listRule": "@request.auth.id = user.id",
    "viewQuery": "SELECT\n    c.set_id AS id,\n    c.set_name as name,\n    col.user\nFROM collections col\n  JOIN cards c ON col.card = c.id\nGROUP BY set_id, set_name",
    "viewRule": "@request.auth.id = user.id"
  }, collection)

  // remove field
  collection.fields.removeById("_clone_z1EF")

  // add field
  collection.fields.addAt(1, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "_clone_nkup",
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
  collection.fields.addAt(2, new Field({
    "cascadeDelete": false,
    "collectionId": "_pb_users_auth_",
    "hidden": false,
    "id": "_clone_VcPh",
    "maxSelect": 1,
    "minSelect": 0,
    "name": "user",
    "presentable": false,
    "required": true,
    "system": false,
    "type": "relation"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_188695556")

  // update collection data
  unmarshal({
    "listRule": "",
    "viewQuery": "SELECT\n    set_id AS id,\n    set_name as name\nFROM cards\nGROUP BY set_id, set_name",
    "viewRule": ""
  }, collection)

  // add field
  collection.fields.addAt(1, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "_clone_z1EF",
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

  // remove field
  collection.fields.removeById("_clone_nkup")

  // remove field
  collection.fields.removeById("_clone_VcPh")

  return app.save(collection)
})
