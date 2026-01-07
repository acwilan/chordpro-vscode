import { ParsedSong, SongSection, SongLine, ChordLyricPair } from './parser';

const PREVIEW_STYLES = `
<style>
    * { box-sizing: border-box; }
    body {
        font-family: 'Georgia', 'Times New Roman', serif;
        max-width: 800px;
        margin: 0 auto;
        padding: 20px;
        line-height: 1.4;
        background: #fff;
        color: #333;
    }
    .song-header {
        text-align: center;
        margin-bottom: 24px;
        border-bottom: 2px solid #333;
        padding-bottom: 16px;
    }
    .song-title {
        font-size: 28px;
        font-weight: bold;
        margin: 0 0 8px 0;
    }
    .song-subtitle {
        font-size: 18px;
        color: #666;
        margin: 0;
    }
    .song-meta {
        display: flex;
        justify-content: center;
        gap: 20px;
        margin-top: 12px;
        font-size: 14px;
        color: #666;
    }
    .song-meta span {
        background: #f5f5f5;
        padding: 4px 12px;
        border-radius: 4px;
    }
    .section {
        margin-bottom: 20px;
    }
    .section-label {
        font-weight: bold;
        font-size: 14px;
        text-transform: uppercase;
        color: #666;
        margin-bottom: 8px;
        letter-spacing: 1px;
    }
    .chorus {
        background: #f8f8f8;
        border-left: 4px solid #333;
        padding: 12px 16px;
        margin: 12px 0;
    }
    .bridge {
        background: #fffaf0;
        border-left: 4px solid #d4a574;
        padding: 12px 16px;
        margin: 12px 0;
    }
    .song-line {
        margin: 4px 0;
        min-height: 1.4em;
    }
    .chord-lyric-line {
        display: flex;
        flex-wrap: wrap;
        margin: 8px 0;
    }
    .chord-lyric-pair {
        display: inline-flex;
        flex-direction: column;
        margin-right: 0;
    }
    .chord {
        color: #c00;
        font-weight: bold;
        font-family: 'Courier New', monospace;
        font-size: 14px;
        height: 18px;
        padding-right: 4px;
    }
    .lyric {
        white-space: pre;
    }
    .comment {
        font-style: italic;
        color: #666;
        background: #f0f0f0;
        padding: 8px 12px;
        border-radius: 4px;
        margin: 8px 0;
    }
    .tab-line {
        font-family: 'Courier New', monospace;
        font-size: 13px;
        white-space: pre;
        color: #555;
        background: #f5f5f5;
        padding: 2px 8px;
    }
    .empty-line {
        height: 12px;
    }
</style>
`;

const PRINT_STYLES = `
<style>
    @media print {
        body {
            font-size: 12pt;
            max-width: 100%;
            padding: 0;
        }
        .song-header {
            page-break-after: avoid;
        }
        .section {
            page-break-inside: avoid;
        }
        .no-print {
            display: none;
        }
    }
    @page {
        margin: 1.5cm;
    }
    * { box-sizing: border-box; }
    body {
        font-family: 'Georgia', 'Times New Roman', serif;
        max-width: 800px;
        margin: 0 auto;
        padding: 20px;
        line-height: 1.4;
        background: #fff;
        color: #000;
    }
    .print-button {
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 12px 24px;
        font-size: 16px;
        background: #333;
        color: #fff;
        border: none;
        border-radius: 8px;
        cursor: pointer;
    }
    .print-button:hover {
        background: #555;
    }
    .song-header {
        text-align: center;
        margin-bottom: 24px;
        border-bottom: 2px solid #000;
        padding-bottom: 16px;
    }
    .song-title {
        font-size: 24pt;
        font-weight: bold;
        margin: 0 0 8px 0;
    }
    .song-subtitle {
        font-size: 14pt;
        margin: 0;
    }
    .song-meta {
        display: flex;
        justify-content: center;
        gap: 20px;
        margin-top: 12px;
        font-size: 10pt;
    }
    .section {
        margin-bottom: 16px;
    }
    .section-label {
        font-weight: bold;
        font-size: 10pt;
        text-transform: uppercase;
        margin-bottom: 6px;
        letter-spacing: 1px;
    }
    .chorus {
        border-left: 3px solid #000;
        padding-left: 12px;
        margin: 8px 0;
    }
    .bridge {
        border-left: 3px solid #666;
        padding-left: 12px;
        margin: 8px 0;
    }
    .chord-lyric-line {
        display: flex;
        flex-wrap: wrap;
        margin: 6px 0;
    }
    .chord-lyric-pair {
        display: inline-flex;
        flex-direction: column;
    }
    .chord {
        font-weight: bold;
        font-family: 'Courier New', monospace;
        font-size: 10pt;
        height: 14pt;
    }
    .lyric {
        white-space: pre;
    }
    .comment {
        font-style: italic;
        margin: 6px 0;
    }
    .tab-line {
        font-family: 'Courier New', monospace;
        font-size: 9pt;
        white-space: pre;
    }
    .empty-line {
        height: 8px;
    }
</style>
`;

