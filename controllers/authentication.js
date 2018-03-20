exports.signin = (req, res, next) => {
    res.send("signin")
}
exports.signup = (req, res, next) => {
    const username = req.body.username
    const password = req.body.password
    if (!username || !password)
        return res.status(422).send('Username and password are required')
    console.log(username, password)
    res.send("signup")
}