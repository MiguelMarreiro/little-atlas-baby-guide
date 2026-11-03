# Little Atlas

An evidence-led baby buying field guide for delivery to mainland Portugal and the UK. It compares four terrain-focused pushchairs, explains compatibility, indexes information sources and maintains an exact-variant price watchlist. The public dataset contains no family names, messages, addresses or baby details.

[Open the live guide](https://little-atlas-baby-guide.pages.dev/) · [Download the standalone HTML](https://little-atlas-baby-guide.pages.dev/index.html)

Research decisions and dated findings are recorded in [project research history](research/PROJECT-HISTORY.md), with links to the full studies.

## Use the guide

Open `dist/index.html` in a browser. It is self-contained: styles, interaction code and the research snapshot are embedded. The optional `dist/snapshot.json` is the same research in a reusable format. The HTML works on Cloudflare Pages or Netlify without a framework, server or database.

Start with **Compare products**, then **Prices & deals**. Choose a destination and display currency. Retailer prices remain in their original currency alongside conversions. Unknown delivery charges do not become zero. The basket selector compares complete configurations; the automatic search finds the lowest verified delivered basket **within this watchlist**, not across the entire market.

## Current research limits

- AVI Spin lists **Cot S**, not Cot S Lux. The original Lux combination is excluded pending exact manufacturer evidence.
- ADAC's Cloud T + Base T result is specific to that configuration and test date; it is not assigned to Base Z2.
- Regional manuals and manufacturer statements sometimes conflict. Running restrictions are shown separately from walking suitability.
- Terrain reference specifications are for TER_V3. A newer UK V4 listing is not silently used as its price.
- Cloud T Comfort and Plus upholstery are separate offer descriptions. Different editions are not presented as like-for-like savings.
- Natural Baby Shower blocked the automated request. Its original links remain manual checks with no invented current price.
- Not every alternative has a fully priced newborn travel system. Missing parts and compatibility evidence remain visible.
- Mainland Portugal is the default shipping region. Madeira/Azores and Channel Islands need separate eligibility/cost checks.
- No vehicle, delivery postcode, purchase deadline or firm budget has been supplied. Confirm these before a purchase.

## Run locally

Node.js 22 or later. No package install is needed for research, building or tests.

```sh
npm test
npm run validate
npm run update
node scripts/check-sources.mjs
node scripts/check-recalls.mjs
npm run build
npm run preview
```

The preview starts at http://localhost:4173. Opening the self-contained HTML directly also works.

## Data and code

- `data/products.json`: exact reference products, manual links and comparison facts.
- `data/evidence.json`: claim-level citations, applicability and unresolved questions.
- `data/sources.json`: publisher, coverage, authority, interests, access and review cadence.
- `data/offers.json`: exact retailer variants, currency, components, shipping and observation dates.
- `data/history.json`: one year of compact price observations; never fabricated back-history.
- `data/baskets.json`: required component lists; unresolved configurations cannot qualify.
- `data/fx.json`: dated ECB reference rates; not a payment-provider quote.
- `data/status.json`: attempts, successful checks, errors, coverage and recent runs.
- `lib/engine.mjs`: the same pure price rules run in the webpage and tests.
- `scripts/update.mjs`: bounded, robots-aware price checks, exact SKU/GTIN/variant and currency validation.

For a new retailer, confirm its terms and robots policy, use an exact product endpoint, and add a `candidate` offer. The first successful updater check makes it `automatic`. A page that blocks access remains manual; do not bypass CAPTCHA, login or paywalls. `components` means the products **included in the purchase**, not the products an adapter is compatible with. Every single-component offer includes only its own product ID.

Shipping and promotion terms require editorial review; a successful price fetch does not revalidate policy text. Retain a terms source and terms review date. Conditional/member/cashback offers do not reduce guaranteed totals. Unknown shipping, charges, stock, product identity or compatibility prevents a winner. A discount code needs verified conditions and expiry; stacking is never assumed.

Source checks detect access/content changes. They do not approve revised safety claims automatically. Review changed manufacturer documents before editing evidence. Monthly editorial review is still required for parenting information and source quality.

## Safety and recall coverage

The UK updater scans recent OPSS Atom feed entries for candidate brand/model terms. It does not exhaust the historical recall database or establish batch identity. EU Safety Gate is linked for manual searches. A clear feed result is **not** a declaration that a product is safe or certified. Product approval, independent testing and manufacturer compatibility remain separate evidence types.

## Scheduling and publishing

See [SETUP.md](SETUP.md). The daily GitHub Actions workflow runs at **07:23 UTC**, with manual dispatch available. It uses ordinary code, not an AI model. It commits observations, builds the static page and publishes to Cloudflare when credentials are connected. Remote source failures are warnings, allowing a fresh failure/stale status to publish; structural errors fail the job. The page marks observations older than 36 hours stale even if the scheduler stops.

## Verification

`npm test` covers exact variants, currency proof, missing costs, unknown stock, stale prices, used parts, duplicate/overlapping components, coupon validity/stacking, per-seller shipping and complete basket optimization. It also checks that a failed fetch preserves the previous successful timestamp and price. `npm run validate` checks reference integrity and accidental private data patterns before publication.

## Research workflow and model budget

Use Luna for bounded extraction of already-selected sources, Sol for evidence synthesis or code changes, and Astra only for an unresolved conflict that needs a focused review. Each agent receives a narrow deliverable and evidence schema; at most two run at once. Daily operations make no AI calls and require no API key. See [official model guidance](https://learn.chatgpt.com/docs/models) for availability and usage differences.

No affiliate tracking or paid ranking is added by this project. Retailers and aggregators may have their own commercial interests, recorded in the source directory.
