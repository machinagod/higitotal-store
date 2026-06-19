import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260619135739 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table if not exists "product_attribute" ("id" text not null, "product_id" text not null, "kind" text not null, "label" text null, "value" text not null, "unit" text null, "rank" integer not null default 0, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "product_attribute_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_product_attribute_deleted_at" ON "product_attribute" ("deleted_at") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_product_attribute_product_id" ON "product_attribute" ("product_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_product_attribute_product_id_kind" ON "product_attribute" ("product_id", "kind") WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "product_attribute" cascade;`);
  }

}
