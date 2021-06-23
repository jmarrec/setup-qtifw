import * as installQtIFW from '../src/install-qtifw';
import {deleteFolderRecursive} from '../src/utils';

import * as process from 'process';
import * as cp from 'child_process';
import * as path from 'path';

// shows how the runner will run a javascript action with env / stdout protocol
test('integration test', async () => {
  //process.env['RUNNER_TEMP'] =
  //  process.env['RUNNER_TEMP'] || path.join(process.cwd(), '.tmp/');

  const workingDirectory = installQtIFW.getWorkingQtIFWWorkingDirectory();
  const installDirectory = path.join(workingDirectory, 'install');

  // Wipe the install if it exists...
  deleteFolderRecursive(workingDirectory);

  process.env['INPUT_QTIFW-VERSION'] = '4.x';
  const np = process.execPath;
  const ip = path.join(__dirname, '..', 'lib', 'main.js');
  const options: cp.ExecFileSyncOptions = {
    env: process.env
  };
  console.log(cp.execFileSync(np, [ip], options).toString());
});
