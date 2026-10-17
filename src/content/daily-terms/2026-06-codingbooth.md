---
title: "CodingBooth"
termSlug: "codingbooth"
year: 2026
month: 6
monthName: "June"
day: 9
order: 7
source: "2026/june-term.md"
sourceUrl: "https://github.com/swegrowthid/daily-term-SE-Growth/blob/main/2026/june-term.md"
excerpt: "CodingBooth is a tool that gives every project its own isolated, reproducible development environment declared in the repository itself. One command brings it up; one command tears it down. Nothing..."
---
### Definition:

CodingBooth is a tool that gives every project its own isolated, reproducible development environment declared in the repository itself. One command brings it up; one command tears it down. Nothing installs on your host machine — all toolchains, runtimes, and dependencies live inside a container that travels with the project.

In one sentence: "A booth per project. A clean host. A repo that brings its own environment."

Analogy — The Pop-Up Kitchen
Imagine a chef who cooks three different cuisines — Italian, Thai, and French. Instead of cramming every ingredient and tool into one chaotic kitchen, she uses pop-up kitchen pods:

Approach What it looks like CodingBooth
❌ One messy kitchen Global Node.js, Python 2.7 and 3.11, three JDKs, a broken JAVA_HOME, and a pip package you installed once in 2023 and forgot about The "project residue" problem
✅ Pop-up kitchen pods Open the Italian pod → everything for pasta. Open the Thai pod → wok, fish sauce, jasmine rice. French pod → butter, wine, copper pans. Each project has its own .booth/ folder with exactly what it needs
Cooking Concept Real World CodingBooth
Pop-up kitchen pod A self-contained cooking station Booth — a containerized dev environment
Recipe card taped to the pod Lists exactly what's inside Boothfile — declares the environment
Pod setup instructions "Plug in, turn on gas, start cooking" ./booth — one command brings it up
Cleaning up Fold the pod away, counter is spotless ./booth down — nothing left on the host

### Example:

A Real Boothfile
Here's a complete CodingBooth setup for a Svelte + Firebase blog with Claude Code AI assistance:

```
.booth/Boothfile

# .booth/Boothfile
# syntax=codingbooth/boothfile:1
# Configured by: booth config --no-tui --overwrite --variant codeserver --port 13579 --expose 5173 --select firebase+credential/claude-code+auto-accept+credential+settings-cache

setup svelte        # Node.js + Svelte toolchain
setup firebase      # Firebase CLI for deploys
setup claude-code   # Claude Code AI assistant
Two setup lines and the entire development environment is declared. No FROM, no ARG, no shell wrangling. Each setup line maps to a curated install script.

.booth/config.toml

# .booth/config.toml
variant = "codeserver"
port    = "13579"

run-args = [
    "-v", "~/.config/configstore/firebase-tools.json:/etc/cb-home-seed/.config/configstore/firebase-tools.json:ro",
    "-v", "~/.claude.json:/etc/cb-home-seed/.claude.json:ro",
    "--publish", "5173:5173"
]
variant = "codeserver" — opens a browser-based VS Code
Credential mounts (:ro = read-only) pass your Firebase and Claude keys into the booth
--publish 5173:5173 — forwards the Vite dev server to your host browser
Usage

# Bring the environment up (one command)
./booth

# → Browser opens at http://localhost:13579
# → Full VS Code in the browser
# → Svelte dev server running on port 5173
# → Firebase CLI ready to deploy
# → Claude Code ready to assist
# → NOTHING installed on the host

# When done:
./booth down   # Tears it all down, host is clean
```
