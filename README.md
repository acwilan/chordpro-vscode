# ChordPro for VS Code

A VS Code extension for editing ChordPro files - the popular format for chord/lyric sheets used by musicians.

## Features

### Syntax Highlighting
Full syntax highlighting for ChordPro files (`.cho`, `.chopro`, `.chordpro`, `.crd`) including:
- Directives (title, artist, key, etc.)
- Chords in square brackets
- Section markers (verse, chorus, bridge)
- Comments

### Auto-Completion
- Type `{` to get suggestions for all ChordPro directives
- Type `[` to get suggestions for common chords

### Live Preview
- Press `Ctrl+Shift+V` (or `Cmd+Shift+V` on Mac) to open a formatted preview
- Preview updates in real-time as you edit

### Chord Transposition
- `Ctrl+Shift+Up` / `Cmd+Shift+Up`: Transpose all chords up one half step
- `Ctrl+Shift+Down` / `Cmd+Shift+Down`: Transpose all chords down one half step

### Print Support
- Use the "ChordPro: Print Preview" command for a print-friendly view
- Clean, professional output for printed chord sheets

## Supported Directives

### Metadata
- `{title: Song Name}` or `{t: Song Name}`
- `{subtitle: Artist}` or `{st: Artist}`
- `{artist: Name}`
- `{key: G}`
- `{capo: 2}`
- `{tempo: 120}`
- `{time: 4/4}`

### Sections
- `{start_of_verse}` / `{sov}` and `{end_of_verse}` / `{eov}`
- `{start_of_chorus}` / `{soc}` and `{end_of_chorus}` / `{eoc}`
- `{start_of_bridge}` / `{sob}` and `{end_of_bridge}` / `{eob}`
- `{start_of_tab}` / `{sot}` and `{end_of_tab}` / `{eot}`

### Chord Notation
Place chords in square brackets inline with lyrics:
```
[G]Amazing [G7]grace, how [C]sweet the [G]sound
```

## Installation

Search for "ChordPro" in the VS Code Extensions view, or install from the command line:
```bash
code --install-extension YOUR_PUBLISHER_ID.chordpro-vscode
```

## License

MIT
