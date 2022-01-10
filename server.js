const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");
const app = express();
const corsOptions = {
  origin: ["http://localhost:3000", "http://81.184.28.86", "https://miprimercurriculum.herokuapp.com"]
};
//rama de jesus
app.use(cors(corsOptions));
const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "miprimercurriculum",
  password: "postgres",
  port: 5432,
  ssl: {    /* <----- Add SSL option */
    rejectUnauthorized: false,
  }
});
app.use(express.json());
// Login
app.post("/login", function (req, res) {
  const userEmail = req.body.email;
  const userPassword = req.body.password;
  pool.query(
    `SELECT name, email FROM users where email='${userEmail}' AND password='${userPassword}'`,
    (error, result) => {
      result.rows.length === 0
        ? res.status(400).send({ error: "Usuario no existe!" })
        : res.status(200).json(result.rows);
    }
  );
});
//Register
app.post("/register", function (req, res) {
  const userEmail = req.body.email;
  const userPassword = req.body.password;
  const userName = req.body.name;
  const userLastName = req.body.lastName;
  pool.query(
    `SELECT email FROM users where email='${userEmail}'`,
    (error, result) => {
      result.rows.length === 0
        ? pool.query(
            `INSERT INTO users (email,password,name,last_name) VALUES ('${userEmail}','${userPassword}','${userName}','${userLastName}')`,
            (error, result) => {
              res.status(200).send({
                email: userEmail,
                password: userPassword,
                name: userName,
                lastName: userLastName,
              });
            }
          )
        : res.status(400).send({ error: "Usuario ya existe!" });
    }
  );
});
//Skills
app.get("/skills", function (req, res) {
    pool
      .query("SELECT * FROM skills")
      .then((result) => res.json(result.rows))
      .catch((e) => console.error(e));
});
//Create Curriculum
app.post("/createcv", function (req, res) {
  console.log(req.body)
  const cvName = req.body.name;
  const cvDescription = req.body.description;
  const cvTitleProject = req.body.titleproject;
  const cvDesProject = req.body.descriptionproject;
  const cvLinkProject = req.body.linkproject;
  const cvSkill = req.body.skill;
  const cvEmail = req.body.cvemail;
  pool.query(
      `SELECT email FROM users where email='${cvEmail}'`,
      (error, result) => {
          result.rows.length === 1
              ? pool.query(
                  `INSERT INTO curriculum (cv_name,description_name,user_id) VALUES ('${cvName}','${cvDescription}',(SELECT id FROM users WHERE email='${cvEmail}'));
            INSERT INTO projects (title,description,link) VALUES ('${cvTitleProject}','${cvDesProject}','${cvLinkProject}');
            INSERT INTO curriculum_project (project_id,curriculum_id) VALUES ((SELECT id FROM projects WHERE link='${cvLinkProject}'),(SELECT id FROM curriculum WHERE cv_name='${cvName}'));`,
                  (error, result) => {
                    cvSkill.map(skill => {pool.query(`INSERT INTO curriculum_skills (skill_id,curriculum_id) VALUES ((SELECT id FROM skills WHERE sk_name='${skill}'),(SELECT id FROM curriculum WHERE cv_name='${cvName}'))`); return skill}).length >= cvSkill.length ? res.status(200).send({agregado:"agregado"}):console.log("no agregado")
                  }
              )
              : res.status(400).send({ error: "Usuario no existe!" });
      }
  );
});


app.get("/cvlist/:account", function (req, res) {
  const cvEmail = req.params.account;
  console.log("cvEmail",cvEmail)
  pool
    .query(`SELECT cv_name,id FROM curriculum where user_id=(SELECT id FROM users WHERE email='${cvEmail}')`)
    .then((result) => res.json(result.rows))
    .catch((e) => console.error(e));
});
app.get("/curriculum/:id", function (req, res) {
  const cvid = req.params.id;
  pool
    .query(`select users.name,users.last_name,users.email,curriculum.cv_name,curriculum.description_name,projects.title,projects.description,projects.link,skills.sk_name from users inner join curriculum on curriculum.user_id=users.id    inner join curriculum_project on curriculum_project.curriculum_id=curriculum.id inner join projects on projects.id=curriculum_project.project_id inner join curriculum_skills on curriculum_skills.curriculum_id=curriculum.id inner join skills on skills.id=curriculum_skills.skill_id where curriculum.id=${cvid}`)
    .then((result) => res.json(result.rows))
    .catch((e) => console.error(e));
});
const host = '0.0.0.0';
const port = process.env.PORT || 3001;
app.listen(port, host, () => console.log(`Server is running on PORT ${port}`));