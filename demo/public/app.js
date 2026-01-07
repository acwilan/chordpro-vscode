const editor = document.getElementById('editor');
const preview = document.getElementById('preview');
const transposeUp = document.getElementById('transposeUp');
const transposeDown = document.getElementById('transposeDown');
const printBtn = document.getElementById('printBtn');
const printModal = document.getElementById('printModal');
const closePrintModal = document.getElementById('closePrintModal');
const printPreview = document.getElementById('printPreview');
const printNow = document.getElementById('printNow');

const sampleSong = `{title: Amazing Grace}
{subtitle: John Newton}
{key: G}
{tempo: 72}
{capo: 2}

{start_of_verse}
[G]Amazing [G7]grace, how [C]sweet the [G]sound
That [G]saved a [Em]wretch like [D]me
[G]I once was [G7]lost, but [C]now am [G]found
Was [Em]blind but [D]now I [G]see
{end_of_verse}

{start_of_chorus}
[G]'Twas grace that [G7]taught my [C]heart to [G]fear
And [G]grace my [Em]fears re[D]lieved
[G]How precious [G7]did that [C]grace ap[G]pear
The [Em]hour I [D]first be[G]lieved
{end_of_chorus}

{c: Instrumental break}

{start_of_verse}
[G]Through many [G7]dangers, [C]toils, and [G]snares
I [G]have al[Em]ready [D]come
[G]'Tis grace hath [G7]brought me [C]safe thus [G]far
And [Em]grace will [D]lead me [G]home
{end_of_verse}`;

editor.value = sampleSong;

let debounceTimer;
function debounce(fn, delay) {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(fn, delay);
}

async function updatePreview() {
    const text = editor.value;
    
    try {
        const response = await fetch('/api/render', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text })
        });
        
        const data = await response.json();
        if (data.success) {
            preview.innerHTML = data.html;
        }
    } catch (error) {
        console.error('Preview error:', error);
    }
}

async function transpose(semitones) {
    const text = editor.value;
    
    try {
        const response = await fetch('/api/transpose', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text, semitones })
        });
        
        const data = await response.json();
        if (data.success) {
            editor.value = data.text;
            updatePreview();
        }
    } catch (error) {
        console.error('Transpose error:', error);
    }
}

function showPrintPreview() {
    printPreview.innerHTML = preview.innerHTML;
    printModal.classList.remove('hidden');
}

function hidePrintModal() {
    printModal.classList.add('hidden');
}

function printDocument() {
    window.print();
}

editor.addEventListener('input', () => {
    debounce(updatePreview, 300);
});

transposeUp.addEventListener('click', () => transpose(1));
transposeDown.addEventListener('click', () => transpose(-1));
printBtn.addEventListener('click', showPrintPreview);
closePrintModal.addEventListener('click', hidePrintModal);
printNow.addEventListener('click', printDocument);

printModal.addEventListener('click', (e) => {
    if (e.target === printModal) {
        hidePrintModal();
    }
});

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        hidePrintModal();
    }
});

updatePreview();
