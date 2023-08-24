import "../config/db";
import express from "express";
import bodyParser from "body-parser";
import UserRouter from "../api/user";
import cors from "cors";

const app = express();

app.use(bodyParser.json());
const PORT = 3000;

const corsOptions = {
  origin: "http://localhost:5173",
  methods: "GET,POST,DELETE",
  allowedHeaders: "Content-Type",
};

app.use(cors(corsOptions));

app.use("/user", UserRouter);

app.listen(PORT, () => {
  console.log("Server is listening on port 5173");
});
