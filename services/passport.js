const passport = require('passport')
const LocalStrategy = require('passport-local') 

const JwtStrategy = require('passport-jwt').Strategy
const ExtractJwt = require('passport-jwt').ExtractJwt

const User = require('../models/user')
const config = require('../config')

// localLogin
const localLogin = new LocalStrategy((username, password, done) => {
    
    User.findOne({ username }, (err, user) => {
        if (err) { return done(err, false) }

        if(!user) {
            done(null, false)
        } else {
            user.comparePassword(password, function(err, isMatch) {
                if(err) { return done(err) }
                
                if(!isMatch) { return done(null, false) }

                return done(null, user)
            })
        }
    })

})

// jwtLogin
const jwtOptions = {
    secretOrKey: config.secret,
    jwtFromRequest: ExtractJwt.fromHeader('authorization')
}


const jwtLogin = new JwtStrategy(jwtOptions, (payload, done) => {
    User.findById(payload.sub, (err, user) => {
        if (err) { return done(err, false) }

        if(user) {
            done(null, user) 
        } else {
            done(null, false) 
        }
    })

})

passport.use('local', localLogin)
passport.use(jwtLogin)
