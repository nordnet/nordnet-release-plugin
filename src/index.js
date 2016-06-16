import fs from 'fs-extra';
import _ from 'lodash';

const options = {
  initDir: './dist/init',
  publicPath: '/',
  ignoreChunks: [],
  async: false,
};

export default function NordnetBuildDirPlugin(opts) {
  this.options = _.merge({}, options, opts);
}

NordnetBuildDirPlugin.prototype.apply = function apply(compiler) {
  compiler.plugin('done', done.bind(this));
};

const syncInjection = (scriptPath) => `document.write(\'<script charset="UTF-8" src="${scriptPath}"></script>\');`;

// script injected async is not the best performance, if possible it would be nice to use
// async & defer attributes directly instead of going via base, look at:
// https://www.igvita.com/2014/05/20/script-injected-async-scripts-considered-harmful/
// the including page can use async defer on base though when using async mode for build plugin
//
// have a look at: https://mathiasbynens.be/notes/async-analytics-snippet for improvements
//
// if server behaves we don't need charset
const asyncInjection =
  (scriptPath) =>
    `(function(d){var s=d.createElement(\'script\');s.charset=\'UTF-8\';s.src=\'${scriptPath}\';d.getElementsByTagName(\'head\')[0].appendChild(s);})(document);`;

const contains = (array, item) => array.indexOf(item) > -1;
const sanitize = (path) => _.endsWith(path, '/') ? path.substring(0, path.length - 1) : path;

function done(stats) {
  const chunks = stats.toJson().assetsByChunkName;
  const dir = sanitize(this.options.initDir);
  const ignore = this.options.ignoreChunks;
  const path = sanitize(this.options.publicPath);
  const injection = (this.options.async ? asyncInjection : syncInjection);

  const inject = (key) => {
    const value = _.isArray(chunks[key]) ? chunks[key][0] : chunks[key];
    return injection(`${path}/${value}`);
  };

  if (!fs.existsSync(dir)) {
    fs.mkdirsSync(dir);
  }

  Object.keys(chunks)
    .filter(key => !contains(ignore, key))
    .forEach(key => {
      fs.writeFileSync(`${dir}/${key}.js`, inject(key));
    });
}
