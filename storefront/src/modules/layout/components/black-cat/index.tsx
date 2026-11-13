/**
 * Small black-cat silhouette shown beside "Mirandela" in the footer.
 *
 * The footer ground is near-black, so the solid black cat gets a hairline
 * outline in the muted footer tone (an SVG dilate filter around the whole
 * silhouette — one clean outer edge, no seams where head/body/tail overlap).
 */
const OUTLINE = "#8b95a1" // svc-fg-muted

export default function BlackCat({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 28 32" role="img" aria-label="Gato preto" className={className}>
      <defs>
        <filter id="ht-black-cat-outline" x="-25%" y="-25%" width="150%" height="150%">
          <feMorphology in="SourceAlpha" operator="dilate" radius="1.2" result="grown" />
          <feFlood floodColor={OUTLINE} />
          <feComposite in2="grown" operator="in" result="outline" />
          <feMerge>
            <feMergeNode in="outline" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <g filter="url(#ht-black-cat-outline)" fill="#000" stroke="#000" strokeLinecap="round" strokeLinejoin="round">
        {/* tail, curving up the left side */}
        <path d="M9 29.6C4.2 29.6 2.6 26 3.7 22.6c.7-2.2 2.3-3.1 3.2-4.6" fill="none" strokeWidth="2.4" />
        {/* body */}
        <path d="M7.6 30C6.9 23 9.1 16.4 14.6 14.4c5-1.6 8.6 3.4 8.6 10 0 3-.7 5-1.5 5.6Z" strokeWidth="0" />
        {/* head (overlaps the body so the silhouette is one piece) */}
        <ellipse cx="18.2" cy="11.2" rx="4.7" ry="4.3" strokeWidth="0" />
        {/* ears */}
        <path d="M14.1 9.9 14.5 4.1l3.1 3.4ZM18.9 7.4l3.2-3.5.5 5.9Z" strokeWidth="0" />
      </g>
    </svg>
  )
}
