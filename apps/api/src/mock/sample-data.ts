import { TestStatus } from '@testa/shared';
import { TestRunResult } from '../test-runner/test-runner.service';

// ── Sample generated spec.ts shown in the "Generated Code" tab ───────────────
export function getMockGeneratedCode(testTypes: string[], baseUrl: string): string {
  const sections: string[] = [
    `import { test, expect, Page } from '@playwright/test';\n`,
  ];

  if (testTypes.includes('navigation')) {
    sections.push(`
// ── Navigation Tests ──────────────────────────────────────────────────────────
test.describe('Navigation', () => {
  test('Homepage loads and displays hero section', async ({ page }) => {
    await page.goto('${baseUrl}');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveTitle(/.+/);
    await expect(page.locator('body')).toBeVisible();
    await expect(page.locator('h1, [data-testid="hero"], .hero, header')).toBeVisible();
  });

  test('About page title contains company name', async ({ page }) => {
    await page.goto('${baseUrl}/about');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveTitle(/.+/);
    const heading = page.locator('h1').first();
    await expect(heading).toBeVisible();
  });

  test('Contact page loads with form visible', async ({ page }) => {
    await page.goto('${baseUrl}/contact');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('form, [data-testid="contact-form"]')).toBeVisible();
  });

  test('Products page loads within timeout', async ({ page }) => {
    await page.goto('${baseUrl}/products');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('.product-grid, [data-testid="products"], ul.products')).toBeVisible({ timeout: 30000 });
  });

  test('Blog listing page has at least one post', async ({ page }) => {
    await page.goto('${baseUrl}/blog');
    await page.waitForLoadState('networkidle');
    const posts = page.locator('article, .post, [data-testid="post-card"]');
    await expect(posts.first()).toBeVisible();
  });

  test('404 page shows error message', async ({ page }) => {
    const response = await page.goto('${baseUrl}/this-page-does-not-exist-404');
    const heading = page.locator('h1, [data-testid="error-heading"]');
    await expect(heading).toContainText(/404|not found|error/i);
  });
});`);
  }

  if (testTypes.includes('forms')) {
    sections.push(`
// ── Form Validation Tests ─────────────────────────────────────────────────────
test.describe('Form Validation', () => {
  test('Login form rejects empty email field', async ({ page }) => {
    await page.goto('${baseUrl}/login');
    await page.waitForLoadState('networkidle');
    await page.click('button[type="submit"], input[type="submit"], [data-testid="login-btn"]');
    const error = page.locator('[data-testid="error-msg"], .error, .field-error, [aria-invalid="true"]');
    await expect(error.first()).toBeVisible();
  });

  test('Login form accepts valid credentials', async ({ page }) => {
    await page.goto('${baseUrl}/login');
    await page.waitForLoadState('networkidle');
    await page.fill('input[type="email"], input[name="email"]', 'test@example.com');
    await page.fill('input[type="password"], input[name="password"]', 'SecurePass123!');
    await page.click('button[type="submit"], [data-testid="login-btn"]');
    await page.waitForLoadState('networkidle');
    await expect(page).not.toHaveURL(/login/);
  });

  test('Contact form validates required fields', async ({ page }) => {
    await page.goto('${baseUrl}/contact');
    await page.waitForLoadState('networkidle');
    await page.fill('input[name="name"]', 'Jane Smith');
    await page.fill('input[name="email"]', 'jane.smith@example.com');
    await page.fill('textarea[name="message"], textarea', 'Hello, I would like more information.');
    await page.click('button[type="submit"]');
    await expect(page.locator('.success, [data-testid="success-msg"], .toast')).toBeVisible({ timeout: 10000 });
  });

  test('Newsletter signup form submits successfully', async ({ page }) => {
    await page.goto('${baseUrl}');
    await page.waitForLoadState('networkidle');
    const emailInput = page.locator('input[type="email"]').first();
    await emailInput.fill('newsletter@example.com');
    await page.click('[data-testid="newsletter-submit"], .newsletter button[type="submit"]');
    await expect(page.locator('.success, .confirmation, [data-testid="newsletter-success"]')).toBeVisible({ timeout: 8000 });
  });

  test('Search form returns results for valid query', async ({ page }) => {
    await page.goto('${baseUrl}');
    await page.waitForLoadState('networkidle');
    const searchInput = page.locator('input[type="search"], input[name="q"], [data-testid="search-input"]');
    await searchInput.fill('product');
    await page.keyboard.press('Enter');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('.results, [data-testid="search-results"], .search-results')).toBeVisible({ timeout: 15000 });
  });
});`);
  }

  if (testTypes.includes('accessibility')) {
    sections.push(`
// ── Accessibility Tests ───────────────────────────────────────────────────────
test.describe('Accessibility', () => {
  test('All images have descriptive alt text', async ({ page }) => {
    await page.goto('${baseUrl}');
    await page.waitForLoadState('networkidle');
    const images = await page.locator('img').all();
    for (const img of images) {
      const alt = await img.getAttribute('alt');
      const role = await img.getAttribute('role');
      if (role !== 'presentation' && role !== 'none') {
        expect(alt).not.toBeNull();
      }
    }
  });

  test('Navigation landmarks use ARIA roles', async ({ page }) => {
    await page.goto('${baseUrl}');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('nav, [role="navigation"]')).toBeVisible();
    await expect(page.locator('main, [role="main"]')).toBeVisible();
  });

  test('Heading hierarchy follows h1 > h2 > h3 order', async ({ page }) => {
    await page.goto('${baseUrl}/blog');
    await page.waitForLoadState('networkidle');
    const h1Count = await page.locator('h1').count();
    expect(h1Count).toBeLessThanOrEqual(1);
    const headings = await page.locator('h1, h2, h3, h4').evaluateAll(
      (els) => els.map((el) => ({ tag: el.tagName.toLowerCase(), text: el.textContent?.slice(0, 40) }))
    );
    let prevLevel = 0;
    for (const h of headings) {
      const level = parseInt(h.tag[1]);
      expect(level - prevLevel).toBeLessThanOrEqual(1);
      prevLevel = level;
    }
  });

  test('Interactive buttons have accessible names', async ({ page }) => {
    await page.goto('${baseUrl}');
    await page.waitForLoadState('networkidle');
    const buttons = await page.locator('button:visible').all();
    for (const btn of buttons.slice(0, 10)) {
      const text = await btn.textContent();
      const ariaLabel = await btn.getAttribute('aria-label');
      const ariaLabelledBy = await btn.getAttribute('aria-labelledby');
      const title = await btn.getAttribute('title');
      const hasLabel = (text?.trim() || ariaLabel || ariaLabelledBy || title);
      expect(hasLabel).toBeTruthy();
    }
  });

  test('Form inputs are associated with labels', async ({ page }) => {
    await page.goto('${baseUrl}/contact');
    await page.waitForLoadState('networkidle');
    const inputs = await page.locator('input:visible, textarea:visible, select:visible').all();
    for (const input of inputs) {
      const id = await input.getAttribute('id');
      const ariaLabel = await input.getAttribute('aria-label');
      const ariaLabelledBy = await input.getAttribute('aria-labelledby');
      const placeholder = await input.getAttribute('placeholder');
      const hasLabel = id
        ? (await page.locator(\`label[for="\${id}"]\`).count()) > 0
        : !!(ariaLabel || ariaLabelledBy || placeholder);
      expect(hasLabel).toBeTruthy();
    }
  });

  test('Color contrast meets WCAG 2.1 AA standards', async ({ page }) => {
    await page.goto('${baseUrl}');
    await page.waitForLoadState('networkidle');
    const contrastIssues = await page.evaluate(() => {
      const getRelativeLuminance = (r: number, g: number, b: number) => {
        const [rs, gs, bs] = [r, g, b].map((c) => {
          const s = c / 255;
          return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
        });
        return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
      };
      const issues: string[] = [];
      document.querySelectorAll('button:not([aria-hidden])').forEach((el) => {
        const style = getComputedStyle(el);
        issues.push(\`\${el.tagName}: bg=\${style.backgroundColor} color=\${style.color}\`);
      });
      return issues.length;
    });
    expect(contrastIssues).toBeDefined();
  });
});`);
  }

  if (testTypes.includes('visual')) {
    sections.push(`
// ── Visual Regression Tests ───────────────────────────────────────────────────
test.describe('Visual Regression', () => {
  test('Homepage desktop layout snapshot', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('${baseUrl}');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveScreenshot('homepage-desktop.png', { fullPage: true, threshold: 0.1 });
  });

  test('Homepage mobile layout snapshot', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('${baseUrl}');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveScreenshot('homepage-mobile.png', { fullPage: true, threshold: 0.1 });
  });

  test('Product listing page layout snapshot', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('${baseUrl}/products');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('.product-grid, [data-testid="products"]')).toBeVisible();
    await expect(page).toHaveScreenshot('products-page.png', { fullPage: true, threshold: 0.1 });
  });

  test('Navigation bar screenshot', async ({ page }) => {
    await page.goto('${baseUrl}');
    await page.waitForLoadState('networkidle');
    const nav = page.locator('nav, header').first();
    await expect(nav).toHaveScreenshot('navigation-bar.png', { threshold: 0.05 });
  });
});`);
  }

  if (testTypes.includes('api')) {
    sections.push(`
// ── API Intercept Tests ───────────────────────────────────────────────────────
test.describe('API Intercept', () => {
  test('GET /api/health returns 200', async ({ page }) => {
    const [response] = await Promise.all([
      page.waitForResponse((r) => r.url().includes('/api/health') || r.url().includes('/health')),
      page.goto('${baseUrl}'),
    ]);
    expect(response.status()).toBe(200);
  });

  test('GET /api/products returns 200 with data', async ({ page }) => {
    let apiStatus: number | undefined;
    page.on('response', (r) => {
      if (r.url().includes('/api/products') || r.url().includes('/products.json')) {
        apiStatus = r.status();
      }
    });
    await page.goto('${baseUrl}/products');
    await page.waitForLoadState('networkidle');
    if (apiStatus !== undefined) {
      expect(apiStatus).toBeLessThan(400);
    }
  });

  test('POST /api/contact returns 200', async ({ page }) => {
    const [response] = await Promise.all([
      page.waitForResponse((r) => r.url().includes('/api/contact') || r.url().includes('/contact') && r.request().method() === 'POST', { timeout: 15000 }).catch(() => null as any),
      (async () => {
        await page.goto('${baseUrl}/contact');
        await page.fill('input[name="name"]', 'Test User');
        await page.fill('input[name="email"]', 'test@example.com');
        await page.fill('textarea', 'Test message for API check');
        await page.click('button[type="submit"]');
      })(),
    ]);
    if (response) {
      expect(response.status()).toBeLessThan(500);
    }
  });

  test('GET /api/user/profile returns 401 when unauthenticated', async ({ page }) => {
    const response = await page.request.get('${baseUrl}/api/user/profile');
    expect([401, 403, 404]).toContain(response.status());
  });

  test('GET /api/config returns 200', async ({ page }) => {
    let found = false;
    page.on('response', (r) => {
      if (r.url().includes('/api/config') || r.url().includes('/config.json')) {
        expect(r.status()).toBeLessThan(400);
        found = true;
      }
    });
    await page.goto('${baseUrl}');
    await page.waitForLoadState('networkidle');
  });
});`);
  }

  return sections.join('\n');
}

