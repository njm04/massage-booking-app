const CronJob = require("cron").CronJob;
const winston = require("winston");
const { Booking } = require("../models/booking.model");

module.exports = () => {
  const job = new CronJob("0 0 * * *", async () => {
    winston.info("You will see this message everyday at midnight");
    const result = await Booking.updateMany(
      {
        isDeleted: 0,
        date: { $lt: Date.now() },
      },
      { isDeleted: 1 }
    );

    console.log(result.nModified);
  });
  job.start();
};
