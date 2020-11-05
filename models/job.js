const db = require("../db");
const { BadRequestError, NotFoundError } = require("../expressError");
const { sqlForPartialUpdate, sqlForFilters } = require("../helpers/sql");

/** Related functions for companies. */

class Job {
    // CREATE TABLE jobs (
    //   id SERIAL PRIMARY KEY,
    //   title TEXT NOT NULL,
    //   salary INTEGER CHECK (salary >= 0),
    //   equity NUMERIC CHECK (equity <= 1.0),
    //   company_handle VARCHAR(25) NOT NULL
    //     REFERENCES companies ON DELETE CASCADE
    // );
    /** Create a Job (from data), update db, return new company data.
     *
     * data should be { title, salary, equity, company_handle }
     *
     * Returns { title, salary, equity, company_handle }
     *
     * Throws BadRequestError if Job is already in database.
     * */

    static async create({ title, salary, equity, companyHandle }) {
        const companyCheck = await db.query(
            `SELECT handle
           FROM companies
           WHERE handle = LOWER($1);`, [companyHandle]);
        if (!companyCheck.rows[0]) {
            throw new BadRequestError(`Company does not exist: ${companyHandle}`);
        }

        const duplicateJobCheck = await db.query(
            `SELECT title
            FROM jobs
            WHERE LOWER(title) = LOWER($1);`, [title]
        )
        if (duplicateJobCheck.rows[0]) {
            throw new BadRequestError(`Job with the title already exists: ${title}`);
        }

        const result = await db.query(
            `INSERT INTO jobs
            (title, salary, equity, company_handle)
            VALUES ($1, $2, $3, $4)
            RETURNING id, title, salary, equity, company_handle AS "companyHandle"`, [title, salary, equity, companyHandle],
        );

        const job = result.rows[0];
        return job;
    }

    /** Find all jobs.
     *
     * Returns [{ title, salary, equity, company_handle }, ...]
     * */
    // WHERE title LIKE "%engineer%"
    static async findAll() {

        const jobsRes = await db.query(
            `SELECT id, title, salary, equity, company_handle AS "companyHandle"
           FROM jobs
           ORDER BY title`);

        return jobsRes.rows;
    }

    /** Given a job title, return data about job.
     *
     * Returns { title, salary, equity, company_handle }
     *   where jobs is [{ id, title, salary, equity, company_handle }, ...]
     *
     * Throws NotFoundError if not found.
     **/

    static async get(id) {
        const jobRes = await db.query(
            `SELECT id, title, salary, equity, company_handle AS "companyHandle"
           FROM jobs
           WHERE id = $1`, [id]);

        const job = jobRes.rows[0];

        if (!job) throw new NotFoundError(`Invalid job id: ${id}`);

        return job;
    }

    /** Update job data with `data`.
     *
     * This is a "partial update" --- it's fine if data doesn't contain all the
     * fields; this only changes provided ones.
     *
     * Data can include: {title, salary, equity}
     *
     * Returns {title, salary, equity}
     *
     * Throws NotFoundError if not found.
     */

    // camelCase is for the input at the JSON body when the user passes the information, snakecase is for sql side syntax

    static async update(id, data) {
        const { setCols, values } = sqlForPartialUpdate(
            data, {
                title: "title",
                salary: "salary",
                equity: "equity"
            });
        const idVarIdx = "$" + (values.length + 1);

        const querySql = `UPDATE jobs 
                      SET ${setCols} 
                      WHERE id = ${idVarIdx} 
                      RETURNING id, title, salary, equity, company_handle AS "companyHandle"`;
        const result = await db.query(querySql, [...values, id]);
        const job = result.rows[0];

        if (!job) throw new NotFoundError(`No job found with the id: ${id}`);

        return job;
    }

    /** Delete given job from database; returns undefined.
     *
     * Throws NotFoundError if job not found.
     **/

    static async remove(id) {
        const result = await db.query(
            `DELETE
           FROM jobs
           WHERE id = $1
           RETURNING id`, [id]);
        const job = result.rows[0];

        if (!job) throw new NotFoundError(`No job found with this name: ${job}`);
    }
}


module.exports = Job;