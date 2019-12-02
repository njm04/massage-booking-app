const verifyToken = (req, res, next) => {
    const bearerHeader = req.headers['Authorization'];
    if(typeof bearerHeader !== 'undefined') {
        // const bearerToken = req.get('authorization');
        const bearer = bearerHeader.split(' ');
        const bearerToken = bearer[0];
        req.token = bearerToken;

        next();
    } else {
        return res.sendStatus(403);
    }
}

module.exports = verifyToken;