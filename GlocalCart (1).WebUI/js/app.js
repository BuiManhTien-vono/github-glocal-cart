/* ═══════════════════════════════════════════════════════
   GlocalCart WebUI — App Init & Route Registration
   ═══════════════════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {
  // Register all routes
  router
    // Auth
    .register('/login', () => LoginPage())
    .register('/forgot-password', () => ForgotPasswordPage())

    // Main tabs
    .register('/', () => HomePage())
    .register('/cart', () => CartPage())
    .register('/notifications', () => NotificationsPage())
    .register('/profile', () => ProfilePage())

    // Shop
    .register('/search', (p) => SearchPage(p))
    .register('/product/:id', (p) => ProductDetailPage(p))
    .register('/checkout', () => CheckoutPage())
    .register('/shop-view', (p) => ShopViewPage(p))
    .register('/shop-detail', () => ShopDetailPage())
    .register('/write-review', (p) => WriteReviewPage(p))

    // Profile sub-pages
    .register('/favourites', () => FavouritesPage())
    .register('/my-orders', (p) => MyOrdersPage(p))
    .register('/order-detail', (p) => OrderDetailPage(p))
    .register('/shipment-tracking', () => ShipmentTrackingPage())

    // Seller
    .register('/seller-dashboard', () => SellerDashboardPage())
    .register('/seller-products', () => SellerProductsPage())
    .register('/seller-orders', () => SellerOrdersPage())
    .register('/seller-shop-info', () => SellerShopInfoPage())
    .register('/seller-categories', () => SellerCategoriesPage())
    .register('/seller-flash-sale', () => SellerFlashSalePage());

  // Initial resolve
  if (!window.location.hash) {
    window.location.hash = Auth.isLoggedIn() ? '#/' : '#/login';
  }
  router.resolve();
});