// ── Sample test results keyed by test type ────────────────────────────────────
const NAV_RESULTS: TestRunResult[] = [
  { testName: 'Homepage loads and displays hero section', status: TestStatus.PASSED, duration: 487 },
  { testName: 'About page title contains company name', status: TestStatus.PASSED, duration: 312 },
  { testName: 'Contact page loads with form visible', status: TestStatus.PASSED, duration: 405 },
  {
    testName: 'Products page loads within timeout',
    status: TestStatus.FAILED,
    duration: 30043,
    errorMessage: "Timeout 30000ms exceeded while waiting for element '.product-grid, [data-testid=\"products\"], ul.products' to be visible.",
    stackTrace: `TimeoutError: Timeout 30000ms exceeded.
  at /tmp/testa-xyz/generated.spec.ts:28:62
  at PWPageAssertions.toBeVisible (/tmp/testa-xyz/node_modules/@playwright/test/lib/matchers/toMatchSnapshot.js:131:15)
  at Object.<anonymous> (/tmp/testa-xyz/generated.spec.ts:28:9)
  Call log:
    - waiting for locator('.product-grid, [data-testid="products"], ul.products') to be visible`,
  },
  { testName: 'Blog listing page has at least one post', status: TestStatus.PASSED, duration: 523 },
  {
    testName: '404 page shows error message',
    status: TestStatus.FAILED,
    duration: 1245,
    errorMessage: "Locator expected to contain text matching /404|not found|error/i. Received: \"Welcome — Page Not Found\"",
    stackTrace: `Error: Locator expected to contain text
  Locator: locator('h1, [data-testid="error-heading"]')
  Expected pattern: /404|not found|error/i
  Received string:  "Welcome — Page Not Found"
  at /tmp/testa-xyz/generated.spec.ts:44:37`,
  },
];

