const express = require('express')
const bodyParser = require('body-parser')
const morgan = require('morgan')
const fs = require('fs')
const rfs = require('rotating-file-stream')
const path = require('path')
const mongoose = require('mongoose')
const app = express()


const router = require('./router')

/*
// @see: https://developer.mozilla.org/en-US/docs/Learn/Server-side/Express_Nodejs/mongoose
// DB Setup
//Set up default mongoose connection
mongoose.connect(mongoDBURL);
//Get the default connection
const db = mongoose.connection;
//Bind connection to error event (to get notification of connection errors)
db.on('error', console.error.bind(console, 'MongoDB connection error:'));

*/

const mongoDBURL = 'mongodb://127.0.0.1/apiServer';
//mongoose.Promise = global.Promise;

mongoose.connect(mongoDBURL)
  .then(() =>  console.log(`connection to ${mongoDBURL} succesful`))
  .catch((err) => console.error(err));

// Middleware
// -- Morgan
// --- Prepare stream writable for log
var logDirectory = path.join(__dirname, 'log')

// ensure log directory exists
fs.existsSync(logDirectory) || fs.mkdirSync(logDirectory)

// @see: https://github.com/iccicci/rotating-file-stream
// create a rotating write stream
var accessLogStream = rfs('access.log', {
    interval: '7d', // rotate weekly
    path: logDirectory,
    maxFiles: 10
  })

var errorLogStream = rfs('error.log', {
    interval: '7d', // rotate daily
    path: logDirectory,
    maxFiles: 30
  })
  
/*
  // Code de test des middlewares trouvés dans le tuto

  var premierMiddleware = function (req, res, next) {
    throw new Error('Une erreur est survenue!')
    next();
  };
  
  var secondeMiddleware = function (err, req, res, next) {
    console.log(err);
    next();
  };
  
  
  app.use(premierMiddleware);
  app.use(secondeMiddleware);
*/

app.use(morgan('tiny', {
    skip: function (req, res) { return res.statusCode > 299 },
    stream: accessLogStream
  }))

app.use(morgan('combined', {
    skip: function (req, res) { return res.statusCode < 300 },
    stream: errorLogStream
  }))


/*
 var rfs    = require('rotating-file-stream');
var stream = rfs('file.log', {
    size:     '10M', // rotate every 10 MegaBytes written
    interval: '1d',  // rotate daily
    compress: 'gzip' // compress rotated files
});
*/
  // -- Body Parser
app.use(bodyParser.json({ type: '*/*' }))
// app.use(express.json())



// Route and launching server
router(app)

const port = process.env.port || 3001
app.listen(port, '127.0.0.1',  _ => { console.log(`-=-=Server listening on port ${port}=-=-`) })


