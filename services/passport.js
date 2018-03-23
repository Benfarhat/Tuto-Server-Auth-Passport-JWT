const passport = require('passport')
const LocalStrategy = require('passport-local') 
const User = require('../models/user')

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


passport.use('local', localLogin)
