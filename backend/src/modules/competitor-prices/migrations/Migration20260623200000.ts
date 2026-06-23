import { Migration } from "@medusajs/framework/mikro-orm/migrations"

export class Migration20260623200000 extends Migration {
  override async up(): Promise<void> {
    this.addSql(
      `alter table if exists "competitor_product" add column if not exists "pack_units" integer not null default 1;`
    )
    this.addSql(
      `alter table if exists "competitor_product" add column if not exists "pack_label" text null;`
    )
    this.addSql(
      `alter table if exists "competitor_product" add column if not exists "last_status" text null;`
    )
    this.addSql(
      `alter table if exists "competitor_product" add column if not exists "last_error" text null;`
    )
    this.addSql(
      `alter table if exists "competitor_price" add column if not exists "unit_price" integer null;`
    )
    this.addSql(
      `alter table if exists "competitor_price" add column if not exists "our_price" integer null;`
    )
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "competitor_product" drop column if exists "pack_units";`)
    this.addSql(`alter table if exists "competitor_product" drop column if exists "pack_label";`)
    this.addSql(`alter table if exists "competitor_product" drop column if exists "last_status";`)
    this.addSql(`alter table if exists "competitor_product" drop column if exists "last_error";`)
    this.addSql(`alter table if exists "competitor_price" drop column if exists "unit_price";`)
    this.addSql(`alter table if exists "competitor_price" drop column if exists "our_price";`)
  }
}
