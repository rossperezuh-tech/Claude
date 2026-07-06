# Portfolio — Ross Perez

Single-page builder/operator portfolio. Showcases Steadyhand, The Prompt
Sherpa, the agency dashboard, and selected ventures. Fully self-contained
(all styles and screenshots inlined as data URIs), no build step.

## Deploy

It's one static `index.html` — deploy anywhere:

- **Vercel:** import the repo, set the root directory to `sites/portfolio`,
  framework preset "Other". Done.
- Or drag `index.html` onto any static host (Netlify, Cloudflare Pages).

## Edit

Open `index.html`. Copy lives in plain markup; the screenshots are inline
`data:image/jpeg` URIs. To swap a screenshot, replace the matching
`data:image/jpeg;base64,…` string. Name, links, and venture list are all
plain text near the top of the `<body>`.
