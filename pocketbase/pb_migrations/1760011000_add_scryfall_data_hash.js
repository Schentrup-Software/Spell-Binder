/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("cards")

  collection.fields.addAt(999, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "text_scryhash",
    "max": 64,
    "min": 8,
    "name": "scryfall_data_hash",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("cards")

  collection.fields.removeById("text_scryhash")

  return app.save(collection)
})
