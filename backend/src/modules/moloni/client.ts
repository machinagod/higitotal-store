/**
 * Moloni HTTP client (Node).
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * SWAP POINT
 * ─────────────────────────────────────────────────────────────────────────────
 * This is a self-contained Node port of the Higitotal Deno Moloni SDK
 * (utils/moloni-client/src/base.ts + endpoint mixins). It exists so the bridge
 * works today without waiting on packaging.
 *
 * When the dedicated `moloni-client` npm package is published, replace the body
 * of `createMoloniClient()` with:
 *
 *     import Moloni from "moloni-client"
 *     return new Moloni(creds).setCompanyId(companyId)
 *
 * The method surface used by the sync (`products`, `productCategories`,
 * `productStocks`, `customers`, `companies`, `setCompanyId`) is identical, so no
 * other file needs to change.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Auth: OAuth2 password grant against https://api.moloni.pt/v1/grant.
 * Tokens are cached in memory and refreshed shortly before expiry.
 */

import { MoloniCredentials } from "./types"

const API_BASE_URL = "https://api.moloni.pt"
const API_URL = `${API_BASE_URL}/v1`
const SANDBOX_URL = `${API_BASE_URL}/sandbox`

interface AuthResponse {
  access_token: string
  refresh_token: string
  expires_in: number
  token_type: string
}

export interface MoloniClientOptions extends MoloniCredentials {
  sandbox?: boolean
}

function toQueryString(
  params: Record<string, string | number | boolean | undefined>
): string {
  const entries = Object.entries(params)
    .filter(([, v]) => v !== undefined)
    .map(([k, v]) => [k, String(v)] as [string, string])
  const search = new URLSearchParams(entries).toString()
  return search ? `?${search}` : ""
}

export class MoloniClient {
  private companyId?: number
  private credentials?: AuthResponse
  private credentialsExpiresAt?: Date
  private authPromise?: Promise<AuthResponse>

  constructor(private readonly options: MoloniClientOptions) {}

  setCompanyId(id: number): this {
    this.companyId = id
    return this
  }

  private get apiUrl(): string {
    return this.options.sandbox ? SANDBOX_URL : API_URL
  }

  /**
   * Core request. Mirrors the SDK guard: write endpoints (insert/update) are
   * refused unless status === 0 (draft), so a read-only sync can never
   * accidentally publish documents in Moloni.
   */
  async request<T>(
    endpoint: string,
    params: Record<string, any> = {}
  ): Promise<T> {
    const isWrite =
      endpoint.endsWith("/insert/") || endpoint.endsWith("/update/")
    if (isWrite && "status" in params && params.status !== 0) {
      throw new Error(
        `Moloni write blocked: status must be 0 (draft), got ${params.status}`
      )
    }

    await this.ensureAuthenticated()

    const url =
      this.apiUrl +
      endpoint +
      toQueryString({
        access_token: this.credentials?.access_token,
        human_errors: true,
        json: true,
      })

    const body = JSON.stringify({ company_id: this.companyId, ...params })

    const response = await fetch(url, {
      method: "POST",
      body,
      headers: { "Content-Type": "application/json" },
    })

    if (!response.ok) {
      const err: any = await response.json().catch(() => ({}))
      throw new Error(
        err.error_description ||
          err.message ||
          `Moloni request to ${endpoint} failed (${response.status})`
      )
    }
    return (await response.json()) as T
  }

  private ensureAuthenticated(): Promise<AuthResponse> {
    const fresh =
      this.credentials?.access_token &&
      this.credentialsExpiresAt &&
      this.credentialsExpiresAt > new Date()
    if (fresh) {
      return Promise.resolve(this.credentials!)
    }
    if (!this.authPromise) {
      this.authPromise = this.authenticate().finally(() => {
        this.authPromise = undefined
      })
    }
    return this.authPromise
  }

  async authenticate(): Promise<AuthResponse> {
    const url =
      `${this.apiUrl}/grant` +
      toQueryString({
        grant_type: "password",
        client_id: this.options.clientId,
        client_secret: this.options.clientSecret,
        username: this.options.username,
        password: this.options.password,
      })

    const response = await fetch(url, {
      method: "GET",
      headers: { Accept: "*/*" },
    })
    if (!response.ok) {
      const err: any = await response.json().catch(() => ({}))
      throw new Error(
        err.error_description ||
          `Moloni authentication failed (${response.status})`
      )
    }
    const credentials = (await response.json()) as AuthResponse
    this.credentials = credentials
    const marginSeconds = 30
    this.credentialsExpiresAt = new Date(
      Date.now() + (credentials.expires_in - marginSeconds) * 1000
    )
    return credentials
  }

  // ── Endpoint helpers (mirror the SDK mixin surface) ──────────────────────

  products<T = any>(request: string, params?: Record<string, any>): Promise<T> {
    return this.request<T>(`/products/${request}/`, params)
  }

  productCategories<T = any>(
    request: string,
    params?: Record<string, any>
  ): Promise<T> {
    return this.request<T>(`/productCategories/${request}/`, params)
  }

  productStocks<T = any>(
    request: string,
    params?: Record<string, any>
  ): Promise<T> {
    return this.request<T>(`/productStocks/${request}/`, params)
  }

  customers<T = any>(
    request: string,
    params?: Record<string, any>
  ): Promise<T> {
    return this.request<T>(`/customers/${request}/`, params)
  }

  companies<T = any>(
    request: string,
    params?: Record<string, any>
  ): Promise<T> {
    return this.request<T>(`/companies/${request}/`, params)
  }
}

/** Factory — the single place to swap in the published package. */
export function createMoloniClient(
  creds: MoloniCredentials,
  companyId: number,
  sandbox = false
): MoloniClient {
  return new MoloniClient({ ...creds, sandbox }).setCompanyId(companyId)
}
