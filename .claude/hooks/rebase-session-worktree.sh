#!/usr/bin/env bash
# SessionStart hook: rebase a session's worktree onto its base branch.
#
# Only linked worktrees are rebased. The main checkout is left alone so its
# merge history is never flattened. The base is `branch.<name>.sessionBase`
# when set, otherwise `main`. Dirty worktrees and conflicting rebases are
# skipped or aborted, never forced.

set -u

git_dir=$(git rev-parse --path-format=absolute --git-dir 2>/dev/null) || exit 0
common_dir=$(git rev-parse --path-format=absolute --git-common-dir 2>/dev/null) || exit 0

# The main checkout shares its git dir with the common dir; linked worktrees do not.
if [ "$git_dir" = "$common_dir" ]; then
  exit 0
fi

branch=$(git symbolic-ref --quiet --short HEAD) || exit 0
base=$(git config --get "branch.$branch.sessionBase" || true)
base=${base:-main}

if ! git rev-parse --verify --quiet "refs/heads/$base" >/dev/null; then
  echo "rebase-session-worktree: base branch '$base' not found; skipping."
  exit 0
fi

if [ "$branch" = "$base" ]; then
  exit 0
fi

if [ -n "$(git status --porcelain)" ]; then
  echo "rebase-session-worktree: uncommitted changes on '$branch'; not rebasing onto '$base'."
  exit 0
fi

if [ "$(git merge-base HEAD "$base")" = "$(git rev-parse "$base")" ]; then
  exit 0
fi

if git rebase "$base" >/dev/null 2>&1; then
  echo "rebase-session-worktree: rebased '$branch' onto '$base'."
else
  git rebase --abort >/dev/null 2>&1
  echo "rebase-session-worktree: rebase of '$branch' onto '$base' conflicts; aborted, branch left unchanged."
fi
exit 0
