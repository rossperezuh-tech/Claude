# sellmywarehousedirect.com

Static site for the warehouse / industrial seller-lead business. One build script turns the
market data into a page per metro, state and property type.

    node build.mjs            # build into dist/
    node build.mjs --serve    # build and preview at http://localhost:4173

## What to edit

| To change…                                   | Edit                         |
| -------------------------------------------- | ---------------------------- |
| Domain, phone, email, form endpoint, tracking | `site.config.mjs`            |
| Add or change a metro page                    | `data/metros.mjs` (one line) |
| State pages                                   | `data/states.mjs`            |
| Property-type pages                           | `data/types.mjs`             |
| Shared sections (how it works, why us, form)  | `src/partials/`              |
| Page layouts and wording                      | `build.mjs`                  |
| Styles / form behaviour                       | `src/styles.css`, `src/app.js` |

Page addresses look like `/sell-warehouse-houston-tx`, `/sell-warehouse-texas`,
`/sell-cold-storage-facility` and `/locations`. `sitemap.xml` and `robots.txt` are generated.

## Deploying on Vercel

Import this GitHub repo as a new Vercel project and set **Root Directory** to
`sites/sellmywarehousedirect`. `vercel.json` supplies the build command and output folder.
Then add the domain under the project's Domains settings.

## Rules for market data

Keep metro and state entries to things that can be checked on a map: counties, submarkets,
highways, ports. No market statistics, no invented deals or testimonials.

## Google Ads

    node ads.mjs    # regenerates the import files in ads/ from the same market data

`ads/` holds five CSVs for Google Ads Editor (campaigns, ad groups, keywords, ads, negative
keywords). Every campaign is created **Paused** with a placeholder $20/day budget. Each ad group
sends clicks to its matching page, and the URL suffix tags each click so the lead form records
which campaign and keyword produced it.
