# Issue 350 screenshot parity artifacts

Generated after increasing Puppeteer protocol timeout and adding chunked screenshot fallback support.

Command used for the focused long-blog screenshot check:

```bash
PARITY_OUTPUT_DIR=.pr/issue-350 \
PARITY_PROTOCOL_TIMEOUT=300000 \
node <focused screenshot capture script for issue #350>
```

Compared routes:

| Route | Live status | Test status | Diff | Capture mode |
| --- | ---: | ---: | ---: | --- |
| `/blog/20260227-creating-effective-agent-skills` | 200 | 200 | 20.63% | fullPage/fullPage |
| `/blog/agent-control-plane` | 200 | 200 | 16.03% | fullPage/fullPage |

Artifacts are in `screenshots/`:

- `blog-20260227-creating-effective-agent-skills-live.png`
- `blog-20260227-creating-effective-agent-skills-test.png`
- `blog-20260227-creating-effective-agent-skills-diff.png`
- `blog-agent-control-plane-live.png`
- `blog-agent-control-plane-test.png`
- `blog-agent-control-plane-diff.png`

The focused run completed screenshot capture for both previously timed-out routes and wrote `.pr/issue-350/long-blog-screenshot-results.json` with the exact dimensions, diff percentages, and capture metadata.
