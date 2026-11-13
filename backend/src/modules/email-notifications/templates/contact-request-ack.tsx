import { Section, Text, Hr, Link } from '@react-email/components'
import { Base } from './base'
import {
  COMPANY_INFO,
  ContactRequestKind,
  QuoteItem,
  buildAckParagraphs,
  quoteItemLabel,
  unitsLabel,
} from '../contact-request-copy'

export const CONTACT_REQUEST_ACK = 'contact-request-ack'

export interface ContactRequestAckEmailProps {
  /** Customer name */
  name: string
  kind: ContactRequestKind
  /** Product the enquiry was about (product enquiries only) */
  productTitle?: string
  /** Quote list lines the customer sent (no links) */
  items?: Omit<QuoteItem, 'url'>[]
  preview?: string
}

export const isContactRequestAckData = (data: any): data is ContactRequestAckEmailProps =>
  typeof data?.name === 'string' && typeof data?.kind === 'string'

/** Customer acknowledgement sent after a contact/enquiry/assistance request. */
export const ContactRequestAckEmail = ({
  name,
  kind,
  productTitle,
  items,
  preview = 'Recebemos o seu pedido',
}: ContactRequestAckEmailProps) => {
  const quote = kind === 'produto' && items?.length ? items : undefined
  const [greeting, ...body] = buildAckParagraphs({
    name,
    kind,
    productTitle,
    itemCount: quote?.length,
  })
  const [thanks, ...rest] = body
  return (
    <Base preview={preview}>
      <Section className="mt-[16px]">
        <Text className="text-[#00adef] text-[13px] font-bold uppercase tracking-[1px] m-0">
          Higitotal
        </Text>
        <Text className="text-black text-[18px] font-semibold">Recebemos o seu pedido</Text>
        <Text className="text-black text-[14px] leading-[22px]">{greeting}</Text>
        <Text className="text-black text-[14px] leading-[22px]">{thanks}</Text>
        {quote ? (
          <table
            width="100%"
            cellPadding={0}
            cellSpacing={0}
            role="presentation"
            className="w-full border-collapse mb-[8px]"
            data-testid="ack-items"
          >
            <tbody>
              {quote.map((item, i) => (
                <tr key={`${item.sku ?? ''}-${i}`}>
                  <td className="align-top text-[14px] leading-[20px] text-black border-0 border-b border-solid border-[#eeeeee] py-[7px] pr-[8px]">
                    <strong>{quoteItemLabel(item)}</strong>
                    {item.sku ? (
                      <span className="text-[#666666] text-[12px]"> · Ref.ª {item.sku}</span>
                    ) : null}
                    {item.note ? (
                      <>
                        <br />
                        <span className="text-[#555555] text-[12px]">Nota: {item.note}</span>
                      </>
                    ) : null}
                  </td>
                  <td className="align-top text-right whitespace-nowrap text-[14px] leading-[20px] font-semibold text-black border-0 border-b border-solid border-[#eeeeee] py-[7px]">
                    {unitsLabel(item.quantity)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : null}
        {rest.map((p) => (
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
