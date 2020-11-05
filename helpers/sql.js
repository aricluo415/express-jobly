const { BadRequestError } = require("../expressError");

// THIS NEEDS SOME GREAT DOCUMENTATION.
/**
 * This function takes in data to update a row in the data base
 * it helps translate the keys to column names that the table 
 * in the database can understand. camelCase -> snake case for 
 * SQL injection. 
 * @param {firstName: string , lastName: string, age: integer} dataToUpdate 
 * @param {firstName: "first_name", lastName: "last_name", age="age"} jsToSql 
 */
function sqlForPartialUpdate(dataToUpdate, jsToSql) {
    /** keys = [firstName, lastName, age] */
    const keys = Object.keys(dataToUpdate);
    if (keys.length === 0) throw new BadRequestError("No data");

    // {firstName: 'Aliya', age: 32} => ['"first_name"=$1', '"age"=$2']
    /** jsToSql = {firstName: "first_name", lastName: "last_name", age="age"} */
    /** colName = firstName, lastName, age */
    /** idx = 0 , 1 , 2 */
    const cols = keys.map((colName, idx) =>
        `"${jsToSql[colName] || colName}"=$${idx + 1}`,
    );
    /** cols = ['"first_name"=$1', '"age"=$2'] */
    return {
        setCols: cols.join(", "),
        values: Object.values(dataToUpdate),
    };
}
/**
 * 
 * @param {query.params:} filters 
 * Checks the filters for keys of nameLike, maxEmployees, and minEmployees
 * returns SQL clause for WHERE if filters exist, otherwise returns empty string
 */
function sqlForFilters(filters) {
    const keys = Object.keys(filters);
    if (keys.length === 0) return '';

    // 5 > undefined => false
    if (filters.minEmployees > filters.maxEmployees) {
        throw new BadRequestError("Min cannot be greater than Max");
    }

    const sqlWhere = keys.map((filter) => {
        if (filter === 'nameLike') {
            return `LOWER(name) LIKE LOWER('%${filters.nameLike}%')`
        }
        if (filter === 'maxEmployees') {
            return `num_employees <= ${filters.maxEmployees}`
        }
        if (filter === 'minEmployees') {
            return `num_employees >= ${filters.minEmployees}`
        }
        throw new BadRequestError("Incorrect query parameter");
    });
    return "WHERE " + sqlWhere.join(' AND ');
}
module.exports = { sqlForPartialUpdate, sqlForFilters };