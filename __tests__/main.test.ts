import * as findQtIFW from '../src/find-qtifw';
import * as installQtIFW from '../src/install-qtifw';
import * as httpm from '@actions/http-client';
import * as core from '@actions/core';

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

it('should test async errors', async () => {
  await expect(findQtIFW.requestQtIndex('3.178.1'))
    .rejects // At least two versions should have been found online
    .toThrow(/Invalid version given: available versions are: \d.{10,}/);
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
    expect.stringContaining(
      'qt-installer-framework/3.1.1/QtInstallerFramework-linux-x64.run'
    )
  );
});

test('getInstallerLinkForSpecificVersion_2', async () => {
  const link: string = await findQtIFW.getInstallerLinkForSpecificVersion(
    '4.1.1',
    'dmg'
  );
  await expect(link).toEqual(
    expect.stringContaining(
      'qt-installer-framework/4.1.1/QtInstallerFramework-macOS-x86_64-4.1.1.dmg'
    )
  );
});

test('Parse Meta Url', async () => {
  const originalUrl =
    'https://download.qt.io/official_releases/qt-installer-framework/4.1.1/QtInstallerFramework-linux-x64-4.1.1.run';
  const link: string = await findQtIFW.getMirrorLinkForSpecificLink(
    originalUrl
  );
  await expect(link).toMatch(/\.run/);
  await expect(link).toEqual(expect.not.stringMatching('download.qt.io'));

  const alreadyTried = [link];
  const link2: string = await findQtIFW.getMirrorLinkForSpecificLink(
    originalUrl,
    alreadyTried
  );

  await expect(link2).toMatch(/\.run/);
  await expect(link2).toEqual(expect.not.stringMatching('download.qt.io'));
  await expect(link2).toEqual(expect.not.stringContaining(link));
});

test('Redirects test bed', async () => {
  const url =
    'https://download.qt.io/official_releases/qt-installer-framework/4.1.1/QtInstallerFramework-linux-x64-4.1.1.run';

  const userAgent = "IT'S ME!";

  const connectionTimeout = 100;

  // Get the response headers
  const http = new httpm.HttpClient(userAgent, [], {
    allowRetries: false,
    allowRedirects: false,
    allowRedirectDowngrade: false,
    socketTimeout: connectionTimeout // miliseconds
  });

  const response: httpm.HttpClientResponse = await http.get(url);
  const statusCode = response.message.statusCode;
  if (!statusCode) {
    throw Error;
  }
  // Redirect
  if (statusCode > 300 && statusCode < 309) {
    const location = response.message.headers.location || '';
    core.error(`Asked to redirect ${statusCode} to ${location}`);
  } else {
    core.error(
      `Failed to download from "${url}". Code(${response.message.statusCode}) Message(${response.message.statusMessage})`
    );
  }
});

test('Try a fast and a slow mirror to figure out the connectionTimeOut', async () => {
  const urlPath =
    'official_releases/qt-installer-framework/4.1.1/installer-framework-opensource-src-4.1.1.tar.xz';
  const fastUrl = `http://www.mirrorservice.org/sites/download.qt-project.org/${urlPath}`;
  const slowUrl = 'https://mirrors.tuna.tsinghua.edu.cn/qt/${urlPath}';

  const userAgent = "IT'S ME!";

  const connectionTimeout = 500;

  // Get the response headers
  const http = new httpm.HttpClient(userAgent, [], {
    allowRetries: false,
    allowRedirects: false,
    allowRedirectDowngrade: false,
    socketTimeout: connectionTimeout // miliseconds
  });

  let message;
  try {
    await http.get(fastUrl);
  } catch (error) {
    message = error.message;
  }
  expect(message).toBeUndefined();

  //await expect(http.get(slowUrl)).rejects.toThrow();

  try {
    await http.get(slowUrl);
  } catch (error) {
    message = error.message;
  }
  expect(message).toMatch(/timeout/i);
});

test('Try a fast and a slow mirror with HEAD', async () => {
  const urlPath =
    'official_releases/qt-installer-framework/4.1.1/installer-framework-opensource-src-4.1.1.tar.xz';
  const fastUrl = `http://www.mirrorservice.org/sites/download.qt-project.org/${urlPath}`;
  const slowUrl = 'https://mirrors.tuna.tsinghua.edu.cn/qt/${urlPath}';

  const userAgent = "IT'S ME!";

  const connectionTimeout = 500;

  // Get the response headers
  const http = new httpm.HttpClient(userAgent, [], {
    allowRetries: false,
    allowRedirects: false,
    allowRedirectDowngrade: false,
    socketTimeout: connectionTimeout // miliseconds
  });

  let message;
  try {
    const response = await http.head(fastUrl);
    core.info(`${response.message.statusCode}, ${response.message.headers}`);
  } catch (error) {
    message = error.message;
  }
  expect(message).toBeUndefined();

  //await expect(http.get(slowUrl)).rejects.toThrow();

  try {
    const response = await http.head(slowUrl);
    core.info(`${response.message.statusCode}, ${response.message.headers}`);
  } catch (error) {
    message = error.message;
  }
  expect(message).toMatch(/timeout/i);

  const url =
    'https://download.qt.io/official_releases/qt-installer-framework/4.1.1/QtInstallerFramework-linux-x64-4.1.1.run';
  const response: httpm.HttpClientResponse = await http.head(url);
  const statusCode = response.message.statusCode;
  if (!statusCode) {
    throw Error;
  }
  // Redirect
  if (statusCode > 300 && statusCode < 309) {
    const location = response.message.headers.location || '';
    core.error(`HEAD: Asked to redirect ${statusCode} to ${location}`);
  } else {
    core.error(
      `Failed to download from "${url}". Code(${response.message.statusCode}) Message(${response.message.statusMessage})`
    );
  }
});