const FORM_RESULTS: TestRunResult[] = [
  { testName: 'Login form rejects empty email field', status: TestStatus.PASSED, duration: 234 },
  {
    testName: 'Login form accepts valid credentials',
    status: TestStatus.FAILED,
    duration: 2103,
    errorMessage: 'net::ERR_CONNECTION_REFUSED: Failed to load resource from https://api.example.com/auth/login',
    stackTrace: `Error: net::ERR_CONNECTION_REFUSED at https://api.example.com/auth/login
  at Page.waitForLoadState (/tmp/testa-xyz/node_modules/playwright-core/lib/client/page.js:220:10)
  at /tmp/testa-xyz/generated.spec.ts:62:5`,
  },
  { testName: 'Contact form validates required fields', status: TestStatus.PASSED, duration: 345 },
  { testName: 'Newsletter signup form submits successfully', status: TestStatus.PASSED, duration: 1823 },
  {
    testName: 'Search form returns results for valid query',
    status: TestStatus.FAILED,
    duration: 3201,
    errorMessage: "Timeout 15000ms exceeded while waiting for '.results, [data-testid=\"search-results\"], .search-results' to be visible.",
    stackTrace: `TimeoutError: Timeout 15000ms exceeded.
  at /tmp/testa-xyz/generated.spec.ts:88:9
  Call log:
    - waiting for locator('.results, [data-testid="search-results"], .search-results') to be visible
    - locator resolved to 0 elements`,
  },
];

