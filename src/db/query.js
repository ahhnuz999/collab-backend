"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.eq = eq;
exports.is = is;
exports.and = and;
exports.or = or;
exports.gte = gte;
exports.lte = lte;
exports.desc = desc;
function getFieldName(field) {
    return field.field;
}
function eq(field, value) {
    return { [getFieldName(field)]: value };
}
function is(field, value) {
    return eq(field, value);
}
function and(...filters) {
    const normalized = filters.filter(Boolean);
    return normalized.length === 1 ? normalized[0] : { $and: normalized };
}
function or(...filters) {
    const normalized = filters.filter(Boolean);
    return normalized.length === 1 ? normalized[0] : { $or: normalized };
}
function gte(field, value) {
    return { [getFieldName(field)]: { $gte: value } };
}
function lte(field, value) {
    return { [getFieldName(field)]: { $lte: value } };
}
function desc(field) {
    return { field: getFieldName(field), direction: -1 };
}
