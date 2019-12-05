const verifyToken = (req, res, next) => {
    console.log(req.headers)
    const bearerHeader = req.headers['authorization'];
    console.log(bearerHeader)
    if(typeof bearerHeader !== 'undefined') {
        // const bearerToken = req.get('authorization');
        const bearer = bearerHeader.split(' ');
        const bearerToken = bearer[1];
        console.log(bearerToken)
        req.token = bearerToken;

        next();
    } else {
        return res.sendStatus(403);
    }
}

module.exports = verifyToken;