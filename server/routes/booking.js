const express = require('express');
const jwt = require('jsonwebtoken');
const Booking = require('../models/booking.model');
const User = require('../models/user.model');
const verifyToken = require('../utils/verifyToken');

const router = express.Router();
const secret_key = process.env.SECRET_KEY;

router.post('/', verifyToken, async (req, res) => {
    jwt.verify(req.token, secret_key, async (err, auth) => {
        if(err) {
            return res.sendStatus(403);
        } else {
            const massageType = req.body.massageType;
            const duration = req.body.duration;
            const date = req.body.date;

            const booking = new Booking({
                bookedBy: auth.user,
                massageType: massageType,
                duration: duration,
                date: date 
            });

            await booking.save();
            return res.sendStatus(200);
        }
    });
});

router.get('/', async (req, res) => {
    await Booking.find()
            .populate('bookedBy', '-_id firstName lastName')
            .exec((err, user) => {
                if(err) return res.status(500); 
                return res.json(user);
            });
});

router.put('/:id', verifyToken, async (req, res) => {
    jwt.verify(req.token, secret_key, async (err) => {
        if(err) {
            return res.sendStatus(403);
        } else {
            const massageType = req.body.massageType;
            const duration = req.body.duration;
            const date = req.body.date;

            await Booking.updateOne(
                {_id : req.params.id},
                {
                    massageType: massageType,
                    duration: duration,
                    date: date
                }
            );

            return res.sendStatus(200);
        }
    });
    // console.log(req.body)
    // console.log(bookings)
})

module.exports = router;