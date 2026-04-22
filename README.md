# Jay Gould · Personal Site

A personal website, blog and portfolio, built with **Astro 6** + **React 19** + **TypeScript**.
It combines a classic Markdown blog with interactive, WebGL / Canvas-driven UI experiments
(Three.js, GSAP, Motion, Lenis smooth scroll, custom "reactbits" components).

Live site: <https://Jay-Gould7.github.io>

---

## ✨ Highlights

- **Hybrid content + interaction** — Markdown-driven blog & stories sit next to scroll-pinned
  3D canvases, a drag-rotatable photo dome, and canvas text-glitch effects.
- **Astro Islands** — heavy React / Three.js widgets hydrate on demand (`client:load`,
  `client:only="react"`), keeping the rest of the page as static HTML.
- **Content Collections** — typed frontmatter for blog posts and life stories via Zod schemas
  in `src/content.config.ts`.
- **Smooth scroll + scroll-driven animation** — Lenis orchestrates page scroll; ScrollStack
  and scroll-seeked `<video>` elements respond to it.
- **Glassmorphism design system** — shared `GlassSurface`, `GlassTopBar`, `SocialsDock`
  components with backdrop-filter layers and mask-feathered edges.
- **Static export, CI deploy** — GitHub Actions builds and publishes to GitHub Pages on
  every push to `main`.

---

## 🧱 Tech stack

| Layer        | Tools                                                                                  |
| :----------- | :------------------------------------------------------------------------------------- |
| Framework    | Astro 6, React 19, TypeScript                                                          |
| Styling      | Tailwind CSS 4 (via `@tailwindcss/vite`), scoped CSS in `.astro` files                 |
| 3D / Canvas  | Three.js, `@react-three/fiber`, `@splinetool/react-spline`                             |
| Animation    | GSAP (+ `@gsap/react`), Motion, Lenis, custom `requestAnimationFrame` loops            |
| Interaction  | `@use-gesture/react` (drag / pinch for DomeGallery)                                    |
| Content      | Astro Content Collections, Markdown + MDX (`@astrojs/mdx`)                             |
| SEO / Meta   | `@astrojs/sitemap`, `@astrojs/rss`, canonical URLs + Open Graph in `BaseHead.astro`    |
| Images       | `sharp` for build-time optimisation; remote R2 URLs for the Life dome gallery          |
| Deployment   | GitHub Pages via `withastro/action@v3` in `.github/workflows/deploy.yml`               |

**Node** >= `22.12.0` (enforced in `package.json#engines`).

---

## 🗺️ Pages

| Route         | Source                              | What it is                                                        |
| :------------ | :---------------------------------- | :---------------------------------------------------------------- |
| `/`           | `src/pages/index.astro`             | Landing: hero, launch button, article preview strip.              |
| `/about`      | `src/pages/about.astro`             | Bento-style about page with scroll-driven video cards.            |
| `/blog`       | `src/pages/blog/index.astro`        | Blog index (cards) backed by the `blog` content collection.       |
| `/blog/[...]` | `src/pages/blog/[...slug].astro`    | Individual blog post rendered through `layouts/BlogPost.astro`.   |
| `/projects`   | `src/pages/projects/index.astro`    | GitHub-fed project showcase with highlight + standard cards.      |
| `/life`       | `src/pages/life/index.astro`        | Drag-rotatable photo dome + `METADATA` story feed.                |
| `/rss.xml`    | `src/pages/rss.xml.js`              | Auto-generated RSS feed for the blog collection.                  |

---

## 📦 Project structure

```text
.
├── .github/workflows/deploy.yml   # GitHub Pages CI
├── astro.config.mjs               # Astro + integrations (mdx, sitemap, react, tailwind)
├── public/                        # Static assets (fonts, icons, videos, models, avatar)
├── src/
│   ├── assets/                    # Imported assets processed by Astro
│   ├── components/                # Astro + React components
│   │   └── reactbits/             # Interactive widgets (DomeGallery, FuzzyText, …)
│   ├── content/
│   │   ├── blog/                  # Blog posts (*.md, *.mdx)
│   │   ├── life/                  # Life stories (*.md) + life-images.ts roster
│   │   └── project/               # Project metadata (if used locally)
│   ├── content.config.ts          # Zod schemas for the `blog` and `life` collections
│   ├── consts.ts                  # SITE_TITLE, SITE_DESCRIPTION
│   ├── layouts/BlogPost.astro     # Shared post layout
│   ├── lib/                       # Small helpers
│   ├── pages/                     # Route files
│   └── styles/                    # Global CSS (blog-list, global, etc.)
├── package.json
└── tsconfig.json
```

