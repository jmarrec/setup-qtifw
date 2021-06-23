import * as core from '@actions/core';
import * as findQtIFW from './find-qtifw';

async function run(): Promise<void> {
  try {
    const version: string = core.getInput('qtifw-version');
    core.info(`Requested qtifw-version '${version}'`); // note: core.debug is only output if you set the secret `ACTIONS_RUNNER_DEBUG` to true

    core.debug(new Date().toTimeString());
    const qtifwindex: string = await findQtIFW.requestQtIndex(version);
    core.info(`QtIFW Index: ${qtifwindex}`);

    core.debug(new Date().toTimeString());

    core.setOutput('time', new Date().toTimeString());
  } catch (err) {
    core.setFailed(err.message);
  }
}

run();
