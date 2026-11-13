import repeat from "@lib/util/repeat"
import SkeletonProductPreview from "@modules/skeletons/components/skeleton-product-preview"

/** Loading stand-in for the PDP suggestion rail (eyebrow + h2 + one row). */
const SkeletonRelatedProducts = () => {
  return (
    <div>
      <div className="mb-6 flex flex-col gap-2 small:mb-7">
        <div className="h-3 w-24 animate-pulse rounded-pill bg-grey-10" />
        <div className="h-7 w-72 max-w-full animate-pulse rounded-pill bg-grey-10" />
      </div>
      <ul className="grid grid-cols-2 gap-x-3 gap-y-4 small:grid-cols-4 small:gap-x-6 small:gap-y-8">
        {repeat(4).map((index) => (
          <li key={index} className={index >= 2 ? "hidden small:block" : undefined}>
            <SkeletonProductPreview />
          </li>
        ))}
      </ul>
    </div>
  )
}

export default SkeletonRelatedProducts
