const mongoose = require('mongoose')
const Schema = mongoose.Schema
const bcrypt = require('bcrypt-nodejs')

// Create Schema
const userSchema = new Schema({
    username:{
        type: String,
        unique: true,
        lowercase: true
    },
    password: String
})


// @see: http://mongoosejs.com/docs/middleware.html#order
// -- On Save Hook, encrypt password

userSchema.pre('save', function(next) {
    const user = this
    // by default gensalt's round is "10"
    bcrypt.genSalt(10, (err, salt) => {
        if(err) {return next(err)}
        // Hash password using salt
        bcrypt.hash(user.password, salt, null, (err, hash) => {
            if(err) {return next(err)}

            user.password = hash
            next()      
        })
    })
  });

userSchema.methods.comparePassword = function(candidatePassword, callback) {
    // @see: https://www.npmjs.com/package/bcrypt#to-check-a-password

    bcrypt.compare(candidatePassword, this.password, function(err, isMatch) {
        if (err) { return callback(err) }
        return callback(null, isMatch)
    })
}

// Create model
module.exports = mongoose.model('User', userSchema)
