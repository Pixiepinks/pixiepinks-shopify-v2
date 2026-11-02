# PixiePinks Product Badges — Phase 1

This is a visual Free Delivery badge. It does not change checkout shipping rates,
shipping profiles, discounts or delivery eligibility. Check your shipping rules
before enabling it for a product. No product is automatically opted in.

## Merchant setup

1. In Shopify Admin → Settings → Custom data → Products → Add definition,
   create **Free Delivery Badge**, namespace and key
   **custom.free_delivery_badge**, type **True or false (Boolean)**.
   Pin the definition for easy access. If it already exists, verify its key and type.
2. Open a product, find the pinned metafield, set it to true and save.
   False and unset both hide the badge. Eligibility never uses title, collection,
   price, inventory or shipping weight.
3. Open Online Store → Themes → Customize → Theme settings →
   **PixiePinks Product Badges**. Enable both switches. They default on, but only
   explicitly eligible products show a badge.
4. Optionally upload the approved transparent PNG/WebP under **Upload Free Delivery
   Badge Image**. One image is reused everywhere. Without an image, the pink pill
   and white truck render. The approved mockup was not supplied with this task;
   the fallback follows the written design.
5. Adjust desktop/mobile width, corner and horizontal/vertical inset. Sizes are
   widths in pixels; artwork retains its aspect ratio and is limited to 56px tall.
   No cropping or stretching. Test your artwork at the mobile size.

### Bulk editing

In Products, select products → Bulk edit → Columns → Metafields →
Free Delivery Badge. Check or uncheck the cells and save. If missing, create/pin
its product definition above, then reopen the bulk editor. Use Shopify's native
selection and fill controls to update several rows. Do not set every product true
unless all of them qualify under your actual shipping rules.

## Architecture and coverage

`snippets/pp-product-badges.liquid` is the authoritative eligibility check and
ordered badge list. The product's Boolean metafield `.value` must equal true and
both theme switches must be enabled. It accepts `product`, `context`, optional
`placement` and optional desktop `badge_size`. Add future badge types inside this
list in priority order; do not add eligibility checks to parent sections.
Only Free Delivery is implemented or exposed in Phase 1.

| Rendering surface | Integration |
| --- | --- |
| Homepage featured products, special offers, new arrivals | `card-product` via `pp-featured-products` |
| Boys and girls gift galleries | `pp-gift-card` via `pp-gift-panel` |
| All products, collection grids, featured collections | `card-product` |
| Product search, related products, recommendations, complementary products, collage product tiles | `card-product` |
| Predictive search | Shared badge in result text; 50px thumbnails are too small for readable artwork |
| Main product, responsive duplicate gallery, featured-product section | `product-thumbnail` receives the explicit product object |
| Quick-add product modal | Reuses main-product gallery markup |

Image badges render once per image container, outside zoom buttons, thumbnails
and image modals. Gallery slides each have one badge on image media only, so
variant changes and swiping need no badge JavaScript. Responsive duplicate
galleries retain Dawn's existing mutually exclusive visibility. Video/model
controls and collection/category artwork do not receive product badges.

`assets/pp-product-badges.css` loads once from `layout/theme.liquid`. No new JS,
requests for product data, external services, or changes to price/inventory/cart
logic. Badges ignore pointer events, have no keyboard stops, use an accessible
Free Delivery label and hide decorative image/icon content from screen readers.
Custom artwork uses Shopify resizing, responsive widths and intrinsic dimensions.

## Collision policy

Default top-left with 8px insets. Dawn cards reserve 38px above/below the badge
when an existing sale/sold-out label occupies that edge. Existing labels retain
their positions. Gift galleries keep price at top-right and flow the badge into
a separate overlay row below the actual price height; bottom placements sit at
the bottom of the photo. Top-left product badges reserve 48px vertically for Dawn’s zoom icon.
The badges stay inside the image and do not change card dimensions.

## Validation and rollout

Run `npm ci --ignore-scripts` in `tests/badges`, then from the theme root run
`node tests/badges/verify.cjs`. These are synthetic Liquid/Chromium fixtures,
not a live Shopify preview. Run Shopify Theme Check separately.

Before publishing, preview an eligible, ineligible and unset product in every
surface above, on mobile and desktop, including sale/sold-out products, variant
changes, quick add, image zoom, duplicate right-side galleries, sliders and Theme
Editor section reloads. Test both uploaded artwork and fallback at each corner.
Confirm checkout shipping separately. No live metafield definition or product
values were changed by this implementation. Create the definition in Admin;
then deploy the theme through your normal review process.


## Implementation validation

- All 16 eligibility combinations passed, including false/unset and string true rejection.
- Shared image renderer, accessible meaning, custom artwork and disabled gift markup checks passed.
- All 24 browser layouts passed across 320px, 390px and 1440px, all corners, fallback and uploaded artwork.
- Existing gift gallery suite: 46 checks passed, including automated WCAG A/AA, mobile swipe and editor reconnect.
- Theme Check: zero new issues compared with the untouched baseline; six existing parser-blocking script errors in BSS snippets remain.
- No publish, metafield definition or product values changed.
- Feature branch is based on current `main` at `ba6c18ff43816240c863d103708913577784bcde`; no changes to Shopify-managed templates/settings data.


## Unsupported locations and verification limits

- Standard `card-product` cards without featured media do not show an image badge.
- Video/model media, gallery thumbnails and full-screen zoom modals intentionally have no badge.
- Quick-order variant-list thumbnails (`quick-order-list-row`) are not integrated; their 43px images are too small for the badge.
- Cart drawer/cart notification/cart line-item thumbnails, customer order history, checkout and third-party app-rendered tiles are outside this theme product-display integration.
- Collection/category promotional artwork does not identify an individual product and is excluded.
- Predictive search is supported in the result text column, not as an overlay on its 50px thumbnail.
- The theme supports quick add through the main-product gallery; no separate quick-view renderer was found.
- Source coverage is verified; live Shopify preview (including actual product metafields and uploaded artwork) remains a rollout check.
