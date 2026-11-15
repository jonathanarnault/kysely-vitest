# Claude Code in the dev container

This feature installs the [Claude Code](https://claude.ai/code) command line tool and its VS Code extension.

It also sets `ENABLE_CLAUDEAI_MCP_SERVERS=false` and, on create, marks the workspace as trusted so Claude skips the trust dialog.

## What is kept between rebuilds

| Folder               | Stored in                                     | Shared with             |
| :------------------- | :-------------------------------------------- | :---------------------- |
| `~/.claude`          | volume `devcontainers-shared-claude`          | all your dev containers |
| `~/.claude/plugins`  | a volume for this container only              | nothing                 |
| `~/.claude/projects` | volume `devcontainers-shared-claude-projects` | all your dev containers |

So your login, settings and history follow you from one dev container to another, but each container gets its own plugins.

## Plugins

Plugins are declared in the project's [`.claude/settings.json`](../../.claude/settings.json):

- `extraKnownMarketplaces` says where each plugin comes from;
- `enabledPlugins` turns each one on.

Declaring a plugin doesn't download it. When the container is created, [`post-create.sh`](post-create.sh) adds every marketplace listed and installs every enabled plugin. It skips this step when the project has no `.claude/settings.json`. To add a plugin, edit `settings.json` and rebuild the container.

The script installs at _local_ scope, which writes only to `.claude/settings.local.json` (git-ignored). That keeps plugins out of the shared `~/.claude/settings.json` and stops the tool from rewriting the committed project settings.
