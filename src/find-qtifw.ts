import * as core from '@actions/core';
import * as url from 'url';
import * as semver from 'semver';
import axios, {AxiosResponse, AxiosError} from 'axios';
import cheerio from 'cheerio';
// import {AxiosResponse, AxiosError} from 'axios'

import {IS_WINDOWS, IS_DARWIN, IS_LINUX} from './utils';

export const ROOT_QTIFW_URL =
  'https://download.qt.io/official_releases/qt-installer-framework/';

export async function requestQtIndex(
  requestedVersion: string
): Promise<string> {
  const resp = await axios
    .get(ROOT_QTIFW_URL)
    .then((response: AxiosResponse) => {
      const versions = parseQtIndex(response.data);
      const maxVersion = semver.maxSatisfying(versions, requestedVersion);
      if (maxVersion == null) {
        throw new Error(
          'Invalid version given: available versions are: { versions }'
        );
      }
      return maxVersion.version;
    })
    .catch((error: AxiosError) => {
      // handle error
      console.log(error);
      throw 'Failed';
    });

  return resp;
}

function parseQtIndex(html: string) {
  const $ = cheerio.load(html); // Load the HTML string into cheerio
  const versionTable = $('table tbody tr td a'); // Parse the HTML and extract just the links in the table rows

  const versions: semver.SemVer[] = [];
  versionTable.each((i, elem) => {
    const thisText = $(elem).text();
    const v = semver.coerce(thisText);
    if (v != null) {
      versions.push(v);
    }
  });
  // core.debug(`QtIFW Index Versions: ${versions}`)

  return versions;
}

export function getInstallerExtension(): string {
  let ext = '';
  if (IS_WINDOWS) {
    ext = 'exe';
  } else if (IS_DARWIN) {
    ext = 'dmg';
  } else if (IS_LINUX) {
    ext = 'run';
  }
  return ext;
}

export async function getInstallerLinkForSpecificVersion(
  requestedVersion: string,
  installerExtension: string
): Promise<string> {
  const qtPageUrl = `${url.resolve(ROOT_QTIFW_URL, requestedVersion)}/`;
  core.debug(`Trying to parse ${qtPageUrl}`);

  let installerLink = '';

  await axios
    .get(qtPageUrl)
    .then((response: AxiosResponse) => {
      const $ = cheerio.load(response.data); // Load the HTML string into cheerio
      const versionTable = $('table tbody tr td a'); // Parse the HTML and extract just the links in the table rows

      versionTable.each((i, elem) => {
        const thisLink = $(elem).attr('href');
        if (thisLink && thisLink.endsWith(installerExtension)) {
          installerLink = url.resolve(qtPageUrl, thisLink);
        }
      });
    })
    .catch((error: AxiosError) => {
      // handle error
      console.log(error);
      throw 'Failed';
    });

  if (installerLink == null) {
    throw 'Couldnt locate';
  }
  return installerLink;
}
