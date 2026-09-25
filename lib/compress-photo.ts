const MAX_BYTES = 4 * 1024 * 1024;
const MAX_EDGE = 2400;

/** Compress locally: no photo data leaves the device until this resolves. */
export async function compressPhoto(file: File): Promise<File> {
  if (!file.size) throw new Error("La photo est vide.");
  const url = URL.createObjectURL(file);
  const image = new Image();
  const canvas = document.createElement("canvas");
  try {
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error("Photo illisible. Choisissez une image JPEG ou PNG."));
      image.src = url;
    });
    if (!image.naturalWidth || !image.naturalHeight) throw new Error("Dimensions de photo invalides.");
    const scale = Math.min(1, MAX_EDGE / Math.max(image.naturalWidth, image.naturalHeight));
    let width = Math.max(1, Math.round(image.naturalWidth * scale));
    let height = Math.max(1, Math.round(image.naturalHeight * scale));
    for (let attempt = 0; attempt < 5; attempt++) {
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext("2d");
      if (!context) throw new Error("La compression photo est indisponible sur cet appareil.");
      context.fillStyle = "#fff";
      context.fillRect(0, 0, width, height);
      context.drawImage(image, 0, 0, width, height);
      for (const quality of [0.88, 0.78, 0.68]) {
        const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, "image/jpeg", quality));
        if (!blob) throw new Error("Impossible de compresser cette photo.");
        if (blob.size > 0 && blob.size <= MAX_BYTES) {
          // Avoid making an already small JPEG larger or reducing its quality unnecessarily.
          if (file.type === "image/jpeg" && file.size <= blob.size && file.size <= MAX_BYTES) return file;
          return new File([blob], `${file.name.replace(/\.[^.]+$/, "") || "etiquette"}.jpg`, {
            type: "image/jpeg", lastModified: file.lastModified,
          });
        }
      }
      width = Math.max(1, Math.round(width * 0.8));
      height = Math.max(1, Math.round(height * 0.8));
    }
    throw new Error("La photo reste trop volumineuse. Reprenez-la avec une résolution plus faible.");
  } finally {
    URL.revokeObjectURL(url);
    canvas.width = canvas.height = 0;
  }
}
