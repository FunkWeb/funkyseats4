const chevronPaths = {
  left: 'M15.41 7.41 14 6l-6 6 6 6 1.41-1.41L10.83 12z',
  right: 'M8.59 16.59 10 18l6-6-6-6-1.41 1.41L13.17 12z',
  down: 'M7.41 8.59 12 13.17l4.59-4.58L18 10l-6 6-6-6z',
}

export const ChevronIcon = ({ direction }: { direction: keyof typeof chevronPaths }) => (
  <svg width="100%" height="100%" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d={chevronPaths[direction]} />
  </svg>
)
