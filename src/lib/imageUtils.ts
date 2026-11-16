/**
 * Utility function to convert Google Drive and other cloud storage links
 * into direct embeddable image URLs that render reliably in <img> tags.
 */
export function formatImageUrl(url: string | undefined | null): string {
  if (!url) return '';
  const trimmed = url.trim();

  if (trimmed.startsWith('data:') || trimmed.startsWith('blob:')) {
    return trimmed;
  }

  // Handle Google Drive links
  if (trimmed.includes('drive.google.com') || trimmed.includes('googleusercontent.com')) {
    const match =
      trimmed.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) ||
      trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/) ||
      trimmed.match(/\/d\/([a-zA-Z0-9_-]+)/);

    if (match && match[1]) {
      const fileId = match[1];
      return `https://lh3.googleusercontent.com/d/${fileId}`;
    }
  }

  // Handle Dropbox links
  if (trimmed.includes('dropbox.com')) {
    return trimmed
      .replace('www.dropbox.com', 'dl.dropboxusercontent.com')
      .replace('?dl=0', '')
      .replace('&dl=0', '');
  }

  return trimmed;
}

export function isGoogleDriveUrl(url: string): boolean {
  if (!url) return false;
  return url.includes('drive.google.com') || url.includes('googleusercontent.com');
}

/**
 * Compress an image File or Data URL cleanly so it stays well within
 * Firestore's 1MB document limit while preserving PNG transparency when needed.
 */
export function compressImageDataUrl(
  dataUrl: string,
  options: { maxDim?: number; maxChars?: number; preserveAlpha?: boolean } = {}
): Promise<string> {
  const { maxDim = 650, maxChars = 480000, preserveAlpha = true } = options;

  if (!dataUrl || !dataUrl.startsWith('data:image/')) {
    return Promise.resolve(dataUrl);
  }
  if (dataUrl.startsWith('data:image/svg+xml')) {
    return Promise.resolve(dataUrl);
  }

  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      try {
        let width = img.width;
        let height = img.height;

        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        const renderAtScale = (w: number, h: number, mime: string, quality?: number): string => {
          const canvas = document.createElement('canvas');
          canvas.width = Math.max(1, Math.round(w));
          canvas.height = Math.max(1, Math.round(h));
          const ctx = canvas.getContext('2d');
          if (!ctx) return dataUrl;
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          return quality !== undefined ? canvas.toDataURL(mime, quality) : canvas.toDataURL(mime);
        };

        // Try PNG first when preserving transparency, or WebP/JPEG fallback if still too large
        let result = preserveAlpha
          ? renderAtScale(width, height, 'image/png')
          : renderAtScale(width, height, 'image/jpeg', 0.85);

        if (result.length > maxChars && preserveAlpha) {
          // Try lossy WebP (supports full alpha transparency and is 5-10x smaller than PNG)
          const webpResult = renderAtScale(width, height, 'image/webp', 0.88);
          if (webpResult.startsWith('data:image/webp') && webpResult.length < result.length) {
            result = webpResult;
          }
        }

        // Iteratively downscale if still larger than maxChars
        let scale = 0.78;
        while (result.length > maxChars && scale >= 0.35) {
          const nextW = width * scale;
          const nextH = height * scale;
          result = preserveAlpha
            ? renderAtScale(nextW, nextH, 'image/webp', 0.82)
            : renderAtScale(nextW, nextH, 'image/jpeg', 0.78);
          if (!result.startsWith('data:image/webp') && preserveAlpha) {
            result = renderAtScale(nextW, nextH, 'image/png');
          }
          scale -= 0.14;
        }

        resolve(result || dataUrl);
      } catch (e) {
        resolve(dataUrl);
      }
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}
