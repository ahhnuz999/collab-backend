"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createField = createField;
exports.createTable = createTable;
exports.getTableMetadata = getTableMetadata;
const tableMetadata = new WeakMap();
function createField(table, field) {
    return {
        __kind: "field",
        table,
        field,
    };
}
function createTable(name, model, fields) {
    const table = {};
    Object.defineProperty(table, "__kind", {
        value: "table",
        enumerable: false,
    });
    for (const field of fields) {
        Object.defineProperty(table, field, {
            value: createField(name, field),
            enumerable: true,
            writable: false,
        });
    }
    tableMetadata.set(table, { name, model, fields });
    return table;
}
function getTableMetadata(table) {
    const metadata = tableMetadata.get(table);
    if (!metadata) {
        throw new Error("Unknown table metadata");
    }
    return metadata;
}
