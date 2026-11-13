import { PUBLIC_SITE_ORIGINS, withOrigins } from '../cors'

describe('withOrigins', () => {
  it('adds the public site origins to the env value', () => {
    expect(withOrigins('https://store.higitotal.pt')).toBe(
      'https://store.higitotal.pt,https://www.higitotal.pt,https://higitotal.pt'
    )
  })

  it('keeps env entries first and de-duplicates (trailing slash ignored)', () => {
    expect(withOrigins('http://localhost:8000, https://www.higitotal.pt/')).toBe(
      'http://localhost:8000,https://www.higitotal.pt/,https://higitotal.pt,https://store.higitotal.pt'
    )
  })

  it('leaves an unset or blank value unset (Medusa default applies)', () => {
    expect(withOrigins(undefined)).toBeUndefined()
    expect(withOrigins('  ')).toBeUndefined()
  })

  it('lists www, the bare domain and store', () => {
    expect(PUBLIC_SITE_ORIGINS).toEqual([
      'https://www.higitotal.pt',
      'https://higitotal.pt',
      'https://store.higitotal.pt',
    ])
  })
})
