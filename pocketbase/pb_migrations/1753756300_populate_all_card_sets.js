/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
    console.log("Populating all_card_sets collection from existing card data...");

    app.db().newQuery(`
        INSERT OR IGNORE INTO all_card_sets (set_code, set_name)
        SELECT DISTINCT set_code, set_name 
        FROM cards 
        WHERE set_code != '' AND set_name != ''
        ORDER BY set_name
    `).execute();
}, (app) => {
    app.db().newQuery("DELETE FROM all_card_sets").execute();
});
