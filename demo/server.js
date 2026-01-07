const express = require('express');
const path = require('path');

const app = express();
const PORT = 5000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const CHROMATIC_SHARP = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const CHROMATIC_FLAT = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];

function normalizeRoot(root) {
    const upperRoot = root.charAt(0).toUpperCase() + root.slice(1);
    const preferFlat = upperRoot.includes('b');
    
    let index = CHROMATIC_SHARP.indexOf(upperRoot);
    if (index === -1) {
        index = CHROMATIC_FLAT.indexOf(upperRoot);
    }
    
    return { note: index !== -1 ? CHROMATIC_SHARP[index] : upperRoot, preferFlat };
}

function transposeChord(chord, semitones) {
    const match = chord.match(/^([A-Ga-g][#b]?)(.*)$/);
    if (!match) return chord;
    
    let [, root, suffix] = match;
    let bassNote = '';
    const slashIndex = suffix.indexOf('/');
    if (slashIndex !== -1) {
        bassNote = suffix.substring(slashIndex + 1);
        suffix = suffix.substring(0, slashIndex);
    }
    
    const { note: normalizedRoot, preferFlat } = normalizeRoot(root);
    let index = CHROMATIC_SHARP.indexOf(normalizedRoot);
    if (index === -1) return chord;
    
    let newIndex = (index + semitones + 12) % 12;
    let newRoot = preferFlat ? CHROMATIC_FLAT[newIndex] : CHROMATIC_SHARP[newIndex];
    let result = newRoot + suffix;
    
    if (bassNote) {
        const { note: normalizedBass, preferFlat: bassPreferFlat } = normalizeRoot(bassNote);
        let bassIndex = CHROMATIC_SHARP.indexOf(normalizedBass);
        if (bassIndex !== -1) {
            let newBassIndex = (bassIndex + semitones + 12) % 12;
            result += '/' + (bassPreferFlat ? CHROMATIC_FLAT[newBassIndex] : CHROMATIC_SHARP[newBassIndex]);
        }
    }
    
    return result;
}

function parseChordPro(text) {
    const metadata = {};
    const sections = [];
    let currentSection = { type: 'none', lines: [] };
    const lines = text.split('\n');

    for (const line of lines) {
        const trimmed = line.trim();
        
        if (trimmed.startsWith('#') || trimmed === '') {
            if (trimmed === '') currentSection.lines.push({ type: 'empty', content: [] });
            continue;
        }
        
        if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
            const match = trimmed.match(/^\{([a-zA-Z_][a-zA-Z0-9_]*)(?:\s*:\s*(.*))?}$/);
            if (match) {
                const directive = match[1].toLowerCase();
                const value = match[2]?.trim() || '';
                
                switch (directive) {
                    case 'title': case 't': metadata.title = value; break;
                    case 'subtitle': case 'st': metadata.subtitle = value; break;
                    case 'artist': metadata.artist = value; break;
                    case 'key': metadata.key = value; break;
                    case 'tempo': metadata.tempo = value; break;
                    case 'time': metadata.time = value; break;
                    case 'capo': metadata.capo = value; break;
                    case 'comment': case 'c': case 'ci': case 'cb':
                        currentSection.lines.push({ type: 'comment', rawText: value });
                        break;
                    case 'start_of_chorus': case 'soc':
                        if (currentSection.lines.length) sections.push(currentSection);
                        currentSection = { type: 'chorus', lines: [] };
                        break;
                    case 'end_of_chorus': case 'eoc':
                        sections.push(currentSection);
                        currentSection = { type: 'none', lines: [] };
                        break;
                    case 'start_of_verse': case 'sov':
                        if (currentSection.lines.length) sections.push(currentSection);
                        currentSection = { type: 'verse', lines: [] };
                        break;
                    case 'end_of_verse': case 'eov':
                        sections.push(currentSection);
                        currentSection = { type: 'none', lines: [] };
                        break;
                    case 'start_of_bridge': case 'sob':
                        if (currentSection.lines.length) sections.push(currentSection);
                        currentSection = { type: 'bridge', lines: [] };
                        break;
                    case 'end_of_bridge': case 'eob':
                        sections.push(currentSection);
                        currentSection = { type: 'none', lines: [] };
                        break;
                    case 'start_of_tab': case 'sot':
                        if (currentSection.lines.length) sections.push(currentSection);
                        currentSection = { type: 'tab', lines: [] };
                        break;
                    case 'end_of_tab': case 'eot':
                        sections.push(currentSection);
                        currentSection = { type: 'none', lines: [] };
                        break;
                    case 'chorus':
                        currentSection.lines.push({ type: 'comment', rawText: '(Repeat Chorus)' });
                        break;
                    default:
                        metadata[directive] = value;
                }
            }
            continue;
        }
        
        if (currentSection.type === 'tab') {
            currentSection.lines.push({ type: 'tab', rawText: line });
        } else {
            const pairs = [];
            const regex = /\[([^\]]*)\]([^\[]*)/g;
            let m;
            const before = line.substring(0, line.indexOf('['));
            if (before && !line.startsWith('[')) pairs.push({ chord: null, lyric: before });
            while ((m = regex.exec(line)) !== null) {
                pairs.push({ chord: m[1] || null, lyric: m[2] || '' });
            }
            if (pairs.length === 0 && line.trim()) pairs.push({ chord: null, lyric: line });
            currentSection.lines.push({ type: 'lyrics', content: pairs });
        }
    }
    
    if (currentSection.lines.length) sections.push(currentSection);
    return { metadata, sections };
}

function escapeHtml(text) {
    return String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

function renderToHtml(song, forPrint = false) {
    const { metadata, sections } = song;
    
    let html = '<div class="song-header">';
    if (metadata.title) html += `<h1 class="song-title">${escapeHtml(metadata.title)}</h1>`;
    if (metadata.subtitle || metadata.artist) html += `<p class="song-subtitle">${escapeHtml(metadata.subtitle || metadata.artist)}</p>`;
    
    const meta = [];
    if (metadata.key) meta.push(`Key: ${metadata.key}`);
    if (metadata.capo) meta.push(`Capo: ${metadata.capo}`);
    if (metadata.tempo) meta.push(`Tempo: ${metadata.tempo}`);
    if (metadata.time) meta.push(`Time: ${metadata.time}`);
    if (meta.length) html += `<div class="song-meta">${meta.map(m => `<span>${escapeHtml(m)}</span>`).join('')}</div>`;
    html += '</div>';
    
    for (const section of sections) {
        const sectionClass = section.type !== 'none' ? section.type : '';
        html += `<div class="section ${sectionClass}">`;
        if (section.type !== 'none') {
            html += `<div class="section-label">${section.type.charAt(0).toUpperCase() + section.type.slice(1)}</div>`;
        }
        
        for (const line of section.lines) {
            if (line.type === 'empty') {
                html += '<div class="empty-line"></div>';
            } else if (line.type === 'comment') {
                html += `<div class="comment">${escapeHtml(line.rawText)}</div>`;
            } else if (line.type === 'tab') {
                html += `<div class="tab-line">${escapeHtml(line.rawText)}</div>`;
            } else if (line.type === 'lyrics' && line.content) {
                html += '<div class="chord-lyric-line">';
                for (const pair of line.content) {
                    const chord = pair.chord ? `<span class="chord">${escapeHtml(pair.chord)}</span>` : '<span class="chord"></span>';
                    html += `<span class="chord-lyric-pair">${chord}<span class="lyric">${escapeHtml(pair.lyric)}</span></span>`;
                }
                html += '</div>';
            }
        }
        html += '</div>';
    }
    
    return html;
}

app.post('/api/parse', (req, res) => {
    try {
        const { text } = req.body;
        const song = parseChordPro(text || '');
        res.json({ success: true, song });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
});

app.post('/api/render', (req, res) => {
    try {
        const { text, forPrint } = req.body;
        const song = parseChordPro(text || '');
        const html = renderToHtml(song, forPrint);
        res.json({ success: true, html, metadata: song.metadata });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
});

app.post('/api/transpose', (req, res) => {
    try {
        const { text, semitones } = req.body;
        const transposed = text.replace(/\[([A-Ga-g][#b]?(?:m|min|maj|dim|aug|sus[24]?|add[0-9]+|[0-9]+)?(?:\/[A-Ga-g][#b]?)?)\]/g,
            (match, chord) => '[' + transposeChord(chord, semitones) + ']'
        );
        res.json({ success: true, text: transposed });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`ChordPro demo server running at http://0.0.0.0:${PORT}`);
});
