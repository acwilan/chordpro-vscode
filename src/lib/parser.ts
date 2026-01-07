export interface ChordLyricPair {
    chord: string | null;
    lyric: string;
}

export interface SongLine {
    type: 'lyrics' | 'comment' | 'tab' | 'empty';
    content: ChordLyricPair[];
    rawText?: string;
}

export interface SongSection {
    type: 'verse' | 'chorus' | 'bridge' | 'tab' | 'none';
    label?: string;
    lines: SongLine[];
}

export interface SongMetadata {
    title?: string;
    subtitle?: string;
    artist?: string;
    key?: string;
    tempo?: string;
    time?: string;
    capo?: string;
    [key: string]: string | undefined;
}

export interface ParsedSong {
    metadata: SongMetadata;
    sections: SongSection[];
    comments: string[];
}

export class ChordProParser {
    private currentSection: SongSection;
    private song: ParsedSong;

    constructor() {
        this.song = {
            metadata: {},
            sections: [],
            comments: []
        };
        this.currentSection = {
            type: 'none',
            lines: []
        };
    }

    parse(text: string): ParsedSong {
        this.song = {
            metadata: {},
            sections: [],
            comments: []
        };
        this.currentSection = {
            type: 'none',
            lines: []
        };

        const lines = text.split('\n');
        let inTab = false;

        for (const line of lines) {
            const trimmedLine = line.trim();

            if (trimmedLine.startsWith('#')) {
                continue;
            }

            if (trimmedLine === '') {
                this.currentSection.lines.push({ type: 'empty', content: [] });
                continue;
            }

            if (trimmedLine.startsWith('{') && trimmedLine.endsWith('}')) {
                this.parseDirective(trimmedLine);
                continue;
            }

            if (inTab || this.currentSection.type === 'tab') {
                this.currentSection.lines.push({
                    type: 'tab',
                    content: [],
                    rawText: line
                });
            } else {
                this.currentSection.lines.push({
                    type: 'lyrics',
                    content: this.parseChordLyricLine(line)
                });
            }
        }

        if (this.currentSection.lines.length > 0) {
            this.song.sections.push(this.currentSection);
        }

        return this.song;
    }

    private parseDirective(line: string): void {
        const match = line.match(/^\{([a-zA-Z_][a-zA-Z0-9_]*)(?:\s*:\s*(.*))?}$/);
        if (!match) return;

        const directive = match[1].toLowerCase();
        const value = match[2]?.trim() || '';

        switch (directive) {
            case 'title':
            case 't':
                this.song.metadata.title = value;
                break;
            case 'subtitle':
            case 'st':
                this.song.metadata.subtitle = value;
                break;
            case 'artist':
                this.song.metadata.artist = value;
                break;
            case 'key':
                this.song.metadata.key = value;
                break;
            case 'tempo':
                this.song.metadata.tempo = value;
                break;
            case 'time':
                this.song.metadata.time = value;
                break;
            case 'capo':
                this.song.metadata.capo = value;
                break;
            case 'comment':
            case 'c':
            case 'comment_italic':
            case 'ci':
            case 'comment_box':
            case 'cb':
                this.song.comments.push(value);
                this.currentSection.lines.push({
                    type: 'comment',
                    content: [],
                    rawText: value
                });
                break;
            case 'start_of_chorus':
            case 'soc':
                this.startSection('chorus');
                break;
            case 'end_of_chorus':
            case 'eoc':
                this.endSection();
                break;
            case 'start_of_verse':
            case 'sov':
                this.startSection('verse');
                break;
            case 'end_of_verse':
            case 'eov':
                this.endSection();
                break;
            case 'start_of_bridge':
            case 'sob':
                this.startSection('bridge');
                break;
            case 'end_of_bridge':
            case 'eob':
                this.endSection();
                break;
            case 'start_of_tab':
            case 'sot':
                this.startSection('tab');
                break;
            case 'end_of_tab':
            case 'eot':
                this.endSection();
                break;
            case 'chorus':
                this.currentSection.lines.push({
                    type: 'comment',
                    content: [],
                    rawText: '(Repeat Chorus)'
                });
                break;
            default:
                this.song.metadata[directive] = value;
                break;
        }
    }

    private startSection(type: 'verse' | 'chorus' | 'bridge' | 'tab'): void {
        if (this.currentSection.lines.length > 0) {
            this.song.sections.push(this.currentSection);
        }
        this.currentSection = {
            type: type,
            lines: []
        };
    }

    private endSection(): void {
        if (this.currentSection.lines.length > 0) {
            this.song.sections.push(this.currentSection);
        }
        this.currentSection = {
            type: 'none',
            lines: []
        };
    }

    private parseChordLyricLine(line: string): ChordLyricPair[] {
        const pairs: ChordLyricPair[] = [];
        const regex = /\[([^\]]*)\]([^\[]*)/g;
        let match;
        let lastIndex = 0;

        const beforeFirstChord = line.substring(0, line.indexOf('['));
        if (beforeFirstChord && !line.startsWith('[')) {
            pairs.push({ chord: null, lyric: beforeFirstChord });
        }

        while ((match = regex.exec(line)) !== null) {
            pairs.push({
                chord: match[1] || null,
                lyric: match[2] || ''
            });
            lastIndex = regex.lastIndex;
        }

        if (pairs.length === 0 && line.trim()) {
            pairs.push({ chord: null, lyric: line });
        }

        return pairs;
    }
}
