/**
 * Navigation Block - Frontend View Component
 * 
 * Premium navigation with scroll-based transparency and smooth animations.
 */

import React, { useState, useEffect } from 'react';
import { motion, useScroll, useTransform } from 'motion/react';
import { ShoppingBag, Menu, X } from 'lucide-react';

interface MenuItem {
    id: number;
    title: string;
    url: string;
}

interface NavAttributes {
    menuItems: MenuItem[];
    theme: 'dark' | 'light';
    showLogo: boolean;
    logoUrl: string;
    siteName: string;
    sticky: boolean;
    showCart: boolean;
}

interface ViewProps {
    attributes: NavAttributes;
    className?: string;
}

export function View({ attributes, className }: ViewProps): JSX.Element {
    const { menuItems = [], showLogo, logoUrl, siteName, sticky, showCart = true } = attributes;
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMobileOpen, setIsMobileOpen] = useState(false);

    const { scrollY } = useScroll();
    const backgroundColor = useTransform(
        scrollY,
        [0, 100],
        ['rgba(255, 254, 249, 0)', 'rgba(255, 254, 249, 0.95)']
    );

    useEffect(() => {
        const handleScroll = () => setIsScrolled(window.scrollY > 50);
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Colors - warm anthracite for text, champagne gold for accents
    const textColor = '#1A1816';
    const textMuted = 'rgba(26, 24, 22, 0.6)';
    const accentColor = '#B8975A';

    return (
        <motion.nav
            className={`renderkit-block renderkit-nav ${sticky ? 'fixed top-0 left-0 right-0 z-50' : 'relative'} ${className || ''}`}
            style={{
                backgroundColor: sticky ? backgroundColor : 'transparent',
                backdropFilter: isScrolled ? 'blur(20px)' : 'blur(0px)',
                WebkitBackdropFilter: isScrolled ? 'blur(20px)' : 'blur(0px)',
            }}
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        >
            <div style={{
                maxWidth: '1600px',
                margin: '0 auto',
                padding: '1.5rem 2rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
            }}>
                {/* Logo / Site Name */}
                {showLogo && (
                    <motion.a
                        href="/"
                        style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', textDecoration: 'none' }}
                        whileHover={{ x: 2 }}
                        transition={{ duration: 0.2 }}
                    >
                        {logoUrl ? (
                            <img src={logoUrl} alt={siteName} style={{ height: '2rem', width: 'auto' }} />
                        ) : null}
                        <span style={{
                            fontSize: '0.875rem',
                            letterSpacing: '0.3em',
                            textTransform: 'uppercase',
                            color: textColor,
                            fontWeight: 500,
                        }}>
                            {siteName}
                        </span>
                    </motion.a>
                )}

                {/* Desktop Menu */}
                <div style={{ display: 'none', gap: '3rem', alignItems: 'center' }} className="lg-flex">
                    {menuItems.map((item, i) => (
                        <motion.a
                            key={item.id}
                            href={item.url}
                            style={{
                                fontSize: '0.875rem',
                                letterSpacing: '0.1em',
                                textTransform: 'uppercase',
                                color: textMuted,
                                textDecoration: 'none',
                                position: 'relative',
                                transition: 'color 0.5s ease',
                            }}
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 * i, duration: 0.6 }}
                            whileHover={{ color: textColor }}
                        >
                            {item.title}
                            <motion.span
                                style={{
                                    position: 'absolute',
                                    bottom: '-4px',
                                    left: 0,
                                    height: '1px',
                                    backgroundColor: accentColor,
                                    width: 0,
                                }}
                                whileHover={{ width: '100%' }}
                                transition={{ duration: 0.5 }}
                            />
                        </motion.a>
                    ))}
                </div>

                {/* Right side - Cart + Mobile Toggle */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    {showCart && (
                        <motion.button
                            style={{
                                position: 'relative',
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                padding: '0.5rem',
                            }}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            <ShoppingBag style={{ width: '1.25rem', height: '1.25rem', color: textColor }} strokeWidth={1.5} />
                            <motion.span
                                style={{
                                    position: 'absolute',
                                    top: '0',
                                    right: '0',
                                    width: '0.5rem',
                                    height: '0.5rem',
                                    backgroundColor: accentColor,
                                    borderRadius: '50%',
                                    opacity: 0,
                                }}
                                whileHover={{ opacity: 1 }}
                                transition={{ duration: 0.3 }}
                            />
                        </motion.button>
                    )}

                    {/* Mobile menu button */}
                    <button
                        onClick={() => setIsMobileOpen(!isMobileOpen)}
                        style={{
                            display: 'none',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            padding: '0.5rem',
                        }}
                        className="lg-hidden"
                        aria-label="Toggle menu"
                    >
                        {isMobileOpen ? (
                            <X style={{ width: '1.5rem', height: '1.5rem', color: textColor }} />
                        ) : (
                            <Menu style={{ width: '1.5rem', height: '1.5rem', color: textColor }} />
                        )}
                    </button>
                </div>
            </div>

            {/* Mobile Menu Overlay */}
            {isMobileOpen && (
                <motion.div
                    style={{
                        position: 'fixed',
                        inset: 0,
                        top: '80px',
                        backgroundColor: '#FFFEF9',
                        zIndex: 40,
                        padding: '2rem',
                    }}
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        {menuItems.map((item, index) => (
                            <motion.a
                                key={item.id}
                                href={item.url}
                                style={{
                                    fontSize: '1.5rem',
                                    fontWeight: 300,
                                    color: textColor,
                                    textDecoration: 'none',
                                    letterSpacing: '0.05em',
                                }}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.1 }}
                                onClick={() => setIsMobileOpen(false)}
                            >
                                {item.title}
                            </motion.a>
                        ))}
                    </div>
                    <div style={{ marginTop: '2rem', width: '4rem', height: '1px', backgroundColor: accentColor }} />
                </motion.div>
            )}
        </motion.nav>
    );
}

export default View;
