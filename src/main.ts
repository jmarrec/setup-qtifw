import * as core from '@actions/core';
import * as findQtIFW from './find-qtifw';
import * as installQtIFW from './install-qtifw';

async function run(): Promise<void> {
  try {
    const version: string = core.getInput('qtifw-version');
    core.info(`Requested qtifw-version '${version}'`); // note: core.debug is only output if you set the secret `ACTIONS_RUNNER_DEBUG` to true

    core.debug(new Date().toTimeString());
    const qtIfwVersion: string = await findQtIFW.requestQtIndex(version);
    core.setOutput('qtifw-version', qtIfwVersion);

    core.info(`QtIFW Version Selected: ${qtIfwVersion}`);

    const installerExtension = findQtIFW.getInstallerExtension();
    core.debug(
      `Will look for ${qtIfwVersion} with extension '${installerExtension}'`
    );
    const installerLink = await findQtIFW.getInstallerLinkForSpecificVersion(
      qtIfwVersion,
      installerExtension
    );

    core.info(`QtIFW Link: ${installerLink}`);

    await installQtIFW.installQtIFW(installerLink);
  } catch (err) {
    core.setFailed(err.message);
  }
}

run();
