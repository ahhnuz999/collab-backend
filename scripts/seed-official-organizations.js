"use strict";

const mongoose = require("mongoose");
const { connectMongoDB } = require("../src/db/mongodb");
const { OrganizationModel } = require("../src/db/models");

const officialOrganizations = [
  {
    name: "Nepal Police",
    serviceCategory: "police",
    generalNumber: 100,
    status: "active",
  },
  {
    name: "Fire Brigade",
    serviceCategory: "fire_truck",
    generalNumber: 101,
    status: "active",
  },
  {
    name: "Ambulance Service",
    serviceCategory: "ambulance",
    generalNumber: 102,
    status: "active",
  },
];

async function seedOfficialOrganizations() {
  await connectMongoDB();

  for (const organization of officialOrganizations) {
    await OrganizationModel.findOneAndUpdate(
      { serviceCategory: organization.serviceCategory },
      {
        $setOnInsert: { name: organization.name },
        $set: {
          generalNumber: organization.generalNumber,
          status: organization.status,
        },
      },
      { new: true, upsert: true }
    );
  }

  const seeded = await OrganizationModel.find({
    serviceCategory: { $in: officialOrganizations.map((organization) => organization.serviceCategory) },
  })
    .select({ _id: 0, id: 1, name: 1, serviceCategory: 1, generalNumber: 1, status: 1 })
    .sort({ serviceCategory: 1 })
    .lean();

  console.log(JSON.stringify(seeded, null, 2));
}

seedOfficialOrganizations()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
