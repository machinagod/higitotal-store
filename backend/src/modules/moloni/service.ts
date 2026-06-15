import { Logger } from "@medusajs/framework/types"
import { createMoloniClient, MoloniClient } from "./client"
import { MoloniCategory, MoloniCustomer, MoloniProduct } from "./types"

type InjectedDependencies = {
  logger: Logger
}

export interface MoloniModuleOptions {
  clientId: string
  clientSecret: string
  username: string
  password: string
  companyId: number
  sandbox?: boolean
}

const PAGE_SIZE = 50

/**
 * MoloniModuleService — wraps the Moloni API client and exposes high-level,
 * fully-paginated readers for the entities the bridge imports. No Medusa
 * writes happen here; this module is purely the Moloni data source.
 */
export default class MoloniModuleService {
  static identifier = "moloni"

  protected readonly logger_: Logger
  protected readonly client_: MoloniClient
  protected readonly companyId_: number

  constructor({ logger }: InjectedDependencies, options: MoloniModuleOptions) {
    this.logger_ = logger

    const missing = (["clientId", "clientSecret", "username", "password"] as const).filter(
      (k) => !options?.[k]
    )
    if (missing.length || !options?.companyId) {
      throw new Error(
        `Moloni module misconfigured. Missing: ${[
          ...missing,
          options?.companyId ? null : "companyId",
        ]
          .filter(Boolean)
          .join(", ")}`
      )
    }

    this.companyId_ = options.companyId
    this.client_ = createMoloniClient(
      {
        clientId: options.clientId,
        clientSecret: options.clientSecret,
        username: options.username,
        password: options.password,
      },
      options.companyId,
      options.sandbox
    )
  }

  get companyId(): number {
    return this.companyId_
  }

  /** Raw client escape hatch (e.g. for ad-hoc endpoints). */
  get client(): MoloniClient {
    return this.client_
  }

  /**
   * Full category tree. Moloni's productCategories/getAll is scoped by
   * parent_id, so we breadth-first traverse from the root (parent_id: 0).
   */
  async listAllCategories(): Promise<MoloniCategory[]> {
    const all: MoloniCategory[] = []
    const queue: number[] = [0]
    const seenParents = new Set<number>()

    while (queue.length) {
      const parentId = queue.shift()!
      if (seenParents.has(parentId)) continue
      seenParents.add(parentId)

      let offset = 0
      // paginate this level
      // eslint-disable-next-line no-constant-condition
      while (true) {
        const page = await this.client_.productCategories<MoloniCategory[]>(
          "getAll",
          { parent_id: parentId, offset }
        )
        if (!Array.isArray(page) || page.length === 0) break
        for (const cat of page) {
          all.push(cat)
          if ((cat.num_categories ?? 0) > 0) queue.push(cat.category_id)
        }
        if (page.length < PAGE_SIZE) break
        offset += PAGE_SIZE
      }
    }

    this.logger_.info(`[moloni] fetched ${all.length} categories`)
    return all
  }

  /** All products, paginated. `limit` caps the total (for dry-runs / testing). */
  async listAllProducts(limit?: number): Promise<MoloniProduct[]> {
    const all: MoloniProduct[] = []
    let offset = 0
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const page = await this.client_.products<MoloniProduct[]>("getAll", {
        qty: PAGE_SIZE,
        offset,
        with_invisible: 1,
      })
      if (!Array.isArray(page) || page.length === 0) break
      all.push(...page)
      if (limit && all.length >= limit) return all.slice(0, limit)
      if (page.length < PAGE_SIZE) break
      offset += PAGE_SIZE
    }
    this.logger_.info(`[moloni] fetched ${all.length} products`)
    return all
  }

  /** All customers, paginated. */
  async listAllCustomers(limit?: number): Promise<MoloniCustomer[]> {
    const all: MoloniCustomer[] = []
    let offset = 0
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const page = await this.client_.customers<MoloniCustomer[]>("getAll", {
        qty: PAGE_SIZE,
        offset,
      })
      if (!Array.isArray(page) || page.length === 0) break
      all.push(...page)
      if (limit && all.length >= limit) return all.slice(0, limit)
      if (page.length < PAGE_SIZE) break
      offset += PAGE_SIZE
    }
    this.logger_.info(`[moloni] fetched ${all.length} customers`)
    return all
  }
}
