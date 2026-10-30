interface Props {
  className?: string
}

export default function Corona({ className }: Props) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M3 8.5 7.5 12 12 5.5l4.5 6.5L21 8.5 19.2 18H4.8Z" />
      <rect x="4.8" y="19.4" width="14.4" height="2" />
      <circle cx="3" cy="7.2" r="1.7" />
      <circle cx="12" cy="4" r="1.7" />
      <circle cx="21" cy="7.2" r="1.7" />
    </svg>
  )
}
