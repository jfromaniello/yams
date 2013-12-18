## YAMS Yet Another MongoDb Session

Mongodb session store for connect.

Fork of [connect-mongo](https://github.com/kcbanner/connect-mongo), simplifies database configuration.

  [![Build Status](https://secure.travis-ci.org/jfromaniello/yams.png?branch=master)](http://travis-ci.org/jfromaniello/yams)

## Installation

    $ npm install yams

## Usage

~~~javascript
var MongoClient     = require("mongodb").MongoClient;
var Yams = require('yams');

var store = new Yams(function (callback) {
  //this will be called once, you must return the collection sessions.
  MongoClient.connect('mongo://localhost/myapp', function (err, db) {
    if (err) return callback(err);
    
    var sessionsCollection = db.collection('sessions')

    //use TTL in mongodb, the document will be automatically expired when the session ends.
    sessionsCollection.ensureIndex({expires:1}, {expireAfterSeconds: 0}, function(){});

    callback(null, sessionsCollection);
  });  
});

app.usage(express.session({
  secret: 'black whisky boycott tango 2013',
  store:  store
}));

~~~

## License 

(The MIT License)

Copyright (c) 2013 Jose Romaniello &lt;jfromaniello@gmail.com&gt;

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
'Software'), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
