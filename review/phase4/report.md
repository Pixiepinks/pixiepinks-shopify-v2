# PixiePinks V2 — Phase 4 review

Repository: Pixiepinks/pixiepinks-shopify-v2
Branch: feature/v2-premium-homepage
Base: 88551325e07cb4a85bb6081c1f0cda21e1369724
Local commit: 09d343f694f72de923cc0ef32328c2b521c27b9e
Working tree: clean

The base contains Phase 3 (edf27946424a3570ff8c03bd7795676b9f9ca3a7), Phase 3B (e9997605a8d6378d5acb3d8e65ad701700afa1b7), and subsequent Shopify merchant configuration updates. Remote main was verified unchanged at the base SHA before committing. This branch has not been pushed, merged, uploaded or published. No changes were made to main or any Shopify theme.

## Files changed or added

- Added assets/pp-homepage.css: homepage-scoped design using existing V2 tokens; 1600px maximum width, balanced 16–32px gutters, rounded hero, pastel category circles and promotional cards, local native product-card presentation, mobile layouts, focus and reduced-motion styles.
- Added assets/pp-homepage.js: a small reduced-motion bridge that pauses Dawn's homepage autoplay through its existing controls; no new library or commerce logic.
- Added sections/pp-category-strip.liquid: reusable image/label circles with optional collection defaults, merchant destinations, decorative icons if no image, and keyboard/touch scrolling without a visible scrollbar.
- Added sections/pp-promo-cards.liquid: reusable image-forward promotional cards, three desktop columns, two tablet columns, one mobile column; contextual CTA labels and configurable content.
- Added sections/pp-featured-products.liquid: reusable featured and special-offers presets based on the verified Dawn featured-collection section, rendering the unchanged card-product snippet and retaining native price, variants, quick-add, product form, slider and app dependencies. No fake product placeholders are rendered. Genuine sale products are selected with compare_at_price > price; empty/unconfigured/non-sale offer selections hide automatically.
- Updated sections/slideshow.liquid: homepage-only style/script hooks; primary homepage image eager/high priority, later slides lazy; all original image/heading/subheading/button/link/overlay/schema settings retained.
- Updated templates/index.json: three new section instances; first New Arrivals instance uses the new native-derived product presentation without losing any existing settings. Pagination changes from counter to dots. JSON was formatted for review; unchanged saved configuration accounts for most of the textual diff.

## Saved homepage configuration

Order: existing slideshow → new category circles → new promotional cards → existing New Arrivals, polished → optional special offers → all remaining existing content.

All 22 original sections remain in the same relative order. All four merchant slide images and complete block settings are byte-equivalent as parsed JSON. Every original section configuration is unchanged except the first section's pagination presentation and the New Arrivals type plus two new visibility/filter flags. Product counts, selected collections, existing quick-add/slider settings, titles and descriptions are preserved.

Twelve category blocks reuse existing collection selections from the saved homepage; images, labels and URLs resolve from Shopify collection objects. Three promotional blocks reuse the existing Bicycles, Gift Packs and Chocolates collection selections. Heading/image/link overrides are deliberately unset; storefront values come from the live merchant-selected collections. No campaign text, discount percentage, policy, fabricated URL or generated artwork is seeded into production.

Special Offers has no selected collection in the saved template and stays hidden until configured. The review fixture explicitly supplies a sample collection to demonstrate it.

## Theme Editor controls

Categories: section heading, visibility, spacing; each block offers collection, image, label override, destination override and pastel background.

Promotions: section heading, visibility, spacing; each block offers optional collection defaults, image, heading, short text, button label, destination and background.

Products/offers: retains Dawn's collection, product count, title, description, column counts, image ratio/shape, secondary image, vendor/rating, quick-add, slider/swipe, View All, color and spacing controls. Adds visibility and genuine-sale-only filtering. Separate featured-products and special-offers presets are available only on the homepage.

Slideshow: existing controls remain authoritative for every slide, overlays, text placement, links, autoplay, image behavior and sizing. Its native controls are preserved, with rounded framing, 44px controls and pink pagination. Mobile uses a smaller minimum height and contained wide banner artwork rather than cropping the merchant's banner.

## Validation

Theme Check before: 6 errors, 22 warnings.
Theme Check after: 6 errors, 22 warnings.
Exact finding signatures are unchanged. All six errors remain the known BSS ParserBlockingScript findings. No translation, schema, Liquid syntax or other new errors were introduced.

323 theme files; 77 JSON files parsed; 46 section schema JSON blocks validated; 593 local references resolve, zero missing. All 41 JavaScript assets and the embedded section JavaScript pass syntax checks. New section settings/block IDs, selected ranges and the 25-section template limit validate. git diff --check passes.

All 12 required route templates remain present. The other 20 existing templates are byte-identical to the base. Header/service settings, layout, global configuration, all shared snippets, locales, BSS files, native assets/commerce JavaScript and every other original section are byte-identical. Only slideshow and index are changed among original files.

92 homepage browser checks pass at 1440, 1024, 768, 390 and 320px: no page overflow; native previous/next; image loading priorities; category keyboard scrolling; three promotional blocks; genuine sale filtering; real native price markup; unconfigured/non-sale offers hidden; unlinked categories omitted; visibility controls; sold-out quick-add disabled; product URL for native variant chooser; quick-add target >=44px; product-card frames inside slider bounds; native product form posts fixture variant ID to a mocked cart endpoint and native notification renders the mocked response; reduced-motion pause; zero browser JavaScript errors.

86 existing header regression checks pass, including predictive search/reset, dynamic cart section replacement, Level 1/2/3 menus, All Categories, responsive More with focus retention, sticky navigation, mobile drawer/search, focus trap, Escape/backdrop, reduced motion and responsive logo behavior.

## Visual review and limits

Desktop: desktop.png (1440px).
Mobile: mobile.png (390px).
Both are labelled LOCAL FIXTURE on the image. They render the actual Liquid sections and native assets with representative objects and illustrative fixture artwork kept outside the repository. No fixture content or screenshots were committed. They are not actual Shopify screenshots, and the real Shopify logo/banner/product photography was not available for this environment's preview. The native header uses its text fallback in these screenshots. Existing lower homepage sections are retained in the template but omitted from the fixture, with an explicit continuation note.

The visual reference informed the rounded banner, compact category circles, pastel three-card row, prominent section headings and image-forward product cards. Product and offers rows are sequential and configurable, matching the requested hierarchy.

Actual Shopify draft rendering and live backend commerce still require user testing. The mocked browser tests verify native frontend wiring, not a live checkout or real Shopify inventory. Variant selection continues through unchanged Dawn infrastructure; the fixture validates its chooser URL and single-variant form submission.

The homepage now has 25 sections, Shopify's template limit; adding another instance requires consolidating/removing an existing section in Theme Editor. Offers filtering examines collection.products available to Liquid (up to 50 candidate products without pagination); a curated offers collection is recommended. Collection images are merchant data: missing images use the first product image where available; missing/unresolved destinations never receive invented URLs. Promotional photography, overrides and a real offer collection remain merchant choices.

No wishlist UI was added because a real wishlist integration was not found in the current theme source. No old problematic theme files were imported. Native routing, commerce, BSS and checkout remain untouched.
