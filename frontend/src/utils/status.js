/** Public-facing labels: users only see Open / Closed */
export function publicStatusLabel(status) {
  if (status === 'closed') return 'Closed'
  return 'Open'
}

export function publicStatusClass(status) {
  return status === 'closed' ? 'closed' : 'open'
}

/** Admin-facing labels */
export function adminStatusLabel(status) {
  return (
    {
      yet_to_publish: 'Yet to Publish',
      published: 'Published',
      closed: 'Closed',
      under_contract: 'Published',
    }[status] || String(status || '').replace(/_/g, ' ')
  )
}

/** Map UI open/closed → API status values */
export function statusFilterToApi(value) {
  if (value === 'open') return 'published'
  if (value === 'closed') return 'closed'
  return value
}
