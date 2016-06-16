import path from 'path';
import rimraf from 'rimraf';
import webpack from 'webpack';
import fs from 'fs-extra';
import { expect } from 'chai';

import NordnetReleasePlugin from './../src';

const OUTPUT_DIR = path.join(__dirname, '../temp');
const publicPath = '/sc/project/cache/dev';

const singleEntryPoint = {
  index: [path.join(__dirname, '/fixtures/index.js')],
};

const multipleEntryPoints = {
  index: [path.join(__dirname, '/fixtures/index.js')],
  vendor: [path.join(__dirname, '/fixtures/vendor.js')],
};

const asyncEntryPoint = {
  async: [path.join(__dirname, '/fixtures/async.js')],
};

const output = {
  path: OUTPUT_DIR,
  filename: '[name].js',
};

const options = {
  publicPath,
  initDir: OUTPUT_DIR,
};

describe('nordnet-release-plugin', () => {
  afterEach((done) => rimraf(OUTPUT_DIR, done));

  it('should export plugin', () => expect(NordnetReleasePlugin).to.be.ok);
  it('should have apply method', () => expect(NordnetReleasePlugin.prototype.apply).to.be.a('function'));

  describe('when single entry point', () => {
    it('should generate ${entrypoint}.js for one entry point', (done) => {
      const webpackConfig = {
        output,
        entry: singleEntryPoint,
        plugins: [new NordnetReleasePlugin(options)],
      };

      testPlugin(webpackConfig, expected(singleEntryPoint, done));
    });
  });

  describe('when multiple entry points', () => {
    it('should generate ${entrypoint}.js for multiple entry points', (done) => {
      const webpackConfig = {
        output,
        entry: multipleEntryPoints,
        plugins: [new NordnetReleasePlugin(options)],
      };

      testPlugin(webpackConfig, expected(multipleEntryPoints, done));
    });
  });

  describe('when publicPath includes trailing "/"', () => {
    it('should remove trailing "/" from resulting path', (done) => {
      const webpackConfig = {
        output,
        entry: singleEntryPoint,
        plugins: [
          new NordnetReleasePlugin({
            publicPath: `${publicPath}/`,
            initDir: OUTPUT_DIR,
          }),
        ],
      };

      testPlugin(webpackConfig, expected(singleEntryPoint, done));
    });
  });

  describe('when async', () => {
    it('should generage ${entrypoint}.js with async injection', (done) => {
      const webpackConfig = {
        output,
        entry: singleEntryPoint,
        plugins: [
          new NordnetReleasePlugin({
            publicPath,
            initDir: OUTPUT_DIR,
            ignoreChunks: ['vendor'],
            async: true,
          }),
        ],
      };

      testPlugin(webpackConfig, expected(singleEntryPoint, done, true));
    });
  });

  describe('when ignoreChunks', () => {
    describe('require.ensure without ignoreChunks', () => {
      it('should generate ${entrypoint}.js with all chunks', (done) => {
        const webpackConfig = {
          output,
          entry: asyncEntryPoint,
          plugins: [new NordnetReleasePlugin(options)],
        };

        testPlugin(webpackConfig, expected(asyncEntryPoint, done));
      });
    });

    describe('require.ensure with ignoreChunks', () => {
      it('should generate ${entrypoint}.js without ignored chunks', (done) => {
        const webpackConfig = {
          output,
          entry: asyncEntryPoint,
          plugins: [
            new NordnetReleasePlugin({
              publicPath,
              initDir: OUTPUT_DIR,
              ignoreChunks: ['index'],
            }),
          ],
        };

        testPlugin(webpackConfig, expected(asyncEntryPoint, done));
      });
    });

    describe('multiple entry points with ignored chunks', () => {
      it('should generate ${entrypoint}.js without ignored chunks', (done) => {
        const webpackConfig = {
          output,
          entry: multipleEntryPoints,
          plugins: [
            new NordnetReleasePlugin({
              publicPath,
              initDir: OUTPUT_DIR,
              ignoreChunks: ['vendor'],
            }),
          ],
        };

        testPlugin(webpackConfig, expected(singleEntryPoint, done));
      });
    });
  });

  describe('source maps', () => {
    describe('hidden-source-map', () => {
      it('should generate ${entrypoint}.js without links to source maps', (done) => {
        const webpackConfig = {
          output: {
            path: OUTPUT_DIR,
            sourceMapFilename: '[name].map',
            filename: '[name].js',
          },
          devtool: 'hidden-source-map',
          entry: multipleEntryPoints,
          plugins: [
            new NordnetReleasePlugin({
              publicPath,
              initDir: OUTPUT_DIR,
              ignoreChunks: ['vendor'],
            }),
          ],
        };

        testPlugin(webpackConfig, expected(singleEntryPoint, done));
      });
    });

    describe('source-map', () => {
      it('should generate ${entrypoint}.js without links to source maps', (done) => {
        const webpackConfig = {
          output: {
            path: OUTPUT_DIR,
            sourceMapFilename: '[name].map',
            filename: '[name].js',
          },
          devtool: 'source-map',
          entry: multipleEntryPoints,
          plugins: [
            new NordnetReleasePlugin({
              publicPath,
              initDir: OUTPUT_DIR,
              ignoreChunks: ['vendor'],
            }),
          ],
        };

        testPlugin(webpackConfig, expected(singleEntryPoint, done));
      });
    });

    describe('inline-source-map', () => {
      it('should generate ${entrypoint}.js without links to source maps', (done) => {
        const webpackConfig = {
          output: {
            path: OUTPUT_DIR,
            sourceMapFilename: '[name].map',
            filename: '[name].js',
          },
          devtool: 'inline-source-map',
          entry: multipleEntryPoints,
          plugins: [
            new NordnetReleasePlugin({
              publicPath,
              initDir: OUTPUT_DIR,
              ignoreChunks: ['vendor'],
            }),
          ],
        };

        testPlugin(webpackConfig, expected(singleEntryPoint, done));
      });
    });
  });
});

function expected(entry, done, async) {
  const files = Object.keys(entry).map(key => ({
    file: `${key}.js`,
    content: mapResult(key, async),
  }));

  return { done, files };
}

function mapResult(key, async) {
  if (async) {
    return `(function(d){var s=d.createElement(\'script\');s.charset=\'UTF-8\';s.src=\'${publicPath}/${key}.js\';d.getElementsByTagName(\'head\')[0].appendChild(s);})(document);`;
  }

  return `document.write(\'<script charset="UTF-8" src="${publicPath}/${key}.js"></script>\');`;
}

function testPlugin(webpackConfig, expectedResults) {
  webpack(webpackConfig, assertPlugin(expectedResults));
}

function assertPlugin(expectedResults) {
  return function assertExpectedResults(err, stats) {
    expect(err).to.not.be.ok;

    const errors = (stats.compilation.errors || []).join('\n');
    assertExpected(errors, expectedResults.errors);

    const warnings = (stats.compilation.warnings || []).join('\n');
    assertExpected(warnings, expectedResults.warnings);

    assertContent(expectedResults);
    expectedResults.done();
  };
}

function assertContent({ files }) {
  files.forEach(({ file, content }) => {
    const actualContent = fs.readFileSync(path.join(OUTPUT_DIR, file)).toString();
    expect(actualContent).to.equal(content);
  });
}

function assertExpected(actual, expectedResults) {
  if (expectedResults) {
    expect(actual).to.not.equal('');
  } else {
    expect(actual).to.equal('');
  }
}
