# setup-qitfw

[![runtime-test](https://github.com/jmarrec/setup-qtifw/actions/workflows/test.yml/badge.svg)](https://github.com/jmarrec/setup-qtifw/actions/workflows/test.yml)
[![build-test](https://github.com/jmarrec/setup-qtifw/actions/workflows/test-build.yml/badge.svg)](https://github.com/jmarrec/setup-qtifw/actions/workflows/test-build.yml)

This action sets up a version of the [Qt Installer Framework](https://doc.qt.io/qtinstallerframework/)


## Usage:

See [action.yml](action.yml)

```yaml
steps:
- uses: actions/checkout@v2
- uses: jmarrec/setup-qtifw@v1
  with:
    qtifw-version: '4.x' # Version range or exact version of a QtIFW version to use, using SemVer's version range syntax
- run: devtool --version
```
