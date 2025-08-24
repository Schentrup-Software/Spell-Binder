/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_3481593366")

  // remove field
  collection.fields.removeById("number141706997")

  // remove field
  collection.fields.removeById("number322190321")

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_3481593366")

  // add field
  collection.fields.addAt(50, new Field({
    "hidden": false,
    "id": "number141706997",
    "max": null,
    "min": 0,
    "name": "price_eur",
    "onlyInt": false,
    "presentable": false,
    "required": false,
    "system": false,
    "type": "number"
  }))

  // add field
  collection.fields.addAt(51, new Field({
    "hidden": false,
    "id": "number322190321",
    "max": null,
    "min": 0,
    "name": "price_tix",
    "onlyInt": false,
    "presentable": false,
    "required": false,
    "system": false,
    "type": "number"
  }))

  return app.save(collection)
})
