# **App Name**: Epipla Graphiou AI eShop

## Core Features:

- Supplier XML Feed Processing: Automatically fetch, parse, and update product listings from supplier XML feed URLs using Firebase Cloud Scheduler and store them in Firestore. Allow admin to configure markup percentage per supplier.
- Dynamic Product Display: Dynamically render product listings with support for browsing, searching, and filtering. Support multi-language and multi-currency (Greek/English, EUR).
- Secure Payment Integration: Integrate Stripe for secure payments, including Apple Pay, Google Pay, Credit/Debit Cards, and Klarna. Handle split payments or buy-now-pay-later options via Klarna API or TBI Bank integration.
- Admin Panel: Protected admin panel for managing suppliers, products, and settings. Secure Firestore rules based on user roles (admin).
- Newsletter Subscription Pop-up & Abandoned Cart Recovery: Automatically display a pop-up after 10 seconds offering a 5% discount for newsletter subscriptions, track abandoned carts and automatically e-mail reminders, and notify users of recently viewed products if not added to their cart.
- Analytics and Smart Dashboard: Integrate Google Analytics 4, Facebook Pixel, and build a dashboard using Firebase Extensions and Looker Studio to track supplier conversion rates and markup profitability.
- Free Delivery Progress Bar: Display an interactive green bar above the footer that shows the remaining amount needed to reach free delivery (orders over 150€) and automatically updates as products are added to the cart.
- One-Page Checkout: Implement a streamlined, single-page checkout process with support for Apple Pay, Google Pay, and Klarna, without requiring forced login.

## Style Guidelines:

- Primary color: Light grey (#D3D3D3) based on the logo, providing a neutral and modern feel.
- Background color: White (#FFFFFF) for a clean and spacious layout.
- Accent color: Green (#4CAF50) for primary interactive elements like 'Add to Cart' and 'Pay Now' buttons to maximize conversion. This color should be highly visible and signify action.
- Secondary accent color: A slightly darker shade of green (#388E3C) for button hover states to provide visual feedback.
- Headline font: 'Inter', a modern sans-serif font for clear and readable headlines.
- Body font: 'Inter', ensuring consistency and readability throughout the site.
- Simple, minimalist icons that complement the Scandinavian design aesthetic. Use a consistent style and size for all icons.
- IKEA-style product grids with clear product images, concise descriptions, and visible pricing. Prioritize a clean and intuitive user experience for high conversion rates. Use whitespace effectively to avoid clutter.
- Subtle transitions and animations (e.g., button hover effects, cart updates) to enhance user engagement without being distracting. Focus on providing clear visual feedback for user actions.