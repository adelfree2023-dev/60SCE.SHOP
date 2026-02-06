export interface Product {
    id: string; name: string; description: string; price: number;
    images: string[]; category: string; inventory: number;
    variants?: { color?: string[]; size?: string[]; };
}
export interface CartItem extends Product {
    quantity: number; selectedColor?: string; selectedSize?: string;
}
export interface UserProfile {
    uid: string; email: string; firstName?: string; lastName?: string;
    role: 'customer' | 'admin' | 'super-admin'; tenantId?: string;
}
