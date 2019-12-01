const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
// const bodyParser = require('body-parser');

// loads environment variables from a .env file into process.env
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;
app.use(cors());
// app.use(bodyParser.json()); // for parsing application/json
// app.use(bodyParser.urlencoded({ extended: true })); // for parsing

app.use(express.json());

const uri = process.env.ATLAS_URI;
mongoose.connect(uri, { useNewUrlParser: true, useCreateIndex: true, useUnifiedTopology: true });
const connection = mongoose.connection;
connection
    .once('open', () => console.log('MongoDB database connection established successfully!'))
    .on('error', err => console.log(err));

const registrationRouter = require('./routes/registration');
const loginRouter = require('./routes/login');
const bookingRouter = require('./routes/booking');

app.use('/user', registrationRouter);
app.use('/login', loginRouter);
app.use('/book', bookingRouter);


app.listen(PORT, () => console.log(`Server is running on port: ${PORT}`));

