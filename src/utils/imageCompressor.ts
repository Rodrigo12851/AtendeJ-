/**
 * Utility to compress and resize image files client-side using HTML5 Canvas.
 * Reduces raw 5-10MB smartphone/camera photos to ~30-80KB data URLs.
 */
export function compressImageFile(
  file: File,
  maxWidth = 800,
  maxHeight = 800,
  quality = 0.78
): Promise<string> {
  return new Promise((resolve, reject) => {
    // If not an image, resolve empty or original
    if (!file.type.startsWith('image/')) {
      reject(new Error('O arquivo selecionado não é uma imagem válida.'));
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Calculate aspect ratio & bounded box dimensions
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (ctx) {
          // Smooth scaling
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, width, height);

          // Convert to JPEG data URL with target quality
          const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
          resolve(compressedDataUrl);
        } else {
          resolve(event.target?.result as string);
        }
      };

      img.onerror = () => reject(new Error('Erro ao carregar os dados da imagem.'));
      img.src = event.target?.result as string;
    };

    reader.onerror = () => reject(new Error('Erro ao ler o arquivo de imagem.'));
    reader.readAsDataURL(file);
  });
}
