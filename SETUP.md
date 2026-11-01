# Publish and maintain Little Atlas

## Default: Cloudflare Pages + GitHub Actions

Use a public GitHub repository containing only this project. Standard Linux GitHub runners for public repositories are free under the current terms. Cloudflare Pages provides a free `pages.dev` address; no paid domain is required.

1. Create a **Direct Upload** Pages project named `little-atlas-baby-guide` (or a unique available name), with production branch `main`.
2. Build with `npm run build` and deploy `dist/`. If using the official Wrangler CLI:

   ```sh
   wrangler login
   wrangler pages project create little-atlas-baby-guide --production-branch main --force
   wrangler pages deploy dist --project-name little-atlas-baby-guide --branch main
   ```

3. For unattended deployment, create a Cloudflare API token limited to **Account / Cloudflare Pages / Edit** for the intended account. Store it only in GitHub Actions secrets, never in source files or chat.
4. Add repository secrets `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`. Add repository variable `CLOUDFLARE_PAGES_PROJECT` with the exact Pages project name.
5. Run **Daily prices and evidence access → Run workflow**. Confirm tests, validation, observation commit and deployment all succeed. Visit the returned Pages URL and verify the visible last-check time.
6. Confirm the next real scheduled run after 07:23 UTC. A manual run proves the workflow works; it does not prove the scheduler has fired.

Before Cloudflare credentials are connected, the workflow still refreshes and commits the research and uploads the webpage as a seven-day build artifact. The updater can therefore run independently while hosting is being connected. No Cloudflare deployment is claimed until the publish step succeeds.

Do not enable paid plans or auto-recharge. Keep the job on `ubuntu-latest`, the 12-minute timeout, bounded URL coverage and short artifact retention. No paid proxy, scraping service or AI API is needed. Free quotas and eligibility can change; check the provider pages below before changing the design.

## Alternative: manual upload / Netlify

Upload the contents of `dist/` to either static host. The self-contained `index.html` also works offline as a dated snapshot.

Netlify can host the page, but its credit-based free allowance may not cover daily production deployments. Keep automatic publication disabled there until the account's applicable quota has been checked. The chosen automated route is Cloudflare Pages.

## Maintenance

- Daily: prices, stock, currency, UK recall feed and update health.
- Weekly: manufacturer document access/change checks; review detected changes manually.
- Monthly: editorial review of guidance, source credibility, shipping policies and promotions.
- Add offers only after exact variant, currency and included components are established.
- For failed fetches, open the original retailer link. Preserve the old observation and fix the adapter; never just advance its timestamp.
- UK customs charges remain unresolved where source terms do not establish who pays. Mainland PT comparisons do not imply island delivery costs.

## When the schedule stops

A browser computes staleness from the observation timestamp, so the page can still warn after hosting updates stop. Inspect GitHub Actions for failures, disabled workflows or missing credentials. Schedules may be delayed, and public-repository schedules may be disabled after 60 days without activity. Run the workflow manually after fixing the cause, then confirm a subsequent scheduled run. Do not create a second paid automation as a workaround.

## Rollback

Use Git history to restore the previous reviewed data/source version, run tests and rebuild. Redeploy the prior known-good `dist/` with Wrangler, or use the Cloudflare Pages deployment dashboard's rollback option. A rollback must preserve true observation dates; it cannot make an old price current.

## Sources for hosting decisions

- [Cloudflare Pages limits](https://developers.cloudflare.com/pages/platform/limits/)
- [Cloudflare Direct Upload](https://developers.cloudflare.com/pages/get-started/direct-upload/)
- [GitHub Actions billing](https://docs.github.com/en/billing/concepts/product-billing/github-actions)
- [GitHub schedule behaviour](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows)
- [Netlify credit usage](https://docs.netlify.com/manage/accounts-and-billing/billing/billing-for-credit-based-plans/how-credits-work/)
