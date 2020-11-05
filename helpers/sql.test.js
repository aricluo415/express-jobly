const { sqlForPartialUpdate, sqlForFilters } = require("./sql");

// ********** test for sqlForPartialUpdate

describe("sqlForPartialUpdate", function() {
    test("works", function() {
        const dataToUpdate = { firstName: 'Test', lastName: 'Tester', age: 32 }
        const jsToSql = { firstName: "first_name", lastName: "last_name", age: "age" }

        const sqlUpdate = sqlForPartialUpdate(dataToUpdate, jsToSql)

        expect(sqlUpdate).toEqual({
            setCols: "\"first_name\"=$1, \"last_name\"=$2, \"age\"=$3",
            values: ["Test", "Tester", 32]
        });
    });
});

// ********** test sqlForFilters

describe("sqlForFilters", function() {
    test("checking filters for 3 queries", function() {
        //const filters = "?name=davis&minEmployee=20&maxEmployee=50";
        const filters = {
            nameLike: "davis",
            minEmployees: 20,
            maxEmployees: 50
        }
        const sqlFilter = sqlForFilters(filters)
        expect(sqlFilter).toEqual(
            "WHERE LOWER(name) LIKE LOWER('%davis%') AND num_employees >= 20 AND num_employees <= 50"
        );
    });
    test("checking filters for 2 queries", function() {
        const filters = {
            minEmployees: 20,
            maxEmployees: 50
        }
        const sqlFilter = sqlForFilters(filters)
        expect(sqlFilter).toEqual(
            "WHERE num_employees >= 20 AND num_employees <= 50"
        );
    });
    test("checking filters for 1 queries", function() {
        const filters = {
            minEmployees: 20,
        }
        const sqlFilter = sqlForFilters(filters)
        expect(sqlFilter).toEqual(
            "WHERE num_employees >= 20"
        );
    });
    test("checking filters for 0 queries", function() {
        const filters = {}
        const sqlFilter = sqlForFilters(filters)
        expect(sqlFilter).toEqual('');
    });
});

// ********** test for checking queries for sqlForFilters