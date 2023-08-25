import "../config/db";
import express from "express";
import bodyParser from "body-parser";
import UserRouter from "../api/user";
import cors from "cors";

const app = express();

app.use(bodyParser.json());
const PORT = 3000;

const corsOptions = {
  origin: "https://ahmed6011.github.io/back-end",
  methods: "GET,POST",
  allowedHeaders: "Content-Type",
};

app.use(cors(corsOptions));

app.use("/user", UserRouter);

app.listen(PORT, () => {
  console.log("Server is listening on port 5173");
});
