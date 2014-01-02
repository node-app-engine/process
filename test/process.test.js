/* vim: set expandtab tabstop=2 shiftwidth=2 foldmethod=marker: */

"use strict";

var should = require('should');

describe('sandbox process interface', function () {

  var _create = function (options) {
    return require(__dirname + '/../').create(options);
  };

  it('should_process_works_fine', function (done) {

    var _me = _create({
      'rootdir' : '/home/app1',
      'srcfile' : './a.js',
      'appuid' : '070',
      'appuser' : 'aleafs',
    });

    (function () {
      _me.chdir('///home');
    }).should.throw('ENOENT, no such file or directory');

    (function () {
      _me.chdir('../../../');
    }).should.throw('ENOENT, no such file or directory');

    _me.chdir('/home/app1/a/b/c/../../d');
    _me.cwd().should.eql('/home/app1/a/d');

    _me.send('hello');

    _me.execPath.should.eql('/usr/bin/node');
    _me.execArgv.should.eql([]);
    _me.argv.should.eql(['/usr/bin/node', './a.js']);
    _me.ARGV.should.eql(['/usr/bin/node', './a.js']);

    _me.env.should.eql({
      'HOME' : '/home/app1',
      'USER' : 'aleafs',
    });
    _me.ENV.should.eql({
      'HOME' : '/home/app1',
      'USER' : 'aleafs',
    });

    ['config', 'pid', 'title', 'version', 'versions', 'arch'].forEach(function (x) {
      _me[x].should.eql(process[x]);
    });

    //_me.maxTickDepth.should.eql(process.maxTickDepth - 10);

    _me.getuid().should.eql(70);
    _me.getgid().should.eql(20);
    _me.getgroups().should.eql([20]);

    ['kill', 'binding', 'abort', 'setgid', 'setuid', 'setgroups', 'initgroups'].forEach(function (x) {
      (function () {
        (_me[x])();
      }).should.throw('Method **' + x + '** for process is disabled in NAE.');
    });

    _me.on('message', function () {
      throw new Error('this should not be executed.');
    });
    process.emit('message', 'abc');

    var count = 0;
    var check = function () {
      if (0 === (--count)) {
        done();
      }
    };

    ++count;
    _me.once('exit', function (code) {
      code.should.eql(3);
      check();
    });

    ++count;
    _me.on('exit', function (code) {
      code.should.eql(3);
      _me.removeAllListeners('exit');
      check();
    });

    process.emit('exit', 3);
    process.emit('exit', 9);

    /*
    ++count;
    _me.on('uncaughtException', function (err) {
      String(err).should.include('blabla');
      //console.log(err);
      check();
    });

    process.emit('uncaughtException', new Error('blabla'));
    */
  });

});

