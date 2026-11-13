import { Section, Text, Hr, Link } from '@react-email/components'
import { Base } from './base'
import {
  ContactRequestKind,
  QuoteItem,
  STAFF_HEADINGS,
  STAFF_INTROS,
  contactPrefLabel,
  inferContactKind,
  productCountLabel,
  quoteItemLabel,
  staffQuoteHeading,
} from '../contact-request-copy'

export const CONTACT_REQUEST = 'contact-request'

export interface ContactRequestEmailProps {
  /** produto | assistencia | geral (inferred from the product fields when absent) */
  kind?: ContactRequestKind
  /** Customer name */
  name: string
  /** Customer email */
  email: string
  /** Customer phone (optional) */
  phone?: string
  /** Company (optional) */
  empresa?: string
  /** Town / postcode (optional) */
  localidade?: string
  /** Estimated quantity, free text (optional) */
  quantidadeEstimada?: string
  /** Preferred contact channel: "telefone" | "email" */
  contactPref?: string
  /** Free-text message (optional) */
  message?: string
  /** Product the request is about */
  productTitle?: string
  /** SKU/reference */
  sku?: string
  /** Cart quantity (non-catalog mode) */
  quantity?: number
  /** Absolute URL of the page the request was sent from */
  productUrl?: string
  /** Assistência: equipment model / serial number */
  modelo?: string
  /** Assistência: equipment stopped — highlighted at the top */
  urgente?: boolean
  /** Quote list lines (sanitised by the store route) */
  items?: QuoteItem[]
  preview?: string
}

export const isContactRequestData = (data: any): data is ContactRequestEmailProps =>
  typeof data?.name === 'string' && typeof data?.email === 'string'

const Row = ({ label, value }: { label: string; value?: string | number }) =>
  value === undefined || value === '' ? null : (
    <Text className="text-black text-[14px] leading-[22px] my-[2px]">
      <strong>{label}:</strong> {value}
    </Text>
  )

const Divider = () => <Hr className="border border-solid border-[#eaeaea] my-[16px] mx-0 w-full" />

const th = 'text-left text-[12px] leading-[16px] font-semibold text-[#555555] border-0 border-b border-solid border-[#dddddd] px-[6px] py-[6px]'
const td = 'align-top text-[13px] leading-[19px] text-black border-0 border-b border-solid border-[#eeeeee] px-[6px] py-[7px]'

/** Quote list as a table: Ref.ª · Produto (linked) · Quantidade · Nota. */
export const QuoteItemsTable = ({ items, linked = true }: { items: QuoteItem[]; linked?: boolean }) => (
  <table
    width="100%"
    cellPadding={0}
    cellSpacing={0}
    role="presentation"
    className="w-full border-collapse my-[4px]"
    data-testid="quote-items"
  >
    <thead>
      <tr>
        <th className={th}>Ref.ª</th>
        <th className={th}>Produto</th>
        <th className={`${th} text-right`}>Quantidade</th>
        <th className={th}>Nota</th>
      </tr>
    </thead>
    <tbody>
      {items.map((item, i) => (
        <tr key={`${item.sku ?? ''}-${i}`}>
          <td className={`${td} whitespace-nowrap`}>{item.sku ?? '—'}</td>
          <td className={td}>
            {linked && item.url ? (
              <Link href={item.url} className="text-[#0074b3] underline">
                {quoteItemLabel(item)}
              </Link>
            ) : (
              quoteItemLabel(item)
            )}
          </td>
          <td className={`${td} text-right whitespace-nowrap font-semibold`}>{item.quantity}</td>
          <td className={`${td} text-[#444444]`}>{item.note ?? ''}</td>
        </tr>
      ))}
    </tbody>
  </table>
)

export const ContactRequestEmail = ({
  kind,
  name,
  email,
  phone,
  empresa,
  localidade,
  quantidadeEstimada,
  contactPref,
  message,
  productTitle,
  sku,
  quantity,
  productUrl,
  modelo,
  urgente,
  items,
  preview,
}: ContactRequestEmailProps) => {
  const k = inferContactKind({ kind, productTitle, sku: sku ?? items?.[0]?.sku ?? items?.[0]?.title })
  const quote = items?.length ? items : undefined
  const heading = quote ? staffQuoteHeading(quote.length) : STAFF_HEADINGS[k]
  return (
    <Base preview={preview ?? heading}>
      <Section className="mt-[24px]">
        <Text className="text-black text-[18px] font-semibold">{heading}</Text>
        <Text className="text-[#666666] text-[13px] leading-[22px]">{STAFF_INTROS[k]}</Text>
        {urgente ? (
          <Text
            className="text-[#9a3412] bg-[#fff1e6] border border-solid border-[#ff7a1a] rounded-[6px] text-[14px] leading-[22px] px-[12px] py-[6px] my-[8px]"
          >
            <strong>Urgente:</strong> Sim — equipamento parado
          </Text>
        ) : null}
      </Section>
      <Divider />
      <Section>
        <Row label="Nome" value={name} />
        <Row label="Empresa" value={empresa} />
        <Row label="E-mail" value={email} />
        <Row label="Telefone" value={phone} />
        <Row label="Localidade" value={localidade} />
        <Row label="Contacto preferido" value={contactPrefLabel(contactPref)} />
      </Section>
      {modelo ? (
        <>
          <Divider />
          <Section>
            <Row label="Modelo / n.º de série" value={modelo} />
          </Section>
        </>
      ) : null}
      {quote ? (
        <>
          <Divider />
          <Section>
            <Text className="text-black text-[14px] leading-[22px] my-[2px]">
              <strong>Produtos pedidos ({productCountLabel(quote.length)}):</strong>
            </Text>
            <QuoteItemsTable items={quote} />
          </Section>
        </>
      ) : k === 'produto' ? (
        <>
          <Divider />
          <Section>
            <Row label="Produto" value={productTitle} />
            <Row label="Ref.ª" value={sku} />
            <Row label="Quantidade estimada" value={quantidadeEstimada} />
            <Row label="Quantidade (carrinho)" value={quantity} />
          </Section>
        </>
      ) : null}
      {message ? (
        <>
          <Divider />
          <Section>
            <Text className="text-black text-[14px] leading-[22px]">
              <strong>Mensagem:</strong>
            </Text>
            <Text className="text-black text-[14px] leading-[22px] whitespace-pre-line">
              {message}
            </Text>
          </Section>
        </>
      ) : null}
      {productUrl ? (
        <>
          <Divider />
          <Text className="text-[#666666] text-[13px] leading-[22px] my-[2px]">
            <strong>Página:</strong>{' '}
            <Link href={productUrl} className="text-[#0094cc] break-all">
              {productUrl}
            </Link>
          </Text>
        </>
      ) : null}
    </Base>
  )
}

ContactRequestEmail.PreviewProps = {
  kind: 'produto',
  name: 'João Silva',
  email: 'joao@exemplo.pt',
  phone: '+351 912 345 678',
  empresa: 'Hotel Exemplo',
  localidade: 'Mirandela',
  quantidadeEstimada: '20 caixas',
  contactPref: 'telefone',
  message: 'Gostaria de receber informação sobre preço, disponibilidade e condições deste produto.',
  productTitle: 'Suma Auto Oven 2em1 DA9.10 (2x5L)',
  sku: '100833185',
  productUrl: 'https://higitotal.pt/pt/products/100833185',
} as ContactRequestEmailProps

export default ContactRequestEmail
