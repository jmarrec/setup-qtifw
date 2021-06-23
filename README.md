# setup-qitfw

<p align="left">
  <a href="https://github.com/jmarrec/setup-qtifw/actions"><img alt="setup-qtifw status" src="https://github.com/jmarrec/setup-qtifw/workflows/test.yml/badge.svg"></a>
</p>

This action sets up a version of the [Qt Installer Framework](https://doc.qt.io/qtinstallerframework/)


## Usage:

See [action.yml](action.yml)

```yaml
steps:
- uses: actions/checkout@v2
- uses: actions/setup-qtifw@v1
  with:
    qtifw-version: '4.x' # Version range or exact version of a Python version to use, using SemVer's version range syntax
- run: devtool --version
```

----

### Development

> First, you'll need to have a reasonably modern version of `node` handy. This won't work with versions older than 9, for instance.

Install the dependencies
```bash
$ npm install
```

Build the typescript and package it for distribution
```bash
$ npm run build && npm run package
```

Run the tests :heavy_check_mark:
```bash
$ npm test

 PASS  ./index.test.js
  ✓ throws invalid number (3ms)
  ✓ wait 500 ms (504ms)
  ✓ test runs (95ms)

...
```

### Publish to a distribution branch

Actions are run from GitHub repos so we will checkin the packed dist folder.

Then run [ncc](https://github.com/zeit/ncc) and push the results:
```bash
$ npm run package
$ git add dist
$ git commit -a -m "prod dependencies"
$ git push origin releases/v1
```

Note: We recommend using the `--license` option for ncc, which will create a license file for all of the production node modules used in your project.

Your action is now published! :rocket:

See the [versioning documentation](https://github.com/actions/toolkit/blob/master/docs/action-versioning.md)

### Validate

You can now validate the action by referencing `./` in a workflow in your repo (see [test.yml](.github/workflows/test.yml))

```yaml
uses: ./
with:
  milliseconds: 1000
```

See the [actions tab](https://github.com/actions/typescript-action/actions) for runs of this action! :rocket:


### Releasing

After testing you can [create a v1 tag](https://github.com/actions/toolkit/blob/master/docs/action-versioning.md) to reference the stable and latest V1 action
