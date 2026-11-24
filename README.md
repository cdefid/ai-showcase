# AI Showcase

A GitHub Pages site for the **Cyber Defense Indonesia AI Showcase**, a webinar series where community members demo projects they vibe-coded.

It's a static site with no build step: `index.html`, `assets/` and a single data file, `data/showcase.json`.

## Preview locally

The page loads its data with `fetch`, so opening the file directly won't work. Serve the folder instead:

```bash
python3 -m http.server 8000
```

Then open http://localhost:8000.

## Publish on GitHub Pages

1. Push this folder to a GitHub repository.
2. In the repo, go to **Settings → Pages** and set **Source** to *Deploy from a branch*, branch `main`, folder `/ (root)`.
3. The site will be live at `https://<user-or-org>.github.io/<repo>/`.

`.nojekyll` is included so GitHub serves the files as they are.

## Adding a new episode

Everything lives in `data/showcase.json`. For Episode 2:

1. **Add an episode** to `episodes`:

   ```json
   {
     "number": 2,
     "title": "Short episode title",
     "date": "2026-10-15",
     "language": "Bahasa Indonesia",
     "youtubeId": "VIDEO_ID",
     "durationSeconds": 7200,
     "hosts": ["Wahyu N"],
     "summary": "One paragraph about the episode.",
     "chapters": [
       { "start": 0, "label": "Opening and introductions" },
       { "start": 600, "label": "Project name", "project": "project-id" }
     ],
     "takeaways": ["Optional list of lessons from the panel."]
   }
   ```

   - `date` can be `YYYY-MM` or `YYYY-MM-DD`.
   - `chapters` build the run-sheet timeline. A chapter that has a `project` id is coloured by that project's category, and one without is shown in grey.
   - `youtubeId` is the `v=` part of the YouTube URL. Chapter `start` values are in seconds.

2. **Add each project** to `projects`:

   | Field | Required | Notes |
   |---|---|---|
   | `id` | yes | URL-safe slug, e.g. `my-tool`. Link straight to a project with `/#my-tool`. |
   | `name`, `tagline`, `maker` | yes | |
   | `episode` | yes | Episode number |
   | `timestamp` | no | Seconds into the recording where the demo starts ("Demo at…" link) |
   | `links.site`, `links.repo` | no | |
   | `links.extra` | no | More links, e.g. `[{ "label": "Read the write-up", "url": "https://…" }]` |
   | `category` | yes | One per project. Each category gets its own colour (8 colours, then they repeat). |
   | `tags` | yes | Free-form topics, shown as filter chips |
   | `builtWith` | no | AI tools, models and workflows used to build it |
   | `availability` | no | e.g. `Live`, `Open source`, `Self-hosted`, `Free to use` |
   | `summary`, `problem`, `howItWasBuilt`, `privacy` | no | Paragraphs shown in the details panel |
   | `features`, `stack`, `lessons`, `roadmap` | no | Lists shown in the details panel |

The filters (episode, category, tags, built with, availability) are generated from the data, so new values appear automatically. Once there's more than one episode, episode tabs appear above the run sheet.

**Tip:** reuse existing tag and tool names where you can (for example `Claude Code`, not `claude code`) so filters group projects together.

## Sharing filtered views

Filters are saved in the URL. For example, `?category=OSINT` or `?tool=Claude%20Code&avail=Open%20source`. Add `#project-id` to open a specific project.

## Contributing

Want to show your project, fix a detail, or improve the site? See [CONTRIBUTING.md](CONTRIBUTING.md).
