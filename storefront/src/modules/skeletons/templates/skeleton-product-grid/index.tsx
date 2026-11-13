import repeat from "@lib/util/repeat"
import SkeletonProductPreview from "@modules/skeletons/components/skeleton-product-preview"

const SkeletonProductGrid = () => {
  return (
    <div className="flex-1" data-testid="products-list-loader">
      <div className="mb-4 h-4 w-28 animate-pulse rounded-pill bg-grey-10" />
      <ul className="grid grid-cols-2 gap-x-3 gap-y-4 small:grid-cols-3 small:gap-x-6 small:gap-y-8 medium:grid-cols-4">
        {repeat(8).map((index) => (
          <li key={index}>
            <SkeletonProductPreview />
          </li>
        ))}
      </ul>
    </div>
  )
}

export default SkeletonProductGrid
