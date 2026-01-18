function stripHtmlTags(value: string): string {
    let stripped = value;
    let previous;
    do {
        previous = stripped;
        stripped = stripped.replace(/<[^>]*>/g, '');
    } while (stripped !== previous);
    return stripped;
}

export function htmlToPlainText(value: string): string {
    const withNewlines = value.replace(/<br\s*\/?>/gi, '\n');
    return stripHtmlTags(withNewlines);
}

export function hasNonEmptyHtmlText(value: string): boolean {
    const stripped = stripHtmlTags(value).replace(/\s+/g, '').trim();
    return stripped.length > 0;
}
