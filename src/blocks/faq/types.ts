export interface FaqItem {
    question: string;
    answer: string;
}

export interface FaqAttributes {
    heading: string;
    intro: string;
    theme: 'light' | 'dark';
    openFirst: boolean;
    items: FaqItem[];
}
