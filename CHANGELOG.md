# Changelog

All notable changes to the ChordPro extension will be documented in this file.

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
