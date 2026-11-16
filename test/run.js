const vscode = require('vscode');
const fs = require('fs');
const path = require('path');
exports.run = async function () {
  const out = process.env.TEST_OUT;
  try {
    await vscode.workspace.getConfiguration().update('[json]', { 'editor.defaultFormatter': 'local.json-inline-primitive-arrays' }, vscode.ConfigurationTarget.Global);
    const file = path.join(path.dirname(out), 'sample.json');
    fs.writeFileSync(file, '{"a":[1,2,"x",null,true],"b":[{"c":[3,4]},[5,6]],"e":[],"s":["has, comma","[b]"],"n":{"k":"v"}}');
    const doc = await vscode.workspace.openTextDocument(file);
    await vscode.window.showTextDocument(doc);
    await new Promise(r => setTimeout(r, 4000)); // let the built-in JSON server start
    await vscode.commands.executeCommand('editor.action.formatDocument');
    fs.writeFileSync(out, doc.getText());
  } catch (e) { fs.writeFileSync(out, 'ERROR ' + e.stack); }
};
