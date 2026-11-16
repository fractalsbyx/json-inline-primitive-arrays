const vscode = require('vscode');
const { formatJson, collapsePrimitiveArrays } = require('./format');

// Documents we are currently formatting. While a document is in here, our provider
// returns nothing, so VS Code falls through to the next formatter: the built-in one.
const inProgress = new Set();

function applyTextEdits(document, text, edits) {
  const sorted = edits
    .map((e) => ({ start: document.offsetAt(e.range.start), end: document.offsetAt(e.range.end), text: e.newText }))
    .sort((a, b) => b.start - a.start || b.end - a.end);
  for (const e of sorted) text = text.slice(0, e.start) + e.text + text.slice(e.end);
  return text;
}

async function defaultFormat(document, options) {
  const key = document.uri.toString();
  inProgress.add(key);
  try {
    // Ask VS Code for the built-in JSON formatter's edits.
    const edits = await vscode.commands.executeCommand(
      'vscode.executeFormatDocumentProvider',
      document.uri,
      { tabSize: options.tabSize, insertSpaces: options.insertSpaces }
    );
    // undefined means no other formatter answered (built-in disabled/missing).
    return edits === undefined ? undefined : applyTextEdits(document, document.getText(), edits);
  } finally {
    inProgress.delete(key);
  }
}

function activate(context) {
  const provider = {
    async provideDocumentFormattingEdits(document, options) {
      if (inProgress.has(document.uri.toString())) return [];

      const text = document.getText();
      let formatted = await defaultFormat(document, options);
      if (formatted === undefined) {
        // Built-in formatter unavailable: use the same library it uses.
        formatted = formatJson(text, {
          tabSize: options.tabSize,
          insertSpaces: options.insertSpaces,
          eol: document.eol === vscode.EndOfLine.CRLF ? '\r\n' : '\n',
          keepLines: vscode.workspace.getConfiguration('json.format', document).get('keepLines', false),
        });
      } else {
        formatted = collapsePrimitiveArrays(formatted);
      }

      if (formatted === text) return [];
      const fullRange = new vscode.Range(document.positionAt(0), document.positionAt(text.length));
      return [vscode.TextEdit.replace(fullRange, formatted)];
    },
  };
  context.subscriptions.push(
    vscode.languages.registerDocumentFormattingEditProvider(['json', 'jsonc'], provider)
  );
}

module.exports = { activate, deactivate() {} };
