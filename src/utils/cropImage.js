/**
 * Utility to crop image and return high-performance base64 data URL.
 * Optimized for mobile devices to prevent canvas memory crashes & CORS issues.
 */
export default function getCroppedImg(imageSrc, pixelCrop) {
  return new Promise((resolve, reject) => {
    if (!imageSrc) {
      return reject(new Error('No image source provided'));
    }

    const image = new window.Image();

    // Only set crossOrigin for remote http(s) URLs to prevent CORS/taint bugs with data/blob URLs on Android WebViews
    if (typeof imageSrc === 'string' && (imageSrc.startsWith('http://') || imageSrc.startsWith('https://'))) {
      image.crossOrigin = 'anonymous';
    }

    image.onload = () => {
      try {
        const naturalWidth = image.naturalWidth || image.width || 800;
        const naturalHeight = image.naturalHeight || image.height || 600;

        // Safe fallback if pixelCrop is invalid or not yet populated
        const cropX = pixelCrop && typeof pixelCrop.x === 'number' && !isNaN(pixelCrop.x) ? Math.max(0, pixelCrop.x) : 0;
        const cropY = pixelCrop && typeof pixelCrop.y === 'number' && !isNaN(pixelCrop.y) ? Math.max(0, pixelCrop.y) : 0;
        const cropWidth = pixelCrop && typeof pixelCrop.width === 'number' && pixelCrop.width > 0 && !isNaN(pixelCrop.width)
          ? pixelCrop.width
          : naturalWidth;
        const cropHeight = pixelCrop && typeof pixelCrop.height === 'number' && pixelCrop.height > 0 && !isNaN(pixelCrop.height)
          ? pixelCrop.height
          : naturalHeight;

        // Constrain max dimensions to prevent Mobile GPU / Canvas RAM exhaustion (e.g. max width 1080, max height 1920)
        const MAX_WIDTH = 1080;
        const MAX_HEIGHT = 1920;
        let targetWidth = cropWidth;
        let targetHeight = cropHeight;

        const ratio = targetWidth / targetHeight;
        if (targetWidth > MAX_WIDTH) {
          targetWidth = MAX_WIDTH;
          targetHeight = Math.round(targetWidth / ratio);
        }
        if (targetHeight > MAX_HEIGHT) {
          targetHeight = MAX_HEIGHT;
          targetWidth = Math.round(targetHeight * ratio);
        }

        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(targetWidth));
        canvas.height = Math.max(1, Math.round(targetHeight));
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          return reject(new Error('Failed to create 2D canvas context'));
        }

        // Image smoothing for highest visual quality
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        ctx.drawImage(
          image,
          cropX,
          cropY,
          cropWidth,
          cropHeight,
          0,
          0,
          canvas.width,
          canvas.height
        );

        // Safe conversion to JPEG base64 DataURL (supported reliably across all mobile devices)
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        if (dataUrl && dataUrl.startsWith('data:image/')) {
          resolve(dataUrl);
        } else {
          // Fallback to toBlob if toDataURL returned empty
          canvas.toBlob(blob => {
            if (!blob) {
              return reject(new Error('Canvas blob generation failed'));
            }
            const reader = new FileReader();
            reader.onloadend = () => {
              if (reader.result) {
                resolve(reader.result);
              } else {
                reject(new Error('FileReader returned empty result'));
              }
            };
            reader.onerror = (err) => reject(err);
            reader.readAsDataURL(blob);
          }, 'image/jpeg', 0.85);
        }
      } catch (err) {
        reject(err);
      }
    };

    image.onerror = (error) => {
      reject(new Error('Failed to load image for cropping: ' + (error?.message || 'Invalid image source')));
    };

    image.src = imageSrc;
  });
}