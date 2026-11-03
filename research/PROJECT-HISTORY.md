# Project research history

## 1 November 2026 — CYBEX vendor and marketplace search

The second market study expanded the initial UK and Portugal retailer watchlist to include used marketplaces, refurbished sellers and European suppliers. The [full research report](CYBEX-vendor-research-2026-11-01.html) contains 16 seller and marketplace entries, direct product links, four basket calculations and the evidence and monitoring limits for each source. Prices are dated observations, not current quotes.

### Findings

- Portugal: an OLX private listing in Odivelas offered an AVI Spin, Cot S and both adapters for €600. The seller described two months of use, although the listing was tagged new. BabyGold listed a new Sage Green Cloud T Plus with Base T for €458.91. Together, the items totalled €1,058.91 before transport and inspection. Confirm the listing, condition, delivery and vehicle fit. The unspecified used car seat in the listing was assigned no value. [OLX listing](https://www.olx.pt/d/anuncio/cybex-avi-spin-cot-s-adaptadores-2-meses-de-uso-ovo-oferta-IDJDqg5.html) · [BabyGold](https://www.babygold.pt/pt/viagem/cloud-t-i-size-plus-base-t_p17479.html?cat=696&id=487&pc=1)
- Portugal: the comparable all-new basket totalled €1,418.71 in item prices, including a €649.95 Moss Green AVI Spin, €209.95 Cot S, two €49.95 adapters and the €458.91 seat-and-base bundle. Delivery and dispatch dates remained to be confirmed. [CYBEX](https://www.cybex-online.com/pt/pt/p/10106356.html) · [Minicool](https://minicool.pt/products/alcofa-cybex-cot-s)
- UK: Baby and Child Store listed the Moss Green AVI Spin at £439 and UK Baby Centre listed a Moon Black Cot S at £99.99. A six-part basket with an explicitly named new Base T totalled £1,000.80 before postcode-specific costs. A £985.81 alternative used Natural Baby Shower’s “With Base” variant, whose included base model required seller confirmation. [Stroller](https://www.babyandchildstore.com/shop/pushchairs/cybex-avi-spin-moss-green/) · [Cot S](https://ukbabycentre.com/products/cybex-cot-s-carrycot-moon-black-1) · [With-base variant](https://www.naturalbabyshower.co.uk/products/cybex-cloud-t-i-size-plus-car-seat-sage-green?variant=56319234900347)
- The original Natural Baby Shower link selects variant `56319234900347`, labelled “With Base”. The separate seat-only variant is `56319234867579`. Preserve these as distinct offers and do not add another base to a bundle that already contains one.
- The £150 Gumtree AVI Spin listing returned HTTP 410 and was excluded. A £320 eBay ex-display listing had sold, with its accepted offer undisclosed. OLX, eBay UK, Vinted and Facebook Marketplace remain useful discovery channels, with local pickup, fees and seller status checked per listing.

### Compatibility and monitoring decisions

- CYBEX lists Cot S for the AVI Spin adapter. Cot S Lux remains unverified for this frame. Cloud T plus Base T is the configuration associated with the cited ADAC result. Keep condition, exact generation, colour, included components, seller, timestamps and delivery costs distinct.
- Prioritize saved searches on eBay and manual local searches on OLX, Vinted and Facebook Marketplace. eBay Browse is a potential automated source subject to production access. OLX's documented partner API manages authorized seller content, and Vinted Pro documents seller integrations. Meta requires permission for automated data collection. [eBay saved searches](https://www.ebay.co.uk/help/buying/finding-items-managing-purchases/save-search?id=4051) · [OLX API FAQ](https://developer.olxgroup.com/faq) · [Vinted Pro API](https://pro-docs.svc.vinted.com/) · [Meta policy](https://about.fb.com/news/2021/04/how-we-combat-scraping/)
- Candidate retailers must pass exact-variant, currency, stock and access checks before joining the existing daily updater. This study did not enroll the new sources. Public website publication remains manual by user choice.
- The study used the accessible Marketplace Price Research chat brief. Its separate completed API report was not available in the chat record reviewed.

## 3 November 2026 — GBP normalization and price discovery

GBP is the comparison currency. Original seller currency remains visible. EUR amounts use the dated ECB reference rate, and conversions older than seven days are unavailable until refreshed. On 2 November the ECB rate was €1 = £0.83580. The automatic updater normally retrieves the latest available ECB reference rate each day. ECB reference rates are not card-provider quotes. [ECB reference rate](https://www.ecb.europa.eu/stats/policy_and_exchange_rates/euro_reference_exchange_rates/html/eurofxref-graph-gbp.en.html)

- idealo UK is a strong first source for this case. Its CYBEX comparison lists AVI Spin variants and multiple offers. Retailer stock, price and delivery still need verification. [idealo CYBEX results](https://www.idealo.co.uk/list/123188666/stroller-cybex.html)
- PriceSpy is useful for UK comparison and historical pricing. Exact AVI Spin coverage was not established in this check. Its UK login and alert arrangements have changed and should be checked before relying on alerts. [PriceSpy UK FAQ](https://pricespy.co.uk/pricespy-is-adopting-a-new-system--ecZPsnlxQAACUAufZ6)
- PriceRunner is a candidate for product discovery, but its site requested robot verification during this check. Coverage and automation are unverified. [PriceRunner](https://www.pricerunner.com/)
- Trolley is most useful for recurring grocery and household items, including baby consumables. Its value for this exact stroller was not established. [Trolley](https://www.trolley.co.uk/)
- camelcamelcamel tracks Amazon price histories and alerts. Its UK site returned 403 during this check. Match the exact ASIN and check the retailer's current terms. [camelcamelcamel UK](https://uk.camelcamelcamel.com/)
- Search Amazon UK, Spain and Germany separately. Verify the seller, exact variant, destination, taxes, shipping and returns. No verified Amazon offer was added during this check.
- The project chat shows a later UK-first Deep Research request, but its completed report is not present in the accessible chat record. The prior 1 November report remains the latest full research document accessible locally. The Worten no-VAT example was illustrative, not a verified eligible AVI Spin offer.

The new sources are discovery entries, not enrolled automatic price monitors. The public Cloudflare edition is published manually and does not include these changes until republished.

## 3 November 2026 — Retailer and resale sweep

A fresh run attempted 17 configured retailer URLs. Thirteen succeeded and four failed. BabyGold and Algateckids passed the automated exact-product checks and are now in the daily watchlist. The remaining new sellers and marketplace searches require manual checks. The offer list includes both new and used listings, separately selectable.

The checked OLX listing offered an AVI Spin, Cot S and adapters for €600, subject to seller confirmation and inspection. BabyGold listed the Cloud T Plus and Base T bundle at €458.91, and Baby and Child Store listed a Moss Green AVI Spin at £439, subject to seller SKU reconciliation. Delivery, import charges and vehicle fit remain open. Automated requests to UK Baby Centre, Minicool, Natural Baby Shower and Pramworld were blocked. Search or retailer pages with no current verified offer are kept as links, without fabricated prices.

## 3 November 2026 — Moss Green product codes and future sources

CYBEX UK identifies the Moss Green AVI Spin as product code 525000441, matching Baby and Child Store and Natural Baby Shower. CYBEX Portugal identifies its Moss Green AVI Spin as 525000437. Both are described as AVI Spin and list 12.5 kg and the same most-compact folded dimensions. CYBEX does not explain the code difference on these pages, so a regional catalog distinction is a plausible interpretation, not proof that the products are identical in every detail or evidence that either is an older model. UK barcode 4063846513314 was stated by Natural Baby Shower. Keep the codes and country-specific documentation distinct. [CYBEX UK](https://www.cybex-online.com/en/gb/p/10106359.html) · [CYBEX Portugal](https://www.cybex-online.com/pt/pt/p/10106356.html) · [Natural Baby Shower](https://www.naturalbabyshower.co.uk/products/cybex-avi-spin-stroller-moss-green)

Baby and Child Store’s UK SKU identity was resolved and the £439 listing was checked again. Its basket remains conditional on verified charges and other component costs. A £400 Seashell Beige Gumtree lead around Edinburgh and a £10 Vinted adapter appeared in search indexes, but direct listing availability, adapter type and costs were not confirmed. The old £150 Gumtree ad returned 410. Sources for future product classes were retained, including eBay, Vinted, Gumtree, Facebook Marketplace, NCT Nearly New Sales, BabySorted, My Little Find, Priceway, Lowsort and Google Shopping. Presence in the source directory does not imply coverage for this exact item.
