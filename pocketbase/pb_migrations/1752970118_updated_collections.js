/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_601157786")

  // update field
  collection.fields.addAt(5, new Field({
    "hidden": false,
    "id": "bool2360936003",
    "name": "foil",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "bool"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_601157786")

  // update field
  collection.fields.addAt(5, new Field({
    "hidden": false,
    "id": "bool2360936003",
    "name": "foil",
    "presentable": false,
    "required": true,
    "system": false,
    "type": "bool"
  }))

  return app.save(collection)
})
