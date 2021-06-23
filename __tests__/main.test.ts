import * as findQtIFW from '../src/find-qtifw';
import * as installQtIFW from '../src/install-qtifw';
import {deleteFolderRecursive} from '../src/utils';

import * as process from 'process';
import * as cp from 'child_process';
import * as path from 'path';

test('Split a path', () => {
  const link =
    'http://download.qt.io/official_releases/qt-installer-framework/3.1.1/QtInstallerFramework-linux-x64.run';
  console.log(path.basename(link));
});

test('A Major is found', async () => {
  const qtifwindex: string = await findQtIFW.requestQtIndex('3.x');
  await expect(qtifwindex).toEqual('3.2.2');
});

test('A major.minor is found', async () => {
  const qtifwindex: string = await findQtIFW.requestQtIndex('3.1');
  await expect(qtifwindex).toEqual('3.1.1');
});

test('A major.minor.patch is found', async () => {
  const qtifwindex: string = await findQtIFW.requestQtIndex('3.1.1');
  await expect(qtifwindex).toEqual('3.1.1');
});

test('getInstallerExtension', () => {
  expect(findQtIFW.getInstallerExtension()).toEqual('run');
});

test('getInstallerLinkForSpecificVersion', async () => {
  const link: string = await findQtIFW.getInstallerLinkForSpecificVersion(
    '3.1.1',
    'run'
  );
  await expect(link).toEqual(
    'http://download.qt.io/official_releases/qt-installer-framework/3.1.1/QtInstallerFramework-linux-x64.run'
  );
});

test('getInstallerLinkForSpecificVersion_2', async () => {
  const link: string = await findQtIFW.getInstallerLinkForSpecificVersion(
    '4.1.1',
    'dmg'
  );
  await expect(link).toEqual(
    'http://download.qt.io/official_releases/qt-installer-framework/4.1.1/QtInstallerFramework-macOS-x86_64-4.1.1.dmg'
  );
});

// shows how the runner will run a javascript action with env / stdout protocol
test('test runs', async () => {
  //process.env['RUNNER_TEMP'] =
  //  process.env['RUNNER_TEMP'] || path.join(process.cwd(), '.tmp/');

  const workingDirectory = installQtIFW.getWorkingQtIFWWorkingDirectory();
  const installDirectory = path.join(workingDirectory, 'install');

  // Wipe the install if it exists...
  deleteFolderRecursive(installDirectory);

  process.env['INPUT_QTIFW-VERSION'] = '4.0.1';
  const np = process.execPath;
  const ip = path.join(__dirname, '..', 'lib', 'main.js');
  const options: cp.ExecFileSyncOptions = {
    env: process.env
  };
  console.log(cp.execFileSync(np, [ip], options).toString());
});
