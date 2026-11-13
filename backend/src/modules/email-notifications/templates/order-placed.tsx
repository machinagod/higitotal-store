import { Text, Section, Hr } from '@react-email/components'
import * as React from 'react'
import { Base } from './base'
import { OrderDTO, OrderAddressDTO } from '@medusajs/framework/types'

export const ORDER_PLACED = 'order-placed'

interface OrderPlacedPreviewProps {
  order: OrderDTO & { display_id: string; summary: { raw_current_order_total: { value: number } } }
  shippingAddress: OrderAddressDTO
}

export interface OrderPlacedTemplateProps {
  order: OrderDTO & { display_id: string; summary: { raw_current_order_total: { value: number } } }
  shippingAddress: OrderAddressDTO
  preview?: string
}

export const isOrderPlacedTemplateData = (data: any): data is OrderPlacedTemplateProps =>
  typeof data.order === 'object' && typeof data.shippingAddress === 'object'

/** pt-PT money, e.g. "45,00 €". Falls back to "45 EUR" for odd inputs. */
export const formatMoney = (value: unknown, currency?: string | null): string => {
  const n = Number(value)
  const code = (currency || 'eur').toUpperCase()
  if (!Number.isFinite(n)) return `${value ?? ''} ${code}`.trim()
  try {
    return new Intl.NumberFormat('pt-PT', { style: 'currency', currency: code }).format(n)
  } catch {
    return `${n} ${code}`
  }
}

/** pt-PT date, e.g. "13/11/2026". */
export const formatDate = (value: unknown): string => {
  const d = new Date(value as string)
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString('pt-PT')
}

/**
 * Order confirmation (pt-PT). Dormant while the storefront runs in catalog
 * mode (no cart/checkout), but kept correct for when sales are enabled.
 */
export const OrderPlacedTemplate: React.FC<OrderPlacedTemplateProps> & {
  PreviewProps: OrderPlacedPreviewProps
} = ({ order, shippingAddress, preview = 'Obrigado pela sua encomenda.' }) => {
  const name = [shippingAddress.first_name, shippingAddress.last_name].filter(Boolean).join(' ')
  return (
    <Base preview={preview}>
      <Section>
        <Text style={{ fontSize: '24px', fontWeight: 'bold', textAlign: 'center', margin: '0 0 30px' }}>
          Confirmação de encomenda
        </Text>

        <Text style={{ margin: '0 0 15px' }}>
          {name ? `Olá, ${name}.` : 'Olá.'}
        </Text>

        <Text style={{ margin: '0 0 30px' }}>
          Obrigado pela sua encomenda. Estes são os detalhes:
        </Text>

        <Text style={{ fontSize: '18px', fontWeight: 'bold', margin: '0 0 10px' }}>
          Resumo da encomenda
        </Text>
        <Text style={{ margin: '0 0 5px' }}>
          N.º da encomenda: {order.display_id}
        </Text>
        <Text style={{ margin: '0 0 5px' }}>
          Data: {formatDate(order.created_at)}
        </Text>
        <Text style={{ margin: '0 0 20px' }}>
          Total: {formatMoney(order.summary.raw_current_order_total.value, order.currency_code)}
        </Text>

        <Hr style={{ margin: '20px 0' }} />

        <Text style={{ fontSize: '18px', fontWeight: 'bold', margin: '0 0 10px' }}>
          Morada de entrega
        </Text>
        <Text style={{ margin: '0 0 5px' }}>
          {shippingAddress.address_1}
        </Text>
        <Text style={{ margin: '0 0 5px' }}>
          {[shippingAddress.postal_code, shippingAddress.city].filter(Boolean).join(' ')}
          {shippingAddress.province ? `, ${shippingAddress.province}` : ''}
        </Text>
        <Text style={{ margin: '0 0 20px' }}>
          {(shippingAddress.country_code ?? '').toUpperCase()}
        </Text>

        <Hr style={{ margin: '20px 0' }} />

        <Text style={{ fontSize: '18px', fontWeight: 'bold', margin: '0 0 15px' }}>
          Artigos
        </Text>

        <div style={{
          width: '100%',
          borderCollapse: 'collapse',
          border: '1px solid #ddd',
          margin: '10px 0'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            backgroundColor: '#f2f2f2',
            padding: '8px',
            borderBottom: '1px solid #ddd'
          }}>
            <Text style={{ fontWeight: 'bold' }}>Artigo</Text>
            <Text style={{ fontWeight: 'bold' }}>Quantidade</Text>
            <Text style={{ fontWeight: 'bold' }}>Preço</Text>
          </div>
          {order.items.map((item) => (
            <div key={item.id} style={{
              display: 'flex',
              justifyContent: 'space-between',
              padding: '8px',
              borderBottom: '1px solid #ddd'
            }}>
              <Text>{item.product_title}{item.title && item.title !== item.product_title ? ` — ${item.title}` : ''}</Text>
              <Text>{item.quantity}</Text>
              <Text>{formatMoney(item.unit_price, order.currency_code)}</Text>
            </div>
          ))}
        </div>

        <Text style={{ margin: '20px 0 0', color: '#666666', fontSize: '12px' }}>
          Higitotal — Sistemas e Produtos de Higiene, Lda. · +351 278 262 913 (chamada para a rede fixa nacional)
        </Text>
      </Section>
    </Base>
  )
}

OrderPlacedTemplate.PreviewProps = {
  order: {
    id: 'test-order-id',
    display_id: 'ORD-123',
    created_at: new Date().toISOString(),
    email: 'cliente@exemplo.pt',
    currency_code: 'EUR',
    items: [
      { id: 'item-1', title: '5 L', product_title: 'Detergente multiusos', quantity: 2, unit_price: 10 },
      { id: 'item-2', title: 'Caixa', product_title: 'Luvas de nitrilo', quantity: 1, unit_price: 25 }
    ],
    shipping_address: {
      first_name: 'Ana',
      last_name: 'Silva',
      address_1: 'Rua Exemplo, 1',
      city: 'Mirandela',
      province: 'Bragança',
      postal_code: '5370-000',
      country_code: 'pt'
    },
    summary: { raw_current_order_total: { value: 45 } }
  },
  shippingAddress: {
    first_name: 'Ana',
    last_name: 'Silva',
    address_1: 'Rua Exemplo, 1',
    city: 'Mirandela',
    province: 'Bragança',
    postal_code: '5370-000',
    country_code: 'pt'
  }
} as OrderPlacedPreviewProps

export default OrderPlacedTemplate
