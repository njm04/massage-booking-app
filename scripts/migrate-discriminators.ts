import mongoose from "mongoose";
import "../startup/env.js";
import { User } from "../models/user.model.js";
import { UserType } from "../models/userType.model.js";
import { getConfigValue } from "../startup/env.js";

const migrateDiscriminators = async () => {
  const databaseUri = getConfigValue("ATLAS_DB", "booking_ATLAS_DB");
  if (!databaseUri) {
    throw new Error("MongoDB connection string is not configured");
  }

  await mongoose.connect(databaseUri);

  try {
    console.log({
      database: mongoose.connection.name,
      collection: User.collection.name,
    });

    const userTypes = await UserType.find({
      name: { $in: ["therapist", "customer"] },
    }).select("_id name");
    const therapistType = userTypes.find(({ name }) => name === "therapist");
    const customerType = userTypes.find(({ name }) => name === "customer");
    if (!therapistType || !customerType) {
      throw new Error("Therapist and customer user types are required");
    }

    const usersCollection = User.collection;
    const migrateType = async (
      name: "therapist" | "customer",
      typeId: mongoose.Types.ObjectId,
    ) => {
      const filter = {
        kind: { $exists: false },
        $or: [{ userType: typeId }, { __t: name }],
      };

      const result = await usersCollection.updateMany(filter, {
        $set: { kind: name },
        $unset: { __t: "" },
      });

      return {
        matched: result.matchedCount,
        modified: result.modifiedCount,
      };
    };

    const therapistResult = await migrateType("therapist", therapistType._id);
    const customerResult = await migrateType("customer", customerType._id);

    const availabilityResult = await usersCollection.updateMany(
      {
        userType: therapistType._id,
        kind: "therapist",
        isAvailable: { $exists: false },
      },
      { $set: { isAvailable: true } },
    );

    const reservationsResult = await usersCollection.updateMany(
      {
        userType: therapistType._id,
        kind: "therapist",
        reservations: { $exists: false },
      },
      { $set: { reservations: [] } },
    );

    console.log({
      therapistMatchedWithoutDiscriminator: therapistResult.matched,
      therapistModifiedDiscriminators: therapistResult.modified,
      customerMatchedWithoutDiscriminator: customerResult.matched,
      customerModifiedDiscriminators: customerResult.modified,
      initializedAvailability: availabilityResult.modifiedCount,
      initializedReservations: reservationsResult.modifiedCount,
    });
  } finally {
    await mongoose.disconnect();
  }
};

migrateDiscriminators().catch((error: unknown) => {
  console.error("Discriminator migration failed", error);
  process.exitCode = 1;
});