const A11Y_RESULTS: TestRunResult[] = [
  { testName: 'All images have descriptive alt text', status: TestStatus.PASSED, duration: 312 },
  { testName: 'Navigation landmarks use ARIA roles', status: TestStatus.PASSED, duration: 267 },
  {
    testName: 'Heading hierarchy follows h1 > h2 > h3 order',
    status: TestStatus.FAILED,
    duration: 423,
    errorMessage: 'Expected level jump (h2 → h4) to be ≤ 1. Found <h4> immediately after <h2> in blog post sidebar.',
    stackTrace: `Error: expect(received).toBeLessThanOrEqual(expected)
  Expected: <= 1
  Received: 2
  at /tmp/testa-xyz/generated.spec.ts:116:9
  (Element: <h4 class="widget-title">Recent Posts</h4> on /blog)`,
  },
  { testName: 'Interactive buttons have accessible names', status: TestStatus.PASSED, duration: 290 },
  { testName: 'Form inputs are associated with labels', status: TestStatus.PASSED, duration: 312 },
  {
    testName: 'Color contrast meets WCAG 2.1 AA standards',
    status: TestStatus.FAILED,
    duration: 567,
    errorMessage: 'Low contrast ratio detected on primary CTA button: computed ratio 2.8:1 (required ≥ 4.5:1 for normal text, ≥ 3:1 for large text).',
    stackTrace: `Error: expect(received).toBeGreaterThanOrEqual(expected)
  Expected: >= 4.5
  Received: 2.8
  at /tmp/testa-xyz/generated.spec.ts:148:9
  Element: button.btn-primary { color: #ffffff; background-color: #a1a1a1 }`,
  },
];

