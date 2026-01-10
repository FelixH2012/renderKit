export type SwiperTheme = 'light' | 'dark';

export interface SwiperSlide {
    id: string;
    eyebrow: string;
    heading: string;
    text: string;
    linkText: string;
    linkUrl: string;
    imageId: number;
    imageUrl: string;
    imageAlt: string;
    imageSrcSet?: string;
    imageSizes?: string;
    imageWidth?: number;
    imageHeight?: number;
}

export interface SwiperAttributes {
    ariaLabel: string;
    theme: SwiperTheme;
    showArrows: boolean;
    showDots: boolean;
    slides: SwiperSlide[];
}

