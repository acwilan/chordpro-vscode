export const CHROMATIC_SHARP = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
export const CHROMATIC_FLAT = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];

const ENHARMONIC_MAP: { [key: string]: string } = {
    'C#': 'Db', 'Db': 'C#',
    'D#': 'Eb', 'Eb': 'D#',
    'F#': 'Gb', 'Gb': 'F#',
    'G#': 'Ab', 'Ab': 'G#',
    'A#': 'Bb', 'Bb': 'A#'
};

function normalizeRoot(root: string): { note: string; preferFlat: boolean } {
    const upperRoot = root.charAt(0).toUpperCase() + root.slice(1);
    const preferFlat = upperRoot.includes('b');
    
    let index = CHROMATIC_SHARP.indexOf(upperRoot);
    if (index === -1) {
        index = CHROMATIC_FLAT.indexOf(upperRoot);
    }
    
    if (index === -1) {
        return { note: upperRoot, preferFlat: false };
    }
    
    return { note: CHROMATIC_SHARP[index], preferFlat };
}

export function transposeChord(chord: string, semitones: number): string {
    const chordRegex = /^([A-Ga-g][#b]?)(.*)$/;
    const match = chord.match(chordRegex);
    
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
            let newBass = bassPreferFlat ? CHROMATIC_FLAT[newBassIndex] : CHROMATIC_SHARP[newBassIndex];
            result += '/' + newBass;
        } else {
            result += '/' + bassNote;
        }
    }
    
    return result;
}

export function getKeyFromSemitones(originalKey: string, semitones: number): string {
    return transposeChord(originalKey, semitones);
}
