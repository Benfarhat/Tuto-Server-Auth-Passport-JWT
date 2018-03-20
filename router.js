const Authentication = require('./controllers/authentication')

module.exports = app => {
    app.get('/', (req, res) => res.send({ authorisation: 'ok' }))
    app.post('/signin',Authentication.signin)
    app.post('/signup',Authentication.signup)
    app.post('/testMorgan', (req, res) => {
        res.end()
    })
    app.get('/google', (req, res) => {
        res.redirect(301, 'http://www.google.tn');
    })
    app.get('/youtube', (req, res) => {
        res.redirect(301, 'http://www.youtube.tn');
    })
}