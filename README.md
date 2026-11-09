# MontInfo

Make long animated explainer videos where cartoon people act out every line, in a new illustrated place every few seconds. Everything is drawn and animated by code, so there are no image credits or accounts to pay for. You supply the voice.

Free from Chris Ife Studio.

https://dub.sh/chrisifestudio

## What you need

- A Mac or a Windows PC
- Claude Code or Codex
- Node 22 or newer: https://nodejs.org
- FFmpeg: Mac `brew install ffmpeg`, Windows `winget install Gyan.FFmpeg`
- uv: Mac `curl -LsSf https://astral.sh/uv/install.sh | sh`, Windows `winget install astral-sh.uv`

Your agent can install all of these for you. It will ask first.

## Install

Open Claude Code or Codex and say:

> Read https://github.com/montorox/montinfo and install the skill for me. Set up anything that's missing.

Restart your agent when it's done.

If anything looks off or a command fails on your computer, tell your agent. It reads the error and fixes it.

## Make your first video

Say this to your agent, with your own topic:

> Use MontInfo to make a video about [your topic]. Write the script first and show it to me.

Then make the voice-over in whichever way you like:

- **Record it:** read the script on your phone or microphone.
- **Use any AI voice tool:** export the audio from it.

Drag the audio file into your agent, and it makes the video. Real scripts are 8 minutes or longer.

Your videos go in `~/MontInfoStudio/projects`.

## For AI agents

Install by copying the `montinfo` folder from this repository into the skills folder of the agent you are running in: `~/.claude/skills/` for Claude Code, and for Codex `~/.agents/skills/` if it exists, otherwise `~/.codex/skills/`. Check that Node, FFmpeg and uv exist, and ask before installing what's missing. Then run `bash <skills folder>/montinfo/setup.sh`. On Windows, run commands in Git Bash. To confirm it works, make a small project with `MI.setWords` word times and one `Q` shot, then run `render.mjs --stills 1` and open the frame. If a command fails on this computer, read the error and fix it, including in the skill's own files, rather than handing it back to the user. Tell the user to restart their agent.

## Licence

MIT. See `LICENSE` and `NOTICE.md`.
