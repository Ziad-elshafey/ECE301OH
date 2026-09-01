# ECE 301 Office Hours

Static dashboard of ECE 301 office hours, classified against **West Lafayette time** (`America/Indiana/Indianapolis`). Built to host on GitHub Pages.

Edit [`data/office-hours.json`](data/office-hours.json) when the roster or hours change. That is the only schedule file. Keys and allowed values are in [`data/office-hours.md`](data/office-hours.md).

Cancellations and one-off moves are **not** in v1. When you add them later, attach them to a session `id` (for example `zeyad-mon`) rather than rewriting the weekly template.

## Local preview

Do not open `index.html` as a file. `fetch` of the JSON schedule needs HTTP.

```bash
npx serve .
```

Then open the URL it prints (usually `http://localhost:3000`).

## GitHub Pages

1. Push this repo to GitHub.
2. Settings → Pages → Build and deployment.
3. Source: **Deploy from a branch**.
4. Branch: `main`, folder: `/ (root)`.
5. Save. The site will be at `https://<user>.github.io/<repo>/`.

If the repo is served from a project-pages subpath, relative paths (`./data/office-hours.json`, `./css/style.css`) still work.

## Preview a specific Indiana time

Append `?now=` with a West Lafayette local datetime:

```text
/?now=2026-09-07T14:30
```

Useful checks:

| Query | What you should see |
|---|---|
| `?now=2026-09-07T14:30` | Monday, two sessions happening now (Zeyad and Alex overlap) |
| `?now=2026-09-07T13:30` | Monday, Zeyad running, Alex coming up |
| `?now=2026-09-07T16:30` | Monday, all of today finished |
| `?now=2026-09-08T16:00` | Tuesday, Sarah coming up (Zoom join visible) |
| `?now=2026-09-08T17:30` | Tuesday, Sarah running |
| `?now=2026-09-12T12:00` | Saturday, empty today |

`2026-09-07` is a Monday.
