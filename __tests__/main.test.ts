import * as findQtIFW from '../src/find-qtifw';
import * as installQtIFW from '../src/install-qtifw';

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
    .rejects// At least two versions should have been found online
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


test('Parse Meta Url', async () => {
  const originalUrl = 'https://download.qt.io/official_releases/qt-installer-framework/4.1.1/QtInstallerFramework-linux-x64-4.1.1.run';
  const link: string = await findQtIFW.getMirrorLinksForSpecificLink(
    originalUrl
  );
  await expect(link).toMatch(/\.run/);
  await expect(link).toEqual(expect.not.stringMatching('download.qt.io'));

  const alreadyTried = [link];
  const link2: string = await findQtIFW.getMirrorLinksForSpecificLink(
    originalUrl, alreadyTried
  );

  await expect(link2).toMatch(/\.run/);
  await expect(link2).toEqual(expect.not.stringMatching('download.qt.io'));
  await expect(link2).toEqual(expect.not.stringContaining(link));
});
