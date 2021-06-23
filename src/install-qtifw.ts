import fs from 'fs';
import * as path from 'path';
import * as core from '@actions/core';
import * as tc from '@actions/tool-cache';
import * as exec from '@actions/exec';
import {ExecOptions} from '@actions/exec/lib/interfaces';

import {IS_DARWIN, IS_LINUX, QT_IFW_INSTALL_SCRIPT_QS} from './utils';

export async function installQtIFW(downloadUrl: string) {
  core.info(`Download from "${downloadUrl}"`);
  const qtIFWPathDir = await tc.downloadTool(downloadUrl);
  core.info(`Downloaded installer at "${qtIFWPathDir}"`);

  const qtIFWPath = path.join(qtIFWPathDir, downloadUrl.split('/')[-1]);

  core.info(`Execute installer at ${qtIFWPath}`);
  await runInstallQtIFW(qtIFWPath);
}

async function runInstallQtIFW(qtIFWPath: string) {
  const workingDirectory = path.dirname(qtIFWPath);
  let exeName = path.basename(qtIFWPath);

  const scriptName = 'install_script_qtifw.qs';

  const options: ExecOptions = {
    cwd: workingDirectory,
    silent: true,
    listeners: {
      stdout: (data: Buffer) => {
        core.info(data.toString().trim());
      },
      stderr: (data: Buffer) => {
        core.error(data.toString().trim());
      }
    }
  };

  await exec.exec('bash', ['ls'], options);

  const qsPath = path.join(workingDirectory, scriptName);
  fs.writeFileSync(qsPath, QT_IFW_INSTALL_SCRIPT_QS);

  if (IS_DARWIN) {
    // This is very annoying... but we need to mount the DMG first...
    // hdiutil attach -mountpoint ./qtfiw_installer QtInstallerFramework-mac-x64.dmg
    // sudo ./qtfiw_installer/QtInstallerFramework-mac-x64.app/Contents/MacOS/QtInstallerFramework-mac-x64 --verbose --script ./ci/install_script_qtifw.qs

    await exec.exec(
      'bash',
      ['hdiutil', 'attach', '-mountpoint', './qtfiw_installer', exeName],
      options
    );
    await exec.exec('bash', ['ls', './qtfiw_installer/'], options);
    exeName =
      'qtfiw_installer/QtInstallerFramework-mac-x64.app/Contents/MacOS/QtInstallerFramework-mac-x64';
  } else if (IS_LINUX) {
    // Chmod +x the .run file
    fs.chmodSync(qtIFWPath, '755');
    // await exec.exec('bash', ['chmod', '+x', path.basename(qtIFWPath)], options);
  }
  await exec.exec(
    'bash',
    ['./' + exeName, '--verbose', '--script', './' + scriptName],
    options
  );
}
