/**
 * Debounce 유틸리티 함수
 * 함수 호출을 지연시켜 연속된 호출을 방지합니다.
 */
export interface DebouncedFunction<T extends (...args: any[]) => any> {
    (...args: Parameters<T>): void;
    cancel: () => void;
}

export function debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number
): DebouncedFunction<T> {
    let timeout: NodeJS.Timeout | null = null;
    const executedFunction = function (...args: Parameters<T>) {
        const later = () => {
            timeout = null;
            func(...args);
        };
        if (timeout) clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    } as DebouncedFunction<T>;

    executedFunction.cancel = () => {
        if (timeout) {
            clearTimeout(timeout);
            timeout = null;
        }
    };

    return executedFunction;
}

