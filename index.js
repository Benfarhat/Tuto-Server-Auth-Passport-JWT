const express = require('express')
const bodyParser = require('body-parser')
const morgan = require('morgan')
const fs = require('fs')
const rfs = require('rotating-file-stream')
const path = require('path')
const app = express()
const router = require('./router')


/*

*/

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
const port = process.env.port || 3000
app.listen(port, '127.0.0.1',  () => { console.log('-=-=Server listening on port 3000=-=-')})

