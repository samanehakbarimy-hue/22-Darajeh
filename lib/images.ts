import sharp from "sharp";

/**
 * The longest edge kept on a stored profile photo.
 *
 * The browse card crops to 4:5 and is capped at 260px wide; the profile page
 * shows it larger. 800 covers both on a high-density screen with room to
 * spare, and none of this is ever printed. Anything past that is bytes every
 * visitor downloads and nobody can see.
 */
const MAX_EDGE = 800;

export type ProcessedImage =
  | { ok: true; data: Buffer; contentType: string; extension: string }
  | { ok: false; error: string };

/**
 * Shrinks and re-encodes a photo on its way to storage.
 *
 * Uploads used to be stored exactly as sent, so a 3MB phone photo was a 3MB
 * download for every visitor to the browse page, once per specialist. Doing it
 * here rather than at serving time means it is paid once, on upload, instead
 * of on every request — which matters on a free tier.
 *
 * rotate() first, with no argument: it applies the EXIF orientation flag and
 * then drops it. Phone cameras lean on that flag constantly, and stripping
 * metadata without honouring it first is how portraits end up sideways.
 */
export async function processAvatar(file: File): Promise<ProcessedImage> {
  try {
    const input = Buffer.from(await file.arrayBuffer());

    const data = await sharp(input)
      .rotate()
      .resize(MAX_EDGE, MAX_EDGE, {
        fit: "inside",
        // A small photo stays small. Blowing a 100px thumbnail up to 800
        // would not add detail, only weight.
        withoutEnlargement: true,
      })
      .webp({ quality: 82 })
      .toBuffer();

    return { ok: true, data, contentType: "image/webp", extension: "webp" };
  } catch {
    // sharp throws on anything it cannot decode — a PDF renamed .jpg, or a
    // HEIC straight off an iPhone, which it cannot read without libheif.
    return {
      ok: false,
      error:
        "این فایل عکس خوانده نشد. یک عکس JPG یا PNG بفرست (اگر از آیفون می‌فرستی، اول آن را به JPG تبدیل کن).",
    };
  }
}
