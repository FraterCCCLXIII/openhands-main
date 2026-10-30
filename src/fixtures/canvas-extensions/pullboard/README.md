# Pullboard

A Canvas Extension for [pullboard-dev/pullboard](https://github.com/pullboard-dev/pullboard)
(MIT, local-first work board with spec-driven, independently verified agent work).

The page summarises how Pullboard works, lists the commands to set it up in a repo,
and opens the repo's local board view (default port 4890, the port `pullboard view`
uses) in its own tab. Pullboard's view sends `frame-ancestors 'none'`, so it cannot
be embedded in an iframe.

Install it like the other fixtures: Customize → Apps, or point the extension
installer at this directory.
