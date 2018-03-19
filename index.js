const express = require('express')
const morgan = require('morgan')
const bodyParser = require('body-parser')
const app = express()
const router = require('./router')


// Middleware
app.use(morgan('combined'))
app.use(bodyParser.json({ type: '*/*' }))

// Route and launching server
router(app)
const port = process.env.port || 3000
app.listen(port, () => { console.log('-=-=Server listening on port 3000=-=-')})