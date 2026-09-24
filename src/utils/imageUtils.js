/**
 * Shared utility for resolving profile image sources across Juicy.
 * Supports:
 * 1. Google OAuth profile pictures (e.g. https://lh3.googleusercontent.com/...)
 * 2. Standard Web & Blob URLs (http://, https://, //, blob:)
 * 3. Base64 Data URIs (data:image/jpeg;base64,..., data:image/png;base64,..., etc.)
 * 4. Raw Base64 strings (auto-prefixed with data:image/jpeg;base64,)
 * 5. Quoted string cleanup (from CSV imports or stringified JSON)
 * 6. Object payloads ({ url, src, profileImage, profilePic })
 */
export const getProfileImageSrc = (profileImage) => {
  if (!profileImage) return undefined;

  // Handle object wrappers if an entire user or avatar object is passed
  if (typeof profileImage === 'object') {
    return getProfileImageSrc(
      profileImage.url ||
      profileImage.src ||
      profileImage.data ||
      profileImage.profileImage ||
      profileImage.profilePic ||
      profileImage.image ||
      profileImage.photoURL
    );
  }

  if (typeof profileImage !== 'string') return undefined;

  // Clean and strip outer quotes or backslashes if present
  let trimmed = profileImage.trim().replace(/^["'\\]+|["'\\]+$/g, '').trim();
  if (!trimmed || trimmed === 'null' || trimmed === 'undefined') return undefined;

  // Google OAuth profile picture handling
  if (trimmed.includes('googleusercontent.com')) {
    if (trimmed.startsWith('http://')) {
      trimmed = trimmed.replace('http://', 'https://');
    } else if (trimmed.startsWith('//')) {
      trimmed = 'https:' + trimmed;
    }
    trimmed = trimmed.replace(/\\/g, '');
    return trimmed;
  }

  // Standard web URLs (Google profile pictures, CDNs, HTTP, HTTPS, relative blobs)
  if (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('//') ||
    trimmed.startsWith('blob:')
  ) {
    return trimmed;
  }

  // Already a full Data URI
  if (trimmed.startsWith('data:')) {
    return trimmed;
  }

  // Raw base64 string
  return `data:image/jpeg;base64,${trimmed}`;
};

export default getProfileImageSrc;
