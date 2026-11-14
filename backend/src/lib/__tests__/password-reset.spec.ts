import { adminResetLink, passwordResetEmail } from '../password-reset'

describe('password reset e-mail', () => {
  it('builds the admin dashboard reset link with token and e-mail', () => {
    expect(adminResetLink('https://storeadmin.higitotal.pt/', 'tok.en+1', 'a+b@x.pt')).toBe(
      'https://storeadmin.higitotal.pt/app/reset-password?token=tok.en%2B1&email=a%2Bb%40x.pt'
    )
  })

  it('mails admin users', () => {
    expect(
      passwordResetEmail(
        { entity_id: ' rui@higitotal.pt ', actor_type: 'user', token: 't' },
        'https://storeadmin.higitotal.pt'
      )
    ).toEqual({
      to: 'rui@higitotal.pt',
      resetLink: 'https://storeadmin.higitotal.pt/app/reset-password?token=t&email=rui%40higitotal.pt',
    })
  })

  it('skips customers (no storefront reset page) and malformed events', () => {
    const url = 'https://x'
    expect(passwordResetEmail({ entity_id: 'c@x.pt', actor_type: 'customer', token: 't' }, url)).toBeNull()
    expect(passwordResetEmail({ entity_id: '', actor_type: 'user', token: 't' }, url)).toBeNull()
    expect(passwordResetEmail({ entity_id: 'a@x.pt', actor_type: 'user' }, url)).toBeNull()
    expect(passwordResetEmail({}, url)).toBeNull()
  })
})
