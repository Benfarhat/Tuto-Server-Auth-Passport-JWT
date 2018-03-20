const mongoose = require('mongoose')
const Schema = mongoose.schema

// Create Schema
const userSchema = new Schema({
    username:{
        type: String,
        unique: true,
        lowercase: true
    },
    password: String
})


// Create model
module.exports = mongoose.model('User', userSchema)
