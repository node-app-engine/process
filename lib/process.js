/* vim: set expandtab tabstop=2 shiftwidth=2 foldmethod=marker: */

"use strict";

var path = require('path');
var Emitter = require('events').EventEmitter;

exports.create = function (options) {

  var _options = {
    'approot' : process.cwd(),
    'appuid'  : 501,
    'appgid'  : 20,
    'appuser' : 'user',
  };

  for (var i in options) {
    _options[i] = options[i];
  }
  _options.approot = path.normalize(_options.approot);
  ['appuid', 'appgid'].forEach(function (x) {
    _options[x] = parseInt(_options[x], 10);
  });

  /**
   * @ 暂时状态
   */
  var _status = {
    'cwd' : _options.approot,
  };

  var _me = {

    'stdout' : process.stdout,
    'stderr' : process.stderr,
    'stdin' : process.stdin,
    'argv' : ['/usr/bin/node', _options.approot],
    'execPath' : '/usr/bin/node',
    'title' : _options.title || '/usr/bin/node',
    'execArgv' : [],
    //'abort', chdir,

    'env' : {
      'HOME' : '/home/' + _options.appuser,
      'USER' : _options.appuser,
    },

    // exit
    'version' : process.version,
    'versions' : process.versions,
    'config' : {},

    // kill
    'pid' : process.pid,
    'arch' : process.arch,
    'platform' : process.platform,
    'memoryUsage' : process.memoryUsage,
    'nextTick' : process.nextTick,
    'maxTickDepth' : Math.max(10, process.maxTickDepth - 10),
    'umask' : process.umask,
    'uptime' : process.uptime,
    'hrtime' : process.hrtime,
  };

  var evt = new Emitter();
  var tmp = {};
  var eventInit = function (e) {
    if (!tmp[e] && ('exit' === e || 'uncaughtException' === e)) {
      tmp[e] = true;
      process.on(e, function () {
        evt.emit.apply(evt, [e].concat(Array.prototype.slice.call(arguments)));
      });
    }
  };

  _me.EventEmitter = Emitter;

  _me.on = function (e) {
    eventInit(e);
    evt.on.apply(evt, arguments);
  };

  _me.once = function (e) {
    eventInit(e);
    evt.once.apply(evt, arguments);
  };

  ['addListener', 'removeListener', 'removeAllListeners', 'setMaxListener', 'listeners'].forEach(function (x) {
    _me[x] = function () {
      evt[x].apply(evt, arguments);
    }
  });

  _me.cwd = function () {
    return _status.cwd;
  };

  _me.chdir = function (dir) {
    dir = String(dir).trim();
    if ('/' !== dir.substring(0, 1)) {
      dir = path.join(_options.approot, dir);
    }
    dir = path.normalize(dir);

    if (0 !== dir.indexOf(_options.approot)) {
      throw new Error('ENOENT, no such file or directory');
    }

    /**
     * XXX: 修正路径问题
     */
    _status.cwd = dir;
  };

  _me.getuid = function () {
    return _options.appuid;
  };

  _me.getgid = function () {
    return _options.appgid;
  };

  _me.getgroups = function () {
    return [_options.appgid];
  };

  _me.send = function () {
    if ('function' === (typeof process.send)) {
      process.send.apply(process, arguments);
    }
  };

  ['binding', 'kill', 'abort', 'setgid', 'setuid', 'setgroups', 'initgroups'].forEach(function (x) {
    _me[x] = function () {
      throw new Error('Method **' + x + '** for process is disabled in NAE.');
    };
  });

  _me.ENV = _me.env;
  _me.ARGV = _me.argv;

  return _me;
};

