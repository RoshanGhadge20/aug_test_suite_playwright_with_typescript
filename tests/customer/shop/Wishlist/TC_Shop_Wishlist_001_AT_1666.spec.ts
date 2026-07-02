import { expect, test } from '../../../../fixtures/base.fixture';
import { ShopWishlistPage } from '../../../../pages/customer/shop-wishlist.page';
import type { WishlistProductCardDetails } from '../../../../pages/customer/shop-wishlist.page';

test.describe('TC_Shop_Wishlist_001 @customer-flows', () => {
  test('TC_Shop_Wishlist_001|AT-1666 -wishlist functionality', async ({ page, shopWishlistPage, shopCartPage }) => {
    test.setTimeout(120_000);

    let removeProductName = '';
    let moveToCartProductName = '';
    let moveToCartWishlistDetails: WishlistProductCardDetails;

    await test.step('open shop home', async () => {
      await shopWishlistPage.openShopHome();
    });

    await test.step('add first product to wishlist (for remove)', async () => {
      const added = await shopWishlistPage.addCatalogProductToWishlist(0);
      removeProductName = added.productName;
      expect(added.toastMessage).toBe(ShopWishlistPage.toastMessages.ADDED);
    });

    await test.step('open wishlist', async () => {
      await shopWishlistPage.clickWishlistIcon();
      await expect(page).toHaveURL(/wishlist/i);
    });

    await test.step('verify product in wishlist before remove', async () => {
      await shopWishlistPage.verifyProductInWishlist(removeProductName);
    });

    await test.step('remove product from wishlist', async () => {
      const removeMessage = await shopWishlistPage.removeWishlistProduct(removeProductName);
      expect(removeMessage).toBe(ShopWishlistPage.toastMessages.REMOVED);
    });

    await test.step('add product to wishlist again (for move to cart)', async () => {
      await shopWishlistPage.openShopHome();
      const added = await shopWishlistPage.addCatalogProductToWishlist(0);
      moveToCartProductName = added.productName;
      expect(added.toastMessage).toBe(ShopWishlistPage.toastMessages.ADDED);
    });

    await test.step('open wishlist', async () => {
      await shopWishlistPage.clickWishlistIcon();
      await expect(page).toHaveURL(/wishlist/i);
    });

    await test.step('verify product in wishlist before move to cart', async () => {
      moveToCartWishlistDetails = await shopWishlistPage.verifyProductInWishlist(moveToCartProductName);
    });

    await test.step('move wishlist product to cart', async () => {
      await shopWishlistPage.moveWishlistProductToCart(moveToCartProductName);
      await expect(page).toHaveURL(/shop-new\/cart/i);
    });

    await test.step('verify moved product in cart', async () => {
      await shopCartPage.validateCartItemAfterWishlistMove(moveToCartProductName);      
      console.log(`Cart item after wishlist move: ${moveToCartProductName}`);
    });
  });
});
