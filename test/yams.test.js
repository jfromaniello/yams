var session = require('express-session');
var Yams = require('../')(session);
var expect = require('chai').expect;
var getDb = require('mongo-getdb');

getDb.init('mongodb://localhost/yams_tests');

var getCollection = function (callback) {
  getDb(function (db) {
    callback(null, db.collection('sessions'));
  });
};

describe('Yams', function () {
  var db;

  before(function (done) {
    getDb(function (_db) {
      db = _db;
      process.nextTick(done);
    });
  });

  beforeEach(function (done) {
    db.collection('sessions').remove({}, done);
  });

  it('can store a session', function (done) {
    var store = new Yams(getCollection);
    store.set('lalalala', {foo: 'bar', cookie: {}}, function (err) {
      if (err) return done(err);
      db.collection('sessions').findOne({_id: 'lalalala'}, function (err, session) {
        if (err) return done(err);
        expect(JSON.parse(session.session).foo).to.eql('bar');
        expect(session).to.have.property('expires');
        expect(session.expires - new Date())
          .to.be.at.least(1209600000 - 100)
          .and.below(1209600000); // default options.inactiveTimeout: 1209600000

        done();
      });
    });
  });

  it('can store a session with inactive and absolute timeouts', function (done) {
    var store = new Yams(getCollection, { inactiveTimeout: 10000, absoluteTimeout: 50000 });
    store.set('lalalala', {foo: 'bar', cookie: {}}, function (err) {
      if (err) return done(err);
      db.collection('sessions').findOne({_id: 'lalalala'}, function (err, session) {
        if (err) return done(err);
        expect(JSON.parse(session.session).foo).to.eql('bar');
        expect(session).to.have.property('expires');
        expect(session.expires - new Date())
          .to.be.at.least(10000 - 100)
          .and.below(10000);

        expect(session).to.have.property('expiresAbsolute');
        expect(session.expiresAbsolute - new Date())
          .to.be.at.least(50000 - 100)
          .and.below(50000);

        done();
      });
    });
  });

  it('can store a session using overridden options', function (done) {
    var store = new Yams(getCollection, { inactiveTimeout: 10000, absoluteTimeout: 50000 });
    store.on('set', function (req, yamsOptions) {
      yamsOptions.inactiveTimeout = 10000000;
      yamsOptions.absoluteTimeout = 50000000;
    });

    store.set('lalalala', {foo: 'bar', cookie: {}}, function (err) {
      if (err) return done(err);
      db.collection('sessions').findOne({_id: 'lalalala'}, function (err, session) {
        if (err) return done(err);
        expect(JSON.parse(session.session).foo).to.eql('bar');
        expect(session).to.have.property('expires');
        expect(session.expires - new Date())
          .to.be.at.least(10000000 - 100)
          .and.below(10000000);

        expect(session).to.have.property('expiresAbsolute');
        expect(session.expiresAbsolute - new Date())
          .to.be.at.least(50000000 - 100)
          .and.below(50000000);

        done();
      });
    });
  });

  it('can retrieve a session', function (done) {
    var store = new Yams(getCollection);
    store.set('lalalala', {foo: 'bar', cookie: {}}, function (err) {
      if (err) return done(err);
      store.get('lalalala', function (err, session) {
        expect(session.foo).to.eql('bar');
        done();
      });
    });
  });

  it('can retrieve destroy a session', function (done) {
    var store = new Yams(getCollection);
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
