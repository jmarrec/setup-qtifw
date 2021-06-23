import fs from 'fs';
import * as path from 'path';
import * as core from '@actions/core';
import * as tc from '@actions/tool-cache';
import * as exec from '@actions/exec';
import {v4 as uuidV4} from 'uuid';
import {ExecOptions} from '@actions/exec/lib/interfaces';

import {IS_DARWIN, IS_LINUX, QT_IFW_INSTALL_SCRIPT_QS} from './utils';

export async function installQtIFW(downloadUrl: string) {
  core.info(`Download from "${downloadUrl}"`);

  const qtIFWPathDestDir = path.join(
    process.env['RUNNER_TEMP'] || '',
    '' // uuidV4()
  );
  const qtIFWPathDest = path.join(qtIFWPathDestDir, path.basename(downloadUrl));

  let qtIFWPath: string = '';
  if (fs.existsSync(qtIFWPathDest)) {
    core.info(`File already exists at ${qtIFWPathDest}`);
    qtIFWPath = qtIFWPathDest;
  } else {
    qtIFWPath = await tc.downloadTool(downloadUrl, qtIFWPathDest);
    core.info(`Downloaded installer at "${qtIFWPath}"`);
  }
  core.debug(`qtIFWPathDest=${qtIFWPathDest}`);

  core.info(`Execute installer at ${qtIFWPath}`);
  try {
    await runInstallQtIFW(qtIFWPath);
  } catch (error) {
    console.log('ERROR', error.message);
  }
}

async function runInstallQtIFW(qtIFWPath: string) {
  const workingDirectory = path.dirname(qtIFWPath) + '/';
  let exeName = path.basename(qtIFWPath);
  core.info(
    `qtIFWPath=${qtIFWPath}, workingDirectory=${workingDirectory}, exeName=${exeName}`
  );

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

  await exec.exec(
    'bash',
    ['-noprofile', '--norc', '-eo', 'pipefail', '-c', 'ls -la'],
    options
  );

  const qsPath = path.join(workingDirectory, scriptName);
  fs.writeFileSync(qsPath, QT_IFW_INSTALL_SCRIPT_QS);

  if (IS_DARWIN) {
    // This is very annoying... but we need to mount the DMG first...
    // hdiutil attach -mountpoint ./qtfiw_installer QtInstallerFramework-mac-x64.dmg
    // sudo ./qtfiw_installer/QtInstallerFramework-mac-x64.app/Contents/MacOS/QtInstallerFramework-mac-x64 --verbose --script ./ci/install_script_qtifw.qs

    await exec.exec(
      'bash',
      [
        '-noprofile',
        '--norc',
        '-eo',
        'pipefail',
        '-c',
        `hdiutil attach -mountpoint ./qtfiw_installer "${exeName}"`
      ],
      options
    );
    await exec.exec('bash', ['-c', 'ls ./qtfiw_installer/'], options);
    exeName =
      'qtfiw_installer/QtInstallerFramework-mac-x64.app/Contents/MacOS/QtInstallerFramework-mac-x64';
  } else if (IS_LINUX) {
    // Chmod +x the .run file
    core.info('Chmod +x');
    await fs.chmodSync(qtIFWPath, '755');
    // await exec.exec('bash', ['chmod', '+x', path.basename(qtIFWPath)], options);
  }
  core.debug('Will try to run the installer now');
  core.debug(
    `"${qtIFWPath}" --verbose --script ${qsPath} TargetDir="${workingDirectory}"`
  );
  await exec.exec(
    `"${exeName}"`,
    [
      '-noprofile',
      '--norc',
      '-eo',
      'pipefail',
      '-c',
      `${qtIFWPath} --verbose --script ${qsPath} TargetDir=${workingDirectory}`
    ],
    options
  );
}
