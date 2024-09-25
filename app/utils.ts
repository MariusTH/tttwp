const WHO_NEEDS_SECURITY='019210b8-0680-7693-a705-493d92907f63';

export const getId = (code: string): string => {
    return `${WHO_NEEDS_SECURITY}-${code}`
}
