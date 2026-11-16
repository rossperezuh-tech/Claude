# health-sites

Two static affiliate sites built from one shared template.

- `template/` shared layout, styles and behavior
- `sites/healthshop/` All In One Health Shop
- `sites/remedies/` supplement and herb site (coming in Part 3)
- `LINKS-TODO.md` every link that still needs an affiliate-tagged replacement

## Rebuild both sites

```bash
node build.js
```

Each site is written to its own `sites/<name>/dist` folder.

## Edit a site

- Products: `sites/<name>/products.json`
- Name, colors and copy: `sites/<name>/site.json`
- Share image and icon (only after a name or color change): `node tools/make-images.js`

## Deploy

Each site is its own Vercel project. Set the project's Root Directory to
`sites/healthshop` or `sites/remedies`. The `vercel.json` in that folder
handles the build.
