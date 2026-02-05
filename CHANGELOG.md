# Changelog

All notable changes to the ChordPro extension will be documented in this file.

## [0.1.4](https://github.com/acwilan/chordpro-vscode/compare/v0.1.2...v0.1.4) (2026-02-05)

### CI
- remove version bump from publish (#4) ([3b84e84](https://github.com/acwilan/chordpro-vscode/commit/3b84e84a01a140a66e4f83c4f8840b49c6285ba4))

## [0.1.3](https://github.com/acwilan/chordpro-vscode/compare/v0.1.2...v0.1.3) (2026-02-05)

### CI
- setup infrastructure for performing releases (#2) ([15b3c70](https://github.com/acwilan/chordpro-vscode/commit/15b3c702a992d73ce5a3003c7692bba1b7b85020))

## [0.1.0] - 2026-01-07

### Added
- Initial release
- Syntax highlighting for ChordPro files (`.cho`, `.chopro`, `.chordpro`, `.crd`)
- Auto-completion for directives (triggered by `{`) and chords (triggered by `[`)
- Live preview panel with formatted song sheet display
- Chord transposition commands (up/down by half steps)
- Print preview with print-friendly styling
- Support for all standard ChordPro directives:
  - Metadata: title, subtitle, artist, key, capo, tempo, time
  - Sections: verse, chorus, bridge, tab
  - Formatting: comments, page breaks, column breaks
- Keyboard shortcuts:
  - `Ctrl+Shift+V` / `Cmd+Shift+V`: Show Preview
  - `Ctrl+Shift+Up` / `Cmd+Shift+Up`: Transpose Up
  - `Ctrl+Shift+Down` / `Cmd+Shift+Down`: Transpose Down
