"use strict";

const db = require("../db.js");
const { BadRequestError, NotFoundError } = require("../expressError");
const Job = require("./job.js");
const {
    commonBeforeAll,
    commonBeforeEach,
    commonAfterEach,
    commonAfterAll,
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);


/************************************** create */


describe("create", function() {
    const newJob = {
        title: "new job",
        equity: "0.05",
        salary: 50000,
        companyHandle: "c1",
    };

    test("works", async function() {
        let job = await Job.create(newJob);
        expect(job.title).toEqual(newJob.title);

        const result = await db.query(
            `SELECT id, title, salary, equity, company_handle as "companyHandle"
           FROM jobs
           WHERE id = ${job.id}`);
        expect(result.rows).toEqual([{
            id: job.id,
            title: "new job",
            equity: "0.05",
            salary: 50000,
            companyHandle: "c1"
        }, ]);
    });
    test("bad request with dupe", async function() {
        try {
            await Job.create(newJob);
            await Job.create(newJob);
            fail();
        } catch (err) {
            expect(err instanceof BadRequestError).toBeTruthy();
        }
    });
});

/************************************** findAll */
describe("findAll", function() {
    test("works: no filter", async function() {
        let jobs = await Job.findAll();
        expect(jobs).toEqual([{
                id: jobs[0].id,
                title: "j1",
                equity: "0.05",
                salary: 50000,
                companyHandle: "c1",
            },
            {
                id: jobs[1].id,
                title: "j2",
                equity: "0.01",
                salary: 40000,
                companyHandle: "c2",
            },
            {
                id: jobs[2].id,
                title: "j3",
                equity: "0.09",
                salary: 30000,
                companyHandle: "c3",
            },
        ]);
    });
});

/************************************** get */

describe("get", function() {
    test("works", async function() {
        let jobs = await Job.findAll();
        let job = await Job.get(jobs[0].id);
        expect(job).toEqual({
            id: jobs[0].id,
            title: "j1",
            equity: "0.05",
            salary: 50000,
            companyHandle: "c1"
        });
    });

    test("not found if no such company", async function() {
        try {
            await Job.get(1);
            fail();
        } catch (err) {
            expect(err instanceof NotFoundError).toBeTruthy();
        }
    });
});