const VISUAL_RESULTS: TestRunResult[] = [
  { testName: 'Homepage desktop layout snapshot', status: TestStatus.PASSED, duration: 2341 },
  { testName: 'Homepage mobile layout snapshot', status: TestStatus.PASSED, duration: 1987 },
  {
    testName: 'Product listing page layout snapshot',
    status: TestStatus.FAILED,
    duration: 3421,
    errorMessage: 'Screenshot comparison failed: 847 pixels differ (2.3% of total). Layout shift of 24px detected in .product-card grid area.',
    stackTrace: `Error: Screenshot comparison failed.
  Expected: products-page-baseline.png
  Received: products-page-actual.png
  Diff pixels: 847 (2.3%)
  at /tmp/testa-xyz/generated.spec.ts:175:22
  Hint: run with --update-snapshots to update the baseline`,
  },
  { testName: 'Navigation bar screenshot', status: TestStatus.PASSED, duration: 1234 },
];

const API_RESULTS: TestRunResult[] = [
  { testName: 'GET /api/health returns 200', status: TestStatus.PASSED, duration: 145 },
  { testName: 'GET /api/products returns 200 with data', status: TestStatus.PASSED, duration: 234 },
  { testName: 'POST /api/contact returns 200', status: TestStatus.PASSED, duration: 456 },
  {
    testName: 'GET /api/user/profile returns 401 when unauthenticated',
    status: TestStatus.FAILED,
    duration: 789,
    errorMessage: 'Expected [401, 403, 404] to contain 200. The /api/user/profile endpoint is returning 200 with an empty user object instead of requiring authentication.',
    stackTrace: `Error: expect(received).toContain(expected)
  Expected: [401, 403, 404]
  Received: 200
  at /tmp/testa-xyz/generated.spec.ts:214:5
  Response body: {"id":null,"email":null,"role":"guest"}`,
  },
  { testName: 'GET /api/config returns 200', status: TestStatus.PASSED, duration: 123 },
];

const RESULTS_BY_TYPE: Record<string, TestRunResult[]> = {
  navigation: NAV_RESULTS,
  forms: FORM_RESULTS,
  accessibility: A11Y_RESULTS,
  visual: VISUAL_RESULTS,
  api: API_RESULTS,
};

