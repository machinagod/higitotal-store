import { Button, Link, Section, Text, Hr } from '@react-email/components'
import { Base } from './base'

/**
 * The key for the ResetPasswordEmail template
 */
export const RESET_PASSWORD = 'reset-password'

export interface ResetPasswordEmailProps {
  /** Link to the page where the new password is set (contains the one-time token). */
  resetLink: string
  /** The account's e-mail, shown for clarity. */
  email: string
  preview?: string
}

/**
 * Type guard for ResetPasswordEmailProps
 */
export const isResetPasswordData = (data: any): data is ResetPasswordEmailProps =>
  !!data &&
  typeof data.resetLink === 'string' &&
  typeof data.email === 'string' &&
  (typeof data.preview === 'string' || !data.preview)

/**
 * Password reset e-mail (pt-PT, Higitotal branding) — admin users.
 */
export const ResetPasswordEmail = ({
  resetLink,
  email,
  preview = 'Redefinir a palavra-passe da sua conta Higitotal',
}: ResetPasswordEmailProps) => {
  return (
    <Base preview={preview}>
      <Section className="mt-[24px] text-center">
        <Text className="text-[#00adef] text-[20px] font-extrabold tracking-[-0.5px] m-0">
          Higitotal
        </Text>
      </Section>
      <Section className="text-center">
        <Text className="text-black text-[14px] leading-[24px]">
          Recebemos um pedido para redefinir a palavra-passe da conta{' '}
          <strong>{email}</strong>.
        </Text>
        <Section className="mt-4 mb-[32px]">
          <Button
            className="bg-[#00adef] rounded text-white text-[12px] font-semibold no-underline px-5 py-3"
            href={resetLink}
          >
            Redefinir palavra-passe
          </Button>
        </Section>
        <Text className="text-black text-[14px] leading-[24px]">
          Ou copie e cole este endereço no seu navegador:
        </Text>
        <Text style={{ maxWidth: '100%', wordBreak: 'break-all', overflowWrap: 'break-word' }}>
          <Link href={resetLink} className="text-[#0094cc] no-underline">
            {resetLink}
          </Link>
        </Text>
      </Section>
      <Hr className="border border-solid border-[#eaeaea] my-[26px] mx-0 w-full" />
      <Text className="text-[#666666] text-[12px] leading-[24px]">
        O link é válido por pouco tempo e só pode ser usado uma vez. Se não
        pediu esta alteração, ignore este e-mail: a sua palavra-passe mantém-se.
      </Text>
    </Base>
  )
}

ResetPasswordEmail.PreviewProps = {
  resetLink: 'https://storeadmin.higitotal.pt/app/reset-password?token=abc&email=nome%40empresa.pt',
  email: 'nome@empresa.pt',
} as ResetPasswordEmailProps

export default ResetPasswordEmail
