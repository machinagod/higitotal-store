import { Text } from "@medusajs/ui"

import LocalizedClientLink from "@modules/common/components/localized-client-link"
import Thumbnail from "@modules/products/components/thumbnail"
import { Recommendation } from "@lib/data/recommendations"

type RecommendedForYouProps = {
  recommendations: Recommendation[]
}

// "Recommended for you" — the signed-in customer's reorder suggestions. Renders
// nothing when there are none (guest / unlinked customer / Twenty offline), so the
// account overview stays clean.
const RecommendedForYou = ({ recommendations }: RecommendedForYouProps) => {
  if (!recommendations?.length) {
    return null
  }

  return (
    <div
      className="flex flex-col gap-y-4 py-8 border-t border-gray-200"
      data-testid="recommended-for-you"
    >
      <h3 className="text-large-semi">Recomendados para si</h3>
      <Text className="text-base-regular text-ui-fg-subtle">
        Sugestões de reposição com base no seu histórico de compras.
      </Text>
      <ul className="grid grid-cols-2 small:grid-cols-4 gap-4">
        {recommendations.map((rec) => (
          <li key={rec.product_id}>
            <LocalizedClientLink
              href={`/products/${rec.handle}`}
              className="group flex flex-col gap-y-2"
              data-testid="recommendation-item"
              data-value={rec.reference ?? rec.product_id}
            >
              <Thumbnail thumbnail={rec.thumbnail} size="square" />
              <div className="flex flex-col">
                <Text className="text-ui-fg-base line-clamp-2 group-hover:text-ui-fg-interactive">
                  {rec.title}
                </Text>
                <Text className="text-small-regular text-ui-fg-subtle">
                  Qtd. sugerida: {rec.suggested_qty}
                </Text>
              </div>
            </LocalizedClientLink>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default RecommendedForYou
