import { Migration } from "@medusajs/framework/mikro-orm/migrations"

export class Migration20260623120000 extends Migration {
  override async up(): Promise<void> {
    // ── competitor ──
    this.addSql(
      `create table if not exists "competitor" (` +
        `"id" text not null, ` +
        `"name" text not null, ` +
        `"handle" text not null, ` +
        `"base_url" text null, ` +
        `"scraper_key" text not null default 'generic-jsonld', ` +
        `"is_active" boolean not null default true, ` +
        `"refresh_interval_seconds" integer null, ` +
        `"catalog_discovery_enabled" boolean not null default false, ` +
        `"catalog_discovery_interval_seconds" integer null, ` +
        `"last_catalog_discovery_at" timestamptz null, ` +
        `"next_catalog_discovery_at" timestamptz null, ` +
        `"metadata" jsonb null, ` +
        `"created_at" timestamptz not null default now(), ` +
        `"updated_at" timestamptz not null default now(), ` +
        `"deleted_at" timestamptz null, ` +
        `constraint "competitor_pkey" primary key ("id"));`
    )
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_competitor_deleted_at" ON "competitor" ("deleted_at") WHERE deleted_at IS NULL;`
    )
    this.addSql(
      `CREATE UNIQUE INDEX IF NOT EXISTS "IDX_competitor_handle_unique" ON "competitor" ("handle") WHERE deleted_at IS NULL;`
    )

    // ── competitor_product ──
    this.addSql(
      `create table if not exists "competitor_product" (` +
        `"id" text not null, ` +
        `"competitor_id" text not null, ` +
        `"product_id" text null, ` +
        `"variant_id" text null, ` +
        `"product_sku" text null, ` +
        `"competitor_url" text null, ` +
        `"competitor_sku" text null, ` +
        `"competitor_ean" text null, ` +
        `"title" text null, ` +
        `"brand" text null, ` +
        `"match_status" text not null default 'unmatched', ` +
        `"match_method" text null, ` +
        `"match_score" integer null, ` +
        `"scraper_key" text null, ` +
        `"refresh_interval_seconds" integer null, ` +
        `"current_interval_seconds" integer null, ` +
        `"consecutive_failures" integer not null default 0, ` +
        `"consecutive_unchanged" integer not null default 0, ` +
        `"last_scraped_at" timestamptz null, ` +
        `"next_scrape_at" timestamptz null, ` +
        `"last_price" integer null, ` +
        `"is_active" boolean not null default true, ` +
        `"metadata" jsonb null, ` +
        `"created_at" timestamptz not null default now(), ` +
        `"updated_at" timestamptz not null default now(), ` +
        `"deleted_at" timestamptz null, ` +
        `constraint "competitor_product_pkey" primary key ("id"));`
    )
    this.addSql(
      `do $$ begin ` +
        `if not exists (select 1 from pg_constraint where conname = 'competitor_product_competitor_id_foreign') then ` +
        `alter table "competitor_product" add constraint "competitor_product_competitor_id_foreign" ` +
        `foreign key ("competitor_id") references "competitor" ("id") on update cascade on delete cascade; ` +
        `end if; end $$;`
    )
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_competitor_product_deleted_at" ON "competitor_product" ("deleted_at") WHERE deleted_at IS NULL;`
    )
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_competitor_product_competitor_id" ON "competitor_product" ("competitor_id");`
    )
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_competitor_product_product_id" ON "competitor_product" ("product_id");`
    )
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_competitor_product_match_status" ON "competitor_product" ("match_status");`
    )
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_competitor_product_next_scrape_at" ON "competitor_product" ("next_scrape_at");`
    )

    // ── competitor_price ──
    this.addSql(
      `create table if not exists "competitor_price" (` +
        `"id" text not null, ` +
        `"competitor_product_id" text not null, ` +
        `"price" integer null, ` +
        `"original_price" integer null, ` +
        `"currency_code" text not null default 'EUR', ` +
        `"in_stock" boolean null, ` +
        `"availability" text null, ` +
        `"status" text not null default 'ok', ` +
        `"error_message" text null, ` +
        `"raw" jsonb null, ` +
        `"scraped_at" timestamptz not null, ` +
        `"created_at" timestamptz not null default now(), ` +
        `"updated_at" timestamptz not null default now(), ` +
        `"deleted_at" timestamptz null, ` +
        `constraint "competitor_price_pkey" primary key ("id"));`
    )
    this.addSql(
      `do $$ begin ` +
        `if not exists (select 1 from pg_constraint where conname = 'competitor_price_competitor_product_id_foreign') then ` +
        `alter table "competitor_price" add constraint "competitor_price_competitor_product_id_foreign" ` +
        `foreign key ("competitor_product_id") references "competitor_product" ("id") on update cascade on delete cascade; ` +
        `end if; end $$;`
    )
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_competitor_price_deleted_at" ON "competitor_price" ("deleted_at") WHERE deleted_at IS NULL;`
    )
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_competitor_price_competitor_product_id" ON "competitor_price" ("competitor_product_id");`
    )
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_competitor_price_scraped_at" ON "competitor_price" ("scraped_at");`
    )

    // ── product_watch (product discovery) ──
    this.addSql(
      `create table if not exists "product_watch" (` +
        `"id" text not null, ` +
        `"product_id" text not null, ` +
        `"product_sku" text null, ` +
        `"title" text null, ` +
        `"brand" text null, ` +
        `"ean" text null, ` +
        `"discovery_interval_seconds" integer null, ` +
        `"last_discovery_at" timestamptz null, ` +
        `"next_discovery_at" timestamptz null, ` +
        `"is_active" boolean not null default true, ` +
        `"metadata" jsonb null, ` +
        `"created_at" timestamptz not null default now(), ` +
        `"updated_at" timestamptz not null default now(), ` +
        `"deleted_at" timestamptz null, ` +
        `constraint "product_watch_pkey" primary key ("id"));`
    )
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_product_watch_deleted_at" ON "product_watch" ("deleted_at") WHERE deleted_at IS NULL;`
    )
    this.addSql(
      `CREATE UNIQUE INDEX IF NOT EXISTS "IDX_product_watch_product_id_unique" ON "product_watch" ("product_id") WHERE deleted_at IS NULL;`
    )
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_product_watch_next_discovery_at" ON "product_watch" ("next_discovery_at");`
    )
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "competitor_price" cascade;`)
    this.addSql(`drop table if exists "competitor_product" cascade;`)
    this.addSql(`drop table if exists "product_watch" cascade;`)
    this.addSql(`drop table if exists "competitor" cascade;`)
  }
}
