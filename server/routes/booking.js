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
            return res.json({status: 403, message: 'Unauthorized'});
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
            return res.json({status: 200, message: 'booking created.'});
        }
    });
});

router.get('/', async (req, res) => {
    await Booking
            .where({isDeleted: 0})
            .find()
            .populate('bookedBy', '-_id firstName lastName')
            .exec((err, user) => {
                if(err) return res.status(500); 
                return res.json(user);
            });
});

router.get('/:id', verifyToken, async (req, res) => {
    const userId = req.params.id;
    jwt.verify(req.token, secret_key, async (err) => {
        if(err) {
            return res.json({status: 403, message: 'Unauthorized'});
        } else {
            await Booking
                .where({bookedBy: userId})
                .find()
                .populate('bookedBy', '_id firstName lastName')
                .exec((err, user) => {
                    if(err) return res.status(500); 
                    return res.json(user);
                });
        }
    });
});

router.put('/:id', verifyToken, async (req, res) => {
    jwt.verify(req.token, secret_key, async (err) => {
        if(err) {
            return res.json({status: 403, message: 'Unauthorized'});
        } else {
            const massageType = req.body.massageType;
            const duration = req.body.duration;
            const date = req.body.date;
            const booking = await Booking.findById(req.params.id);
            if(booking !== null) {
                await Booking.updateOne(
                    {
                        massageType: massageType,
                        duration: duration,
                        date: date
                    }
                );
    
                return res.json({status: 200, message: "Successfully updated."});
            } else {
                return res.json({status: 500, message: 'Booking not found.'});
            }
            
        }
    });
});

router.put('/delete/:id', verifyToken, async (req, res) => {
    jwt.verify(req.token, secret_key, async (err) => {
        if(err) {
            return res.json({status: 403, message: 'Unauthorized'});
        } else {
            const booking = await Booking.where({isDeleted: 0}).findOne({_id: req.params.id});
            if(booking !== null) {
                await Booking.updateOne({isDeleted: 1});
                return res.json({status: 200, message: 'Successfully deleted'});
            };
            return res.json({status: 500, message: 'Booking not found.'});
        }
    });
});


module.exports = router;