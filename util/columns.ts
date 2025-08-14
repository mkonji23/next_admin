export function getColumns<T>(items: T[] | T): { field: string }[] {
    if (!items) return [];

    let target: any;

    if (Array.isArray(items)) {
        if (!items.length) return [];
        target = items[0];
    } else {
        target = items; // 단일 객체
    }

    return Object.keys(target).map((field) => ({
        field
    }));
}
