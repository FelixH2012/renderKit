export interface FaqItem {
    question: string;
    answer: string;
}

export interface FaqAttributes {
    blockId?: string;
    heading: string;
    intro: string;
    theme: 'light' | 'dark';
    openFirst: boolean;
    items: FaqItem[];
}
