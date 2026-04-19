# Skinport Dragon Lore Check

Date du check : `2026-04-19`

## Commande utilisee

```powershell
@'
const main = async () => {
  const response = await fetch("https://api.skinport.com/v1/items?app_id=730&currency=USD&tradable=0", {
    headers: { "Accept-Encoding": "br" },
  });

  const items = await response.json();
  const matches = items.filter((item) => String(item.market_hash_name).includes("Dragon Lore"));

  console.log(JSON.stringify({
    status: response.status,
    totalItemsReturned: items.length,
    dragonLoreMatches: matches,
  }, null, 2));
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
'@ | node -
```

## Resultat brut

```json
{
  "status": 200,
  "totalItemsReturned": 19926,
  "dragonLoreMatches": [
    {
      "market_hash_name": "AWP | Dragon Lore (Field-Tested)",
      "version": null,
      "currency": "USD",
      "suggested_price": 8212.5,
      "item_page": "https://skinport.com/item/awp-dragon-lore-field-tested",
      "market_page": "https://skinport.com/market/rifle/awp?item=Dragon%20Lore",
      "min_price": 7364.79,
      "max_price": 8090.74,
      "mean_price": 7727.77,
      "median_price": 7727.77,
      "quantity": 2,
      "created_at": 1535988254,
      "updated_at": 1776600913
    },
    {
      "market_hash_name": "Souvenir AWP | Dragon Lore (Battle-Scarred)",
      "version": null,
      "currency": "USD",
      "suggested_price": 49299.62,
      "item_page": "https://skinport.com/item/souvenir-awp-dragon-lore-battle-scarred",
      "market_page": "https://skinport.com/market/rifle/awp?item=Dragon%20Lore",
      "min_price": null,
      "max_price": null,
      "mean_price": null,
      "median_price": null,
      "quantity": 0,
      "created_at": 1705560863,
      "updated_at": 1776600913
    },
    {
      "market_hash_name": "Souvenir AWP | Dragon Lore (Field-Tested)",
      "version": null,
      "currency": "USD",
      "suggested_price": 51248.75,
      "item_page": "https://skinport.com/item/souvenir-awp-dragon-lore-field-tested",
      "market_page": "https://skinport.com/market/rifle/awp?item=Dragon%20Lore",
      "min_price": null,
      "max_price": null,
      "mean_price": null,
      "median_price": null,
      "quantity": 0,
      "created_at": 1686005934,
      "updated_at": 1776600913
    },
    {
      "market_hash_name": "Souvenir AWP | Dragon Lore (Minimal Wear)",
      "version": null,
      "currency": "USD",
      "suggested_price": 239341.3,
      "item_page": "https://skinport.com/item/souvenir-awp-dragon-lore-minimal-wear",
      "market_page": "https://skinport.com/market/rifle/awp?item=Dragon%20Lore",
      "min_price": null,
      "max_price": null,
      "mean_price": null,
      "median_price": null,
      "quantity": 0,
      "created_at": 1686762220,
      "updated_at": 1776600913
    },
    {
      "market_hash_name": "Sticker | Dragon Lore (Foil)",
      "version": null,
      "currency": "USD",
      "suggested_price": 11.33,
      "item_page": "https://skinport.com/item/sticker-dragon-lore-foil",
      "market_page": "https://skinport.com/market/sticker?item=Dragon%20Lore%20(Foil)",
      "min_price": 8.99,
      "max_price": 11.75,
      "mean_price": 10.92,
      "median_price": 11.69,
      "quantity": 27,
      "created_at": 1572097986,
      "updated_at": 1776600913
    },
    {
      "market_hash_name": "Sticker | Dragon Lore Surf Ava (Foil)",
      "version": null,
      "currency": "USD",
      "suggested_price": 18.45,
      "item_page": "https://skinport.com/item/sticker-dragon-lore-surf-ava-foil",
      "market_page": "https://skinport.com/market/sticker?item=Dragon%20Lore%20Surf%20Ava%20(Foil)",
      "min_price": 17.24,
      "max_price": 17.24,
      "mean_price": 17.24,
      "median_price": 17.24,
      "quantity": 2,
      "created_at": 1633019515,
      "updated_at": 1776600913
    },
    {
      "market_hash_name": "Sticker Slab | Dragon Lore (Foil)",
      "version": null,
      "currency": "USD",
      "suggested_price": 12.94,
      "item_page": "https://skinport.com/item/sticker-slab-dragon-lore-foil",
      "market_page": "https://skinport.com/market/charm?item=Dragon%20Lore%20(Foil)",
      "min_price": 10.8,
      "max_price": 10.8,
      "mean_price": 10.8,
      "median_price": 10.8,
      "quantity": 1,
      "created_at": 1763753324,
      "updated_at": 1776600913
    },
    {
      "market_hash_name": "Sticker Slab | Dragon Lore Surf Ava (Foil)",
      "version": null,
      "currency": "USD",
      "suggested_price": 48.97,
      "item_page": "https://skinport.com/item/sticker-slab-dragon-lore-surf-ava-foil",
      "market_page": "https://skinport.com/market/charm?item=Dragon%20Lore%20Surf%20Ava%20(Foil)",
      "min_price": null,
      "max_price": null,
      "mean_price": null,
      "median_price": null,
      "quantity": 0,
      "created_at": 1763999760,
      "updated_at": 1776600913
    }
  ]
}
```

## Lecture rapide

- `AWP | Dragon Lore (Field-Tested)` est present dans `/v1/items`
- `AWP | Dragon Lore (Factory New)` n'apparait pas dans ce resultat precis
- certains items `Dragon Lore` sont presents avec `quantity = 0`, donc sans listing actif exploitable pour un floor live
