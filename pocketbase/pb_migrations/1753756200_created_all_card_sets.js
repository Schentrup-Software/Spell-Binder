/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
    const collection = new Collection({
        "createRule": null,
        "deleteRule": null,
        "fields": [
            {
                "autogeneratePattern": "[a-z0-9]{15}",
                "hidden": false,
                "id": "text3208210256",
                "max": 0,
                "min": 0,
                "name": "id",
                "pattern": "^[a-z0-9]+$",
                "presentable": false,
                "primaryKey": true,
                "required": true,
                "system": true,
                "type": "text"
            },
            {
                "autogeneratePattern": "",
                "hidden": false,
                "id": "set_code_field",
                "max": 10,
                "min": 1,
                "name": "set_code",
                "pattern": "",
                "presentable": true,
                "primaryKey": false,
                "required": true,
                "system": false,
                "type": "text"
            },
            {
                "autogeneratePattern": "",
                "hidden": false,
                "id": "set_name_field",
                "max": 255,
                "min": 1,
                "name": "set_name",
                "pattern": "",
                "presentable": false,
                "primaryKey": false,
                "required": true,
                "system": false,
                "type": "text"
            },
            {
                "cascadeDelete": false,
                "collectionId": "",
                "hidden": false,
                "id": "created_field",
                "maxSelect": 1,
                "minSelect": 0,
                "name": "created",
                "presentable": false,
                "required": false,
                "system": true,
                "type": "date"
            },
            {
                "cascadeDelete": false,
                "collectionId": "",
                "hidden": false,
                "id": "updated_field",
                "maxSelect": 1,
                "minSelect": 0,
                "name": "updated",
                "presentable": false,
                "required": false,
                "system": true,
                "type": "date"
            }
        ],
        "id": "all_card_sets",
        "indexes": [
            "CREATE UNIQUE INDEX `idx_unique_set_code` ON `all_card_sets` (`set_code`)"
        ],
        "listRule": "",
        "name": "all_card_sets",
        "system": false,
        "type": "base",
        "updateRule": null,
        "viewRule": ""
    });

    return app.save(collection);
}, (app) => {
    const collection = app.findCollectionByNameOrId("all_card_sets");

    return app.delete(collection);
});
