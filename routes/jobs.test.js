"use strict";

const request = require("supertest");

const db = require("../db");
const app = require("../app");

const {
    commonBeforeAll,
    commonBeforeEach,
    commonAfterEach,
    commonAfterAll,
    u1Token,
} = require("./_testCommon");

beforeAll(commonBeforeAll); //Make all the users and company data
beforeEach(commonBeforeEach); //Begin?
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** POST /companies */

describe("POST /jobs", function() {
    const newJob = {
        title: "new job",
        equity: 0.05,
        salary: 50000,
        companyHandle: "c1",
    };

    test("ok for users", async function() {
        const resp = await request(app)
            .post("/jobs")
            .send(newJob)
            .set("authorization", `Bearer ${u1Token}`);
        expect(resp.statusCode).toEqual(201);
        expect(resp.body).toEqual({
            job: {
                id: resp.body.job.id,
                title: "new job",
                equity: "0.05",
                salary: 50000,
                companyHandle: "c1",
            },
        });
    });


    test("bad request with missing data", async function() {
        const resp = await request(app)
            .post("/jobs")
            .send({
                title: "new",
                salary: 10,
            })
            .set("authorization", `Bearer ${u1Token}`);
        expect(resp.statusCode).toEqual(400);
    });

    test("bad request with invalid data", async function() {
        const resp = await request(app)
            .post("/companies")
            .send({
                salary: "12312",
                ...newJob
            })
            .set("authorization", `Bearer ${u1Token}`);
        expect(resp.statusCode).toEqual(400);
    });
});

/************************************** GET /companies */

describe("GET /jobs", function() {
    test("ok for anon", async function() {
        const resp = await request(app).get("/jobs")
        expect(resp.body).toEqual({
            jobs: [{
                    id: resp.body.jobs[0].id,
                    title: "j1",
                    equity: "0.05",
                    salary: 50000,
                    companyHandle: "c1"
                },
                {
                    id: resp.body.jobs[1].id,
                    title: "j2",
                    equity: "0.05",
                    salary: 50000,
                    companyHandle: "c2"
                },
                {
                    id: resp.body.jobs[2].id,
                    title: "j3",
                    equity: "0.05",
                    salary: 50000,
                    companyHandle: "c3"
                }
            ],
        });
    });

    test("fails: test next() handler", async function() {
        // there's no normal failure event which will cause this route to fail ---
        // thus making it hard to test that the error-handler works with it. This
        // should cause an error, all right :)
        await db.query("DROP TABLE jobs CASCADE");
        const resp = await request(app)
            .get("/jobs")
            .set("authorization", `Bearer ${u1Token}`);
        expect(resp.statusCode).toEqual(500);
    });
});

/************************************** GET /companies/:handle */

describe("GET /jobs/:id", function() {
    test("works for anon", async function() {
        // getting all the jobs ids
        /* resp1 = {jobs:[ 
                {4, title, equity, company_handle},
                {5, title, equity, company_handle},
                {6, title, equity, company_handle}
            ]}
        */
        const resp1 = await request(app).get("/jobs")
        const jobs = resp1.body.jobs;
        //const resp = await request(app).get(`/jobs/1`)
        const resp = await request(app).get(`/jobs/${jobs[0].id}`)
        expect(resp.body).toEqual({
            job: {
                id: jobs[0].id,
                title: jobs[0].title,
                equity: jobs[0].equity,
                salary: jobs[0].salary,
                companyHandle: jobs[0].companyHandle
            }
        });
    });

    test("works for anon: company w/o jobs", async function() {
        const resp1 = await request(app).get("/jobs")
        const jobs = resp1.body.jobs;
        const resp = await request(app).get(`/jobs/${jobs[1].id}`);
        expect(resp.body).toEqual({
            job: {
                id: jobs[1].id,
                title: jobs[1].title,
                equity: jobs[1].equity,
                salary: jobs[1].salary,
                companyHandle: jobs[1].companyHandle
            }
        });
    });

    test("no job found", async function() {
        const resp = await request(app).get(`/jobs/10000000000`);
        expect(resp.statusCode).toEqual(404);
    });
});

/************************************** PATCH /jobs/:id */

describe("PATCH /jobs/:id", function() {
    test("works for users", async function() {
        const resp1 = await request(app).get("/jobs")
        const jobs = resp1.body.jobs;
        const resp = await request(app)
            .patch(`/jobs/${jobs[0].id}`)
            .send({
                title: "j1-new",
                equity: 0.01,
                salary: 100
            })
            .set("authorization", `Bearer ${u1Token}`);
        expect(resp.body).toEqual({
            job: {
                id: jobs[0].id,
                title: "j1-new",
                equity: "0.01",
                salary: 100,
                companyHandle: "c1"
            },
        });
    });

    test("unauth for anon", async function() {
        const resp1 = await request(app).get("/jobs")
        const jobs = resp1.body.jobs;
        const resp = await request(app)
            .patch(`/jobs/${jobs[0].id}`)
            .send({
                title: "j1-new",
                equity: 0.01,
                salary: 100
            });
        expect(resp.statusCode).toEqual(401);
    });

    test("No job found", async function() {
        const resp1 = await request(app).get("/jobs")
        const jobs = resp1.body.jobs;
        const resp = await request(app)
            .patch(`/jobs/100000000`)
            .send({
                title: "j1-new",
                equity: 0.01,
                salary: 100
            })
            .set("authorization", `Bearer ${u1Token}`);
        expect(resp.statusCode).toEqual(404);
    });

    test("bad request on companyHandle can't change attempt", async function() {
        const resp1 = await request(app).get("/jobs")
        const jobs = resp1.body.jobs;
        const resp = await request(app)
            .patch(`/jobs/${jobs[0].id}`)
            .send({
                companyHandle: "c1-new",
            })
            .set("authorization", `Bearer ${u1Token}`);
        expect(resp.statusCode).toEqual(400);
    });

    test("bad request on invalid data", async function() {
        const resp1 = await request(app).get("/jobs")
        const jobs = resp1.body.jobs;
        const resp = await request(app)
            .patch(`/jobs/${jobs[0].id}`)
            .send({
                equity: 100,
            })
            .set("authorization", `Bearer ${u1Token}`);
        expect(resp.statusCode).toEqual(400);
    });
});

// /************************************** DELETE /jobs/:id */

describe("DELETE /jobs/:id", function() {
    test("works for users", async function() {
        const resp1 = await request(app).get("/jobs")
        const jobs = resp1.body.jobs;
        console.log(jobs);
        const resp = await request(app)
            .delete(`/jobs/${jobs[0].id}`)
            .set("authorization", `Bearer ${u1Token}`);
        expect(resp.body).toEqual({
            deleted: `${jobs[0].id}`
        });
    });

    test("unauth for anon", async function() {
        const resp1 = await request(app).get("/jobs")
        const jobs = resp1.body.jobs;
        const resp = await request(app)
            .delete(`/jobs/${jobs[0].id}`);
        expect(resp.statusCode).toEqual(401);
    });

    test("not found for no such job", async function() {
        const resp = await request(app)
            .delete(`/jobs/10000`)
            .set("authorization", `Bearer ${u1Token}`);
        expect(resp.statusCode).toEqual(404);
    });
});