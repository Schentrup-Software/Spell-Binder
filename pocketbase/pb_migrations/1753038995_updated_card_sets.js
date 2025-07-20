/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_188695556")

  // update collection data
  unmarshal({
    "viewQuery": "SELECT\n    c.set_code AS id,\n    c.set_name as name,\n    col.user\nFROM collections col\n  JOIN cards c ON col.card = c.id\nGROUP BY set_id, set_name"
  }, collection)

  // remove field
  collection.fields.removeById("_clone_nkup")

  // remove field
  collection.fields.removeById("_clone_VcPh")

  // add field
  collection.fields.addAt(1, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "_clone_86s1",
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
    "id": "_clone_riCU",
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
    "viewQuery": "SELECT\n    c.set_id AS id,\n    c.set_name as name,\n    col.user\nFROM collections col\n  JOIN cards c ON col.card = c.id\nGROUP BY set_id, set_name"
  }, collection)

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

  // remove field
  collection.fields.removeById("_clone_86s1")

  // remove field
  collection.fields.removeById("_clone_riCU")

  return app.save(collection)
})
