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
        currentUrl: z.string().optional().default(''),
        cartCount: z.coerce.number().int().optional().default(0),
        cartUrl: z.string().optional().default('/warenkorb/'),
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

// Shared image schema for product pages and archives
const productImageSchema = z
    .object({
        id: z.coerce.number().int().catch(0),
        src: z.string().optional().default(''),
        fullSrc: z.string().optional(),
        alt: z.string().optional().default(''),
        width: z.coerce.number().optional(),
        height: z.coerce.number().optional(),
        srcSet: z.string().optional(),
        sizes: z.string().optional(),
    })
    .strip();

const productPageAttributesSchema = z
    .object({
        navigation: navigationAttributesSchema.optional().default({} as any),
        footer: footerAttributesSchema.optional().default({} as any),
        hero: heroAttributesSchema.optional().default({} as any),
        labels: z
            .object({
                backToProducts: z.string().optional().default('Back to products'),
                sku: z.string().optional().default('SKU'),
                availability: z.string().optional().default('Availability'),
                readDescription: z.string().optional().default('Zum Produkt'),
                priceOnRequest: z.string().optional().default('Price on request'),
                gallery: z.string().optional().default('Product gallery'),
                relatedHeading: z.string().optional().default('Weitere Produkte'),
            })
            .strip()
            .optional()
            .default({} as any),
        product: z
            .object({
                id: z.coerce.number().int().catch(0),
                title: z.string().optional().default(''),
                excerpt: z.string().optional().default(''),
                archiveUrl: z.string().optional().default(''),
                sku: z.string().optional().default(''),
                stockStatus: z.string().optional().default('instock'),
                stockLabel: z.string().optional().default(''),
                price: z.coerce.number().optional().default(0),
                salePrice: z.coerce.number().optional().default(0),
                priceFormatted: z.string().optional().default(''),
                salePriceFormatted: z.string().optional().default(''),
                featuredImage: productImageSchema.nullable().optional().default(null),
                gallery: z.array(productImageSchema).catch([]),
                hasRenderkitBlocks: z.boolean().optional().default(false),
            })
            .strip(),
        relatedProducts: z
            .array(
                z
                    .object({
                        id: z.coerce.number().int().catch(0),
                        title: z.string().optional().default(''),
                        excerpt: z.string().optional().default(''),
                        url: z.string().optional().default(''),
                        image: z.string().optional().default(''),
                        price: z.coerce.number().optional().default(0),
                        salePrice: z.coerce.number().optional().default(0),
                        priceFormatted: z.string().optional().default(''),
                        salePriceFormatted: z.string().optional().default(''),
                    })
                    .strip()
            )
            .optional()
            .default([]),
    })
    .strip();

const textImageAttributesSchema = z
    .object({
        heading: z.string().optional().default(''),
        description: z.string().optional().default(''),
        imageUrl: z.string().optional().default(''),
        imageAlt: z.string().optional().default(''),
        imageId: z.coerce.number().optional().default(0),
        imagePosition: z.enum(['left', 'right']).optional().default('right'),
        buttonText: z.string().optional().default(''),
        buttonUrl: z.string().optional().default(''),
        theme: themeSchema.optional().default('light'),
    })
    .strip();

const contactFormAttributesSchema = z
    .object({
        nameLabel: z.string().optional().default('Name'),
        emailLabel: z.string().optional().default('Email'),
        subjectLabel: z.string().optional().default('Subject'),
        messageLabel: z.string().optional().default('Message'),
        submitButtonText: z.string().optional().default('Send Message'),
        privacyLabel: z.string().optional().default('I agree to the privacy policy.'),
        privacyRequired: z.boolean().optional().default(true),
        status: z.string().optional().default(''),
        successMessage: z.string().optional().default('Thanks! Your message has been sent.'),
        errorMessage: z.string().optional().default('Something went wrong. Please try again.'),
        theme: themeSchema.optional().default('light'),
        recaptchaSiteKey: z.string().optional().default(''),
        recaptchaEnabled: z.boolean().optional().default(false),
        nonce: z.string().optional().default(''),
    })
    .strip();

const cookieBannerSettingSchema = z
    .object({
        id: z.string().optional().default(''),
        label: z.string().optional().default(''),
        description: z.string().optional().default(''),
        required: z.boolean().optional().default(false),
        enabledByDefault: z.boolean().optional().default(false),
        linkLabel: z.string().optional().default(''),
        linkUrl: z.string().optional().default(''),
    })
    .strip();

const cookieBannerAttributesSchema = z
    .object({
        message: z.string().optional().default('Wir nutzen Cookies, um dir die bestmögliche Erfahrung zu bieten und unsere Website sicher zu betreiben.'),
        policyLabel: z.string().optional().default('Datenschutzerklärung'),
        policyUrl: z.string().optional().default('/datenschutz'),
        acceptLabel: z.string().optional().default('Alle akzeptieren'),
        rejectLabel: z.string().optional().default('Ablehnen'),
        manageLabel: z.string().optional().default('Einstellungen'),
        saveLabel: z.string().optional().default('Auswahl speichern'),
        theme: themeSchema.optional().default('dark'),
        consentVersion: z.string().optional().default('1'),
        settings: z.array(cookieBannerSettingSchema).optional().default([]),
    })
    .strip();

