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
    const setCode = e.request.url.query().get("setCode");
    const typeLine = e.request.url.query().get("typeLine");
    const rarity = e.request.url.query().get("rarity");
    const colors = e.request.url.query().get("colors")
        ?.split(",")?.map(c => c.trim().toLocaleLowerCase())?.filter(c => c.length > 0) || [];

    const cards = $app.db()
        .newQuery(`
            SELECT DISTINCT
                c.id,
                c.scryfall_id,
                c.name,
                c.oracle_text,
                c.set_code,
                c.set_name,
                c.rarity,
                c.mana_cost,
                c.type_line,
                c.colors,
                COALESCE(
                    JSON_EXTRACT(c.image_uris, '$.normal'),
                    JSON_EXTRACT(c.image_uris, '$.png'),
                    JSON_EXTRACT(c.image_uris, '$.art_crop'),
                    JSON_EXTRACT(c.image_uris, '$.border_crop'),
                    JSON_EXTRACT(c.image_uris, '$.large'),
                    JSON_EXTRACT(c.image_uris, '$.small'),
                    ''
                ) AS image_uri,
                COALESCE(JSON_EXTRACT(c.image_uris, '$.small'), '') AS image_uri_small,
                c.image_file,
                c.last_updated
            FROM search_text_fts s
            JOIN cards c ON c.scryfall_id = s.card_id
            WHERE 
                search_text_fts MATCH {:searchText}
                AND ({:setCode} IS NULL OR c.set_code = {:setCode})
                AND ({:typeLine} IS NULL OR c.type_line = {:typeLine})
                AND ({:rarity} IS NULL OR c.rarity = {:rarity})
                AND ({:colorsIsNull} IS NULL OR EXISTS (
                        SELECT 1
                        FROM json_each(c.colors)
                        WHERE (value = 'R' AND {:hasRed} IS NOT NULL)
                           OR (value = 'G' AND {:hasGreen} IS NOT NULL)
                           OR (value = 'U' AND {:hasBlue} IS NOT NULL)
                           OR (value = 'W' AND {:hasWhite} IS NOT NULL)
                           OR (value = 'B' AND {:hasBlack} IS NOT NULL)
                    )
                )
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
            colorsIsNull: colors.length === 0 ? null : false,
            hasRed: colors.includes("r") ? true : null,
            hasGreen: colors.includes("g") ? true : null,
            hasBlue: colors.includes("u") ? true : null,
            hasWhite: colors.includes("w") ? true : null,
            hasBlack: colors.includes("b") ? true : null,
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
        "last_updated": ""
    }))
    cards.all(result)

    // Add prices
    const prices = $app.findAllRecords(
        "card_prices",
        $dbx.in("card_id", ...result.map(c => c.id))
    );

    return e.json(200, {
        items: result.map(card => {
            const price = prices.find(p => p.get('card_id') === card.id) || null;
            return {
                ...card,
                price_usd: price?.get('price_usd') || null
            };
        })
    })
});

routerAdd("POST", "/api/cards/image", (e) => {
    let body = e.requestInfo().body;
    const title = body.title || "";

    if (title.length === 0) {
        return e.json(400, { error: "Title is required" });
    }

    const cards = $app.db()
        .newQuery(`
            SELECT
                c.id,
                c.scryfall_id,
                c.name,
                c.oracle_text,
                c.set_code,
                c.set_name,
                c.rarity,
                c.mana_cost,
                c.type_line,
                c.colors,
                COALESCE(
                    JSON_EXTRACT(c.image_uris, '$.normal'),
                    JSON_EXTRACT(c.image_uris, '$.png'),
                    JSON_EXTRACT(c.image_uris, '$.art_crop'),
                    JSON_EXTRACT(c.image_uris, '$.border_crop'),
                    JSON_EXTRACT(c.image_uris, '$.large'),
                    JSON_EXTRACT(c.image_uris, '$.small'),
                    ''
                ) AS image_uri,
                COALESCE(JSON_EXTRACT(c.image_uris, '$.small'), '') AS image_uri_small,
                c.image_file,
                c.last_updated
            FROM search_text_fts s
            JOIN cards c ON c.scryfall_id = s.card_id
            WHERE 
                s.name MATCH {:searchText}
            GROUP BY c.name;
        `).bind({
            searchText: searchText,
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
        "last_updated": ""
    }))
    cards.all(result)

    if (result.length === 0) {
        return e.json(200, { card: null });
    } else if (result.length === 1) {
        return e.json(200, { card: result[0] });
    }


    let files = e.findUploadedFiles("picture");

    const utils = require(`${__hooks}/utils.js`);

    utils.pixelmatch("World")
});