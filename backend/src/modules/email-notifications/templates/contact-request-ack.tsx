import { Section, Text, Hr, Link } from '@react-email/components'
import { Base } from './base'
import { COMPANY_INFO, ContactRequestKind, buildAckParagraphs } from '../contact-request-copy'

export const CONTACT_REQUEST_ACK = 'contact-request-ack'

export interface ContactRequestAckEmailProps {
  /** Customer name */
  name: string
  kind: ContactRequestKind
  /** Product the enquiry was about (product enquiries only) */
  productTitle?: string
  preview?: string
}

export const isContactRequestAckData = (data: any): data is ContactRequestAckEmailProps =>
  typeof data?.name === 'string' && typeof data?.kind === 'string'

/** Customer acknowledgement sent after a contact/enquiry/assistance request. */
export const ContactRequestAckEmail = ({
  name,
  kind,
  productTitle,
  preview = 'Recebemos o seu pedido',
}: ContactRequestAckEmailProps) => {
  const [greeting, ...body] = buildAckParagraphs({ name, kind, productTitle })
  return (
    <Base preview={preview}>
      <Section className="mt-[16px]">
        <Text className="text-[#00adef] text-[13px] font-bold uppercase tracking-[1px] m-0">
          Higitotal
        </Text>
        <Text className="text-black text-[18px] font-semibold">Recebemos o seu pedido</Text>
        <Text className="text-black text-[14px] leading-[22px]">{greeting}</Text>
        {body.map((p) => (
          <Text key={p} className="text-black text-[14px] leading-[22px]">
            {p}
          </Text>
        ))}
        <Text className="text-black text-[14px] leading-[22px]">
          Com os melhores cumprimentos,
          <br />
          Equipa Higitotal
        </Text>
      </Section>
      <Hr className="border border-solid border-[#eaeaea] my-[20px] mx-0 w-full" />
      <Section>
        <Text className="text-[#666666] text-[12px] leading-[18px] m-0">
          {COMPANY_INFO.legalName}
          <br />
          {COMPANY_INFO.address}
          <br />
          NIPC {COMPANY_INFO.nipc} · {COMPANY_INFO.phone} ({COMPANY_INFO.phoneCostNote})
          <br />
          <Link href={`mailto:${COMPANY_INFO.email}`} className="text-[#0094cc]">
            {COMPANY_INFO.email}
          </Link>{' '}
          ·{' '}
          <Link href={COMPANY_INFO.website} className="text-[#0094cc]">
            higitotal.pt
          </Link>
        </Text>
        <Text className="text-[#999999] text-[11px] leading-[16px] mt-[12px]">
          Recebeu este e-mail porque enviou um pedido através do site Higitotal.
        </Text>
      </Section>
    </Base>
  )
}

ContactRequestAckEmail.PreviewProps = {
  name: 'João Silva',
  kind: 'produto',
  productTitle: 'Drip Floor (2L)',
} as ContactRequestAckEmailProps

export default ContactRequestAckEmail
