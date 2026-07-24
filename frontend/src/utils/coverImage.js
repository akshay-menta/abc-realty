/** Stable random cover when a listing has no uploaded photos */
const PLACEHOLDERS = [
  'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800',
  'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800',
  'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800',
  'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800',
  'https://images.unsplash.com/photo-1549517045-bc93de075e53?w=800',
  'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=800',
  'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800',
  'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800',
]

/**
 * Cover/icon for a property:
 * - If photos exist → first uploaded photo
 * - If none → deterministic placeholder (stable per property id)
 */
export function getCoverImage(property, size = 800) {
  const photos = property?.photos
  if (Array.isArray(photos) && photos.length > 0 && photos[0]) {
    return photos[0]
  }
  const seed = Number(property?.id) || Math.abs(hashString(property?.slug || property?.title || 'home'))
  const url = PLACEHOLDERS[seed % PLACEHOLDERS.length]
  return url.replace(/w=\d+/, `w=${size}`)
}

function hashString(str) {
  let h = 0
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) | 0
  return h
}

export const DEFAULT_PLACEHOLDER = PLACEHOLDERS[0]
