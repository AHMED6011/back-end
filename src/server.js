import "../config/db";
import express from "express";
import bodyParser from "body-parser";
import UserRouter from "../api/user";
import cors from "cors";

const app = express();

app.use(bodyParser.json());

const corsOptions = {
  origin: "https://riad-front-end.vercel.app",
  methods: "GET,POST",
  allowedHeaders: "Content-Type",
};

app.use(cors(corsOptions));

app.use("/api", UserRouter);

const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
  res.send("Hello World");
});

app.listen(PORT, () => {
  console.log(`Server is listening on port: ${PORT}`);
});