---

## 🧞 Commands

All commands are run from the project root:

| Command           | Action                                                                 |
| :---------------- | :--------------------------------------------------------------------- |
| `npm install`     | Install dependencies.                                                  |
| `npm run dev`     | Start the dev server on **`http://localhost:8080`** (see `astro.config.mjs`). |
| `npm run build`   | Build the static site to `./dist/`.                                    |
| `npm run preview` | Preview the production build locally.                                  |
| `npm run astro`   | Run Astro CLI commands (e.g. `npm run astro -- check`).                |

---

## ✍️ Authoring content

### Blog posts

Add a Markdown or MDX file under `src/content/blog/`:

```md
---
title: "Hello world"
description: "A short summary for cards and SEO."
pubDate: 2026-04-22
updatedDate: 2026-04-23      # optional
heroImage: ./cover.jpg        # optional, resolved by Astro's asset pipeline
---

Your post body here.
```

The schema is defined in `src/content.config.ts` (`blog` collection) and is type-checked at
build time.

### Life stories

The `/life` page combines two data sources:

1. **`src/content/life/life-images.ts`** — the roster of photos shown on the `DomeGallery`
   sphere. Each entry is a URL string or `{ src, alt }`. The dome has `segments * 5` tiles,
   and the list is repeated to fill them.
2. **`src/content/life/*.md`** — individual stories rendered below the dome as
   `PixelTransition` cards (image flips to caption). Frontmatter:

   ```md
   ---
   title: "A day in Lisbon"
   date: 2026-04-10
   image: "https://<your-cdn>/lisbon.jpg"
   alt: "Rooftops at dusk"
   ---

   Markdown body shown on the back of the card.
   ```

A starter template lives at `src/content/life/sample-story.md`.

---

## 🧩 Notable components

Located in `src/components/` and `src/components/reactbits/`:

- **`DomeGallery`** — drag / pinch-rotatable 3D photo sphere (`/life`).
- **`FuzzyText`** — canvas-rendered text with live per-row pixel jitter (the `METADATA`
  title on `/life`). Resolves responsive `clamp()` font sizes to pixels before drawing.
- **`PixelTransition`** — image-to-content pixel-dissolve transition, with an `autoHeight`
  mode for native aspect ratios.
- **`ScrollStack`** — pinned, stacked card animation driven by window or container scroll.
  Uses Lenis on desktop, falls back to `requestAnimationFrame` polling on touch devices to
  avoid iOS scroll jitter.
- **`GlassTopBar` / `SocialsDock` / `GlassSurface`** — the shared glassmorphism chrome.
- **`Hero3D` / `AboutBento` / `AboutStack`** — Three.js / R3F scenes and the About page
  bento layout.
- **`BlogList` / `StackedArticles` / `ArticleCard`** — blog index cards and the home-page
  article strip.

---

## 🚀 Deployment

On every push to `main`, `.github/workflows/deploy.yml` runs:

1. `actions/checkout@v4`
2. `withastro/action@v3` (Node 22) — installs, builds, uploads the `dist/` artifact.
3. `actions/deploy-pages@v4` — publishes to the `github-pages` environment.

To deploy your own fork:

1. In the repository **Settings → Pages**, set the source to **GitHub Actions**.
2. Update `site` in `astro.config.mjs` to your own URL.
3. Update `SITE_TITLE` / `SITE_DESCRIPTION` in `src/consts.ts`.

---

## 🪪 Credits

- Based on the official [Astro Blog starter](https://github.com/withastro/astro/tree/main/examples/blog),
  which itself draws from [Bear Blog](https://github.com/HermanMartinus/bearblog/).
- Several interactive widgets under `src/components/reactbits/` are adapted from the
  [reactbits](https://reactbits.dev/) collection and customised for this site.