function renderLine(line: SongLine): string {
    switch (line.type) {
        case 'empty':
            return '<div class="empty-line"></div>';
        case 'comment':
            return `<div class="comment">${escapeHtml(line.rawText || '')}</div>`;
        case 'tab':
            return `<div class="tab-line">${escapeHtml(line.rawText || '')}</div>`;
        case 'lyrics':
            if (line.content.length === 0) {
                return '<div class="song-line"></div>';
            }
            const pairs = line.content.map(pair => {
                const chord = pair.chord ? `<span class="chord">${escapeHtml(pair.chord)}</span>` : '<span class="chord"></span>';
                const lyric = `<span class="lyric">${escapeHtml(pair.lyric)}</span>`;
                return `<span class="chord-lyric-pair">${chord}${lyric}</span>`;
            }).join('');
            return `<div class="chord-lyric-line">${pairs}</div>`;
        default:
            return '';
    }
}

function renderSection(section: SongSection): string {
    const sectionClass = section.type !== 'none' ? section.type : '';
    const label = section.type !== 'none' ? 
        `<div class="section-label">${section.type.charAt(0).toUpperCase() + section.type.slice(1)}</div>` : '';
    
    const lines = section.lines.map(renderLine).join('');
    
    return `<div class="section ${sectionClass}">${label}${lines}</div>`;
}

function renderMetadata(metadata: any): string {
    let html = '<div class="song-header">';
    
    if (metadata.title) {
        html += `<h1 class="song-title">${escapeHtml(metadata.title)}</h1>`;
    }
    
    if (metadata.subtitle || metadata.artist) {
        html += `<p class="song-subtitle">${escapeHtml(metadata.subtitle || metadata.artist || '')}</p>`;
    }
    
    const metaItems: string[] = [];
    if (metadata.key) metaItems.push(`Key: ${metadata.key}`);
    if (metadata.capo) metaItems.push(`Capo: ${metadata.capo}`);
    if (metadata.tempo) metaItems.push(`Tempo: ${metadata.tempo}`);
    if (metadata.time) metaItems.push(`Time: ${metadata.time}`);
    
    if (metaItems.length > 0) {
        html += '<div class="song-meta">';
        html += metaItems.map(item => `<span>${escapeHtml(item)}</span>`).join('');
        html += '</div>';
    }
    
    html += '</div>';
    return html;
}

function escapeHtml(text: string): string {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

export function generatePreviewHtml(song: ParsedSong): string {
    const metadata = renderMetadata(song.metadata);
    const sections = song.sections.map(renderSection).join('');
    
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${escapeHtml(song.metadata.title || 'ChordPro Preview')}</title>
    ${PREVIEW_STYLES}
</head>
<body>
    ${metadata}
    ${sections}
</body>
</html>`;
}

export function generatePrintHtml(song: ParsedSong): string {
    const metadata = renderMetadata(song.metadata);
    const sections = song.sections.map(renderSection).join('');
    
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${escapeHtml(song.metadata.title || 'ChordPro Print')}</title>
    ${PRINT_STYLES}
</head>
<body>
    <button class="print-button no-print" onclick="window.print()">Print</button>
    ${metadata}
    ${sections}
</body>
</html>`;
}
