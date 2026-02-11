/**
 * Compresses an image file and returns a Base64 string.
 * Resizes the image to fit within maxWidth/maxHeight to ensure small payload size.
 * 
 * @param file - The image file to compress
 * @param maxWidth - Maximum width in pixels (default: 500)
 * @param quality - JPEG quality 0-1 (default: 0.7)
 * @returns Promise resolving to Base64 string
 */
export const compressImage = (
    file: File,
    maxWidth: number = 500,
    quality: number = 0.7
): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target?.result as string;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                // Calculate new dimensions
                if (width > maxWidth) {
                    height = Math.round((height * maxWidth) / width);
                    width = maxWidth;
                }

                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    reject(new Error("Could not get canvas context"));
                    return;
                }

                ctx.drawImage(img, 0, 0, width, height);

                // Convert to Base64 (JPEG for better compression)
                const base64 = canvas.toDataURL('image/jpeg', quality);
                resolve(base64);
            };
            img.onerror = (error) => reject(error);
        };
        reader.onerror = (error) => reject(error);
    });
};
