# fuzzloom-site

The website for [Fuzzloom](https://github.com/MikeMoulder/fuzzloom): a landing page and the documentation, as static files.

- `index.html` is the landing page.
- `docs/` holds the documentation pages, generated from markdown.
- `llms.txt` and `llms-full.txt` give the docs as plain text for language models.

## Build the docs

The guide, the architecture notes and the algorithms reference come from the Fuzzloom repository's `docs/` folder, so the site and the code never drift apart. The introduction, quick start and CLI reference live in `content/`.

```bash
npm install
FUZZLOOM_REPO=../fuzzloom npm run build              # defaults to the parent directory
BASE=https://example.pages.dev npm run build         # absolute links in llms.txt
```

## Preview and check

```bash
node build/serve.mjs            # http://localhost:4173
node build/check-links.mjs      # every relative link and #anchor resolves
```

## Deploy

Any static host serves the folder as it is, for example Cloudflare Pages with no build command and the repository root as the output directory.

## Credits

- The landing page is built with the design kit from [taste-skill](https://github.com/Leonxlnx/taste-skill) (MIT, see `assets/LICENSE-taste-skill.txt`).
- Tool icons from SVG Logos by Gil Barbara (CC0) and Lucide (ISC), listed in `assets/icons/icons-credits.json`. Product names and logos are trademarks of their owners.
- Fonts: Gabarito, Figtree and DM Mono from Google Fonts.

Fuzzloom and this site are under the Apache License 2.0, except for the third-party files noted above.
