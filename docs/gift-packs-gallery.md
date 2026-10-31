# PixiePinks Gift Packs Gallery

The reusable Online Store 2.0 section uses the repository's root-level Shopify directories. The approved implementation commit `a75bd94a3fd7586e4ec19b742eabcad0a817a337` remains in branch history. That implementation originated from the temporary ZIP-download branch; a subsequent reconciliation merges the actual V2 development branch (`main`) into `feature/gift-packs-gallery` and moves only the six gallery additions into its existing theme structure. The final PR diff excludes the ZIP and the nested foundation copy. Nothing has been merged into `main` or published to Shopify.

The supplied mockup guides the blush/blue palette, white rounded cards, bright price badges, hearts/stars, and benefits strip. Use background-only artwork in the image settings for the fairy illustrations; the section does not reuse or flatten the mockup's product names, codes, or prices. Phone cards follow the written 1.2–1.5-card requirement rather than the mockup's smaller three-card composition.

## Files to install on an unpublished theme

The six new theme files, preserving their directories:

- `sections/pp-gift-packs-gallery.liquid`
- `assets/pp-gift-packs-gallery.css`
- `assets/pp-gift-packs-gallery.js`
- `snippets/pp-gift-panel.liquid`
- `snippets/pp-gift-card.liquid`
- `snippets/pp-gift-icon.liquid`

Copy only these additions into an existing customized V2 theme. Uploading the whole older foundation over the current store could replace merchant customizations. No existing header, navigation, cards, reviews, template, settings, or section source was edited.

`artifacts/gallery/gift-packs-gallery-additions.zip` bundles just these six files. It is a file bundle for the theme developer, not a complete theme ZIP for Shopify's Upload theme action.

## Safe homepage placement

The verified V2 `main` homepage has these adjacent section IDs:

1. `pp_featured_products_KKaqgb` — Featured Products
2. `pp_featured_products_UFjpaW` — Today's Special Offers
3. `featured_collection_UFg7hX` — New Arrivals

`templates/index.json` remains byte-for-byte unchanged in this PR to preserve merchant-managed settings. In **Online Store → Themes**, open **Customize** for the intended unpublished V2 theme. On **Home page**, choose **Add section → Gift Packs Gallery**. Drag it immediately after Today's Special Offers and before New Arrivals. Save the draft theme and confirm the order visually. This retains every existing section ID and setting. Do not publish without approval.

## Merchant configuration

1. Create or identify the two actual gift pack collections under **Products → Collections**. Ensure products are active and available to the Online Store sales channel.
2. In **Customize → Gift Packs Gallery**, select the Boys and Girls collections independently. Explore buttons derive their URLs from these selections; no handles or URLs are hardcoded. An unselected collection has an empty message and no Explore link. A selected empty collection shows the message and its real collection link.
3. Configure each panel's heading, subtitle, product count (1–16), autoplay, interval (3–12 seconds), and button text. Either panel can be disabled. A single enabled panel fills the available width. The general enable checkbox hides the whole gallery.
4. Set general title/subtitle, cream overlay opacity, and top/bottom spacing. All section labels and the optional four benefit messages are editable. Turn off the benefits strip if desired.

## Four background images

Upload independent files in these section settings:

| Setting | Recommended dimensions | Notes |
| --- | --- | --- |
| Desktop title background | 1920 × 500 | Fairy, gifts, hearts, stars; leave centre clear for the live heading. |
| Mobile title background | 1080 × 1350 | Portrait artwork with space for the heading. Uses a dedicated mobile source below 750px. |
| Boys background | 1080 × 1350 | Blue artwork, without baked-in product photos or labels. |
| Girls background | 1080 × 1350 | Pink artwork, without baked-in product photos or labels. |

Use background-only exports to avoid repeating title lettering. Title artwork uses `object-fit: contain` so it is never distorted or clipped; pastel fallback areas fill any unused space. Panel backgrounds use decorative cover cropping. Adjust the cream overlay for readability. Without images the CSS pastel design remains usable. Images use Shopify image URLs, responsive widths, reserved geometry, and lazy loading. Product featured images use a fixed 4:5 container with `object-fit: contain` to retain the whole image.

## Gift pack codes and prices

