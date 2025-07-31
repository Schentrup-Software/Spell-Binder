/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_1757051097")

  // add field
  collection.fields.addAt(2, new Field({
    "hidden": false,
    "id": "select3736761055",
    "maxSelect": 1,
    "name": "format",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "select",
    "values": [
      "alchemy",
      "brawl",
      "commander",
      "duel",
      "future",
      "gladiator",
      "historic",
      "legacy",
      "modern",
      "oathbreaker",
      "oldschool",
      "pauper",
      "paupercommander",
      "penny",
      "pioneer",
      "predh",
      "premodern",
      "standard",
      "standardbrawl",
      "timeless",
      "vintage"
    ]
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_1757051097")

  // remove field
  collection.fields.removeById("select3736761055")

  return app.save(collection)
})
