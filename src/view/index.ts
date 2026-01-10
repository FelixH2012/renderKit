/**
 * RenderKit - Frontend Enhancements
 *
 * renderKit-Relay provides fully server-rendered HTML (SEO/no-JS friendly).
 * This file only adds progressive enhancements (optional).
 */

document.documentElement.classList.add('rk-js');

function onReady(callback: () => void) {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', callback, { once: true });
    } else {
        callback();
    }
}

function enhanceStickyNavigation() {
    const navs = Array.from(document.querySelectorAll<HTMLElement>('.renderkit-nav.is-sticky'));
    if (navs.length === 0) return;

    let lastScrollY = window.scrollY;
    let ticking = false;

    const update = () => {
        ticking = false;
        const scrollY = window.scrollY;
        const scrollingDown = scrollY > lastScrollY;
        const scrollingUp = scrollY < lastScrollY;

        navs.forEach((nav) => {
            // Add 'is-scrolled' class when scrolled past 20px (pill transformation)
            nav.classList.toggle('is-scrolled', scrollY > 20);

            // Hide/show based on scroll direction
            if (scrollY > 100) {
                // Only apply hide/show logic when scrolled past 100px
                if (scrollingDown) {
                    nav.classList.add('is-hidden');
                } else if (scrollingUp) {
                    nav.classList.remove('is-hidden');
                }
            } else {
                // Always show navbar when near the top
                nav.classList.remove('is-hidden');
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

function enhanceNavMobileDetails() {
    const detailsList = Array.from(document.querySelectorAll<HTMLDetailsElement>('.renderkit-nav__mobile-details'));
    if (detailsList.length === 0) return;

    detailsList.forEach((details) => {
        details.addEventListener('click', (event) => {
            const target = event.target as HTMLElement | null;
            if (!target) return;

            const link = target.closest<HTMLAnchorElement>('.renderkit-nav__mobile-link');
            if (!link) return;

            details.open = false;
        });
    });

    window.addEventListener('keydown', (event) => {
        if (event.key !== 'Escape') return;
        detailsList.forEach((details) => (details.open = false));
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

    // Close on Escape (JS-only enhancement; <details> still works without it)
    window.addEventListener('keydown', (event) => {
        if (event.key !== 'Escape') return;
        items.forEach((details) => (details.open = false));
    });

    const fromRects = new WeakMap<HTMLDetailsElement, DOMRect>();
    const modalParallaxCleanup = new WeakMap<HTMLDetailsElement, () => void>();
    const runningAnimations = new WeakMap<
        HTMLDetailsElement,
        { clip?: Animation; fade?: Animation; finished?: Promise<unknown> }
    >();
    const animationSeq = new WeakMap<HTMLDetailsElement, number>();
    let seqCounter = 0;
    let scrollLock: null | { y: number; styles: Partial<CSSStyleDeclaration> } = null;

    const easingOpen = 'cubic-bezier(0.16, 1, 0.3, 1)';
    const easingClose = 'cubic-bezier(0.2, 1, 0.2, 1)';

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

    const rectToInset = (rect: DOMRect): string => {
        const vw = window.innerWidth || 0;
        const vh = window.innerHeight || 0;
        const top = Math.max(0, Math.min(vh, rect.top));
        const left = Math.max(0, Math.min(vw, rect.left));
        const right = Math.max(0, Math.min(vw, vw - rect.right));
        const bottom = Math.max(0, Math.min(vh, vh - rect.bottom));
        return `inset(${top}px ${right}px ${bottom}px ${left}px round 0px)`;
    };

    const lockScroll = () => {
        if (scrollLock) return;
        const y = window.scrollY || 0;
        const scrollbarWidth = Math.max(0, (window.innerWidth || 0) - document.documentElement.clientWidth);
        scrollLock = {
            y,
            styles: {
                position: document.body.style.position,
                top: document.body.style.top,
                left: document.body.style.left,
                right: document.body.style.right,
                width: document.body.style.width,
                paddingRight: document.body.style.paddingRight,
            },
        };

        document.body.style.position = 'fixed';
        document.body.style.top = `-${y}px`;
        document.body.style.left = '0';
        document.body.style.right = '0';
        document.body.style.width = '100%';
        if (scrollbarWidth > 0) document.body.style.paddingRight = `${scrollbarWidth}px`;
    };

    const unlockScroll = () => {
        if (!scrollLock) return;
        const { y, styles } = scrollLock;
        scrollLock = null;

        document.body.style.position = styles.position || '';
        document.body.style.top = styles.top || '';
        document.body.style.left = styles.left || '';
        document.body.style.right = styles.right || '';
        document.body.style.width = styles.width || '';
        document.body.style.paddingRight = styles.paddingRight || '';
        window.scrollTo(0, y);
    };

    items.forEach((details) => {
        const summary = details.querySelector<HTMLElement>('summary');
        if (summary) {
            const captureRect = () => {
                if (details.open) return;
                const card = details.querySelector<HTMLElement>('[data-rk-bento-card]') || details;
                fromRects.set(details, card.getBoundingClientRect());
            };

            summary.addEventListener('pointerdown', captureRect);

            summary.addEventListener('click', (event) => {
                // Before opening: capture the card rect for a high-quality animation.
                if (!details.open) {
                    captureRect();
                    details.dataset.rkBentoState = prefersReduced ? '' : 'opening';
                    return;
                }

                // Smooth close animation (JS enhancement). Without JS, native <details> behavior still works.
                if (prefersReduced) return;
                event.preventDefault();

                const surface = details.querySelector<HTMLElement>('[data-rk-bento-surface]');
                const modal = details.querySelector<HTMLElement>('[data-rk-bento-modal]');
                const modalImg = details.querySelector<HTMLElement>('[data-rk-bento-modal-img]');

                if (!surface || !modal) {
                    details.open = false;
                    return;
                }

                const seq = nextSeq(details);

                // Capture the current visual state so we can close smoothly even if the user closes mid-open.
                const computedSurface = window.getComputedStyle(surface);
                const computedModal = window.getComputedStyle(modal);
                const fromClip =
                    computedSurface.clipPath && computedSurface.clipPath !== 'none'
                        ? computedSurface.clipPath
                        : 'inset(0px 0px 0px 0px round 0px)';
                const parsedOpacity = Number.parseFloat(computedModal.opacity || '1');
                const fromOpacity = Number.isFinite(parsedOpacity) ? parsedOpacity : 1;

                stopRunningAnimations(details);
                modal.style.opacity = '';
                surface.style.clipPath = '';
                details.dataset.rkBentoState = 'closing';

                const cardRect = fromRects.get(details) || details.getBoundingClientRect();
                const insetTo = rectToInset(cardRect);

                if (typeof surface.animate !== 'function' || typeof modal.animate !== 'function') {
                    details.open = false;
                    return;
                }

                const durationClose = 620;
                const clipAnimation = surface.animate(
                    [{ clipPath: fromClip }, { clipPath: insetTo }],
                    { duration: durationClose, easing: easingClose, fill: 'both' }
                );

                const fadeAnimation = modal.animate(
                    [
                        { opacity: fromOpacity, offset: 0 },
                        { opacity: fromOpacity, offset: 0.55 },
                        { opacity: 0, offset: 1 },
                    ],
                    { duration: durationClose, easing: 'linear', fill: 'both' }
                );

                runningAnimations.set(details, {
                    clip: clipAnimation,
                    fade: fadeAnimation,
                    finished: Promise.allSettled([clipAnimation.finished, fadeAnimation.finished]),
                });

                if (modalImg) {
                    modalImg.style.setProperty('--rk-bento-img-x', '0px');
                    modalImg.style.setProperty('--rk-bento-img-y', '0px');
                }

                Promise.allSettled([clipAnimation.finished, fadeAnimation.finished]).finally(() => {
                    if (!isSeq(details, seq)) return;
                    details.open = false;
                    // Ensure filled WAAPI effects don't leak into the next open.
                    window.requestAnimationFrame(() => {
                        if (!isSeq(details, seq)) return;
                        stopRunningAnimations(details);
                    });
                });
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
                const modal = details.querySelector<HTMLElement>('[data-rk-bento-modal]');
                if (surface) surface.style.clipPath = '';
                if (modal) modal.style.opacity = '';
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
            const modal = details.querySelector<HTMLElement>('[data-rk-bento-modal]');
            const modalImg = details.querySelector<HTMLElement>('[data-rk-bento-modal-img]');
            const media = details.querySelector<HTMLElement>('[data-rk-bento-media]');

            if (!prefersReduced && surface && modal) {
                const seq = nextSeq(details);
                details.dataset.rkBentoState = 'opening';

                const cardRect = fromRects.get(details) || details.getBoundingClientRect();
                const insetFrom = rectToInset(cardRect);

                if (typeof surface.animate !== 'function' || typeof modal.animate !== 'function') {
                    details.dataset.rkBentoState = 'open';
                    return;
                }

                // Start hidden and clipped to the originating card rect.
                modal.style.opacity = '0';
                surface.style.clipPath = insetFrom;

                // Force styles to apply before starting animations.
                void surface.getBoundingClientRect();

                const durationOpen = 760;
                const fadeInDuration = 360;
                const clipAnimation = surface.animate(
                    [{ clipPath: insetFrom }, { clipPath: 'inset(0px 0px 0px 0px round 0px)' }],
                    { duration: durationOpen, easing: easingOpen, fill: 'both' }
                );

                const fadeAnimation = modal.animate([{ opacity: 0 }, { opacity: 1 }], {
                    duration: fadeInDuration,
                    easing: easingOpen,
                    fill: 'both',
                });

                runningAnimations.set(details, {
                    clip: clipAnimation,
                    fade: fadeAnimation,
                    finished: Promise.allSettled([clipAnimation.finished, fadeAnimation.finished]),
                });

                fadeAnimation.finished
                    .then(() => {
                        if (!isSeq(details, seq)) return;
                        if (!details.open) return;
                        if (details.dataset.rkBentoState !== 'closing') details.dataset.rkBentoState = 'open';
                    })
                    .catch(() => {
                        // no-op
                    });

                Promise.allSettled([clipAnimation.finished, fadeAnimation.finished]).finally(() => {
                    if (!isSeq(details, seq)) return;
                    surface.style.clipPath = '';
                    modal.style.opacity = '';
                    stopRunningAnimations(details);
                    if (details.open && details.dataset.rkBentoState !== 'closing') details.dataset.rkBentoState = 'open';
                });
            } else {
                details.dataset.rkBentoState = 'open';
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

                modalParallaxCleanup.set(details, () => {
                    media.removeEventListener('pointermove', onMove);
                    media.removeEventListener('pointerleave', onLeave);
                    onLeave();
                });
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
            img.style.transform = `translate3d(0, ${y}px, 0) scale(1.06)`;
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

onReady(() => {
    enhanceStickyNavigation();
    enhanceNavMobileDetails();
    enhanceHeroScrollAnimations();
    enhanceSwipers();
    enhanceProductGridBento();
});