In **Settings → Custom data → Products → Add definition**, create **Gift pack code**, namespace/key **`custom.gift_pack_code`**, type **Single line text**. Populate the value on each gift pack product. Codes are plain text, not an image overlay. If empty, the section uses `product.selected_or_first_available_variant.sku`; if that is also empty the code badge is omitted.

The price and compare-at price use that same selected/first available variant, so the fallback SKU and displayed price refer to the same variant. Prices use Shopify `money`, or `money_with_currency` when the theme's currency-code setting is enabled. Applicable compare-at prices are struck through. Sold-out products are labelled and still link to their product pages. Shopify price changes appear on the next storefront render; this section does not poll already-open pages or implement variant selection. No made-up fallback price exists.

## Carousel behavior

Each panel is its own `pp-gift-carousel` custom element. Native scrolling and scroll snap provide swipe support without a library. Autoplay advances one card position at a time, returning from the last scroll position to the first with no cloned products. It is a looping slideshow, not an uninterrupted marquee. Previous/next arrows, numbered accessible dot labels, and a pause/play control are available when there is overflow. Mobile scroll shows roughly 1.35 cards. At widths below 990px the panels stack.

Hover and keyboard focus temporarily pause autoplay. Swiping, scrolling with a wheel, keyboard navigation, arrows, and dots leave autoplay paused until the user explicitly presses Play. It also pauses outside the viewport and in hidden tabs. Reduced-motion preference disables autoplay and smooth movement while retaining instant manual navigation. Without JavaScript, collection links and native horizontal scrolling still work; inactive JS controls stay hidden.

Repeated script execution is guarded. Disconnecting the element clears both timeouts, aborts event listeners, and disconnects observers; reconnecting rebuilds them. This supports the section replacement behavior used by Shopify Customize without global reinitialization handlers. Dots represent distinct reachable scroll positions, including a partial final page, rather than generating repeated cards.

## Validation and screenshots

From the repository root:

```sh
npm ci --prefix tests/gallery
npm test --prefix tests/gallery
/workspace/shopify-tools/node_modules/.bin/shopify theme check --path . --output json
```

Tests require Node and Chromium; the default binary is `/usr/bin/chromium` (override with `CHROMIUM_PATH`). The pinned test dependencies and lockfile are separate from the Shopify theme; do not upload `tests/` or `artifacts/` to the theme. The browser test renders the actual section/snippets with LiquidJS, small Shopify-filter substitutes, Dawn base CSS, and explicit synthetic collections. These filter substitutes are a test harness, not a production renderer. Shopify's actual Liquid and schema are checked with Theme Check.

`artifacts/gallery/desktop.png` (1440px) and `mobile.png` (390px) are local design-test screenshots using labelled fixture data and geometric test illustrations. They are **not live-store screenshots or product photographs**. Responsive checks also cover 768px and 320px. `test-results.json` records completed checks; `accessibility.json` records automated accessibility violations. Theme Check evidence is in `theme-check.json` with its pre-existing baseline in `theme-check-baseline.json`.

The V2 `main` baseline has 6 `ParserBlockingScript` errors in BSS snippets and 22 warnings. The gallery must introduce zero additional findings; those original files are not changed or suppressed.

Delivery validation: all 46 browser checks passed, including native touch events, independent autoplay, manual controls, pause behavior, reduced motion, currency-code formatting, empty collections, missing images, and custom-element reload cleanup. The automated WCAG A/AA scan found zero violations. Theme Check matched the baseline exactly: 6 existing errors, 22 existing warnings, zero new findings. Shopify CLI theme packaging passed. Every pre-existing file from the verified V2 base remains byte-for-byte unchanged in the final PR diff. There was no pre-existing repository test runner.

### Remaining Shopify integration checks

No Shopify store session or store credentials were available. Before publishing, test the unpublished V2 theme with its actual collections, Markets currency context, all four uploaded images, and real product/metafield values. In Customize, replace/reorder/reload this section, toggle either panel, change collections, and verify independent movement and no console errors. Confirm the homepage order against the actual V2 theme. Browser fixtures test the custom-element disconnect/reconnect and duplicate-script lifecycle but cannot certify Shopify's remote editor or real checkout/catalog behavior.

With authorized store access, use the installed CLI's `theme dev --path . --store <actual-store>.myshopify.com` against an approved development theme, or copy the six additions into the actual V2 development theme. Review required Shopify network access first. Do not run a whole-foundation push over the merchant theme. No live theme upload or publication is part of this delivery.
