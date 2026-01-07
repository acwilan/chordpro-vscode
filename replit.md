# ChordPro VS Code Extension

## Overview
A VS Code extension for managing ChordPro files - the popular format for chord/lyric sheets used by musicians.

## Current State
- **Status**: MVP Complete
- **Demo**: Web-based demo running on port 5000

## Features

### 1. Syntax Highlighting
- TextMate grammar for `.cho`, `.chopro`, `.chordpro`, `.crd` files
- Highlights directives, chords, comments, and lyrics
- Support for all standard ChordPro directives

### 2. Auto-completion
- Directive completion (triggered by `{`)
- Chord completion (triggered by `[`)
- All common ChordPro directives and chord types

### 3. Preview Panel
- Live preview of formatted song sheets
- Section styling (verse, chorus, bridge, tab)
- Proper chord positioning above lyrics

### 4. Chord Transposition
- Transpose up/down by half steps
- Preserves chord quality and bass notes
- Handles sharps and flats intelligently

### 5. Print Support
- Print-friendly styling
- Page break handling
- Clean, professional output

## Project Structure
```
/
├── package.json          # Extension manifest and dependencies
├── tsconfig.json         # TypeScript configuration
├── language-configuration.json  # Language settings
├── syntaxes/
│   └── chordpro.tmLanguage.json  # Syntax highlighting grammar
├── src/
│   ├── extension.ts      # Main extension entry point
│   └── lib/
│       ├── parser.ts     # ChordPro parser
│       ├── transposer.ts # Chord transposition logic
│       └── renderer.ts   # HTML preview renderer
└── demo/
    ├── server.js         # Express demo server
    └── public/
        ├── index.html    # Demo UI
        ├── styles.css    # Demo styling
        └── app.js        # Demo JavaScript
```

## Development

### Running the Demo
```bash
node demo/server.js
```

### Compiling TypeScript
```bash
npm run compile
```

### Building for VS Code
```bash
npm run vscode:prepublish
```

## ChordPro Format Reference

### Metadata Directives
- `{title: Song Name}` or `{t: Song Name}`
- `{subtitle: Artist}` or `{st: Artist}`
- `{artist: Name}`
- `{key: G}`
- `{capo: 2}`
- `{tempo: 120}`
- `{time: 4/4}`

### Section Directives
- `{start_of_verse}` / `{sov}` and `{end_of_verse}` / `{eov}`
- `{start_of_chorus}` / `{soc}` and `{end_of_chorus}` / `{eoc}`
- `{start_of_bridge}` / `{sob}` and `{end_of_bridge}` / `{eob}`
- `{start_of_tab}` / `{sot}` and `{end_of_tab}` / `{eot}`

### Chord Notation
- Chords in square brackets: `[Am]`, `[G7]`, `[Cmaj7]`
- Slash chords: `[G/B]`, `[Am/E]`

## Recent Changes
- 2026-01-07: Created complete VS Code extension with syntax highlighting, auto-completion, preview, transposition, and print support
