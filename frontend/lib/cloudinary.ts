const CLOUDINARY_HOST = "res.cloudinary.com";
const IMAGE_UPLOAD_SEGMENT = "/image/upload/";

export function optimizedCloudinaryUrl(src: string, width: number) {
  try {
    const url = new URL(src);

    if (
      url.hostname !== CLOUDINARY_HOST ||
      !url.pathname.includes(IMAGE_UPLOAD_SEGMENT) ||
      url.pathname.includes("/s--")
    ) {
      return src;
    }

    const transformation = `f_auto,q_auto:good,c_limit,w_${Math.round(width)}`;
    url.pathname = url.pathname.replace(
      IMAGE_UPLOAD_SEGMENT,
      `${IMAGE_UPLOAD_SEGMENT}${transformation}/`
    );

    return url.toString();
  } catch {
    return src;
  }
}
