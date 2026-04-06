"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateOrganization = exports.deleteOrganization = exports.getOrganizationById = exports.getAllOrganizations = exports.createOrganization = void 0;
const db_1 = __importDefault(require("../db"));
const schema_1 = require("../db/schema");
const ApiError_1 = __importDefault(require("../utils/api/ApiError"));
const ApiResponse_1 = __importDefault(require("../utils/api/ApiResponse"));
const asyncHandler_1 = require("../utils/api/asyncHandler");
const query_1 = require("../db/query");
const createOrganization = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const parsedValues = schema_1.newOrganizationSchema.safeParse(req.body);
    if (!parsedValues.success) {
        const validationError = new ApiError_1.default(400, "Error validating data", parsedValues.error.errors.map((error) => `${error.path[0]} : ${error.message} `));
        return res.status(400).json(validationError);
    }
    const existingOrganization = await db_1.default.query.organization.findFirst({
        where: (0, query_1.and)((0, query_1.eq)(schema_1.organization.name, parsedValues.data.name), (0, query_1.eq)(schema_1.organization.serviceCategory, parsedValues.data.serviceCategory)),
    });
    if (existingOrganization) {
        throw new ApiError_1.default(400, "Organization already exists");
    }
    const newOrganization = await db_1.default
        .insert(schema_1.organization)
        .values(parsedValues.data)
        .returning({
        id: schema_1.organization.id,
        name: schema_1.organization.name,
        serviceCategory: schema_1.organization.serviceCategory,
        generalNumber: schema_1.organization.generalNumber,
    });
    if (!newOrganization) {
        throw new ApiError_1.default(500, "Error creating organization");
    }
    res.status(201).json(new ApiResponse_1.default(201, "Organization created", {
        organization: newOrganization[0],
    }));
});
exports.createOrganization = createOrganization;
const getAllOrganizations = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const loggedInUser = req.user;
    if (!loggedInUser || loggedInUser.role !== "admin" || !loggedInUser.id) {
        throw new ApiError_1.default(401, "Unauthorized to perform this action");
    }
    const organizations = await db_1.default.query.organization.findMany();
    res
        .status(200)
        .json(new ApiResponse_1.default(200, "Organizations retrieved", organizations));
});
exports.getAllOrganizations = getAllOrganizations;
const getOrganizationById = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const loggedInUser = req.user;
    if (!loggedInUser || !loggedInUser.id) {
        throw new ApiError_1.default(401, "Unauthorized to perform this action");
    }
    const organizationId = req.params.id;
    const organizationDetails = await db_1.default.query.organization.findFirst({
        where: (0, query_1.eq)(schema_1.organization.id, organizationId),
    });
    if (!organizationDetails) {
        throw new ApiError_1.default(404, "Organization not found");
    }
    res
        .status(200)
        .json(new ApiResponse_1.default(200, "Organization details retrieved", organizationDetails));
});
exports.getOrganizationById = getOrganizationById;
const deleteOrganization = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const loggedInUser = req.user;
    if (!loggedInUser || loggedInUser.role !== "admin" || !loggedInUser.id) {
        throw new ApiError_1.default(401, "Unauthorized to perform this action");
    }
    const organizationId = req.params.id;
    const organizationDetails = await db_1.default.query.organization.findFirst({
        where: (0, query_1.eq)(schema_1.organization.id, organizationId),
    });
    if (!organizationDetails) {
        throw new ApiError_1.default(404, "Organization not found");
    }
    const deletedOrganization = await db_1.default
        .delete(schema_1.organization)
        .where((0, query_1.eq)(schema_1.organization.id, organizationId))
        .returning({
        id: schema_1.organization.id,
        name: schema_1.organization.name,
        serviceCategory: schema_1.organization.serviceCategory,
        generalNumber: schema_1.organization.generalNumber,
    });
    if (!deletedOrganization) {
        throw new ApiError_1.default(500, "Error deleting organization");
    }
    res.status(200).json(new ApiResponse_1.default(200, "Organization deleted", {
        organization: deletedOrganization[0],
    }));
});
exports.deleteOrganization = deleteOrganization;
const updateOrganization = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const loggedInUser = req.user;
    if (!loggedInUser || loggedInUser.role !== "admin" || !loggedInUser.id) {
        throw new ApiError_1.default(401, "Unauthorized to perform this action");
    }
    const organizationId = req.params.id;
    const organizationDetails = await db_1.default.query.organization.findFirst({
        where: (0, query_1.eq)(schema_1.organization.id, organizationId),
    });
    if (!organizationDetails) {
        throw new ApiError_1.default(404, "Organization not found");
    }
    const updateData = req.body;
    if (Object.keys(updateData).length === 0) {
        throw new ApiError_1.default(400, "No data to update");
    }
    const invalidKeys = Object.keys(updateData).filter((key) => !Object.keys(schema_1.organization).includes(key));
    if (invalidKeys.length > 0) {
        throw new ApiError_1.default(400, `Invalid data to update. Invalid keys: ${invalidKeys}`);
    }
    const updatedOrganization = await db_1.default
        .update(schema_1.organization)
        .set(updateData)
        .where((0, query_1.eq)(schema_1.organization.id, organizationId))
        .returning({
        id: schema_1.organization.id,
        name: schema_1.organization.name,
        serviceCategory: schema_1.organization.serviceCategory,
        generalNumber: schema_1.organization.generalNumber,
    });
    if (!updatedOrganization) {
        throw new ApiError_1.default(500, "Error updating organization");
    }
    res.status(200).json(new ApiResponse_1.default(200, "Organization updated", {
        organization: updatedOrganization[0],
    }));
});
exports.updateOrganization = updateOrganization;
