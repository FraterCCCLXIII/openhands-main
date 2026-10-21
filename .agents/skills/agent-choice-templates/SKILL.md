---
name: agent-choice-templates
description: >
  This skill should be used when an agent running in Agent Canvas needs to ask
  the user to pick between a few concrete options, "ask the user a multiple
  choice question", "offer options in chat", or "use the choice template".
  Explains the ```choice markdown fence that Canvas renders as an interactive
  card.
---

# Choice Template

Canvas renders a fenced code block with the language `choice` as a
multiple-choice card. The user's selection is sent back as their next chat
message. Documentation only: nothing here changes prompt construction.

## Format

Write exactly one JSON object inside the fence:

````
```choice
{"question": "Which version should I merge?", "options": [{"label": "Option A", "description": "Optional detail"}, {"label": "Compare first", "description": "Optional detail"}], "allowOther": true}
```
````

- `question`: non-empty string.
- `options`: 2 to 6 entries, each with a non-empty `label` and an optional
  `description`.
- `allowOther`: optional boolean, default `false`. When `true`, the card adds
  an "Other" choice with a free-text field.

If the JSON is invalid or does not match this shape, Canvas shows it as an
ordinary code block, so keep it strictly valid JSON (double quotes, no
trailing commas, no comments).

## When to use it

- Use it when the decision is genuinely the user's: product direction,
  trade-offs with real cost, or ambiguity you cannot resolve from the code or
  conversation.
- One question per block. For several decisions, ask the most blocking one
  first and continue after the answer.
- Keep labels short and mutually exclusive; put detail in `description`.
- Set `allowOther` when your options may not cover the user's intent.
- Say in the surrounding prose why you are asking, then stop and wait for the
  reply. Do not continue work that depends on the answer.

## When not to use it

- Never for yes/no questions that a sensible default covers. Pick the default,
  state it, and proceed.
- Not for questions you can answer by reading the repository or running a
  command.
- Not for open-ended requests (ask in plain prose) or more than six options.

## What you receive

The next user message is the selected option's `label`, the user's "Other"
text, or a short message saying the question was skipped. On a skip, use your
best judgment and continue.
