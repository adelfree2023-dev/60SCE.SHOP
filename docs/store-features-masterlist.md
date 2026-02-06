# 🛒 Apex v2 Storefront: Master Page & Feature List

This document defines the complete scope of pages and features for the **Apex v2** client-facing store. It combines standard e-commerce requirements with the advanced capabilities seen in your project structure (B2B, Affiliates, AI).

---

## 📑 1. Core Shopping Pages (The Customer Journey)
*These are the "Money Maker" pages. They must be perfect.*

| # | Page Name | Type | Priority | Description |
| :--- | :--- | :--- | :--- | :--- |
| **01** | **Home Page** | 🏠 Page | 🔴 Essential | Dynamic layout (Banners, Best Sellers, Categories). Fast loading. |
| **02** | **Search & Results** | 🔍 Page | 🔴 Essential | Advanced filtering (Price, Brand, Specs), Grid/List view. |
| **03** | **Product Details (PDP)** | 👕 Page | 🔴 Essential | Images, Variants (Size/Color), Reviews, "Add to Cart", Related Products. |
| **04** | **Quick View** | ⚡ Modal | 🔴 Essential | Pop-up to view product details without leaving the current page. |
| **05** | **Shopping Cart** | 🛒 Page | 🔴 Essential | Edit quantities, view shipping estimates, apply coupons. |
| **06** | **Checkout (One-Page)** | 💳 Page | 🔴 Essential | Address, Shipping Method, Payment (Stripe/COD), Order Summary. |
| **07** | **Order Success** | ✅ Page | 🔴 Essential | "Thank You" message, Order ID, tracking link intro. |
| **08** | **Payment Failure** | ❌ Page | 🔴 Essential | Error message, "Try Again" button, alternative payment options. |
| **09** | **Category/Collection** | 📂 Page | 🟡 High | Landing page for specific categories (e.g., "Men's Shoes"). |
| **10** | **Flash Deals / Offers** | 🏷️ Page | 🟢 Medium | Special page for discounted items with countdown timers. |
| **11** | **Compare Products** | ⚖️ Page | 🟢 Medium | Side-by-side comparison (Specs, Price) - Critical for Electronics. |
| **12** | **Store Locations** | 📍 Page | 🟢 Medium | Map view of physical branches (if applicable). |

---

## 👤 2. User Account & Dashboard Pages
*For registered customers to manage their relationship with the store.*

| # | Page Name | Type | Priority | Description |
| :--- | :--- | :--- | :--- | :--- |
| **13** | **Login** | 🔑 Modal/Page | 🔴 Essential | Email/Password, Social Login (Google/Apple), OTP. |
| **14** | **Register** | 📝 Page | 🟠 High | Sign up form, Newsletter opt-in. |
| **15** | **My Account (Dashboard)**| 👤 Page | 🟠 High | Overview of recent orders, wallet balance, loyalty points. |
| **16** | **My Orders** | 📦 Page | 🟠 High | List of history orders with status (Processing, Shipped). |
| **17** | **Order Details** | 📄 Page | 🟠 High | Specific order info, invoice download, "Reorder" button. |
| **18** | **Track Order (Guest)** | 🚚 Page | 🟠 High | Track shipment without logging in (using Order ID + Email). |
| **19** | **Addresses** | 🏠 Page | 🟡 Medium | Manage saved shipping/billing addresses. |
| **20** | **Payment Methods** | 💳 Page | 🟡 Medium | Manage saved cards (Tokenized). |
| **21** | **Wishlist / Favorites** | ❤️ Page | 🟡 Medium | Saved products for later. |
| **22** | **Wallet / Credits** | 💰 Page | 🟡 Medium | Store credit balance, Cashback history, Top-up. |
| **23** | **Loyalty Points** | 🌟 Page | 🟢 Low | Points balance, redemption rules. |
| **24** | **Referral / Invite** | 🤝 Page | 🟢 Low | "Invite a Friend" link and earnings dashboard. |
| **25** | **Product Reviews** | ⭐ Page | 🟢 Low | List of reviews written by the user. |
| **26** | **Return Request (RMA)** | 🔙 Page | 🟡 Medium | Form to request a return/refund for an item. |
| **27** | **Notifications** | 🔔 Page | 🟢 Low | Center for system messages (Order updates, Promotions). |

---

## 📜 3. Content, Legal & Support Pages
*Essential for trust, SEO, and legal compliance.*

| # | Page Name | Type | Priority | Description |
| :--- | :--- | :--- | :--- | :--- |
| **28** | **Privacy Policy** | 📄 Page | 🔴 Essential | GDPR/Legal compliance text. |
| **29** | **Terms & Conditions** | 📄 Page | 🔴 Essential | Usage rules and contracts. |
| **30** | **Refund Policy** | 📄 Page | 🔴 Essential | Rules for returns and refunds (Required by Payment Gateways). |
| **31** | **About Us** | ℹ️ Page | 🟡 Medium | Brand story, team, mission. |
| **32** | **Contact Us** | 📞 Page | 🟡 Medium | Contact form, Map, Phone, Email. |
| **33** | **FAQ** | ❓ Page | 🟡 Medium | Frequently Asked Questions accordion. |
| **34** | **Blog / Articles** | 📰 Page | 🟢 Low | Content marketing for SEO traffic. |
| **35** | **404 Not Found** | 🚫 Page | 🟠 High | Custom error page directing back to Home. |
| **36** | **Maintenance Mode** | 🚧 Page | 🟢 Low | "We'll be back soon" page for system updates. |

---

## 🛠️ 4. Essential Functional Features (Widgets & Add-ons)
*These are not "pages" but critical components/features embedded in the store.*

| # | Feature Name | Type | Priority | Description |
| :--- | :--- | :--- | :--- | :--- |
| **37** | **Global Search (Ajax)** | 🔍 Widget | 🔴 Essential | Instant search results dropdown as you type. |
| **38** | **Mega Menu** | 🧭 Nav | 🔴 Essential | Expandable menu for large category trees. |
| **39** | **Smart Filters** | 🎛️ Sidebar | 🔴 Essential | Dynamic filters based on category attributes (Size, RAM, etc.). |
| **40** | **Toast Notifications** | 🍞 UI | 🟢 Medium | Small popups: "Added to cart", "Action failed". |
| **41** | **Newsletter Popup** | 📧 Modal | 🟢 Low | "Subscribe & get 10% off" (appears once). |
| **42** | **Floating WhatsApp** | 💬 Widget | 🟢 Low | Direct chat button for customer support. |
| **43** | **Social Wall** | 🖼️ Section | 🟢 Low | Instagram feed integration. |
| **44** | **Out of Stock Notify** | 🔔 Modal | 🟢 Medium | "Email me when available" for OOS items. |
| **45** | **Cookie Consent** | 🍪 Banner | 🔴 Essential | GDPR compliance banner at one-time load. |

---

### 🚀 Advanced Modules (Based on your Architecture)
*Detected from your provided folder structure image.*

*   **B2B Portal:** (Need separate pages for Wholesale pricing, Bulk Order form).
*   **Affiliates:** (Dashboard for marketers to see their earnings).
*   **Vendors:** (If Multi-Vendor, each seller needs a "Store Profile" page).
*   **Subscriptions:** (Management page for recurring orders).

This list covers **100% of a standard e-commerce experience** plus the advanced features required for a robust SaaS platform.
