import { useState, useEffect } from 'react';
import { CartItem, Product } from '../types';

export function useCart() {
    const [cart, setCart] = useState<CartItem[]>([]);
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        const saved = localStorage.getItem('apex-cart');
        if (saved) { try { setCart(JSON.parse(saved)); } catch (e) {} }
    }, []);

    useEffect(() => { localStorage.setItem('apex-cart', JSON.stringify(cart)); }, [cart]);

    const addItem = (product: Product, options: { quantity: number; color?: string; size?: string }) => {
        setCart(current => {
            const index = current.findIndex(item => item.id === product.id && item.selectedColor === options.color && item.selectedSize === options.size);
            if (index > -1) {
                const newCart = [...current]; newCart[index].quantity += options.quantity; return newCart;
            }
            return [...current, { ...product, quantity: options.quantity, selectedColor: options.color, selectedSize: options.size }];
        });
        setIsOpen(true);
    };

    const removeItem = (id: string, color?: string, size?: string) => {
        setCart(c => c.filter(i => !(i.id === id && i.selectedColor === color && i.selectedSize === size)));
    };

    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const count = cart.reduce((sum, item) => sum + item.quantity, 0);

    return { cart, isOpen, setIsOpen, addItem, removeItem, total, count };
}
