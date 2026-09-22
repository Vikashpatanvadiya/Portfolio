# Portfolio

Personal site built with Next.js 16. All content (profile, sections, projects, contact links…) is editable from a private admin panel. No code changes needed.

## Admin

Open `/admin` (it isn't linked anywhere on the site, and search engines are told to skip it) and log in with `ADMIN_PASSWORD`.

- **Profile**: name, headline, bio, highlights, photo, banner, resume link, SEO text
- **Sections**: each one gets its own page (`/projects`, `/skills`…) and a nav link. Section types:
  - **Projects**: name, category, dates, description, role, where it was built, tech stack, achievements, takeaway, live / GitHub / demo links, cover image, "feature on home page"
  - **Skills**: groups of skill chips
  - **Timeline**: dated journey entries
  - **Numbered list**: e.g. wall of wins
  - **Text**: free-form paragraphs
  - **Contact / links**: email, X, GitHub, Telegram…

Text fields support `**bold**`, `` `code` `` and `[links](https://…)`. Press **⌘S** to save.

## Where content is stored

| Where | Storage |
| --- | --- |
| Local dev | `content/site.json` (commit it if you want) |
| Vercel | Upstash Redis. Falls back to `content/site.json` until the first save |

## Environment variables

| Variable | Needed | Notes |
| --- | --- | --- |
| `ADMIN_PASSWORD` | yes | min 8 chars. Changing it logs you out everywhere |
| `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` | on Vercel | set automatically when you add Upstash Redis from the Vercel **Storage** tab (`KV_REST_API_URL` / `KV_REST_API_TOKEN` also work) |
| `ADMIN_SECRET` | optional | cookie signing key. Defaults to one derived from the password |

## Dev

```bash
pnpm install
pnpm dev
```
