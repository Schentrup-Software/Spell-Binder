/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = new Collection({
    "createRule": "deck.user.id = @request.auth.id",
    "deleteRule": "deck.user.id = @request.auth.id",
    "fields": [
      {
        "autogeneratePattern": "[a-z0-9]{15}",
        "hidden": false,
        "id": "text3208210256",
        "max": 15,
        "min": 15,
        "name": "id",
        "pattern": "^[a-z0-9]+$",
        "presentable": false,
        "primaryKey": true,
        "required": true,
        "system": true,
        "type": "text"
      },
      {
        "cascadeDelete": true,
        "collectionId": "pbc_1757051097",
        "hidden": false,
        "id": "relation1336686135",
        "maxSelect": 1,
        "minSelect": 0,
        "name": "deck",
        "presentable": false,
        "required": true,
        "system": false,
        "type": "relation"
      },
      {
        "cascadeDelete": false,
        "collectionId": "pbc_601157786",
        "hidden": false,
        "id": "relation4232930610",
        "maxSelect": 1,
        "minSelect": 0,
        "name": "collection",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "relation"
      },
      {
        "cascadeDelete": true,
        "collectionId": "pbc_3481593366",
        "hidden": false,
        "id": "relation370448595",
        "maxSelect": 1,
        "minSelect": 0,
        "name": "card",
        "presentable": false,
        "required": true,
        "system": false,
        "type": "relation"
      },
      {
        "hidden": false,
        "id": "select2363381545",
        "maxSelect": 1,
        "name": "type",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "select",
        "values": [
          "library",
          "commander",
          "co-commander"
        ]
      },
      {
        "hidden": false,
        "id": "autodate2990389176",
        "name": "created",
        "onCreate": true,
        "onUpdate": false,
        "presentable": false,
        "system": false,
        "type": "autodate"
      },
      {
        "hidden": false,
        "id": "autodate3332085495",
        "name": "updated",
        "onCreate": true,
        "onUpdate": true,
        "presentable": false,
        "system": false,
        "type": "autodate"
      }
    ],
    "id": "pbc_992973442",
    "indexes": [],
    "listRule": "deck.user.id = @request.auth.id",
    "name": "deck_cards",
    "system": false,
    "type": "base",
    "updateRule": "deck.user.id = @request.auth.id",
    "viewRule": "deck.user.id = @request.auth.id"
  });

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_992973442");

  return app.delete(collection);
})
