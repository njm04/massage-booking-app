const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const bookingSchema = new Schema({
    bookedBy: {type: Schema.Types.ObjectId, ref: 'User'},
    massageType: {type: String, require: true},
    duration: {type: Number, require: true},
    date: {type: Date, require: true},
    isDeleted: {type: Number, default: 0}
}, {
    timestamps: true
});

const Booking = mongoose.model('Booking', bookingSchema);

module.exports = Booking;