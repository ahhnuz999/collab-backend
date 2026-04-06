"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createNearServiceProviders = exports.createServiceProvider = exports.capitalizeFirstLetter = void 0;
const schema_1 = require("../db/schema");
const db_1 = __importDefault(require("../db"));
const faker_1 = require("@faker-js/faker");
const capitalizeFirstLetter = (str) => {
    if (!str)
        return str;
    return str.charAt(0).toUpperCase() + str.slice(1);
};
exports.capitalizeFirstLetter = capitalizeFirstLetter;
const createServiceProvider = async (location) => {
    try {
        const randomOrganization = await db_1.default.query.organization.findFirst({});
        if (!randomOrganization) {
            throw new Error("No organization found");
        }
        const fakeData = {
            name: faker_1.faker.internet.username(),
            age: faker_1.faker.number.int({ min: 18, max: 65 }),
            email: faker_1.faker.internet.email(),
            phoneNumber: `98${Math.random().toString().slice(2, 11)}`,
            primaryAddress: faker_1.faker.location.streetAddress(),
            password: faker_1.faker.internet.password(),
            serviceType: randomOrganization.serviceCategory,
            isVerified: true,
            organizationId: randomOrganization.id,
            currentLocation: {
                latitude: location.latitude.toString(),
                longitude: location.longitude.toString(),
            },
            serviceStatus: "available",
        };
        console.log("Fake data", fakeData);
        const createdServiceProvider = await db_1.default
            .insert(schema_1.serviceProvider)
            .values({
            name: faker_1.faker.internet.username(),
            age: faker_1.faker.number.int({ min: 18, max: 65 }),
            email: faker_1.faker.internet.email(),
            phoneNumber: parseInt(`98${Math.random().toString().slice(2, 11)}`),
            primaryAddress: faker_1.faker.location.streetAddress(),
            password: faker_1.faker.internet.password(),
            serviceType: randomOrganization.serviceCategory,
            isVerified: true,
            organizationId: randomOrganization.id,
            currentLocation: {
                latitude: location.latitude.toString(),
                longitude: location.longitude.toString(),
            },
            serviceStatus: "available",
        })
            .returning({
            id: schema_1.serviceProvider.id,
            currentLocation: schema_1.serviceProvider.currentLocation,
            serviceStatus: schema_1.serviceProvider.serviceStatus,
        });
        console.log("Randomly created Service Provider", createdServiceProvider[0]);
        return createdServiceProvider;
    }
    catch (error) {
        console.log("Error creating service provider:", error);
        throw error;
    }
};
exports.createServiceProvider = createServiceProvider;
const createNearServiceProviders = async (destLocation, count) => {
    const createdServiceProviders = [];
    for (let i = 0; i < count; i++) {
        const distance = 0.04 + Math.random() * 0.01;
        const angle = Math.random() * 2 * Math.PI;
        const serviceProvider = await (0, exports.createServiceProvider)({
            latitude: destLocation.latitude + Math.sin(angle) * distance,
            longitude: destLocation.longitude + Math.cos(angle) * distance,
        });
        createdServiceProviders.push(serviceProvider);
    }
    return createdServiceProviders;
};
exports.createNearServiceProviders = createNearServiceProviders;
