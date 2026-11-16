// Pure formatting logic (no vscode dependency, so it can be tested with plain node).
const { format, applyEdits, parseTree, createScanner, SyntaxKind } = require('jsonc-parser');

const PRIMITIVES = new Set(['string', 'number', 'boolean', 'null']);

function hasComment(text) {
  const scanner = createScanner(text, false);
  let kind;
  while ((kind = scanner.scan()) !== SyntaxKind.EOF) {
    if (kind === SyntaxKind.LineCommentTrivia || kind === SyntaxKind.BlockCommentTrivia) return true;
  }
  return false;
}

// Fallback used only if VS Code's built-in JSON formatter is unavailable.
function formatJson(text, { tabSize = 2, insertSpaces = true, eol = '\n', keepLines = false } = {}) {
  return collapsePrimitiveArrays(applyEdits(text, format(text, undefined, { tabSize, insertSpaces, eol, keepLines })));
}

// Put arrays whose elements are all primitives (and that contain no comments) on one line.
function collapsePrimitiveArrays(out) {
  const tree = parseTree(out, [], { allowTrailingComma: true, disallowComments: false });
  if (!tree) return out;

  const collapses = [];
  (function walk(node) {
    if (
      node.type === 'array' &&
      node.children && node.children.length > 0 &&
      node.children.every((c) => PRIMITIVES.has(c.type)) &&
      !hasComment(out.slice(node.offset, node.offset + node.length))
    ) {
      const items = node.children.map((c) => out.slice(c.offset, c.offset + c.length));
      collapses.push({ start: node.offset, end: node.offset + node.length, text: '[' + items.join(', ') + ']' });
      return;
    }
    (node.children || []).forEach(walk);
  })(tree);

  let result = out;
  for (const c of collapses.sort((a, b) => b.start - a.start)) {
    result = result.slice(0, c.start) + c.text + result.slice(c.end);
  }
  return result;
}

module.exports = { formatJson, collapsePrimitiveArrays };
