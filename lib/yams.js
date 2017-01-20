/*!
 * yams
 * Copyright(c) 2013 Jose Romaniello <jfromaniello@gmail.com>
 * MIT Licensed
 */

module.exports = function(connect) {
  var Store = connect.Store || connect.session.Store;

  /**
   * Initialize mongodb session store.
   *
   * @param {Function} [getCollection] async function to return the sessions collection
   * @param {Object} [options]
   * @param {Object} [options.inactiveTimeout] Maximum time window on which the session will be valid without making a new request
   * @param {Object} [options.absoluteTimeout] Absolute time window on which the user will have the session valid
   * @public
   */

  function Yams(getCollection, options) {
    Store.call(this, options);

    this.options = options || {};

    // support `options.ttl` to maintain compatibility with previous version
    this.options.inactiveTimeout = this.options.inactiveTimeout || this.options.ttl || (1000 * 60 * 60 * 24 * 14); // 14 days

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
    callback = callback || function(){};
    var self = this;
    this._get_collection(function(collection) {
      collection.findOne({_id: sid}, function(err, session) {
        if (err) {
          callback(err, null);
        } else {
          if (session) {
            if (!session.expires || new Date() < session.expires) {
              callback(null, JSON.parse(session.session));
            } else {
              self.destroy(sid, callback);
            }
          } else {
            callback();
          }
        }
      });
    });
  };

  Yams.prototype.set = function(sid, session, callback) {
    // this event is useful when you want to override yams options based on some req.X fields
    this.emit('set', session.req, this.options);

    callback = callback || function(){};
    var doc = {};
    var s = {_id: sid, session: JSON.stringify(session)};

    if (session && session.cookie) {
      if (session.cookie._expires) {
        s.expires = new Date(session.cookie._expires);
      } else {
        // If there's no expiration date specified, it is
        // browser-session cookie, as per the connect docs.
        // So we set the expiration to two-weeks from now,
        // as is common practice in the industry (e.g Django).
        var today = new Date();
        s.expires = new Date(new Date().getTime() + this.options.inactiveTimeout);
      }
    }

    if (typeof this.options.absoluteTimeout === 'number') {
      doc['$setOnInsert'] = {
        expiresAbsolute: new Date(new Date().getTime() + this.options.absoluteTimeout)
      };
    }

    doc['$set'] = s;

    this._get_collection(function(collection) {
      collection.update({_id: sid}, doc, {upsert: true, safe: true}, function(err) {
        if (err) {
          callback(err);
        } else {
          callback(null);
        }
      });
    });
  };

  Yams.prototype.destroy = function(sid, callback) {
    callback = callback || function(){};
    this._get_collection(function(collection) {
      collection.remove({_id: sid}, function() {
        callback();
      });
    });
  };

  Yams.prototype.length = function(callback) {
    callback = callback || function(){};
    this._get_collection(function(collection) {
      collection.count({}, function(err, count) {
        if (err) {
          callback(err);
        } else {
          callback(null, count);
        }
      });
    });
  };

  Yams.prototype.clear = function(callback) {
    callback = callback || function(){};
    this._get_collection(function(collection) {
      collection.drop(function() {
        callback();
      });
    });
  };

  return Yams;
};
