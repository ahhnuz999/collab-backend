"use strict";

const mongoose = require("mongoose");
const { connectMongoDB } = require("../src/db/mongodb");
const { EmergencyRequestModel, UserModel, UserRequestHistoryModel } = require("../src/db/models");
const { resolveLocationName } = require("../src/services/user-history.service");

async function backfillLocationNames() {
  await connectMongoDB();

  const requests = await EmergencyRequestModel.find({
    $or: [{ locationName: { $exists: false } }, { locationName: "" }, { locationName: null }],
  }).lean();

  let updated = 0;

  for (const request of requests) {
    const user = await UserModel.findOne({ id: request.userId }).select({ primaryAddress: 1, _id: 0 }).lean();
    const locationName = (await resolveLocationName(request.location).catch(() => "")) || user?.primaryAddress || "";

    if (!locationName) {
      continue;
    }

    await EmergencyRequestModel.updateOne({ id: request.id }, { locationName });
    await UserRequestHistoryModel.updateOne({ emergencyRequestId: request.id }, { locationName });
    updated += 1;
  }

  console.log(`Backfilled location names: ${updated}/${requests.length}`);
}

backfillLocationNames()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
