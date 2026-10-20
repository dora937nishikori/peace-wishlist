/** Resize locally to keep uploads light, respect orientation and discard EXIF location data. */
export async function preparePhoto(file: File): Promise<File> {
  if (!file.type.startsWith("image/") || file.size > 30 * 1024 * 1024) {
    throw new Error("30MB以内の写真を選んでください。");
  }
  const objectUrl = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.src = objectUrl;
    await image.decode();
    const scale = Math.min(
      1,
      2400 / Math.max(image.naturalWidth, image.naturalHeight),
    );
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
    const context = canvas.getContext("2d");
    if (!context) throw new Error();
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob(
        (value) => (value ? resolve(value) : reject(new Error())),
        "image/jpeg",
        0.88,
      ),
    );
    if (blob.size > 8 * 1024 * 1024) throw new Error();
    return new File([blob], `${file.name.replace(/\.[^.]+$/, "")}.jpg`, {
      type: "image/jpeg",
    });
  } catch {
    throw new Error(
      "この写真を読み込めませんでした。JPEG・PNG・WebPの写真をお試しください。",
    );
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}
