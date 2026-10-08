# Jot & Tittle website

This folder contains the Jekyll homepage, guide, privacy page, layouts, styles,
and illustrations for https://travisseitler.github.io/jot-and-tittle/.
The production app is built from this repository and published at
https://travisseitler.github.io/jot-and-tittle/app/.

## Preview the website

Install a current Ruby and Bundler, then run from this folder:

```sh
bundle install
bundle exec jekyll serve
```

Open http://localhost:4000/jot-and-tittle/. The app link points to the production
path; to use the app locally, run `npm run dev` from the repository root and open
the address Vite prints.

## Publish

In this repository's **Settings → Pages**, select **GitHub Actions** as the source.
The `Pages` workflow builds the app and website on pull requests. Pushes to `main`
and manual runs on `main` publish the combined site. The build copies the fresh
app output from `dist/` into `_site/app/`; no compiled app files belong in `site/`.

The personal `travisseitler.github.io` repository only publishes a project index.
Each future application's repository can deploy its own Pages project site.

## Customize

- `_config.yml`: title, description, source repository, base path, and app URL.
- `_layouts/` and `_includes/`: page layouts, navigation, and app links.
- `index.html`, `guide.md`, `privacy.md`, `404.html`: page content.
- `assets/`: site styles, brand mark, and verse-map illustration.

Use Jekyll's `relative_url` filter for internal links so they include the
`/jot-and-tittle` project path. The application uses relative asset and service
worker URLs so it can run under `/app/` within this project site.
