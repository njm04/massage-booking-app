const express = require('express');
const bcrypt = require('bcryptjs');
const User = require('../models/user.model');
const router = express.Router();

router.post('/register', async (req, res) => {
    try {
        const email = req.body.email;
        const firstName = req.body.firstName;
        const lastName = req.body.lastName;
        const age = req.body.age;
        const password = await bcrypt.hash(req.body.password, 10);
        
        const newUser = new User({
            email,
            firstName,
            lastName,
            age,
            password
        });

        await newUser.save();
        return res.sendStatus(200);
    } catch (err) {
        return res.status(400).json('Username / Email already exists.');
    }
});

module.exports = router;