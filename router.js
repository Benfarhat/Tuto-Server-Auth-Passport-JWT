const Authentication = require('./controllers/authentication')

module.exports = app => {
    app.get('/', (req, res) => res.sendStatus(200)) // OK
    app.get('/api', (req, res) => res.sendStatus(401)) // Unauthorized
    app.post('/signup',  Authentication.signup)
    app.post('/signin',  Authentication.signin)


    /*
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

    app.get('/', requireAuth, (req, res) => res.send({ authorization: 'done'}))

    app.post('/signin', requireSignin, Authentication.signin)
    */
}