function getMockScreenshot(errorMessage = ''): string {
  const esc = (s: string) =>
    s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const line1 = esc(errorMessage.slice(0, 90));
  const line2 = esc(errorMessage.slice(90, 180));
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="320" viewBox="0 0 800 320">
  <rect width="800" height="320" fill="#0a0a0a"/>
  <rect width="800" height="40" fill="#111111"/>
  <circle cx="22" cy="20" r="7" fill="#ff5f57"/>
  <circle cx="44" cy="20" r="7" fill="#febc2e"/>
  <circle cx="66" cy="20" r="7" fill="#28c840"/>
  <rect x="86" y="12" width="596" height="18" rx="4" fill="#1a1a1a"/>
  <text x="384" y="24" font-family="Courier New,monospace" font-size="10" fill="#3a3a3a" text-anchor="middle">about:blank — playwright runner</text>
  <line x1="0" y1="40" x2="800" y2="40" stroke="#1e1e1e" stroke-width="1"/>
  <text x="400" y="125" font-family="Courier New,monospace" font-size="13" fill="#ff3333" text-anchor="middle" font-weight="bold">&#x2715;  TEST ASSERTION FAILED</text>
  <line x1="30" y1="140" x2="770" y2="140" stroke="#1e1e1e" stroke-width="1"/>
  <text x="50" y="175" font-family="Courier New,monospace" font-size="11" fill="#737373">${line1}</text>
  ${line2 ? `<text x="50" y="198" font-family="Courier New,monospace" font-size="11" fill="#737373">${line2}</text>` : ''}
  <line x1="0" y1="295" x2="800" y2="295" stroke="#1e1e1e" stroke-width="1"/>
  <text x="400" y="310" font-family="Courier New,monospace" font-size="9" fill="#2a2a2a" text-anchor="middle">Screenshot captured at failure moment — TESTA runner</text>
</svg>`;
  return Buffer.from(svg).toString('base64');
}

export function getMockResults(testTypes: string[]): TestRunResult[] {
  const out: TestRunResult[] = [];
  for (const t of testTypes) {
    out.push(...(RESULTS_BY_TYPE[t] ?? []));
  }
  return out.map((r) =>
    r.status !== TestStatus.PASSED && !r.screenshotBase64
      ? { ...r, screenshotBase64: getMockScreenshot(r.errorMessage ?? '') }
      : r,
  );
}

// ── Per-failure AI suggestions ────────────────────────────────────────────────
const SUGGESTIONS: Record<string, string> = {
  'Products page loads within timeout':
    "The .product-grid selector failed to appear within the 30-second timeout, which usually means the products data API is slow or returning an error before the component can render. Check the /api/products endpoint response time in your browser DevTools Network tab — if it regularly exceeds 5 seconds, increase PLAYWRIGHT_TEST_TIMEOUT in your .env to 60000. Also verify the backend service is running and the CORS headers allow requests from the test origin. As a quick fix, add an explicit wait for the network response before asserting the grid: await page.waitForResponse(r => r.url().includes('/api/products') && r.status() === 200) then assert the grid.",

  '404 page shows error message':
    "The 404 page heading contains 'Welcome — Page Not Found' but the test regex /404|not found|error/i requires the text to literally include one of those keywords (case-insensitive). Update the assertion to use toContainText('Page Not Found') or adjust the regex to /page not found/i to match the actual wording. Alternatively, change the page copy to include '404' in the visible heading for clearer error identification.",

  'Login form accepts valid credentials':
    "The test is receiving net::ERR_CONNECTION_REFUSED when the login form submits, meaning the authentication API endpoint is not reachable from the test environment. Confirm that the API server (typically running on a different port or domain) is started before the test suite runs. If the API lives at a different origin, ensure CORS is configured for the Playwright test origin. For CI environments, add a health-check step that waits for the API to be ready before executing tests.",

  'Search form returns results for valid query':
    "The search results container (.results / [data-testid='search-results']) never appeared within 15 seconds after pressing Enter, suggesting the search API is not returning results or the UI is rendering them under a different selector. Inspect the network tab for the search request and verify it returns data. If the selector is correct, increase the timeout or add a page.waitForResponse() that waits for the search API call to complete before asserting the DOM. Also check whether the search requires a minimum query length.",

  'Heading hierarchy follows h1 > h2 > h3 order':
    "An <h4> element was found immediately after an <h2> in the blog sidebar, skipping the <h3> level. This violates WCAG 1.3.1 (Info and Relationships) and breaks screen reader navigation. Change the widget title from <h4> to <h3> or restructure the sidebar headings so the hierarchy descends one level at a time. Run a full heading audit with a tool like axe-core to find all affected pages before applying the fix.",

  'Color contrast meets WCAG 2.1 AA standards':
    "The primary CTA button has a contrast ratio of 2.8:1 between its white text and the #a1a1a1 background, well below the WCAG 2.1 AA minimum of 4.5:1 for normal text. Darken the button background to at least #767676 to achieve 4.5:1 contrast with white, or switch to a darker brand color. Use the WebAIM Contrast Checker (webaim.org/resources/contrastchecker/) to verify the new combination before deploying. All interactive elements must meet this threshold to comply with WCAG 2.1 Level AA.",

  'Product listing page layout snapshot':
    "A 2.3% pixel difference (847 pixels, 24px layout shift) was detected in the product card grid between the baseline and current snapshots. This is typically caused by a new product image with different dimensions, a font loading race condition, or a CSS change that affected grid column widths. Run the test with --update-snapshots after confirming the new layout is intentional, or investigate recent CSS changes to .product-card. Consider adding a page.waitForFunction() that waits until all images are loaded before taking the screenshot to eliminate loading-state differences.",

  'GET /api/user/profile returns 401 when unauthenticated':
    "The /api/user/profile endpoint is returning HTTP 200 with a null-filled guest object instead of a 401 or 403 for unauthenticated requests. This is a security concern: unauthenticated users should receive a 401 Unauthorized response so the client can redirect to the login page. Add authentication middleware to the profile route that validates the session/JWT token and returns 401 if missing or invalid. In Express/NestJS, apply an AuthGuard to this route. After the fix, update this test expectation to remove 404 from the allowed list if the route should always exist.",
};

export function getMockSuggestion(testName: string): string {
  return (
    SUGGESTIONS[testName] ??
    'The test failed due to a selector timing out or an unexpected response. Verify that the target element exists in the DOM with the expected selector, check network requests for API errors, and consider increasing the timeout if the page is legitimately slow to load.'
  );
}
