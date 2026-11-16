# JSON: Inline Primitive Arrays

A VS Code formatter for JSON and JSONC. It runs VS Code's built-in JSON formatter, then puts every array that holds only primitives (strings, numbers, booleans, `null`) on a single line.

```json
{
  "a": [1, 2, "x", null, true],
  "b": [
    {
      "c": [3, 4]
    },
    [5, 6]
  ]
}
```

Arrays that contain objects or other arrays keep the built-in multi-line layout. Everything else matches the built-in formatter.

## Install

```bash
npm install
npx @vscode/vsce@2.24.0 package --allow-missing-repository
code --install-extension json-inline-primitive-arrays-*.vsix --force
```

`@vscode/vsce` is pinned to 2.24.0 because newer versions need a newer Node than 20.12.

Then make it the default formatter in your user `settings.json`:

```json
"[json]":  { "editor.defaultFormatter": "local.json-inline-primitive-arrays" },
"[jsonc]": { "editor.defaultFormatter": "local.json-inline-primitive-arrays" }
```

Reload VS Code. With `editor.formatOnSave` on, saving a JSON file applies the formatting.

## How it works

- [extension.js](extension.js) registers a formatter for `json` and `jsonc`. When it runs, it asks VS Code to format the document. During that call the extension returns nothing, so VS Code passes the request to the next formatter, the built-in one. The extension then applies the array collapse to the built-in output.
- [format.js](format.js) holds the collapse step. It uses [`jsonc-parser`](https://github.com/microsoft/node-jsonc-parser), the library behind VS Code's own JSON formatter. If the built-in formatter isn't available, the extension formats with `jsonc-parser` directly, which gives the same result.

## Behavior notes

- An array that contains a comment stays multi-line, so no comment is lost.
- A trailing comma inside a collapsed array is dropped.
- There's no line-length limit, so a long array of primitives still ends up on one line.

## Testing

`test/run.js` is a test you run inside VS Code. It opens a sample file, formats it, and writes the result to the path in `TEST_OUT`. Run it with a separate settings folder so your own setup isn't touched. On macOS, keep that folder's path short, because a long path makes VS Code fail to start.

```bash
TEST_OUT=/tmp/vt/out.txt "/Applications/Visual Studio Code.app/Contents/MacOS/Code" --new-window --user-data-dir=/tmp/vt/ud --extensions-dir=/tmp/vt/ext --extensionDevelopmentPath="$PWD" --extensionTestsPath="$PWD/test/run.js" /tmp/vt
```
