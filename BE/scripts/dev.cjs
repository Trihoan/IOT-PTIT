const fs = require('node:fs');
const ts = require('typescript');

// Biên dịch TypeScript trong bộ nhớ; Node --watch tải lại khi sửa code.
require.extensions['.ts'] = (module, filename) => {
  const { outputText } = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
  });
  module._compile(outputText, filename);
};
require('../src/server.ts').startServer();
