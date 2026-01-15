/**
 * Cart Block - Frontend View Component
 *
 * Rendered server-side via renderKit-Relay.
 */

import React from 'react';
import type { CartViewAttributes, CartItem } from './types';

interface ViewProps {
    attributes: CartViewAttributes;
    className?: string;
}

function formatPrice(value: number): string {
    return Number.isFinite(value) ? value.toFixed(2).replace('.', ',') : '0,00';
}

function CartItemRow({ item }: { item: CartItem }): JSX.Element {
    const effectivePrice = item.sale_price > 0 ? item.sale_price : item.price;
    const lineTotal = effectivePrice * item.quantity;

    return (
        <div
            className="rk-cart__item"
            data-rk-cart-item={item.id}
            data-rk-product-price={effectivePrice}
        >
            <div className="rk-cart__item-media">
                {item.image ? (
                    <img src={item.image} alt={item.title} className="rk-cart__item-img" />
                ) : (
                    <div className="rk-cart__item-placeholder">
                        <i className="fa-solid fa-box" aria-hidden="true"></i>
                    </div>
                )}
            </div>

            <div className="rk-cart__item-details">
                <a href={item.url} className="rk-cart__item-title">
                    {item.title}
                </a>
                <p className="rk-cart__item-price">
                    {item.sale_price > 0 ? (
                        <>
                            <span className="rk-cart__item-price-sale">€{formatPrice(item.sale_price)}</span>
                            <span className="rk-cart__item-price-was">€{formatPrice(item.price)}</span>
                        </>
                    ) : (
                        <>€{formatPrice(item.price)}</>
                    )}
                </p>
            </div>

            <div className="rk-cart__item-quantity">
                <button
                    type="button"
                    className="rk-cart__qty-btn"
                    data-rk-cart-qty-decrease={item.id}
                    aria-label="Menge verringern"
                >
                    <i className="fa-solid fa-minus" aria-hidden="true"></i>
                </button>
                <span className="rk-cart__qty-value" data-rk-cart-qty-value={item.id}>
                    {item.quantity}
                </span>
                <button
                    type="button"
                    className="rk-cart__qty-btn"
                    data-rk-cart-qty-increase={item.id}
                    aria-label="Menge erhöhen"
                >
                    <i className="fa-solid fa-plus" aria-hidden="true"></i>
                </button>
            </div>

            <div className="rk-cart__item-total">
                €{formatPrice(lineTotal)}
            </div>

            <button
                type="button"
                className="rk-cart__item-remove"
                data-rk-cart-remove={item.id}
                aria-label={`${item.title} entfernen`}
            >
                <i className="fa-solid fa-trash" aria-hidden="true"></i>
            </button>
        </div>
    );
}

export function View({ attributes, className }: ViewProps): JSX.Element {
    const {
        items = [],
        total = 0,
        emptyMessage = 'Dein Warenkorb ist leer.',
        emptyButtonText = 'Weiter einkaufen',
        continueUrl = '/',
        theme = 'light',
    } = attributes;

    const isEmpty = items.length === 0;

    return (
        <section
            className={`renderkit-block renderkit-cart renderkit-cart--${theme} ${className || ''}`.trim()}
            data-rk-cart-block="1"
        >
            <div className="rk-cart__container">
                <div className="rk-cart__header">
                    <p className="rk-cart__eyebrow">Warenkorb</p>
                    <h1 className="rk-cart__title">Deine Auswahl</h1>
                    <div className="rk-cart__rule" />
                </div>

                {isEmpty ? (
                    <div className="rk-cart__empty">
                        <i className="fa-solid fa-bag-shopping rk-cart__empty-icon" aria-hidden="true"></i>
                        <p className="rk-cart__empty-message">{emptyMessage}</p>
                        <a href={continueUrl} className="rk-cart__empty-btn">
                            {emptyButtonText}
                        </a>
                    </div>
                ) : (
                    <>
                        <div className="rk-cart__items" data-rk-cart-items>
                            <div className="rk-cart__items-header">
                                <span className="rk-cart__col-product">Produkt</span>
                                <span className="rk-cart__col-quantity">Menge</span>
                                <span className="rk-cart__col-total">Summe</span>
                                <span className="rk-cart__col-remove"></span>
                            </div>
                            {items.map((item) => (
                                <CartItemRow key={item.id} item={item} />
                            ))}
                        </div>

                        <div className="rk-cart__footer">
                            <div className="rk-cart__summary">
                                <div className="rk-cart__summary-row">
                                    <span>Zwischensumme</span>
                                    <span data-rk-cart-subtotal>€{formatPrice(total)}</span>
                                </div>
                                <div className="rk-cart__summary-row rk-cart__summary-row--total">
                                    <span>Gesamtsumme</span>
                                    <span data-rk-cart-total>€{formatPrice(total)}</span>
                                </div>
                            </div>

                            <div className="rk-cart__actions">
                                <a href={continueUrl} className="rk-cart__continue-btn">
                                    <i className="fa-solid fa-arrow-left" aria-hidden="true"></i>
                                    Weiter einkaufen
                                </a>
                                <button
                                    type="button"
                                    className="rk-cart__clear-btn"
                                    data-rk-cart-clear
                                >
                                    <i className="fa-solid fa-trash" aria-hidden="true"></i>
                                    Warenkorb leeren
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </section>
    );
}

export default View;
