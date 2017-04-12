'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.shouldIgnore = shouldIgnore;
exports.resolveMockPath = resolveMockPath;
exports.passthru = passthru;
exports.errorHandler = errorHandler;

var _url = require('url');

var _querystring = require('querystring');

var _querystring2 = _interopRequireDefault(_querystring);

var _path = require('path');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// Utility methods
function stripSpecialChars(val) {
  if (!val) {
    return val;
  }
  return val.replace(/\?/g, '--').replace(/\//g, '__').replace(/:/g, '~~').replace(/\*/g, '%2A');
}

function getUrlPath(urlParts) {
  return stripSpecialChars((urlParts.pathname || '').replace('/', ''));
}

function getProps(req, match, ignore) {
  let qs;
  let pobj = {};
  if (Array.isArray(match)) {
    for (let m of match) {
      if (m in req.props) {
        pobj[m] = req.props[m];
      }
    }
  } else if (match !== false) {
    pobj = req.props;
  }
  if (Array.isArray(ignore)) {
    for (let p of ignore) {
      delete pobj[p];
    }
  }
  qs = _querystring2.default.stringify(pobj);
  return stripSpecialChars(qs);
}

function getReqHeaders(req, match) {
  let headers = '';
  if (Array.isArray(match)) {
    for (let header of match) {
      let presenseOnly = false;
      if (header.startsWith('@')) {
        presenseOnly = true;
        header = header.substring(1);
      }
      if (header in req.headers) {
        if (presenseOnly) {
          headers = (0, _path.join)(headers, stripSpecialChars(header));
        } else {
          headers = (0, _path.join)(headers, stripSpecialChars(header + '/' + req.headers[header]));
        }
      }
    }
  } else {
    for (let key in req.headers) {
      headers = (0, _path.join)(headers, stripSpecialChars(key + '/' + req.headers[key]));
    }
  }
  return headers;
}

function shouldIgnore(_ref) {
  let url = _ref.url;

  return url === '' || url === '/' || url.startsWith('/__');
}

function resolveMockPath(req, dataRoot) {
  // Mock data directory associated with the API call
  let path = (0, _path.join)(req.conf.dir, req.method);
  if (!path) {
    return null;
  }

  // Custom headers
  if (req.conf.matchHeaders) {
    const headers = getReqHeaders(req, req.conf.matchHeaders);
    if (headers) {
      path = (0, _path.join)(path, headers);
    }
  }

  // Meta info regarding the request's url, including the query string
  const parts = (0, _url.parse)(req.urlToProxy, true);

  if (parts) {
    // REST parameters
    const urlPath = getUrlPath(parts);
    if (urlPath) {
      path = (0, _path.join)(path, urlPath);
    } else {
      path = (0, _path.join)(path, 'index');
    }

    // Query string
    const props = getProps(req, req.conf.matchProps, req.conf.ignoreProps);
    if (props) {
      path = (0, _path.join)(path, props);
    }
  }

  path = (0, _path.join)(dataRoot, path + '.mock');
  console.log(path);
  return path;
}

function passthru(res, options) {
  try {
    res.writeHead(options.code || 200, options.headers);
    res.write(options.body);
    res.end();
  } catch (e) {
    console.warn('Error writing response', e);
    res.end();
  }
}

function errorHandler(res, err) {
  console.error('Request failed: ' + err);
  res.writeHead(500, { 'Content-Type': 'text/plain' });
  res.write('An error has occured, please review the logs.');
  res.end();
}