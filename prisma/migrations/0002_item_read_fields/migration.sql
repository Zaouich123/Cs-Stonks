ALTER TABLE "Item"
ADD COLUMN "slug" TEXT,
ADD COLUMN "searchText" TEXT;

UPDATE "Item"
SET
  "slug" = trim(BOTH '-' FROM lower(regexp_replace("variantKey", '[^[:alnum:]]+', '-', 'g'))),
  "searchText" = trim(
    regexp_replace(
      lower(
        regexp_replace(
          concat_ws(
            ' ',
            "displayName",
            "marketHashName",
            "weapon",
            "skinName",
            "exterior",
            "rarity",
            "collection",
            "phase",
            CASE WHEN "stattrak" THEN 'stattrak' ELSE '' END,
            CASE WHEN "souvenir" THEN 'souvenir' ELSE '' END
          ),
          '[^[:alnum:]]+',
          ' ',
          'g'
        )
      ),
      '\s+',
      ' ',
      'g'
    )
  );

ALTER TABLE "Item"
ALTER COLUMN "slug" SET NOT NULL,
ALTER COLUMN "searchText" SET NOT NULL;

CREATE INDEX "Item_slug_idx" ON "Item"("slug");
CREATE INDEX "Item_searchText_idx" ON "Item"("searchText");
