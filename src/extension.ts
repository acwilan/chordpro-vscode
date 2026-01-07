import * as vscode from 'vscode';
import { ChordProParser, ParsedSong } from './lib/parser';
import { transposeChord, CHROMATIC_SHARP } from './lib/transposer';
import { generatePreviewHtml, generatePrintHtml } from './lib/renderer';

let previewPanel: vscode.WebviewPanel | undefined;

export function activate(context: vscode.ExtensionContext) {
    console.log('ChordPro extension activated');

    const completionProvider = vscode.languages.registerCompletionItemProvider(
        'chordpro',
        {
            provideCompletionItems(document: vscode.TextDocument, position: vscode.Position) {
                const linePrefix = document.lineAt(position).text.substring(0, position.character);
                
                if (linePrefix.endsWith('{')) {
                    return getDirectiveCompletions();
                }
                
                if (linePrefix.endsWith('[')) {
                    return getChordCompletions();
                }

                return undefined;
            }
        },
        '{', '['
    );

    const showPreviewCommand = vscode.commands.registerCommand('chordpro.showPreview', () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage('No active ChordPro file');
            return;
        }

        if (previewPanel) {
            previewPanel.reveal(vscode.ViewColumn.Two);
        } else {
            previewPanel = vscode.window.createWebviewPanel(
                'chordproPreview',
                'ChordPro Preview',
                vscode.ViewColumn.Two,
                {
                    enableScripts: true,
                    retainContextWhenHidden: true
                }
            );

            previewPanel.onDidDispose(() => {
                previewPanel = undefined;
            });
        }

        updatePreview(editor.document);
    });

    const transposeUpCommand = vscode.commands.registerCommand('chordpro.transposeUp', () => {
        transposeDocument(1);
    });

    const transposeDownCommand = vscode.commands.registerCommand('chordpro.transposeDown', () => {
        transposeDocument(-1);
    });

    const printCommand = vscode.commands.registerCommand('chordpro.print', () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage('No active ChordPro file');
            return;
        }

        const parser = new ChordProParser();
        const song = parser.parse(editor.document.getText());
        const printHtml = generatePrintHtml(song);

        const printPanel = vscode.window.createWebviewPanel(
            'chordproPrint',
            'ChordPro Print',
            vscode.ViewColumn.Two,
            { enableScripts: true }
        );
        printPanel.webview.html = printHtml;
    });

    vscode.workspace.onDidChangeTextDocument((event) => {
        if (previewPanel && event.document.languageId === 'chordpro') {
            updatePreview(event.document);
        }
    });

    context.subscriptions.push(
        completionProvider,
        showPreviewCommand,
        transposeUpCommand,
        transposeDownCommand,
        printCommand
    );
}

function updatePreview(document: vscode.TextDocument) {
    if (!previewPanel) return;

    const parser = new ChordProParser();
    const song = parser.parse(document.getText());
    previewPanel.webview.html = generatePreviewHtml(song);
}