const cookieGateAttributesSchema = z
    .object({
        requiredSetting: z.string().optional().default('analytics'),
        consentVersion: z.string().optional().default('1'),
        fallbackText: z.string().optional().default('Bitte akzeptiere die passenden Cookies, um diesen Inhalt zu sehen.'),
        previewAccepted: z.boolean().optional().default(false),
    })
    .strip();

const faqItemSchema = z
    .object({
        question: z.string().optional().default(''),
        answer: z.string().optional().default(''),
    })
    .strip();

const faqAttributesSchema = z
    .object({
        heading: z.string().optional().default('Haeufige Fragen'),
        intro: z.string().optional().default('Hier findest du Antworten auf die wichtigsten Fragen.'),
        theme: themeSchema.optional().default('light'),
        openFirst: z.boolean().optional().default(false),
        items: z.array(faqItemSchema).optional().default([]),
    })
    .strip();

const cartItemSchema = z
    .object({
        id: z.coerce.number().int(),
        title: z.string().optional().default(''),
        price: z.coerce.number().optional().default(0),
        sale_price: z.coerce.number().optional().default(0),
        quantity: z.coerce.number().int().optional().default(1),
        image: z.union([z.string(), z.null()]).optional().default(null),
        url: z.string().optional().default(''),
    })
    .strip();

const cartAttributesSchema = z
    .object({
        emptyMessage: z.string().optional().default('Dein Warenkorb ist leer.'),
        emptyButtonText: z.string().optional().default('Weiter einkaufen'),
        continueUrl: z.string().optional().default('/'),
        theme: themeSchema.optional().default('light'),
        items: z.array(cartItemSchema).catch([]),
        total: z.coerce.number().optional().default(0),
    })
    .strip();

// Reuse shared productImageSchema for archive (nullable variant)

const productArchiveAttributesSchema = z
    .object({
        navigation: navigationAttributesSchema.optional().default({} as any),
        footer: footerAttributesSchema.optional().default({} as any),
        hero: heroAttributesSchema.optional().default({} as any),
        labels: z
            .object({
                heading: z.string().optional().default('Produkte'),
                intro: z.string().optional().default('Unsere Auswahl handgefertigter Lieblingsstuecke.'),
                priceOnRequest: z.string().optional().default('Price on request'),
                pagination: z.string().optional().default('Seite'),
            })
            .strip()
            .optional()
            .default({} as any),
        products: z
            .array(
                z
                    .object({
                        id: z.coerce.number().int().catch(0),
                        title: z.string().optional().default(''),
                        excerpt: z.string().optional().default(''),
                        url: z.string().optional().default(''),
                        image: productImageSchema.nullable().optional().default(null),
                        price: z.coerce.number().optional().default(0),
                        salePrice: z.coerce.number().optional().default(0),
                        priceFormatted: z.string().optional().default(''),
                        salePriceFormatted: z.string().optional().default(''),
                    })
                    .strip()
            )
            .optional()
            .default([]),
        pagination: z
            .object({
                current: z.coerce.number().int().optional().default(1),
                total: z.coerce.number().int().optional().default(1),
                links: z
                    .array(
                        z
                            .object({
                                label: z.string().optional().default(''),
                                url: z.string().optional().default(''),
                                isCurrent: z.boolean().optional().default(false),
                            })
                            .strip()
                    )
                    .optional()
                    .default([]),
            })
            .strip()
            .optional()
            .default({} as any),
    })
    .strip();

export const relayPropsSchemas = {
    'renderkit/hero': relayPropsSchema(heroAttributesSchema),
    'renderkit/navigation': relayPropsSchema(navigationAttributesSchema),
    'renderkit/product-grid': relayPropsSchema(productGridAttributesSchema),
    'renderkit/swiper': relayPropsSchema(swiperAttributesSchema),
    'renderkit/text-block': relayPropsSchema(textBlockAttributesSchema),
    'renderkit/text-image': relayPropsSchema(textImageAttributesSchema),
    'renderkit/contact-form': relayPropsSchema(contactFormAttributesSchema),
    'renderkit/cookie-banner': relayPropsSchema(cookieBannerAttributesSchema),
    'renderkit/cookie-gate': relayPropsSchema(cookieGateAttributesSchema),
    'renderkit/faq': relayPropsSchema(faqAttributesSchema),
    'renderkit/cart': relayPropsSchema(cartAttributesSchema),
    'renderkit/footer': relayPropsSchema(footerAttributesSchema),
    'renderkit/product-page': relayPropsSchema(productPageAttributesSchema),
    'renderkit/product-archive': relayPropsSchema(productArchiveAttributesSchema),
} as const;

export type RelayBlockName = keyof typeof relayPropsSchemas;
