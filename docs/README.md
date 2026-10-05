# The Jot & Tittle project site

A custom Jekyll site with paper tones, sage accents, system fonts, serif typography,
and an original illustrative verse map. No remote theme, JavaScript, or external
font requests are needed. The site introduces the project; it does not host the
React application or store journal data.

## Preview locally

Install a current Ruby and Bundler, then from this directory:

```sh
bundle install
bundle exec jekyll serve --baseurl /jot-and-tittle
```

Open http://localhost:4000/jot-and-tittle/. For a build only, use
`bundle exec jekyll build`. Generated `_site/` files should not be committed.

## Publish

In the repository's **Settings → Pages**, select **GitHub Actions** as the source.
The `Project site` workflow builds pull requests and deploys changes to `docs/`
on `main`. You can also run it manually from `main`.

The default URL is https://travisseitler.github.io/jot-and-tittle/.
Change `url` and `baseurl` in `_config.yml` if you use a custom domain or move the
repository. Use an empty `baseurl` for a domain-root site.

## Customize

- `_config.yml`: title, description, repository URL, and optional hosted `app_url`.
  With no app URL, the main button opens the local-installation guide.
- `_layouts/default.html`: shared metadata, navigation, and footer.
- `_layouts/page.html`: reusable layout for Markdown pages.
- `index.html`: homepage sections and project copy.
- `assets/site.css`: palette, typography, responsive layouts, and focus styles.
- `assets/verse-map.svg`: decorative illustration, explicitly labeled as a preview.

Add Markdown pages with `title`, `intro`, and `permalink` front matter. The page
layout is applied automatically. Wrap internal URLs in Jekyll's `relative_url`
filter so links work under the project path.
