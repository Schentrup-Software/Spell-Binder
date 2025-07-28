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
        .newQuery(`
            SELECT DISTINCT
                c.*
            FROM search_text_fts s
            JOIN cards c ON c.scryfall_id = s.card_id
            WHERE 
                ${searchText ? "search_text_fts MATCH {:searchText}" : "1=1"}
                AND ({:setCode} IS NULL OR c.set_code = {:setCode})
                AND ({:typeLine} IS NULL OR c.type_line = {:typeLine})
                AND ({:rarity} IS NULL OR c.rarity = {:rarity})
                AND ({:colors} IS NULL OR c.colors IN ({:colors}))
            GROUP BY c.name
            ORDER BY 
                IF(c.name = {:searchText}, 1, 0) DESC,
                IF(c.name LIKE {:searchTextLike}, 1, 0) DESC,
                s.rank DESC,
                c.name
            LIMIT {:pageSize} OFFSET {:offset};
        `).bind({
            pageSize,
            offset: (page - 1) * pageSize,
            searchText: searchText,
            searchTextLike: `%${searchText}%`,
            setCode: setCode || null,
            typeLine: typeLine || null,
            rarity: rarity || null,
            colors: colors ? colors.split(",") : null,
        });

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
        "price_usd": -0,
        "last_updated": ""
    }))
    cards.all(result)

    return e.json(200, {
        items: result,
    });
});