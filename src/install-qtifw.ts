import fs from 'fs';
import * as path from 'path';
import * as core from '@actions/core';
import * as tc from '@actions/tool-cache';
import * as exec from '@actions/exec';
import {v4 as uuidV4} from 'uuid';
import {ExecOptions} from '@actions/exec/lib/interfaces';

import {IS_DARWIN, IS_LINUX, QT_IFW_INSTALL_SCRIPT_QS} from './utils';

export function getWorkingQtIFWWorkingDirectory() {
  let qtIFWPathDestDir: string;
  if (process.env['QT_IFW_WORKING_DIR']) {
    qtIFWPathDestDir = process.env['QT_IFW_WORKING_DIR'];
  } else {
    qtIFWPathDestDir = path.join(process.cwd(), '.tmp/');
    if (process.env['RUNNER_TEMP']) {
      qtIFWPathDestDir = path.join(process.env['RUNNER_TEMP'], uuidV4());
    }
  }
  process.env['QT_IFW_WORKING_DIR'] = qtIFWPathDestDir;
  core.debug(`Working Directory: ${qtIFWPathDestDir}`);
  return qtIFWPathDestDir;
}

export async function installQtIFW(downloadUrl: string) {
  core.info(`Download from "${downloadUrl}"`);

  const qtIFWPathDestDir = getWorkingQtIFWWorkingDirectory();
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
        `hdiutil attach -mountpoint ./qtfiw_installer "${qtIFWPath}"`
      ],
      options
    );
    await exec.exec('bash', ['-c', 'ls ./qtfiw_installer/'], options);
    exeName =
      `qtfiw_installer/${exeName}.app/Contents/MacOS/${exeName}`;
  } else if (IS_LINUX) {
    // Chmod +x the .run file
    core.info('Chmod +x');
    await fs.chmodSync(qtIFWPath, '755');
    // await exec.exec('bash', ['chmod', '+x', path.basename(qtIFWPath)], options);
  }
  core.debug('Will try to run the installer now');
  const installDir = path.join(workingDirectory, 'install');
  core.debug(
    `${qtIFWPath} --verbose --script ${qsPath} TargetDir=${installDir}`
  );
  try {
    const return_code = await exec.exec(
      'bash',
      [
        '-noprofile',
        '--norc',
        '-eo',
        'pipefail',
        '-c',
        `${qtIFWPath} --verbose --script ${qsPath} TargetDir=${installDir}`
      ],
      options
    );
    if (return_code != 0) {
      throw 'Something went wrong during the installation';
    }
  } catch (error) {
    throw 'Something went wrong during the installation' + error.message;
  }

  const binDir = path.join(installDir, 'bin/');
  core.info(`Adding '${binDir}' to PATH`);
  core.setOutput('qtifw-bin-dir', binDir);
  core.addPath(binDir);
}

export async function installRequiredSystemDeps() {
  if (process.env['GITHUB_ACTIONS']) {
    if (IS_LINUX) {
      // libxkbcommon-x11-0
      core.info(
        'Installing required system library: libxkbcommon-x11-0 xorg-dev libgl1-mesa-dev'
      );
      await exec.exec(
        'sudo',
        [
          'apt-get',
          '-yqq',
          'install',
          'libxkbcommon-x11-0',
          'xorg-dev',
          'libgl1-mesa-dev'
        ],
        {silent: true}
      );
    }
  }
}
