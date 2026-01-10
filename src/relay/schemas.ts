import { z } from 'zod';

function relayPropsSchema<AttributesSchema extends z.ZodTypeAny>(attributes: AttributesSchema) {
    return z
        .object({
            attributes,
            content: z.string().optional().default(''),
            className: z.string().optional(),
        })
        .strip();
}

const themeSchema = z.enum(['light', 'dark']);

const menuItemSchema = z
    .object({
        id: z.coerce.number().int(),
        title: z.string(),
        url: z.string(),
    })
    .strip();

const heroAttributesSchema = z
    .object({
        heading: z.string().optional().default(''),
        description: z.string().optional().default(''),
        buttonText: z.string().optional().default(''),
        buttonUrl: z.string().optional().default('#'),
        stat1Label: z.string().optional().default(''),
        stat1Value: z.string().optional().default(''),
        stat2Label: z.string().optional().default(''),
        stat2Value: z.string().optional().default(''),
        theme: themeSchema.optional().default('dark'),
        variant: z.enum(['full', 'minimal']).optional().default('full'),
        enableAnimations: z.boolean().optional().default(true),
    })
    .strip();

const navigationAttributesSchema = z
    .object({
        menuSlug: z.string().optional().default('renderkit-primary'),
        showLogo: z.boolean().optional().default(true),
        logoUrl: z.string().optional().default(''),
        siteName: z.string().optional().default(''),
        sticky: z.boolean().optional().default(true),
        theme: themeSchema.optional().default('light'),
        showCart: z.boolean().optional().default(false),
        menuItems: z.array(menuItemSchema).catch([]),
    })
    .strip();

const productSchema = z
    .object({
        id: z.coerce.number().int(),
        title: z.string().optional().default(''),
        excerpt: z.string().optional().default(''),
        url: z.string().optional().default('#'),
        price: z.coerce.number().optional().default(0),
        sale_price: z.coerce.number().optional().default(0),
        sku: z.string().optional().default(''),
        stock_status: z.string().optional().default('instock'),
        image: z
            .union([z.string(), z.null(), z.literal(false)])
            .optional()
            .transform((value) => (value === false ? null : value ?? null)),
    })
    .strip();

const productGridAttributesSchema = z
    .object({
        columns: z.coerce.number().optional().default(3),
        count: z.coerce.number().optional().default(6),
        category: z.coerce.number().optional().default(0),
        showPrice: z.boolean().optional().default(true),
        showButton: z.boolean().optional().default(true),
        products: z.array(productSchema).catch([]),
    })
    .strip();

const swiperSlideSchema = z
    .object({
        id: z.string().optional(),
        eyebrow: z.string().optional(),
        heading: z.string().optional(),
        text: z.string().optional(),
        linkText: z.string().optional(),
        linkUrl: z.string().optional(),
        imageId: z.coerce.number().int().catch(0),
        imageUrl: z.string().optional(),
        imageAlt: z.string().optional(),
        imageSrcSet: z.string().optional(),
        imageSizes: z.string().optional(),
        imageWidth: z.coerce.number().optional(),
        imageHeight: z.coerce.number().optional(),
    })
    .strip();

const swiperAttributesSchema = z
    .object({
        ariaLabel: z.string().optional().default('Carousel'),
        theme: themeSchema.optional().default('light'),
        showArrows: z.boolean().optional().default(true),
        showDots: z.boolean().optional().default(true),
        slides: z
            .array(swiperSlideSchema)
            .catch([])
            .transform((slides) =>
                slides
                    .map((slide, index) => ({
                        id: slide.id && slide.id.trim() !== '' ? slide.id : `slide-${index + 1}`,
                        eyebrow: slide.eyebrow || '',
                        heading: slide.heading || '',
                        text: slide.text || '',
                        linkText: slide.linkText || '',
                        linkUrl: slide.linkUrl || '',
                        imageId: slide.imageId,
                        imageUrl: slide.imageUrl || '',
                        imageAlt: slide.imageAlt || '',
                        imageSrcSet: slide.imageSrcSet,
                        imageSizes: slide.imageSizes,
                        imageWidth: slide.imageWidth,
                        imageHeight: slide.imageHeight,
                    }))
                    .filter((slide) => slide.heading.trim() !== '' || slide.text.trim() !== '' || slide.imageUrl.trim() !== '')
            ),
    })
    .strip();

const textBlockAttributesSchema = z
    .object({
        theme: themeSchema.optional().default('light'),
        width: z.enum(['narrow', 'wide']).optional().default('narrow'),
    })
    .strip();

const footerAttributesSchema = z
    .object({
        menuSlug: z.string().optional().default('renderkit-footer'),
        showLogo: z.boolean().optional().default(true),
        logoUrl: z.string().optional().default(''),
        siteName: z.string().optional().default(''),
        tagline: z.string().optional().default(''),
        theme: themeSchema.optional().default('dark'),
        menuItems: z.array(menuItemSchema).catch([]),
    })
    .strip();

export const relayPropsSchemas = {
    'renderkit/hero': relayPropsSchema(heroAttributesSchema),
    'renderkit/navigation': relayPropsSchema(navigationAttributesSchema),
    'renderkit/product-grid': relayPropsSchema(productGridAttributesSchema),
    'renderkit/swiper': relayPropsSchema(swiperAttributesSchema),
    'renderkit/text-block': relayPropsSchema(textBlockAttributesSchema),
    'renderkit/footer': relayPropsSchema(footerAttributesSchema),
} as const;

export type RelayBlockName = keyof typeof relayPropsSchemas;
