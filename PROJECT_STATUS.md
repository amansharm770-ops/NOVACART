# NovaCart - Project status

## Done
- Security baseline (helmet, CORS allow-list, rate limits, NoSQL-injection sanitizer, env validation, central error handler)
- Auth: HttpOnly cookies, 15-min access token, rotating hashed refresh token with reuse detection, CSRF double-submit, login cooldown (5 fails -> 15 min), stricter admin login limiter
- Products API, server-priced orders with atomic stock reservation, cancel + restock, mock payments (UPI/card/COD)
- Admin API: stats, product CRUD (soft delete), order status, users enable/disable, audit log; admin created only via `npm run create-admin`
- Client: home/search/filter, product page, cart, wishlist, checkout, orders, login/register, admin panel
- 14 API integration tests

## Not built
- 2FA, real payment gateway, email, image upload, reviews, password reset
