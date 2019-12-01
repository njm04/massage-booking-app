const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const userSchema = new Schema({
    email: {type: String, require: true, unique: true},
    firstName: {type: String, require: true},
    lastName: {type: String, require: true},
    age: {type: Number, require: true},
    password: {type: String, require: true}
},{
    timestamps: true
});

const User = mongoose.model('User', userSchema);

module.exports = User;