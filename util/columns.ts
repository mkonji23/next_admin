export function getColumns<T>(items: T[]): { field: string }[] {
    if (!items.length) return [];
    return Object.keys(items[0] as any).map((field) => ({
        field
    }));
}
