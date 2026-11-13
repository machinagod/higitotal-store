import { Button, Link, Section, Text, Hr } from '@react-email/components'
import { Base } from './base'

/**
 * The key for the InviteUserEmail template, used to identify it
 */
export const INVITE_USER = 'invite-user'

/**
 * The props for the InviteUserEmail template
 */
export interface InviteUserEmailProps {
  /**
   * The link that the user can click to accept the invitation
   */
  inviteLink: string
  /**
   * The preview text for the email, appears next to the subject
   * in mail providers like Gmail
   */
  preview?: string
}

/**
 * Type guard for checking if the data is of type InviteUserEmailProps
 * @param data - The data to check
 */
export const isInviteUserData = (data: any): data is InviteUserEmailProps =>
  typeof data.inviteLink === 'string' && (typeof data.preview === 'string' || !data.preview)

/**
 * Admin invitation e-mail (pt-PT, Higitotal branding).
 */
export const InviteUserEmail = ({
  inviteLink,
  preview = 'Foi convidado(a) para administrar a loja Higitotal',
}: InviteUserEmailProps) => {
  return (
    <Base preview={preview}>
      <Section className="mt-[24px] text-center">
        <Text className="text-[#00adef] text-[20px] font-extrabold tracking-[-0.5px] m-0">
          Higitotal
        </Text>
      </Section>
      <Section className="text-center">
        <Text className="text-black text-[14px] leading-[24px]">
          Foi convidado(a) para administrar a loja <strong>Higitotal</strong>.
        </Text>
        <Section className="mt-4 mb-[32px]">
          <Button
            className="bg-[#00adef] rounded text-white text-[12px] font-semibold no-underline px-5 py-3"
            href={inviteLink}
          >
            Aceitar convite
          </Button>
        </Section>
        <Text className="text-black text-[14px] leading-[24px]">
          Ou copie e cole este endereço no seu navegador:
        </Text>
        <Text style={{
          maxWidth: '100%',
          wordBreak: 'break-all',
          overflowWrap: 'break-word'
        }}>
          <Link
            href={inviteLink}
            className="text-[#0094cc] no-underline"
          >
            {inviteLink}
          </Link>
        </Text>
      </Section>
      <Hr className="border border-solid border-[#eaeaea] my-[26px] mx-0 w-full" />
      <Text className="text-[#666666] text-[12px] leading-[24px]">
        Se não esperava este convite, pode ignorar este e-mail. O convite expira
        automaticamente ao fim de 24 horas. Se tiver alguma preocupação com a
        segurança da sua conta, responda a este e-mail.
      </Text>
    </Base>
  )
}

InviteUserEmail.PreviewProps = {
  inviteLink: 'https://storeadmin.higitotal.pt/app/invite?token=abc123'
} as InviteUserEmailProps

export default InviteUserEmail
