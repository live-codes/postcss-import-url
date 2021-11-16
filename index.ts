import { list, parse } from 'postcss';
import isUrl from 'is-url';
import trim from 'lodash.trim';
import resolveRelative from 'resolve-relative-url';
import url from 'url';

const defaults = {
  disableCache: false,
  recursive: true,
  resolveUrls: false,
  modernBrowser: false,
  userAgent: null,
};
const space = list.space;
const urlRegexp = /url\(["']?.+?['"]?\)/g;

function postcssImportUrl(options: typeof defaults) {
  options = {
    ...defaults,
    ...options,
  };

  async function importUrl(tree, _, parentRemoteFile) {
    parentRemoteFile = parentRemoteFile || tree.source.input.file;
    const imports = [];
    tree.walkAtRules('import', function checkAtRule(atRule) {
      const params = space(atRule.params);
      let remoteFile = cleanupRemoteFile(params[0]);
      if (parentRemoteFile) {
        remoteFile = resolveRelative(remoteFile, parentRemoteFile);
      }
      if (!isUrl(remoteFile)) {
        return;
      }
      imports[imports.length] = createPromise(remoteFile, options).then(async (r) => {
        let newNode = parse(r.body);
        const mediaQueries = params.slice(1).join(' ');
        if (mediaQueries) {
          const mediaNode = atRule({
            name: 'media',
            params: mediaQueries,
            source: atRule.source,
          });
          mediaNode.append(newNode);
          newNode = mediaNode as any;
        } else {
          newNode.source = atRule.source;
        }

        if (options.resolveUrls) {
          // Convert relative paths to absolute paths
          newNode = newNode.replaceValues(urlRegexp, { fast: 'url(' }, (url) =>
            resolveUrls(url, remoteFile),
          );
        }

        const tree = await (options.recursive
          ? importUrl(newNode, null, r.parent)
          : Promise.resolve(newNode));
        atRule.replaceWith(tree);
      });
    });
    await Promise.all(imports);
    return tree;
  }

  return {
    postcssPlugin: 'postcss-import-url',
    Once: importUrl,
  };
}

module.exports = postcssImportUrl;
module.exports.postcss = true;

function cleanupRemoteFile(value) {
  if (value.substr(0, 3) === 'url') {
    value = value.substr(3);
  }
  value = trim(value, '\'"()');
  return value;
}

function resolveUrls(to, from) {
  return 'url("' + resolveRelative(cleanupRemoteFile(to), from) + '")';
}

const cache: Record<string, string> = {};
function createPromise(remoteFile, options) {
  const reqOptions: url.UrlWithStringQuery & { headers?: any } = urlParse(remoteFile);
  reqOptions.headers = {};
  reqOptions.headers['connection'] = 'keep-alive';
  if (options.modernBrowser) {
    reqOptions.headers['user-agent'] = 'Mozilla/5.0 AppleWebKit/538.0 Chrome/88.0.0.0 Safari/538';
  }
  if (options.userAgent) {
    reqOptions.headers['user-agent'] = String(options.userAgent);
  }
  if (options.disableCache !== true && cache[reqOptions.href]) {
    return Promise.resolve({
      body: cache[reqOptions.href],
      parent: remoteFile,
    });
  }
  return fetch(reqOptions.href, {
    headers: { ...reqOptions.headers },
  })
    .then((res) => res.text())
    .then((body) => {
      cache[reqOptions.href] = body;
      return {
        body,
        parent: remoteFile,
      };
    });
}

function urlParse(remoteFile) {
  const reqOptions = url.parse(remoteFile);
  return reqOptions;
}
