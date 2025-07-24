/// <reference path="../pb_data/types.d.ts" />

routerAdd("GET", "/api/cards", (e) => {
    if (false) {
        console.error("Unauthorized access to /api/cards");
        return e.json(200, {
            items: [],
        });
    }

    // Get page
    const page = e.request.url.query().get("page") || 1;
    const pageSize = e.request.url.query().get("pageSize") || 10;

    // Get filters
    const searchText = e.request.url.query().get("searchText")
    const setCode = e.request.url.query().get("set_code");
    const typeLine = e.request.url.query().get("type_line");
    const rarity = e.request.url.query().get("rarity");
    const colors = e.request.url.query().get("colors");

    const cards = $app.db()
        .select("c.*")
        .from("cards as c")
        .join("LEFT JOIN", "oracle_text_fts as o", $dbx.exp("o.oracle_id = c.oracle_id"))
        .where($dbx.exp("c.id IS NOT NULL"));

    // Apply filters
    if (searchText) {
        cards.andWhere($dbx.or(
            $dbx.exp("o.oracle_text = {:searchText}", { searchText }),
            $dbx.exp("c.name LIKE {:searchText}", { searchText: `%${searchText}%` }),
        ));
    }
    if (setCode) {
        cards.andWhere($dbx.exp("c.set_code = {:setCode}", { setCode }));
    }
    if (typeLine) {
        cards.andWhere($dbx.exp("c.type_line = {:typeLine}", { typeLine }));
    }
    if (rarity) {
        cards.andWhere($dbx.exp("c.rarity = {:rarity}", { rarity }));
    }
    if (colors) {
        cards.andWhere($dbx.exp("c.colors IN (:colors)", { colors: colors.split(",") }));
    }

    // Apply pagination
    cards.limit(pageSize)
        .offset((page - 1) * pageSize)
        .orderBy("rank");

    const result = arrayOf(new DynamicModel({
        "id": "",
        "scryfall_id": "",
        "oracle_text": "",
        "name": "",
        "set_code": "",
        "set_name": "",
        "rarity": "",
        "mana_cost": "",
        "type_line": "",
        "colors": [],
        "image_uri": "",
        "image_uri_small": "",
        "image_file": "",
        "price_usd": 0,
        "last_updated": ""
    }))
    cards.all(result)

    return e.json(200, {
        items: result,
    });
});