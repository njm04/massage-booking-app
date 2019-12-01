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
                if(err) return res.status(400);
                return res.json({
                    token,
                    message: 'Authenticated'
                });
            });
        } else {
            return res.status(401).json('Unauthorized');
        }
    } catch(err) {
        return res.status(400).json('Login Error.'); 
    }
});

module.exports = router;