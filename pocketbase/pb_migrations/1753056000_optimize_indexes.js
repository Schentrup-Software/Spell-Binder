/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const collection = db.findCollectionByNameOrId("cards")

  collection.removeIndex("idx_cards_collector_number")
  collection.removeIndex("idx_cards_released_at")
  collection.removeIndex("idx_cards_artist")
  collection.removeIndex("idx_cards_cmc")

  db.db().newQuery("CREATE VIRTUAL TABLE oracle_text_fts USING fts5(oracle_id, oracle_text);").execute();
}, (db) => {
  const collection = db.findCollectionByNameOrId("cards")

  collection.addIndex("idx_cards_collector_number", false, "collector_number")
  collection.addIndex("idx_cards_released_at", false, "released_at")
  collection.addIndex("idx_cards_artist", false, "artist")
  collection.addIndex("idx_cards_cmc", false, "cmc")

  db.db().newQuery("DROP TABLE oracle_text_fts;").execute();
})
