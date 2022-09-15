const express = require("express");
const app = express();

const cors = require("cors");
app.use(cors());

const bodyParser = require("body-parser");
app.use(bodyParser.json());

const knex = require("knex");

const db = knex({
  client: "pg",
  connection: {
    host: "127.0.0.1",

    port: 5432,
    user: "postgres",
    password: "test",
    database: "smart-brain",
  },
});

const database = {
  users: [
    {
      id: "123",

      name: "john",

      email: "j",
      password: "c",
      entries: 0,
      joined: new Date(),
    },
    {
      id: "124",
      name: "sally",
      email: "sally@gmail.com",
      password: "bananas",
      entries: 0,
      joined: new Date(),
    },
  ],
};

app.get("/", (req, res) => {
  res.send(database.users);
});

app.post("/signin", (req, res) => {
  db.select("email", "hash")
    .from("login")
    .where("email", "=", req.body.email)
    .then((data) => {
      let isValid = false;

      if (req.body.password === data[0].hash) {
        isValid = true;
      }

      if (isValid) {
        return db
          .select("*")
          .from("users")
          .where("email", "=", req.body.email)
          .then((user) => {
            res.json(user[0]);
          })
          .catch((err) => res.status(400).json("unable to get user"));
      } else {
        res.status(400).json("wrong password");
      }
    })

    .catch((err) => res.status(400).json("wrong email"));
});

app.post("/register", (req, res) => {
  const { email, name, password } = req.body;

  db.transaction((trx) => {
    trx
      .insert({
        hash: password,
        email: email,
      })
      .into("login")
      .returning("email")
      .then((loginEmail) => {
        return trx("users")
          .returning("*")
          .insert({
            email: loginEmail[0].email,
            name: name,
            joined: new Date(),
          })
          .then((user) => {
            res.json(user[0]);
          });
      })
      .then(trx.commit)
      .catch(trx.rollback);
  }).catch((err) => res.status(400).json("unable to register"));
});

app.get("/profile/:id", (req, res) => {
  const { id } = req.params;

  db.select("*")
    .from("users")
    .where({
      id: id,
    })

    .then((data) => {
      if (data.length) {
        res.json(data[0]);
      } else {
        res.status(400).json("not found");
      }
    })
    .catch((err) => res.status(400).json("error getting user"));
});

app.put("/image", (req, res) => {
  const { id } = req.body;

  db("users")
    .where("id", "=", id)
    .increment("entries", 1)
    .returning("entries")

    .then((data) => {
      res.json(data[0].entries);
    })
    .catch((err) => res.status(400).json("error getting entries"));
});

app.listen(3000);



