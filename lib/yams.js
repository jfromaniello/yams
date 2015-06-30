/*!
 * yams
 * Copyright(c) 2013 Jose Romaniello <jfromaniello@gmail.com>
 * MIT Licensed
 */

module.exports = function(connect) {
  var Store = connect.Store || connect.session.Store;

  function Yams(getCollection, options) {
    Store.call(this, options);

    var self = this;

    this._get_collection = function(callback) {
      if (self._collection) {
        return callback(self._collection);
      }
      getCollection(function (err, coll) {
        if (err) {
          console.error('cant initialize the mongodb session store', err.stack);
          process.exit(2);
        }
        self._collection = coll;
        callback(self._collection);
      });
    };
  }

  Yams.prototype = Object.create(Store.prototype);

  Yams.prototype.get = function(sid, callback) {
    var self = this;
    this._get_collection(function(collection) {
      collection.findOne({_id: sid}, function(err, session) {
        if (err) {
          callback && callback(err, null);
        } else {
          if (session) {
            if (!session.expires || new Date < session.expires) {
              callback(null, JSON.parse(session.session));
            } else {
              self.destroy(sid, callback);
            }
          } else {
            callback && callback();
          }
        }
      });
    });
  };

  Yams.prototype.set = function(sid, session, callback) {
    var s = {_id: sid, session: JSON.stringify(session)};

    if (session && session.cookie) {
      if (session.cookie._expires) {
        s.expires = new Date(session.cookie._expires);
      } else {
        // If there's no expiration date specified, it is
        // browser-session cookie, as per the connect docs.
        // So we set the expiration to two-weeks from now,
        // as is common practice in the industry (e.g Django).
        var today = new Date(),
        twoWeeks = 1000 * 60 * 60 * 24 * 14;
        s.expires = new Date(today.getTime() + twoWeeks);
      }
    }

    this._get_collection(function(collection) {
      collection.update({_id: sid}, s, {upsert: true, safe: true}, function(err) {
        if (err) {
          callback && callback(err);
        } else {
          callback && callback(null);
        }
      });
    });
  };

  Yams.prototype.destroy = function(sid, callback) {
    this._get_collection(function(collection) {
      collection.remove({_id: sid}, function() {
        callback && callback();
      });
    });
  };

  Yams.prototype.length = function(callback) {
    this._get_collection(function(collection) {
      collection.count({}, function(err, count) {
        if (err) {
          callback && callback(err);
        } else {
          callback && callback(null, count);
        }
      });
    });
  };

  Yams.prototype.clear = function(callback) {
    this._get_collection(function(collection) {
      collection.drop(function() {
        callback && callback();
      });
    });
  };

  return Yams;
};
