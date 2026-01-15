export type CartTheme = 'light' | 'dark';

export interface CartItem {
    id: number;
    title: string;
    price: number;
    sale_price: number;
    quantity: number;
    image: string | null;
    url: string;
}

export interface CartAttributes {
    emptyMessage: string;
    emptyButtonText: string;
    continueUrl: string;
    theme: CartTheme;
}

export interface CartViewAttributes extends CartAttributes {
    items: CartItem[];
    total: number;
}
