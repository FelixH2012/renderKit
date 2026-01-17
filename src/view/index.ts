/**
 * RenderKit - Frontend Enhancements
 *
 * renderKit-Relay provides fully server-rendered HTML (SEO/no-JS friendly).
 * This file only adds progressive enhancements (optional).
 */

document.documentElement.classList.add('rk-js');

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const MS_PER_DAY = 86_400_000; // 24 * 60 * 60 * 1000
const COOKIE_DEFAULT_DAYS = 180;

// ─────────────────────────────────────────────────────────────────────────────
// Shared Utilities
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Read a cookie value by name.
 */
function getCookie(name: string): string {
    const match = document.cookie.match(new RegExp(`(^| )${name}=([^;]+)`));
    return match ? decodeURIComponent(match[2]) : '';
}

/**
 * Set a cookie with expiration in days.
 */
function setCookie(name: string, value: string, days: number = COOKIE_DEFAULT_DAYS): void {
    const expires = new Date(Date.now() + days * MS_PER_DAY).toUTCString();
    document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
}

/**
 * Execute callback when DOM is ready.
 */
function onReady(callback: () => void): void {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', callback, { once: true });
    } else {
        callback();
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Enhancement Functions
// ─────────────────────────────────────────────────────────────────────────────

function enhanceStickyNavigation() {
    const navs = Array.from(document.querySelectorAll<HTMLElement>('[data-rk-nav][data-sticky]'));
    if (navs.length === 0) return;

    let lastScrollY = window.scrollY;
    let ticking = false;

    const update = () => {
        ticking = false;
        const scrollY = window.scrollY;
        const scrollingDown = scrollY > lastScrollY;
        const scrollingUp = scrollY < lastScrollY;

        navs.forEach((nav) => {
            // Set data-scrolled when scrolled past 20px (pill transformation)
            if (scrollY > 20) {
                nav.dataset.scrolled = '';
            } else {
                delete nav.dataset.scrolled;
            }

            const mobileMenuOpen = nav.hasAttribute('data-menu-open');

            // Hide/show based on scroll direction
            if (scrollY > 100 && !mobileMenuOpen) {
                if (scrollingDown) {
                    nav.dataset.hidden = '';
                } else if (scrollingUp) {
                    delete nav.dataset.hidden;
                }
            } else {
                delete nav.dataset.hidden;
            }
        });

        lastScrollY = scrollY;
    };

    const onScroll = () => {
        if (!ticking) {
            window.requestAnimationFrame(update);
            ticking = true;
        }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    update();
}

function enhanceNavMobileMenu() {
    const navs = Array.from(document.querySelectorAll<HTMLElement>('[data-rk-nav]'));
    if (navs.length === 0) return;

    navs.forEach((nav) => {
        const toggle = nav.querySelector<HTMLButtonElement>('[data-rk-menu-toggle]');
        const menu = nav.querySelector<HTMLElement>('[data-rk-mobile-menu]');
        const links = nav.querySelectorAll<HTMLAnchorElement>('[data-rk-mobile-link]');

        if (!toggle || !menu) return;

        const open = () => {
            nav.dataset.menuOpen = '';
            toggle.setAttribute('aria-expanded', 'true');
            toggle.setAttribute('aria-label', 'Menü schließen');
            menu.setAttribute('aria-hidden', 'false');
            document.body.style.overflow = 'hidden';
        };

        const close = () => {
            delete nav.dataset.menuOpen;
            toggle.setAttribute('aria-expanded', 'false');
            toggle.setAttribute('aria-label', 'Menü öffnen');
            menu.setAttribute('aria-hidden', 'true');
            document.body.style.overflow = '';
        };

        const isOpen = () => nav.hasAttribute('data-menu-open');

        toggle.addEventListener('click', () => {
            if (isOpen()) {
                close();
            } else {
                open();
            }
        });

        // Close when clicking a link
        links.forEach((link) => {
            link.addEventListener('click', () => {
                close();
            });
        });
    });

    // Close on Escape key
    window.addEventListener('keydown', (event) => {
        if (event.key !== 'Escape') return;
        navs.forEach((nav) => {
            if (nav.hasAttribute('data-menu-open')) {
                delete nav.dataset.menuOpen;
                const toggle = nav.querySelector<HTMLButtonElement>('[data-rk-menu-toggle]');
                const menu = nav.querySelector<HTMLElement>('[data-rk-mobile-menu]');
                if (toggle) {
                    toggle.setAttribute('aria-expanded', 'false');
                    toggle.setAttribute('aria-label', 'Menü öffnen');
                }
                if (menu) {
                    menu.setAttribute('aria-hidden', 'true');
                }
                document.body.style.overflow = '';
            }
        });
    });
}

function enhanceHeroScrollAnimations() {
    const heroes = Array.from(
        document.querySelectorAll<HTMLElement>(
            '.renderkit-hero[data-rk-hero-animations="1"]:not([data-rk-hero-variant="minimal"])'
        )
    );
    if (heroes.length === 0) return;

    let scheduled = false;
    const update = () => {
        scheduled = false;

        const scrollY = window.scrollY || 0;
        const y = Math.min(scrollY, 500) / 500 * 150;
        const opacity = 1 - Math.min(scrollY, 300) / 300;

        heroes.forEach((hero) => {
            const bg = hero.querySelector<HTMLElement>('[data-rk-hero-bg]');
            const content = hero.querySelector<HTMLElement>('[data-rk-hero-content]');

            if (bg) bg.style.transform = `translate3d(0, ${y}px, 0)`;
            if (content) content.style.opacity = String(opacity);
        });
    };

    const schedule = () => {
        if (scheduled) return;
        scheduled = true;
        window.requestAnimationFrame(update);
    };

    window.addEventListener('scroll', schedule, { passive: true });
    schedule();
}

function enhanceSwipers() {
    const carousels = Array.from(document.querySelectorAll<HTMLElement>('.renderkit-swiper[data-rk-swiper="1"]'));
    if (carousels.length === 0) return;

    carousels.forEach((carousel) => {
        const track = carousel.querySelector<HTMLElement>('[data-rk-swiper-track]');
        if (!track) return;

        const slides = Array.from(track.querySelectorAll<HTMLElement>('[data-rk-swiper-slide]'));
        if (slides.length <= 1) return;

        const prev = carousel.querySelector<HTMLButtonElement>('[data-rk-swiper-prev]');
        const next = carousel.querySelector<HTMLButtonElement>('[data-rk-swiper-next]');
        const dotsContainer = carousel.querySelector<HTMLElement>('[data-rk-swiper-dots]');

        carousel.dataset.rkSwiperEnhanced = '1';

        let activeIndex = 0;
        const setActive = (index: number) => {
            activeIndex = Math.max(0, Math.min(slides.length - 1, index));

            if (prev) prev.disabled = activeIndex === 0;
            if (next) next.disabled = activeIndex === slides.length - 1;

            if (dotsContainer) {
                const dots = Array.from(dotsContainer.querySelectorAll<HTMLButtonElement>('button[data-rk-swiper-dot]'));
                dots.forEach((dot, dotIndex) => {
                    const isActive = dotIndex === activeIndex;
                    dot.toggleAttribute('data-active', isActive);
                    if (isActive) {
                        dot.setAttribute('aria-current', 'true');
                    } else {
                        dot.removeAttribute('aria-current');
                    }
                });
            }
        };

        const scrollToIndex = (index: number) => {
            const clamped = Math.max(0, Math.min(slides.length - 1, index));
            const slide = slides[clamped];
            if (!slide) return;
            track.scrollTo({ left: slide.offsetLeft, behavior: 'smooth' });
        };

        // Build dots (JS-only)
        if (dotsContainer) {
            dotsContainer.innerHTML = '';
            slides.forEach((_, index) => {
                const dot = document.createElement('button');
                dot.type = 'button';
                dot.className = 'rk-swiper__dot';
                dot.setAttribute('data-rk-swiper-dot', String(index));
                dot.setAttribute('aria-label', `Slide ${index + 1}`);
                dot.addEventListener('click', () => scrollToIndex(index));
                dotsContainer.appendChild(dot);
            });
        }

        // Track active slide
        const observer = new IntersectionObserver(
            (entries) => {
                for (const entry of entries) {
                    if (!entry.isIntersecting) continue;
                    const idx = Number((entry.target as HTMLElement).dataset.rkSwiperIndex || '0');
                    if (Number.isFinite(idx)) {
                        setActive(idx);
                    }
                }
            },
            { root: track, threshold: 0.6 }
        );

        slides.forEach((slide) => observer.observe(slide));

        prev?.addEventListener('click', () => scrollToIndex(activeIndex - 1));
        next?.addEventListener('click', () => scrollToIndex(activeIndex + 1));

        track.addEventListener('keydown', (event) => {
            if (event.key === 'ArrowLeft') {
                event.preventDefault();
                scrollToIndex(activeIndex - 1);
            }
            if (event.key === 'ArrowRight') {
                event.preventDefault();
                scrollToIndex(activeIndex + 1);
            }
        });

        setActive(0);
    });
}

function enhanceProductGridBento() {
    const items = Array.from(
        document.querySelectorAll<HTMLDetailsElement>(
            '.renderkit-product-grid details.rk-bento-item[data-rk-bento="1"]'
        )
    );
    if (items.length === 0) return;

    const prefersReduced =
        typeof window !== 'undefined' &&
        typeof window.matchMedia === 'function' &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const cardParallaxScale = 1.02;
    const cardParallaxY = new WeakMap<HTMLDetailsElement, number>();
    const modalParallaxCleanup = new WeakMap<HTMLDetailsElement, () => void>();
    const runningAnimations = new WeakMap<
        HTMLDetailsElement,
        { clip?: Animation; fade?: Animation; finished?: Promise<unknown> }
    >();
    const animationSeq = new WeakMap<HTMLDetailsElement, number>();
    let seqCounter = 0;
    let scrollLock: null | { y: number; styles: Partial<CSSStyleDeclaration> } = null;

    const nextSeq = (details: HTMLDetailsElement) => {
        const seq = (seqCounter += 1);
        animationSeq.set(details, seq);
        return seq;
    };

    const isSeq = (details: HTMLDetailsElement, seq: number) => animationSeq.get(details) === seq;

    const stopRunningAnimations = (details: HTMLDetailsElement) => {
        const running = runningAnimations.get(details);
        if (!running) return;
        try {
            running.clip?.cancel();
        } catch {
            // no-op
        }
        try {
            running.fade?.cancel();
        } catch {
            // no-op
        }
        runningAnimations.delete(details);
    };

    const lockScroll = () => {
        if (scrollLock) return;
        const y = window.scrollY || 0;
        const scrollbarWidth = Math.max(0, (window.innerWidth || 0) - document.documentElement.clientWidth);
        scrollLock = {
            y,
            styles: {
                overflow: document.documentElement.style.overflow,
                paddingRight: document.body.style.paddingRight,
            },
        };

        // Use overflow hidden instead of position fixed - prevents layout shifts
        document.documentElement.style.overflow = 'hidden';
        if (scrollbarWidth > 0) {
            document.body.style.paddingRight = `${scrollbarWidth}px`;
        }
    };

    const unlockScroll = () => {
        if (!scrollLock) return;
        const { styles } = scrollLock;
        scrollLock = null;

        document.documentElement.style.overflow = styles.overflow || '';
        document.body.style.paddingRight = styles.paddingRight || '';
    };

    const closeAnimated = (details: HTMLDetailsElement) => {
        if (!details.open) return;
        if (prefersReduced) {
            details.open = false;
            return;
        }

        const surface = details.querySelector<HTMLElement>('[data-rk-bento-surface]');
        const backdrop = details.querySelector<HTMLElement>('[data-rk-bento-backdrop]');
        const aside = details.querySelector<HTMLElement>('[data-rk-bento-aside]');

        if (!surface || !backdrop) {
            details.open = false;
            return;
        }

        const seq = nextSeq(details);
        stopRunningAnimations(details);
        details.dataset.rkBentoState = 'closing';

        if (typeof surface.animate !== 'function') {
            details.open = false;
            return;
        }

        // Premium easing - smooth deceleration
        const easing = 'cubic-bezier(0.4, 0, 0.2, 1)';

        // Staggered exit: Aside fades out first, then surface scales down
        if (aside) {
            aside.animate(
                [
                    { opacity: 1, transform: 'translateX(0)' },
                    { opacity: 0, transform: 'translateX(-20px)' },
                ],
                { duration: 250, easing, fill: 'forwards' }
            );
        }

        // Main surface animation - starts slightly delayed
        const surfaceAnimation = surface.animate(
            [
                { opacity: 1, transform: 'scale(1)' },
                { opacity: 0, transform: 'scale(0.98)' },
            ],
            { duration: 450, easing, fill: 'forwards', delay: 50 }
        );

        const backdropAnimation = backdrop.animate(
            [{ opacity: 1 }, { opacity: 0 }],
            { duration: 400, easing, fill: 'forwards' }
        );

        runningAnimations.set(details, {
            clip: surfaceAnimation,
            fade: backdropAnimation,
            finished: Promise.allSettled([surfaceAnimation.finished, backdropAnimation.finished]),
        });

        surfaceAnimation.finished
            .then(() => {
                if (!isSeq(details, seq)) return;
                details.open = false;
            })
            .catch(() => {
                // cancelled
            })
            .finally(() => {
                if (!isSeq(details, seq)) return;
                stopRunningAnimations(details);
            });
    };

    // Close on Escape (JS-only enhancement; <details> still works without it)
    window.addEventListener('keydown', (event) => {
        if (event.key !== 'Escape') return;
        items.filter((details) => details.open).forEach((details) => closeAnimated(details));
    });

    items.forEach((details) => {
        const summary = details.querySelector<HTMLElement>('summary');
        if (summary) {
            // Prevent a dark "flash" on open by forcing the backdrop to start transparent
            const prepareOpen = () => {
                if (details.open) return;
                const backdrop = details.querySelector<HTMLElement>('[data-rk-bento-backdrop]');
                if (backdrop) backdrop.style.opacity = '0';
            };

            summary.addEventListener('pointerdown', prepareOpen);

            summary.addEventListener('click', (event) => {
                // Before opening: prepare backdrop
                if (!details.open) {
                    prepareOpen();
                    details.dataset.rkBentoState = prefersReduced ? '' : 'opening';
                    return;
                }

                // Smooth close animation (JS enhancement)
                if (prefersReduced) return;
                event.preventDefault();
                closeAnimated(details);
            });
        }

        details.addEventListener('toggle', () => {
            // Always cleanup modal listeners when state changes
            const cleanup = modalParallaxCleanup.get(details);
            if (cleanup) {
                cleanup();
                modalParallaxCleanup.delete(details);
            }

            stopRunningAnimations(details);

            if (!details.open) {
                const surface = details.querySelector<HTMLElement>('[data-rk-bento-surface]');
                const backdrop = details.querySelector<HTMLElement>('[data-rk-bento-backdrop]');
                if (surface) {
                    surface.style.opacity = '';
                    surface.style.transform = '';
                }
                if (backdrop) backdrop.style.opacity = '';
                details.dataset.rkBentoState = '';
                if (!items.some((d) => d.open)) unlockScroll();
                return;
            }

            lockScroll();

            // Only allow one open at a time (JS enhancement)
            items.forEach((other) => {
                if (other !== details) other.open = false;
            });

            const surface = details.querySelector<HTMLElement>('[data-rk-bento-surface]');
            const backdrop = details.querySelector<HTMLElement>('[data-rk-bento-backdrop]');
            const media = details.querySelector<HTMLElement>('[data-rk-bento-media]');

            if (!prefersReduced && surface && backdrop) {
                const seq = nextSeq(details);
                details.dataset.rkBentoState = 'opening';

                const aside = details.querySelector<HTMLElement>('[data-rk-bento-aside]');

                if (typeof surface.animate !== 'function') {
                    details.dataset.rkBentoState = 'open';
                    return;
                }

                // Start from hidden state
                surface.style.opacity = '0';
                surface.style.transform = 'scale(0.98)';
                backdrop.style.opacity = '0';
                if (aside) {
                    aside.style.opacity = '0';
                    aside.style.transform = 'translateX(-30px)';
                }
                void surface.getBoundingClientRect();

                // Premium spring-like easing
                const easing = 'cubic-bezier(0.16, 1, 0.3, 1)';

                // Backdrop fades in first
                const backdropAnimation = backdrop.animate(
                    [{ opacity: 0 }, { opacity: 1 }],
                    { duration: 400, easing: 'ease-out', fill: 'forwards' }
                );

                // Surface scales up with spring effect
                const surfaceAnimation = surface.animate(
                    [
                        { opacity: 0, transform: 'scale(0.98)' },
                        { opacity: 1, transform: 'scale(1)' },
                    ],
                    { duration: 550, easing, fill: 'forwards' }
                );

                // Aside slides in after surface starts (staggered entrance)
                if (aside) {
                    aside.animate(
                        [
                            { opacity: 0, transform: 'translateX(-30px)' },
                            { opacity: 1, transform: 'translateX(0)' },
                        ],
                        { duration: 500, easing, fill: 'forwards', delay: 150 }
                    );
                }

                runningAnimations.set(details, {
                    clip: surfaceAnimation,
                    fade: backdropAnimation,
                    finished: Promise.allSettled([surfaceAnimation.finished, backdropAnimation.finished]),
                });

                surfaceAnimation.finished
                    .then(() => {
                        if (!isSeq(details, seq)) return;
                        if (!details.open) return;
                        details.dataset.rkBentoState = 'open';
                        // Clear inline styles, let CSS take over
                        surface.style.opacity = '';
                        surface.style.transform = '';
                        backdrop.style.opacity = '';
                        if (aside) {
                            aside.style.opacity = '';
                            aside.style.transform = '';
                        }
                    })
                    .catch(() => {
                        // cancelled
                    })
                    .finally(() => {
                        if (!isSeq(details, seq)) return;
                        stopRunningAnimations(details);
                    });
            } else {
                details.dataset.rkBentoState = 'open';
            }

            const modalImg = details.querySelector<HTMLElement>('[data-rk-bento-modal-img]');
            const cleanupFns: Array<() => void> = [];

            // Click on the image area closes (JS-only quality-of-life enhancement)
            if (!prefersReduced && media) {
                const onMediaClick = () => closeAnimated(details);
                media.addEventListener('click', onMediaClick);
                cleanupFns.push(() => media.removeEventListener('click', onMediaClick));
            }

            if (!prefersReduced && media && modalImg) {
                let raf = 0;
                let lastEvent: PointerEvent | null = null;

                const onMove = (event: PointerEvent) => {
                    if (event.pointerType && event.pointerType !== 'mouse') return;
                    lastEvent = event;
                    if (raf) return;
                    raf = window.requestAnimationFrame(() => {
                        raf = 0;
                        if (!lastEvent) return;

                        const rect = media.getBoundingClientRect();
                        const x = (lastEvent.clientX - rect.left) / Math.max(1, rect.width);
                        const y = (lastEvent.clientY - rect.top) / Math.max(1, rect.height);
                        const dx = (x - 0.5) * 14;
                        const dy = (y - 0.5) * 10;
                        (modalImg as HTMLElement).style.setProperty('--rk-bento-img-x', `${dx.toFixed(2)}px`);
                        (modalImg as HTMLElement).style.setProperty('--rk-bento-img-y', `${dy.toFixed(2)}px`);
                    });
                };

                const onLeave = () => {
                    if (raf) {
                        window.cancelAnimationFrame(raf);
                        raf = 0;
                    }
                    lastEvent = null;
                    (modalImg as HTMLElement).style.setProperty('--rk-bento-img-x', '0px');
                    (modalImg as HTMLElement).style.setProperty('--rk-bento-img-y', '0px');
                };

                media.addEventListener('pointermove', onMove);
                media.addEventListener('pointerleave', onLeave);

                cleanupFns.push(() => {
                    media.removeEventListener('pointermove', onMove);
                    media.removeEventListener('pointerleave', onLeave);
                    onLeave();
                });
            }

            if (cleanupFns.length > 0) {
                modalParallaxCleanup.set(details, () => cleanupFns.forEach((fn) => fn()));
            }
        });
    });

    // Scroll parallax for card images (JS-only enhancement)
    const cardImages = items
        .map((details) => details.querySelector<HTMLElement>('[data-rk-bento-img]'))
        .filter(Boolean) as HTMLElement[];

    if (prefersReduced || cardImages.length === 0) return;

    let ticking = false;
    const update = () => {
        ticking = false;
        const viewportH = window.innerHeight || 1;

        cardImages.forEach((img) => {
            const card = img.closest<HTMLDetailsElement>('details.rk-bento-item');
            if (!card || card.open) return;

            const rect = card.getBoundingClientRect();
            const midpoint = rect.top + rect.height / 2;
            const progress = (midpoint - viewportH / 2) / viewportH;
            const clamped = Math.max(-1, Math.min(1, progress));
            const y = clamped * -12;
            cardParallaxY.set(card, y);
            img.style.transform = `translate3d(0, ${y}px, 0) scale(${cardParallaxScale})`;
        });
    };

    const schedule = () => {
        if (ticking) return;
        ticking = true;
        window.requestAnimationFrame(update);
    };

    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    schedule();
}

function enhanceProductViewTransitions() {
    if (!('viewTransitionName' in document.documentElement.style)) return;

    const storageKey = 'rk-product-vt';
    const transitionName = 'rk-product-media';
    const storage = {
        get: (): null | string => {
            try {
                return sessionStorage.getItem(storageKey);
            } catch {
                return null;
            }
        },
        set: (value: string) => {
            try {
                sessionStorage.setItem(storageKey, value);
            } catch {
                // ignore
            }
        },
        clear: () => {
            try {
                sessionStorage.removeItem(storageKey);
            } catch {
                // ignore
            }
        },
    };

    const hero = document.querySelector<HTMLElement>('[data-rk-product-hero]');
    const pending = storage.get();
    if (pending && hero) {
        hero.style.setProperty('view-transition-name', pending);
    }
    if (pending) {
        storage.clear();
    }

    const links = Array.from(document.querySelectorAll<HTMLAnchorElement>('[data-rk-product-link]'));
    if (links.length === 0) return;

    const clearActive = () => {
        const current = Array.from(document.querySelectorAll<HTMLElement>('[data-rk-vt-active="1"]'));
        if (current.length === 0) return;
        current.forEach((el) => {
            el.style.removeProperty('view-transition-name');
            el.removeAttribute('data-rk-vt-active');
        });
    };

    links.forEach((link) => {
        link.addEventListener('click', (event) => {
            if (event.defaultPrevented) return;
            if (link.target && link.target !== '_self') return;
            if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
            if (link.origin !== window.location.origin) return;

            const card = link.closest<HTMLElement>('details.rk-bento-item[data-rk-bento="1"]');
            if (!card) return;

            const media =
                card.querySelector<HTMLElement>('[data-rk-bento-card-media]') ??
                card.querySelector<HTMLElement>('[data-rk-bento-img]') ??
                card.querySelector<HTMLElement>('[data-rk-bento-media]');

            if (!media) return;

            clearActive();
            media.style.setProperty('view-transition-name', transitionName);
            media.setAttribute('data-rk-vt-active', '1');
            storage.set(transitionName);
        });
    });
}

function enhanceRecaptcha() {
    const widgets = Array.from(document.querySelectorAll<HTMLElement>('[data-rk-recaptcha="v3"]'));
    if (widgets.length === 0) return;

    const first = widgets[0];
    if (!first) return;
    const siteKey = first.dataset.sitekey || '';
    if (!siteKey) return;

    const existing = document.querySelector<HTMLScriptElement>('script[src*="recaptcha/api.js"]');
    if (existing) return;

    const script = document.createElement('script');
    script.src = `https://www.google.com/recaptcha/api.js?render=${encodeURIComponent(siteKey)}`;
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);

    const wireForms = () => {
        widgets.forEach((widget) => {
            const form = widget.closest<HTMLFormElement>('form');
            if (!form) return;

            const action = widget.dataset.action || 'contact_form';
            const input = widget.querySelector<HTMLInputElement>('input[name="g-recaptcha-response"]');
            if (!input) return;

            form.addEventListener('submit', (event) => {
                if (form.dataset.rkRecaptchaSubmitting === '1') return;
                const grecaptcha = (window as { grecaptcha?: { ready: (cb: () => void) => void; execute: (key: string, options: { action: string }) => Promise<string> } }).grecaptcha;
                if (!grecaptcha) return;

                event.preventDefault();
                form.dataset.rkRecaptchaSubmitting = '1';

                grecaptcha.ready(() => {
                    grecaptcha
                        .execute(siteKey, { action })
                        .then((token: string) => {
                            input.value = token;
                            form.dataset.rkRecaptchaSubmitting = '0';
                            form.submit();
                        })
                        .catch(() => {
                            form.dataset.rkRecaptchaSubmitting = '0';
                            form.submit();
                        });
                });
            });
        });
    };

    script.addEventListener('load', wireForms);
    wireForms();
}

function enhanceCookieBanner() {
    const banners = Array.from(document.querySelectorAll<HTMLElement>('[data-rk-cookie-banner="1"]'));
    if (banners.length === 0) return;

    const applyConsent = (version: string, prefs: Record<string, boolean>, timestamp: number) => {
        document.documentElement.dataset.rkConsentVersion = version;
        Object.entries(prefs).forEach(([key, value]) => {
            document.documentElement.dataset[`rkConsent${key[0]?.toUpperCase()}${key.slice(1)}`] = value ? '1' : '0';
        });

        (window as unknown as {
            renderKitConsent?: {
                version: string;
                timestamp: number;
                prefs: Record<string, boolean>;
                has: (key: string) => boolean;
            };
        }).renderKitConsent = {
            version,
            timestamp,
            prefs,
            has: (key: string) => Boolean(prefs[key]),
        };
    };

    const updateCookieGates = (version: string, prefs: Record<string, boolean>) => {
        const gates = Array.from(document.querySelectorAll<HTMLElement>('[data-rk-cookie-gate="1"]'));
        gates.forEach((gate) => {
            const gateVersion = gate.dataset.rkCookieVersion || '1';
            if (gateVersion !== version) return;
            const required = gate.dataset.rkCookieRequires || '';
            const allowed = required === '' || Boolean(prefs[required]);
            gate.dataset.rkCookieAllowed = allowed ? '1' : '0';
        });
    };

    banners.forEach((banner) => {
        const version = banner.dataset.rkCookieVersion || '1';
        const cookieName = `rk_cookie_consent_v${version}`;
        const cookieValue = getCookie(cookieName);
        let hasConsent = false;
        if (cookieValue) {
            try {
                const parsed = JSON.parse(cookieValue) as { version?: string; timestamp?: number; prefs?: Record<string, boolean> };
                if (parsed && parsed.version === version && parsed.prefs) {
                    applyConsent(version, parsed.prefs, parsed.timestamp || Date.now());
                    updateCookieGates(version, parsed.prefs);
                    banner.dataset.rkCookieHidden = '1';
                    banner.setAttribute('aria-hidden', 'true');
                    banner.style.display = 'none';
                    hasConsent = true;
                }
            } catch {
                // ignore malformed cookie
            }
        }

        const settingsPanel = banner.querySelector<HTMLDetailsElement>('[data-rk-cookie-settings]');
        const manageBtn = banner.querySelector<HTMLButtonElement>('[data-rk-cookie-manage]');
        const acceptBtn = banner.querySelector<HTMLButtonElement>('[data-rk-cookie-accept]');
        const rejectBtn = banner.querySelector<HTMLButtonElement>('[data-rk-cookie-reject]');
        const saveBtn = banner.querySelector<HTMLButtonElement>('[data-rk-cookie-save]');

        const settingInputs = Array.from(banner.querySelectorAll<HTMLInputElement>('[data-rk-cookie-setting]'));
        const requiredIds = settingInputs
            .filter((input) => input.disabled)
            .map((input) => input.dataset.rkCookieSetting || '')
            .filter(Boolean);

        const setAndHide = (prefs: Record<string, boolean>) => {
            const payload = {
                version,
                timestamp: Date.now(),
                prefs,
            };
            setCookie(cookieName, JSON.stringify(payload));
            applyConsent(version, prefs, payload.timestamp);
            updateCookieGates(version, prefs);
            document.dispatchEvent(new CustomEvent('renderkit:consent-changed', { detail: { prefs, version } }));
            banner.dataset.rkCookieHidden = '1';
            banner.setAttribute('aria-hidden', 'true');
            window.setTimeout(() => {
                banner.style.display = 'none';
            }, 350);
        };

        manageBtn?.addEventListener('click', (event) => {
            event.preventDefault();
            if (settingsPanel) {
                settingsPanel.open = !settingsPanel.open;
            }
        });

        acceptBtn?.addEventListener('click', (event) => {
            event.preventDefault();
            const prefs: Record<string, boolean> = {};
            settingInputs.forEach((input) => {
                const id = input.dataset.rkCookieSetting;
                if (id) prefs[id] = true;
            });
            setAndHide(prefs);
        });

        rejectBtn?.addEventListener('click', (event) => {
            event.preventDefault();
            const prefs: Record<string, boolean> = {};
            settingInputs.forEach((input) => {
                const id = input.dataset.rkCookieSetting;
                if (id) prefs[id] = requiredIds.includes(id);
            });
            setAndHide(prefs);
        });

        saveBtn?.addEventListener('click', (event) => {
            event.preventDefault();
            const prefs: Record<string, boolean> = {};
            settingInputs.forEach((input) => {
                const id = input.dataset.rkCookieSetting;
                if (id) prefs[id] = input.checked || requiredIds.includes(id);
            });
            setAndHide(prefs);
        });

        if (hasConsent) {
            const summary = banner.querySelector<HTMLElement>('.rk-cookie-banner__settings-toggle');
            if (summary && settingsPanel) {
                settingsPanel.open = false;
            }
        }
    });

    const openButtons = Array.from(document.querySelectorAll<HTMLButtonElement>('[data-rk-cookie-open]'));
    openButtons.forEach((button) => {
        button.addEventListener('click', (event) => {
            event.preventDefault();
            banners.forEach((banner) => {
                banner.dataset.rkCookieHidden = '0';
                banner.removeAttribute('aria-hidden');
                banner.style.display = '';
                const settingsPanel = banner.querySelector<HTMLDetailsElement>('[data-rk-cookie-settings]');
                if (settingsPanel) settingsPanel.open = true;
            });
        });
    });
}

function enhanceCookieGates() {
    const gates = Array.from(document.querySelectorAll<HTMLElement>('[data-rk-cookie-gate="1"]'));
    if (gates.length === 0) return;

    // Uses shared getCookie utility

    gates.forEach((gate) => {
        const version = gate.dataset.rkCookieVersion || '1';
        const cookieValue = getCookie(`rk_cookie_consent_v${version}`);
        if (!cookieValue) return;
        try {
            const parsed = JSON.parse(cookieValue) as { prefs?: Record<string, boolean> };
            if (!parsed?.prefs) return;
            const required = gate.dataset.rkCookieRequires || '';
            const allowed = required === '' || Boolean(parsed.prefs[required]);
            gate.dataset.rkCookieAllowed = allowed ? '1' : '0';
        } catch {
            // ignore
        }
    });
}

function enhanceForge() {
    const endpoint = new URL('/wp-json/renderkit/v1/forge/events', window.location.origin).toString();
    const maxBatch = 20;
    const flushDelay = 1000;
    const queueLimit = 100;
    const pagePath = window.location.pathname || '/';
    let queue: Array<{ type: string; block?: string; page?: string; target?: string; depth?: number }> = [];
    let flushTimer: number | null = null;
    let started = false;

    const hasConsent = () => {
        const consent = (window as unknown as { renderKitConsent?: { has?: (key: string) => boolean } }).renderKitConsent;
        if (consent?.has && consent.has('analytics')) return true;
        return document.documentElement.dataset.rkConsentAnalytics === '1';
    };

    const sendBatch = (events: typeof queue, useBeacon: boolean) => {
        if (events.length === 0) return;
        const body = JSON.stringify({ events });

        if (useBeacon && typeof navigator.sendBeacon === 'function') {
            const blob = new Blob([body], { type: 'application/json' });
            navigator.sendBeacon(endpoint, blob);
            return;
        }

        fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body,
            credentials: 'same-origin',
            keepalive: true,
        }).catch(() => {
            // ignore network errors
        });
    };

    const flush = (useBeacon = false) => {
        if (flushTimer !== null) {
            window.clearTimeout(flushTimer);
            flushTimer = null;
        }
        if (queue.length === 0) return;
        const batch = queue.slice(0, maxBatch);
        queue = queue.slice(maxBatch);
        sendBatch(batch, useBeacon);
        if (queue.length > 0) {
            flushTimer = window.setTimeout(() => flush(false), flushDelay);
        }
    };

    const enqueue = (event: { type: string; block?: string; page?: string; target?: string; depth?: number }) => {
        if (!hasConsent()) return;
        if (queue.length >= queueLimit) {
            queue.shift();
        }
        queue.push({ ...event, page: pagePath });
        if (!flushTimer) {
            flushTimer = window.setTimeout(() => flush(false), flushDelay);
        }
    };

    const startTracking = () => {
        if (started) return;
        started = true;

        enqueue({ type: 'page_view' });

        const seenBlocks = new WeakSet<Element>();
        const blocks = Array.from(document.querySelectorAll<HTMLElement>('[data-renderkit-block]'));
        if (blocks.length > 0 && 'IntersectionObserver' in window) {
            const observer = new IntersectionObserver(
                (entries) => {
                    entries.forEach((entry) => {
                        if (!entry.isIntersecting) return;
                        const target = entry.target as HTMLElement;
                        if (seenBlocks.has(target)) return;
                        seenBlocks.add(target);
                        const block = target.dataset.renderkitBlock || '';
                        if (block) {
                            enqueue({ type: 'block_view', block });
                        }
                    });
                },
                { threshold: 0.35 }
            );
            blocks.forEach((block) => observer.observe(block));
        }

        document.addEventListener('click', (event) => {
            const target = event.target as HTMLElement | null;
            if (!target) return;
            const clickable = target.closest<HTMLElement>('a, button, [data-rk-track], [data-rk-cta]');
            if (!clickable) return;
            const blockEl = clickable.closest<HTMLElement>('[data-renderkit-block]');
            const block = blockEl?.dataset.renderkitBlock || '';
            const label =
                clickable.getAttribute('data-rk-track') ||
                clickable.getAttribute('data-rk-cta') ||
                clickable.getAttribute('aria-label') ||
                (clickable.textContent || '').trim() ||
                clickable.tagName.toLowerCase();
            const trimmed = label.length > 80 ? label.slice(0, 80) : label;
            enqueue({ type: 'click', block, target: trimmed });
        });

        const depthMarkers = [0.25, 0.5, 0.75, 1];
        const seenDepths = new Set<number>();
        let ticking = false;

        const measureDepth = () => {
            ticking = false;
            const doc = document.documentElement;
            const scrollHeight = doc.scrollHeight || 0;
            const viewport = window.innerHeight || 0;
            const scrollTop = window.scrollY || doc.scrollTop || 0;
            if (scrollHeight <= 0) return;
            const depth = Math.min(1, (scrollTop + viewport) / scrollHeight);
            depthMarkers.forEach((marker) => {
                if (depth >= marker && !seenDepths.has(marker)) {
                    seenDepths.add(marker);
                    enqueue({ type: 'scroll_depth', depth: marker });
                }
            });
        };

        const onScroll = () => {
            if (!ticking) {
                window.requestAnimationFrame(measureDepth);
                ticking = true;
            }
        };

        window.addEventListener('scroll', onScroll, { passive: true });
        window.addEventListener('resize', onScroll, { passive: true });
        onScroll();

        window.addEventListener('pagehide', () => flush(true));
    };

    if (hasConsent()) {
        startTracking();
    } else {
        document.addEventListener('renderkit:consent-changed', () => {
            if (hasConsent()) {
                startTracking();
            }
        });
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Shopping Cart Enhancements
// ─────────────────────────────────────────────────────────────────────────────

interface CartState {
    items: Array<{ id: number; quantity: number }>;
    count: number;
    total: number;
}

function enhanceCart() {
    const cartConfig = (window as unknown as { renderKitCart?: { restUrl: string; nonce: string; count: number } }).renderKitCart;
    if (!cartConfig) return;

    const { restUrl, nonce } = cartConfig;
    let cartState: CartState = { items: [], count: cartConfig.count || 0, total: 0 };

    // Load from localStorage for instant UI
    const loadFromStorage = () => {
        try {
            const stored = localStorage.getItem('rk_cart');
            if (stored) {
                const parsed = JSON.parse(stored);
                if (parsed && typeof parsed.count === 'number') {
                    cartState = parsed;
                }
            }
        } catch {
            // ignore
        }
    };

    const saveToStorage = () => {
        try {
            localStorage.setItem('rk_cart', JSON.stringify(cartState));
        } catch {
            // ignore
        }
    };

    // Update all cart badges on the page
    const updateCartBadges = () => {
        const badges = document.querySelectorAll<HTMLElement>('[data-rk-cart-count]');
        badges.forEach((badge) => {
            badge.textContent = String(cartState.count);
            // Use data-attributes for state
            if (cartState.count === 0) {
                badge.dataset.empty = '';
            } else {
                delete badge.dataset.empty;
            }
            // Bump animation
            delete badge.dataset.bumping;
            void badge.offsetHeight; // Force reflow
            badge.dataset.bumping = '';
        });
    };

    // Make API request
    const apiRequest = async (endpoint: string, data?: object): Promise<CartState | null> => {
        try {
            const response = await fetch(`${restUrl}${endpoint}`, {
                method: data ? 'POST' : 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'X-WP-Nonce': nonce,
                },
                body: data ? JSON.stringify(data) : undefined,
            });

            if (!response.ok) return null;

            const json = await response.json();
            if (json && json.success) {
                cartState = {
                    items: json.items || [],
                    count: json.count || 0,
                    total: json.total || 0,
                };
                saveToStorage();
                return cartState;
            }
            return null;
        } catch {
            return null;
        }
    };

    // Show feedback on add-to-cart button
    const showAddedFeedback = (button: HTMLElement) => {
        const originalHTML = button.innerHTML;
        button.setAttribute('data-rk-cart-added', '1');
        button.innerHTML = '<i class="fa-solid fa-check" aria-hidden="true"></i> Hinzugefügt';

        setTimeout(() => {
            button.removeAttribute('data-rk-cart-added');
            button.innerHTML = originalHTML;
        }, 1500);
    };

    // Handle add-to-cart clicks
    document.addEventListener('click', async (event) => {
        const button = (event.target as HTMLElement).closest<HTMLElement>('[data-rk-add-to-cart]');
        if (!button) return;

        event.preventDefault();

        if (button.hasAttribute('data-rk-cart-adding')) return;
        button.setAttribute('data-rk-cart-adding', '1');

        const productId = Number(button.getAttribute('data-rk-add-to-cart'));
        if (!productId) {
            button.removeAttribute('data-rk-cart-adding');
            return;
        }

        // Optimistic update
        cartState.count += 1;
        updateCartBadges();

        const result = await apiRequest('/add', { product_id: productId, quantity: 1 });
        button.removeAttribute('data-rk-cart-adding');

        if (result) {
            showAddedFeedback(button);
            updateCartBadges();
        } else {
            // Rollback
            cartState.count -= 1;
            updateCartBadges();
        }
    });

    // Handle quantity changes on cart page (dynamic, no reload)
    document.addEventListener('click', async (event) => {
        const decrease = (event.target as HTMLElement).closest<HTMLElement>('[data-rk-cart-qty-decrease]');
        const increase = (event.target as HTMLElement).closest<HTMLElement>('[data-rk-cart-qty-increase]');

        if (!decrease && !increase) return;
        event.preventDefault();

        const button = decrease || increase;
        if (!button) return;

        const productId = Number(button.getAttribute(decrease ? 'data-rk-cart-qty-decrease' : 'data-rk-cart-qty-increase'));
        if (!productId) return;

        const valueEl = document.querySelector<HTMLElement>(`[data-rk-cart-qty-value="${productId}"]`);
        const currentQty = valueEl ? parseInt(valueEl.textContent || '1', 10) : 1;
        const newQty = decrease ? currentQty - 1 : currentQty + 1;

        if (newQty < 1) {
            // Remove item with animation
            const item = document.querySelector<HTMLElement>(`[data-rk-cart-item="${productId}"]`);
            if (item) {
                item.style.transition = 'opacity 0.3s, transform 0.3s';
                item.style.opacity = '0';
                item.style.transform = 'translateX(-20px)';
                await apiRequest('/remove', { product_id: productId });
                setTimeout(() => item.remove(), 300);
                updateCartUI();
            }
        } else {
            // Update quantity in DOM immediately
            if (valueEl) {
                valueEl.textContent = String(newQty);
                valueEl.style.transform = 'scale(1.2)';
                setTimeout(() => { valueEl.style.transform = ''; }, 150);
            }
            await apiRequest('/update', { product_id: productId, quantity: newQty });
            updateCartUI();
        }
        updateCartBadges();
    });

    // Handle remove item (dynamic, no reload)
    document.addEventListener('click', async (event) => {
        const button = (event.target as HTMLElement).closest<HTMLElement>('[data-rk-cart-remove]');
        if (!button) return;
        event.preventDefault();

        const productId = Number(button.getAttribute('data-rk-cart-remove'));
        if (!productId) return;

        const item = document.querySelector<HTMLElement>(`[data-rk-cart-item="${productId}"]`);
        if (item) {
            item.style.transition = 'opacity 0.3s, transform 0.3s, max-height 0.3s';
            item.style.opacity = '0';
            item.style.transform = 'translateX(-20px)';
            await apiRequest('/remove', { product_id: productId });
            setTimeout(() => item.remove(), 300);
            updateCartBadges();
            updateCartUI();
        }
    });

    // Handle clear cart (dynamic, no reload)
    document.addEventListener('click', async (event) => {
        const button = (event.target as HTMLElement).closest<HTMLElement>('[data-rk-cart-clear]');
        if (!button) return;
        event.preventDefault();

        const items = document.querySelectorAll<HTMLElement>('[data-rk-cart-item]');
        items.forEach((item, index) => {
            item.style.transition = `opacity 0.3s ${index * 0.05}s, transform 0.3s ${index * 0.05}s`;
            item.style.opacity = '0';
            item.style.transform = 'translateX(-20px)';
        });

        await apiRequest('/clear');

        setTimeout(() => {
            const cartBlock = document.querySelector('[data-rk-cart-block]');
            if (cartBlock) {
                window.location.reload(); // Reload to show empty state
            }
        }, 400);
    });

    // Update cart totals and UI
    const updateCartUI = () => {
        // Calculate totals from DOM
        const items = document.querySelectorAll<HTMLElement>('[data-rk-cart-item]');
        let total = 0;
        let count = 0;

        items.forEach((item) => {
            const productId = Number(item.getAttribute('data-rk-cart-item'));
            const qtyEl = document.querySelector<HTMLElement>(`[data-rk-cart-qty-value="${productId}"]`);
            const qty = qtyEl ? parseInt(qtyEl.textContent || '1', 10) : 1;

            // Get price from item element
            const priceAttr = item.getAttribute('data-rk-product-price');
            const price = priceAttr ? parseFloat(priceAttr) : 0;

            // Update line total
            const totalEl = item.querySelector<HTMLElement>('.rk-cart__item-total');
            if (totalEl) {
                totalEl.textContent = `€${(price * qty).toFixed(2).replace('.', ',')}`;
            }

            total += price * qty;
            count += qty;
        });

        // Update summary
        const subtotalEl = document.querySelector<HTMLElement>('[data-rk-cart-subtotal]');
        const totalEl = document.querySelector<HTMLElement>('[data-rk-cart-total]');
        if (subtotalEl) subtotalEl.textContent = `€${total.toFixed(2).replace('.', ',')}`;
        if (totalEl) totalEl.textContent = `€${total.toFixed(2).replace('.', ',')}`;

        cartState.count = count;
        cartState.total = total;
        saveToStorage();
    };

    // Initialize
    loadFromStorage();
    updateCartBadges();
}

onReady(() => {
    enhanceStickyNavigation();
    enhanceNavMobileMenu();
    enhanceHeroScrollAnimations();
    enhanceSwipers();
    enhanceProductGridBento();
    enhanceProductViewTransitions();
    enhanceRecaptcha();
    enhanceCookieBanner();
    enhanceCookieGates();
    enhanceForge();
    enhanceCart();
});

