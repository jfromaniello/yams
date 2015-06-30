var session = require('express-session');
var Yams = require('../')(session);

var expect = require('chai').expect;

var getDb = require('mongo-getdb');

getDb.init('mongodb://localhost/yams_tests');

var store = new Yams(function (callback) {
  getDb(function (db) {
    callback(null, db.collection('sessions'));
  });
});


describe('Yams', function () {
  var db;

  before (function (done) {
    getDb(function (_db) {
      db = _db;
      process.nextTick(done);
    });
  });

  beforeEach(function (done) {
    db.collection('sessions').remove({}, done);
  });

  it('can store a session', function (done) {
    store.set('lalalala', {foo: 'bar', cookie: {}}, function (err) {
      if (err) return done(err);
      db.collection('sessions').findOne({_id: 'lalalala'}, function (err, session) {
        if (err) return done(err);
        expect(JSON.parse(session.session).foo).to.eql('bar');
        expect(session).to.have.property('expires');
        done();
      });
    });
  });

  it('can retrieve a session', function (done) {
    store.set('lalalala', {foo: 'bar', cookie: {}}, function (err) {
      if (err) return done(err);
      store.get('lalalala', function (err, session) {
        expect(session.foo).to.eql('bar');
        done();
      });
    });
  });

  it('can retrieve destroy a session', function (done) {
    store.set('lalalala', {foo: 'bar', cookie: {}}, function (err) {
      if (err) return done(err);
      store.destroy('lalalala', function (err, session) {
        if (err) return done(err);
        store.get('lalalala', function (err, session) {
          if (err) return done(err);
          expect(session).to.not.exist;
          done();
        });
      });
    });
  });


});
