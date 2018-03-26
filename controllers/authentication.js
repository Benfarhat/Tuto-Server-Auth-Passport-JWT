const jwt = require('jwt-simple')
const User = require('../models/user')
const config = require('../config')


function generateToken(user){
    const timestamp = new Date().getTime()
    return jwt.encode({ sub: user.id, iat: timestamp }, config.secret)
}

exports.signin = (req, res, next) => {
    res.send({ 
        success:true,
        message: `User ${req.user.username} authenticated`,
        token: generateToken(req.user)
    })
}
exports.signup = (req, res, next) => {
    const username = req.body.username
    const password = req.body.password
    if (!username || !password)
        return res.status(422).send('Username and password are required')

        User.findOne({username}, (err, exist) => {
            if (err) { return next(err) }
            
            // If a user with user does exist, return an error
            if (exist){
                // 422 Unprocessable Entity
                return res.status(422).send({ error: 'Username already exist' })
            }
    
            // if a user with username does NOT exist, create a save user record
            const user = new User({username, password})
    
            user.save(err => {
                if(err) { return next(err) }
                // Respond to request indicating the user was created
                // res.json(user)
                // res.json({ success: true, data: {username, password} })
                res.send({ 
                    success:true,
                    message: `User ${username} saved`,
                    token: generateToken(user)})
            })
        })
        // res.send({username, password})
}