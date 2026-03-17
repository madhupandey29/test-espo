import { test } from '@playwright/test';

test.describe('Authenticated flows', () => {
  test.skip(
    'login, cart, wishlist, and profile flows need a dedicated test account and stable secrets',
    async () => {
      // Fill in once a non-production test account and environment strategy are available.
    }
  );
});
