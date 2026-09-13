/**
 * Supabase Storage image transformation helpers.
 *
 * Public storage URLs (`/storage/v1/object/public/...`) serve the original
 * upload. Rewriting them to the render endpoint
 * (`/storage/v1/render/image/public/...?width=...&quality=...`) returns a
 * CDN-cached resized variant instead — a large egress saving for list thumbs.
 *
 * Requires Supabase image transformations (Pro plan). Non-Supabase URLs are
 * returned untouched, so callers can apply this unconditionally.
 */

const PUBLIC_OBJECT_SEGMENT = '/storage/v1/object/public/';
const PUBLIC_RENDER_SEGMENT = '/storage/v1/render/image/public/';

export interface ImageTransformOptions {
    /** Target width in pixels (height scales to preserve aspect ratio). */
    width: number;
    /** JPEG/WebP quality 20-100. Defaults to 75. */
    quality?: number;
}

export function getTransformedImageUrl(
    url: string | null | undefined,
    options: ImageTransformOptions
): string | null {
    if (!url) return null;
    if (!url.includes(PUBLIC_OBJECT_SEGMENT)) return url;

    const rendered = url.replace(PUBLIC_OBJECT_SEGMENT, PUBLIC_RENDER_SEGMENT);
    const separator = rendered.includes('?') ? '&' : '?';
    const quality = options.quality ?? 75;
    return `${rendered}${separator}width=${options.width}&quality=${quality}`;
}
