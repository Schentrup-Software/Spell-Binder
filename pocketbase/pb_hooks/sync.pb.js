// Bulk data synchronization system for Spell Binder
// Downloads and processes Scryfall bulk data to populate local Cards collection

//TODO: Add authentication https://pocketbase.io/docs/js-routing/#retrieving-the-current-auth-state

cronAdd("daily_sync", "0 2 * * *", () => {
    console.log("Daily sync job triggered")

    const sync = require(`${__hooks}/sync.js`)
    sync.syncBulkCardData();
});
