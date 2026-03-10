/**
 * 이미지를 리사이징하고 압축하는 유틸리티
 */

export interface ResizeOptions {
    maxWidth?: number;
    maxHeight?: number;
    quality?: number;
    type?: string;
}

/**
 * File 객체를 받아 압축된 File 객체로 반환합니다.
 */
export const compressImage = async (file: File, options: ResizeOptions = {}): Promise<File> => {
    const { maxWidth = 1200, maxHeight = 1200, quality = 0.7, type = 'image/jpeg' } = options;

    // 이미지 파일이 아니면 그대로 반환
    if (!file.type.startsWith('image/')) {
        return file;
    }

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

                // 비율 유지하며 리사이징
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
                if (!ctx) {
                    resolve(file);
                    return;
                }

                // 이미지 그리기
                ctx.drawImage(img, 0, 0, width, height);

                // Blob으로 변환 후 File 객체 생성
                canvas.toBlob(
                    (blob) => {
                        if (blob) {
                            const compressedFile = new File([blob], file.name, {
                                type: type,
                                lastModified: Date.now()
                            });
                            resolve(compressedFile);
                        } else {
                            resolve(file);
                        }
                    },
                    type,
                    quality
                );
            };

            img.onerror = () => resolve(file);
        };
        reader.onerror = () => resolve(file);
    });
};

/**
 * 여러 개의 파일을 한 번에 압축하며, 전체 용량 합계가 maxTotalSize를 넘지 않도록 조정합니다.
 */
export const compressImages = async (
    files: File[],
    options: ResizeOptions & { maxTotalSize?: number } = {}
): Promise<File[]> => {
    const { maxTotalSize = 4.2 * 1024 * 1024, ...restOptions } = options; // 기본 4MB 제한

    // 1차 압축 시도 (기본 설정: 1200px, quality 0.7)
    let currentQuality = restOptions.quality || 0.7;
    let currentMaxWidth = restOptions.maxWidth || 1200;

    let compressedFiles = await Promise.all(
        files.map((file) => compressImage(file, { ...restOptions, quality: currentQuality, maxWidth: currentMaxWidth }))
    );

    let totalSize = compressedFiles.reduce((acc, file) => acc + file.size, 0);

    // 전체 용량이 제한을 초과하는 경우, 단계적으로 더 강하게 압축 (최대 2번 더 시도)
    if (totalSize > maxTotalSize) {
        // 2차 시도: 품질 0.5, 해상도 1000px
        currentQuality = 0.5;
        currentMaxWidth = 1000;
        compressedFiles = await Promise.all(
            files.map((file) =>
                compressImage(file, { ...restOptions, quality: currentQuality, maxWidth: currentMaxWidth })
            )
        );
        totalSize = compressedFiles.reduce((acc, file) => acc + file.size, 0);
    }

    if (totalSize > maxTotalSize) {
        // 3차 시도: 품질 0.3, 해상도 800px (최후의 수단)
        currentQuality = 0.3;
        currentMaxWidth = 800;
        compressedFiles = await Promise.all(
            files.map((file) =>
                compressImage(file, { ...restOptions, quality: currentQuality, maxWidth: currentMaxWidth })
            )
        );
    }

    return compressedFiles;
};
