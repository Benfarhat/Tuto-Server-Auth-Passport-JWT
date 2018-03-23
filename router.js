const Authentication = require('./controllers/authentication')
const passportService = require('./services/passport')
const passport = require('passport')

module.exports = app => {
    app.get('/', (req, res) => res.sendStatus(200)) // OK
    app.post('/signup',  Authentication.signup)
    app.post('/signin', passport.authenticate('local', { session: false }),  Authentication.signin)
    //app.get('/api', passport.authenticate('jwt', { session: false }), (req, res) => res.send("Secured Area")) // Unauthorized
}