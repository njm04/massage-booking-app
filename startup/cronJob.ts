import { CronJob } from "cron";
import winston from "winston";
import { Booking } from "../models/booking.model.js";

export default () => {
  const job = new CronJob("0 0 * * *", async () => {
    winston.info("You will see this message everyday at midnight");
    const result = await Booking.updateMany(
      {
        isDeleted: 0,
        date: { $lt: Date.now() },
      },
      { isDeleted: 1 },
    );

    console.log((result as any).modifiedCount ?? (result as any).nModified);
  });
  job.start();
};
