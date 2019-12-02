const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/user.model');
const router = express.Router();

router.post('/', async (req, res) => {
    try {
        const email = req.body.email;
        const password = req.body.password;
        const secret_key = process.env.SECRET_KEY;

        const user = await User.findOne({'email': email});

        if(await bcrypt.compare(password, user.password)) {
            jwt.sign({user}, secret_key, (err, token) => {
                if(err) return res.json({status: 500, err});
                return res.json({
                    token,
                    message: 'Authenticated'
                });
            });
        } else {
            return res.json({status: 401, message: 'Unauthorized'});
        }
    } catch(err) {
        return res.json({status: 500, message: 'Login Error.'});
    }
});

module.exports = router;