"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const schema_1 = require("./schema");
const helpers_1 = require("./schema/helpers");
function normalizeDoc(doc) {
    if (!doc)
        return null;
    if (Array.isArray(doc)) {
        return doc.map((item) => normalizeDoc(item));
    }
    if (typeof doc !== "object") {
        return doc;
    }
    const record = { ...doc };
    delete record._id;
    delete record.__v;
    return record;
}
function toProjection(columns) {
    if (!columns || Object.keys(columns).length === 0) {
        return undefined;
    }
    const projection = {};
    const inclusionKeys = Object.entries(columns)
        .filter(([, include]) => include)
        .map(([key]) => key);
    if (inclusionKeys.length > 0) {
        for (const key of inclusionKeys) {
            projection[key] = 1;
        }
        projection._id = 0;
        return projection;
    }
    for (const [key, include] of Object.entries(columns)) {
        if (!include) {
            projection[key] = 0;
        }
    }
    projection._id = 0;
    return projection;
}
function toSort(orderBy) {
    if (!orderBy?.length) {
        return undefined;
    }
    return orderBy.reduce((acc, item) => {
        acc[item.field] = item.direction;
        return acc;
    }, {});
}
function pickSelection(docs, selection) {
    const normalized = normalizeDoc(docs);
    if (!selection) {
        return normalized;
    }
    return normalized.map((doc) => {
        const selected = {};
        for (const [alias, field] of Object.entries(selection)) {
            selected[alias] = doc[field.field];
        }
        return selected;
    });
}
async function runFind(model, options = {}, first = false) {
    let query = first
        ? model.findOne(options.where ?? {}, toProjection(options.columns))
        : model.find(options.where ?? {}, toProjection(options.columns));
    const sort = toSort(options.orderBy);
    if (sort) {
        query = query.sort(sort);
    }
    if (!first && options.limit) {
        query = query.limit(options.limit);
    }
    const result = await query.lean();
    return normalizeDoc(result);
}
class InsertBuilder {
    table;
    payload = {};
    constructor(table) {
        this.table = table;
    }
    values(payload) {
        this.payload = payload;
        return this;
    }
    async returning(selection) {
        const { model } = (0, helpers_1.getTableMetadata)(this.table);
        const created = await model.create(this.payload);
        const docs = Array.isArray(created) ? created : [created];
        return pickSelection(docs.map((doc) => doc.toObject()), selection);
    }
}
class UpdateBuilder {
    table;
    updateData = {};
    filter = {};
    constructor(table) {
        this.table = table;
    }
    set(data) {
        this.updateData = data;
        return this;
    }
    where(filter) {
        this.filter = filter;
        return this;
    }
    then(onfulfilled, onrejected) {
        return this.exec().then(onfulfilled, onrejected);
    }
    async exec() {
        const { model } = (0, helpers_1.getTableMetadata)(this.table);
        const ids = (await model.find(this.filter).select({ id: 1, _id: 0 }).lean()).map((doc) => doc.id);
        if (!ids.length) {
            return { matchedCount: 0, modifiedCount: 0 };
        }
        return model.updateMany({ id: { $in: ids } }, { ...this.updateData, updatedAt: new Date() });
    }
    async returning(selection) {
        const { model } = (0, helpers_1.getTableMetadata)(this.table);
        const ids = (await model.find(this.filter).select({ id: 1, _id: 0 }).lean()).map((doc) => doc.id);
        if (!ids.length) {
            return [];
        }
        await model.updateMany({ id: { $in: ids } }, { ...this.updateData, updatedAt: new Date() });
        const docs = await model.find({ id: { $in: ids } }).lean();
        return pickSelection(docs, selection);
    }
}
class DeleteBuilder {
    table;
    filter = {};
    constructor(table) {
        this.table = table;
    }
    where(filter) {
        this.filter = filter;
        return this;
    }
    async returning(selection) {
        const { model } = (0, helpers_1.getTableMetadata)(this.table);
        const docs = await model.find(this.filter).lean();
        if (!docs.length) {
            return [];
        }
        const ids = docs.map((doc) => doc.id);
        await model.deleteMany({ id: { $in: ids } });
        return pickSelection(docs, selection);
    }
}
class SelectBuilder {
    table;
    filter = {};
    sorts = [];
    from(table) {
        this.table = table;
        return this;
    }
    where(filter) {
        this.filter = filter;
        return this;
    }
    orderBy(...sorts) {
        this.sorts = sorts;
        return this;
    }
    then(onfulfilled, onrejected) {
        return this.exec().then(onfulfilled, onrejected);
    }
    async exec() {
        if (!this.table) {
            throw new Error("No table selected");
        }
        const { model } = (0, helpers_1.getTableMetadata)(this.table);
        let query = model.find(this.filter);
        const sort = toSort(this.sorts);
        if (sort) {
            query = query.sort(sort);
        }
        const docs = await query.lean();
        return normalizeDoc(docs);
    }
}
function buildQuery(table) {
    const { model } = (0, helpers_1.getTableMetadata)(table);
    return {
        findFirst: (options) => runFind(model, options, true),
        findMany: (options) => runFind(model, options, false),
    };
}
const db = {
    query: {
        user: buildQuery(schema_1.user),
        serviceProvider: buildQuery(schema_1.serviceProvider),
        organization: buildQuery(schema_1.organization),
        emergencyRequest: buildQuery(schema_1.emergencyRequest),
        emergencyResponse: buildQuery(schema_1.emergencyResponse),
        emergencyContact: buildQuery(schema_1.emergencyContact),
        feedback: buildQuery(schema_1.feedback),
        notifications: buildQuery(schema_1.notifications),
    },
    insert: (table) => new InsertBuilder(table),
    update: (table) => new UpdateBuilder(table),
    delete: (table) => new DeleteBuilder(table),
    select: () => new SelectBuilder(),
    transaction: async (callback) => {
        return callback(db);
    },
};
exports.default = db;
