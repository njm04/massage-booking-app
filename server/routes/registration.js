const express = require('express');
const bcrypt = require('bcryptjs');
const User = require('../models/user.model');
const router = express.Router();

router.post('/register', async (req, res) => {
    try {
        const email = req.body.email;
        const firstName = req.body.firstName;
        const lastName = req.body.lastName;
        const age = req.body.parseAge;
        const password = await bcrypt.hash(req.body.password, 10);
        
        if(!email || !firstName || !lastName || !age || !password) {
            return res.json({status: 401, message: 'All Fields must be supplied.'});
        } else {
            const newUser = new User({
                email,
                firstName,
                lastName,
                age,
                password
            });
    
            await newUser.save();
            return res.json({status: 200, message: 'Registered successfully'});
        }
    } catch (err) {
        return res.json({status: 400, message: 'Username / Email already exists.'});
    }
});

module.exports = router;