function transposeDocument(semitones: number) {
    const editor = vscode.window.activeTextEditor;
    if (!editor) return;

    const document = editor.document;
    const text = document.getText();
    
    const transposedText = text.replace(/\[([A-Ga-g][#b]?(?:m|min|maj|dim|aug|sus[24]?|add[0-9]+|[0-9]+)?(?:\/[A-Ga-g][#b]?)?)\]/g, 
        (match, chord) => {
            return '[' + transposeChord(chord, semitones) + ']';
        }
    );

    editor.edit(editBuilder => {
        const fullRange = new vscode.Range(
            document.positionAt(0),
            document.positionAt(text.length)
        );
        editBuilder.replace(fullRange, transposedText);
    });
}

function getDirectiveCompletions(): vscode.CompletionItem[] {
    const directives = [
        { label: 'title', snippet: 'title: $1}', detail: 'Song title' },
        { label: 'subtitle', snippet: 'subtitle: $1}', detail: 'Song subtitle/artist' },
        { label: 'artist', snippet: 'artist: $1}', detail: 'Artist name' },
        { label: 'key', snippet: 'key: $1}', detail: 'Song key' },
        { label: 'tempo', snippet: 'tempo: $1}', detail: 'Song tempo (BPM)' },
        { label: 'time', snippet: 'time: $1}', detail: 'Time signature' },
        { label: 'capo', snippet: 'capo: $1}', detail: 'Capo position' },
        { label: 'comment', snippet: 'comment: $1}', detail: 'Comment text' },
        { label: 'c', snippet: 'c: $1}', detail: 'Comment (short)' },
        { label: 'start_of_chorus', snippet: 'start_of_chorus}', detail: 'Begin chorus section' },
        { label: 'soc', snippet: 'soc}', detail: 'Begin chorus (short)' },
        { label: 'end_of_chorus', snippet: 'end_of_chorus}', detail: 'End chorus section' },
        { label: 'eoc', snippet: 'eoc}', detail: 'End chorus (short)' },
        { label: 'start_of_verse', snippet: 'start_of_verse}', detail: 'Begin verse section' },
        { label: 'sov', snippet: 'sov}', detail: 'Begin verse (short)' },
        { label: 'end_of_verse', snippet: 'end_of_verse}', detail: 'End verse section' },
        { label: 'eov', snippet: 'eov}', detail: 'End verse (short)' },
        { label: 'start_of_bridge', snippet: 'start_of_bridge}', detail: 'Begin bridge section' },
        { label: 'sob', snippet: 'sob}', detail: 'Begin bridge (short)' },
        { label: 'end_of_bridge', snippet: 'end_of_bridge}', detail: 'End bridge section' },
        { label: 'eob', snippet: 'eob}', detail: 'End bridge (short)' },
        { label: 'start_of_tab', snippet: 'start_of_tab}', detail: 'Begin tab section' },
        { label: 'sot', snippet: 'sot}', detail: 'Begin tab (short)' },
        { label: 'end_of_tab', snippet: 'end_of_tab}', detail: 'End tab section' },
        { label: 'eot', snippet: 'eot}', detail: 'End tab (short)' },
        { label: 'chorus', snippet: 'chorus}', detail: 'Repeat chorus' },
        { label: 'define', snippet: 'define: $1 base-fret $2 frets $3}', detail: 'Define custom chord' },
        { label: 'new_page', snippet: 'new_page}', detail: 'Page break' },
        { label: 'np', snippet: 'np}', detail: 'Page break (short)' },
        { label: 'column_break', snippet: 'column_break}', detail: 'Column break' },
        { label: 'colb', snippet: 'colb}', detail: 'Column break (short)' }
    ];

    return directives.map(d => {
        const item = new vscode.CompletionItem(d.label, vscode.CompletionItemKind.Keyword);
        item.insertText = new vscode.SnippetString(d.snippet);
        item.detail = d.detail;
        return item;
    });
}

function getChordCompletions(): vscode.CompletionItem[] {
    const roots = ['C', 'C#', 'Db', 'D', 'D#', 'Eb', 'E', 'F', 'F#', 'Gb', 'G', 'G#', 'Ab', 'A', 'A#', 'Bb', 'B'];
    const suffixes = ['', 'm', '7', 'm7', 'maj7', 'sus2', 'sus4', 'dim', 'aug', 'add9', '6', 'm6', '9', '11', '13'];
    
    const chords: vscode.CompletionItem[] = [];
    
    for (const root of roots) {
        for (const suffix of suffixes) {
            const chord = root + suffix;
            const item = new vscode.CompletionItem(chord, vscode.CompletionItemKind.Value);
            item.insertText = chord + ']';
            item.detail = 'Chord: ' + chord;
            chords.push(item);
        }
    }
    
    return chords;
}

export function deactivate() {}
