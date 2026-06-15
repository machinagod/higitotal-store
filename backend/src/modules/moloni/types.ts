/**
 * Moloni API types — the subset the Medusa bridge consumes.
 *
 * Mirrors the shapes from the Higitotal Deno Moloni SDK
 * (utils/moloni-client/src/**\/types) so that, when the dedicated
 * `moloni-client` npm package is published, these can be replaced by a direct
 * import with no change to the sync logic.
 */

export interface MoloniCredentials {
  clientId: string
  clientSecret: string
  username: string
  password: string
}

/** Moloni product category (productCategories/getAll). */
export interface MoloniCategory {
  category_id: number
  parent_id: number
  name: string
  description: string
  pos_enabled?: number
  image?: string
  num_categories?: number
  num_products?: number
}

export interface MoloniTax {
  tax_id: number
  name: string
  value: number // percentage, e.g. 23
  vat_type?: string
}

export interface MoloniPriceClassEntry {
  product_price_class_id: number
  price_class_id: number
  value: number
  price_class: {
    price_class_id: number
    title: string // e.g. "PVP1"
  }
}

export interface MoloniSupplier {
  product_id: number
  supplier_id: number
  cost_price: number
  comercial_discount?: number
  financial_discount?: number
  cost_price_discounted?: number
  reference?: string
}

export interface MoloniWarehouseStock {
  product_id: number
  warehouse_id: number
  stock: number
  minimum_stock?: number
}

/** Moloni product (products/getAll). */
export interface MoloniProduct {
  product_id: number
  category_id: number
  type: number
  name: string
  summary?: string
  reference: string
  ean?: string
  price: number
  unit_id?: number
  has_stock: 0 | 1
  stock: number
  image?: string
  minimum_stock?: number
  warehouse_id?: number
  visibility_id?: number
  created?: string
  category?: {
    category_id: number
    parent_id: number
    name: string
  }
  taxes?: { tax_id: number; value: number; tax: MoloniTax }[]
  price_classes?: MoloniPriceClassEntry[]
  suppliers?: MoloniSupplier[]
  warehouses?: MoloniWarehouseStock[]
}

/** Moloni customer (customers/getAll). */
export interface MoloniCustomer {
  customer_id: number
  number: string
  name: string
  vat?: string
  address?: string
  city?: string
  zip_code?: string
  country_id?: number
  email?: string
  website?: string
  phone?: string
  contact_name?: string
  contact_email?: string
  contact_phone?: string
  notes?: string
  language_id?: number
  country?: {
    country_id: number
    iso_3166_1: string
    name: string
  }
}
