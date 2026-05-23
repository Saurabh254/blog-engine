# blog-engine

A minimal markdown blog engine built with [Astro](https://astro.build). Add a `.md` file to `src/blogs/`, run the dev server, and the post is live.

Deployed at [blog.saurabhvishwakarma.in](https://blog.saurabhvishwakarma.in).

## Prerequisites

- Node.js 22+
- GitHub CLI logged in (`gh auth login`) **or** a `GITHUB_TOKEN` env var (used to render markdown via the GitHub API)

## Quick start

```bash
npm install
npm run dev
```

Open [http://localhost:4321](http://localhost:4321).

## Create a new blog post

### 1. Add a markdown file

Create a new file in `src/blogs/`:

```bash
touch src/blogs/my-new-post.md
```

The filename does not affect the URL. The **title** in frontmatter does.

### 2. Add frontmatter + content

```markdown
---
title: My New Post
description: One sentence summary for SEO and social previews (keep under ~160 characters).
date: 2026-05-23
tags: [thoughts]
draft: false
image: images/og-cover.webp
---

Your post content here. Write in normal Markdown.

## A section heading

Paragraph text. **Bold** and [links](https://example.com) work.

- Bullet lists
- Are supported

![](images/inline-photo.webp)
```

### 3. Preview locally

```bash
npm run dev
```

Your post URL is generated from the title:

| Title            | URL                    |
|------------------|------------------------|
| `My New Post`    | `/my-new-post`         |
| `Hello World!`   | `/hello-world`         |

### 4. Build for production

```bash
SITE_URL=https://blog.saurabhvishwakarma.in npm run build
npm run preview
```

Set `SITE_URL` in your hosting provider (Cloudflare Pages, etc.) so canonical URLs, sitemap, and Open Graph tags are correct.

## Frontmatter reference

| Field         | Required | Description |
|---------------|----------|-------------|
| `title`       | Yes      | Post title. Used for the page heading and URL slug. |
| `date`        | Yes      | Publish date (`YYYY-MM-DD`). |
| `description` | No       | SEO / social preview text. Highly recommended. |
| `tags`        | No       | List of tags (stored, not shown on site yet). |
| `draft`       | No       | `true` = visible in dev only, excluded from production builds. |
| `image`       | No       | Social preview image (see Images below). |

## Images

Put image files in `public/` and reference them in markdown:

```
public/
  images/
    og-cover.webp
    diagram.png
```

In your post:

```markdown
---
image: images/og-cover.webp
---

![](images/diagram.png)

[](images/photo.webp)
```

Paths like `images/photo.webp` are automatically resolved to `/images/photo.webp`.

You can also use absolute paths (`/images/photo.webp`) or full URLs (`https://...`).

## Project structure

```
src/
  blogs/           # Markdown posts go here
  layouts/         # Base layout + post layout
  pages/           # Index + dynamic post routes
  lib/             # Slug, images, site config
public/
  images/          # Static images
  robots.txt
```

## Commands

| Command           | Action                          |
|-------------------|---------------------------------|
| `npm run dev`     | Start dev server                |
| `npm run build`   | Build static site to `dist/`    |
| `npm run preview` | Preview the production build    |

## Environment variables

Copy `.env.example` and configure as needed:

| Variable        | Description |
|-----------------|-------------|
| `SITE_URL`      | Production URL (e.g. `https://blog.saurabhvishwakarma.in`) |
| `GITHUB_TOKEN`  | GitHub token for markdown rendering in CI |

Locally, `gh auth token` is used automatically if no token is set.

## SEO checklist (per post)

- [ ] Unique `title`
- [ ] Unique `description` (~150 characters)
- [ ] Correct `date`
- [ ] `draft: false` before publishing
- [ ] Optional `image` for social sharing
- [ ] Descriptive alt text on images: `![what it shows](images/...)`

Sitemap is generated automatically at `/sitemap-index.xml` on build.
