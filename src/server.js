import "../config/db";
import express from "express";
import bodyParser from "body-parser";
import UserRouter from "../api/user";
import cors from "cors";

const app = express();

app.use(bodyParser.json());
const PORT = 3000;

const corsOptions = {
  origin: "https://front-end-umber-sigma.vercel.app",
  methods: "GET,POST",
  allowedHeaders: "Content-Type",
};

app.use(cors(corsOptions));

app.use("/user", UserRouter);

app.get("/", (req, res) => {
  res.send("Hello World");
});

app.listen(PORT, () => {
  console.log(
    `Server is listening on port: https://front-end-two-weld.vercel.app`
  );
});
