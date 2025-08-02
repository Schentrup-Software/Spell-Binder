/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_992973442")

  // add field
  collection.fields.addAt(5, new Field({
    "hidden": false,
    "id": "number2683508278",
    "max": null,
    "min": 1,
    "name": "quantity",
    "onlyInt": true,
    "presentable": false,
    "required": true,
    "system": false,
    "type": "number"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_992973442")

  // remove field
  collection.fields.removeById("number2683508278")

  return app.save(collection)
})
