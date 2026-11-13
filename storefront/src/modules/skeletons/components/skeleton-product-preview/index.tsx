/**
 * Loading stand-in for a product card — same frame, square image tile,
 * reserved eyebrow line, title and (outline) CTA, so nothing jumps on load.
 */
const SkeletonProductPreview = () => {
  return (
    <div className="flex h-full animate-pulse flex-col rounded-card border border-hairline bg-white p-2.5 xsmall:p-3 small:p-4">
      <div className="mb-3 aspect-square w-full rounded-btn bg-[#f5f7f9] small:mb-3.5" />
      <div className="mb-1 h-[26px] min-[380px]:h-[13px] small:mb-1.5">
        <div className="h-2.5 w-1/3 rounded-pill bg-grey-10" />
      </div>
      <div className="mb-1.5 h-3.5 w-full rounded-pill bg-grey-10" />
      <div className="h-3.5 w-2/3 rounded-pill bg-grey-10" />
      <div className="mt-5 h-11 w-full rounded-pill border-[1.5px] border-grey-10" />
    </div>
  )
}

export default SkeletonProductPreview
