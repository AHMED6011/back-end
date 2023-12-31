import express from "express";
import User from "./../models/User";
import PasswordReset from "./../models/PasswordReset";
import { v4 as uuidv4 } from "uuid";
import nodemailer from "nodemailer";

const router = express.Router();

// env variables
require("dotenv").config();

let transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  service: "gmail",
  auth: {
    user: process.env.AUTH_EMAIL,
    pass: process.env.AUTH_PASS,
  },
});

transporter.verify((error, success) => {
  if (error) {
    console.log(error);
  } else {
    console.log("Ready for messages");
    console.log(success);
  }
});

router.post("/signup", (req, res) => {
  let { name, email, password, expiryDate } = req.body;

  name = name.trim();
  email = email.trim();
  password = password.trim();
  expiryDate = expiryDate;

  if (name == "" || email == "" || password == "") {
    res.json({
      status: "FAILED",
      message: "Empty input fields!",
    });
  } else if (!/^[a-zA-Z ]*$/.test(name)) {
    res.json({
      status: "FAILED",
      message: "Invalid name entered",
    });
  } else if (!/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(email)) {
    res.json({
      status: "FAILED",
      message: "Invalid email entered",
    });
  } else if (password.length < 8) {
    res.json({
      status: "FAILED",
      message: "Password is too short",
    });
  } else {
    User.find({ email })
      .then((result) => {
        if (result.length) {
          res.json({
            status: "FAILED",
            message: "User with the provided email already exists",
          });
        } else {
          const newUser = new User({
            name,
            email,
            password,
            expiryDate: new Date().getTime(),
            verified: false,
          });
          newUser
            .save()
            .then((result) => {
              res.json({
                status: "SUCCESS",
                message: "Signup successful",
                data: result,
              });
            })
            .catch((error) => {
              console.error("Save Error:", error);
              res.json({
                status: "FAILED",
                message: "An error occurred while saving user account!",
              });
            });
        }
      })
      .catch((err) => {
        console.log(err);
        res.json({
          status: "FAILED",
          message: "An error occurred while checking for existing user!",
        });
      });
  }
});

router.post("/signin", (req, res) => {
  let { email, password } = req.body;
  email = email.trim();
  password = password.trim();

  if (email == "" || password == "") {
    res.status(400).json({
      status: "FAILED",
      message: "Empty credentials supplied",
    });
  } else {
    User.find({ email })
      .then((data) => {
        if (data.length) {
          const storedPassword = data[0].password;
          if (password === storedPassword) {
            res.json({
              status: "SUCCESS",
              message: "Signin Successful",
              data: data,
            });
          } else {
            res.status(401).json({
              status: "FAILED",
              message: "Invalid password entered!",
            });
          }
        } else {
          res.status(404).json({
            status: "FAILED",
            message: "User not found",
          });
        }
      })
      .catch((err) => {
        res.status(500).json({
          status: "FAILED",
          message: "An error occurred while checking for existing user",
        });
      });
  }
});

router.post("/requestPasswordReset", (req, res) => {
  const { email, redirectUrl } = req.body;

  User.find({ email })
    .then((data) => {
      if (data.length) {
        if (!data[0].verified) {
          res.status(401).json({
            status: "FAILED",
            message: "Email hasn't been verified yet. Check your inbox",
          });
        } else {
          sendResetEmail(data[0], redirectUrl, res);
        }
      } else {
        res.json({
          status: "FAILED",
          message: "No account with the supplied email exists!",
        });
      }
    })
    .catch((err) => {
      console.log(err);
      res.json({
        status: "FAILED",
        message: "An error occurred while checking for an existing user",
      });
    });
});

const sendResetEmail = ({ _id, email }, redirectUrl, res) => {
  const resetString = uuidv4() + _id;

  PasswordReset.deleteMany({ userId: _id })
    .then((result) => {
      const mailOptions = {
        from: process.env.AUTH_EMAIL,
        to: email,
        subject: "Password Reset",
        html: `<p>We heard that you lost the password.<p></p>Don't worry, use the link below to reset it.
        <p>This link <b>expires in 60 minutes</b>.</p>Press 
        <a href=${redirectUrl + "/" + _id + "/" + resetString}>
        here</a> to proceed.</p>`,
      };
      const newPasswordReset = new PasswordReset({
        userId: _id,
        resetString: resetString, // Store plain reset string
        createdAt: new Date(),
        expiresAt: new Date().getTime() + 36000, 
      });
      newPasswordReset
        .save()
        .then(() => {
          transporter
            .sendMail(mailOptions)
            .then(() => {
              res.json({
                status: "PENDING",
                message: "Password reset email sent",
              });
            })
            .catch((err) => {
              console.log(err);
              res.json({
                status: "FAILED",
                message: "Password reset email failed",
              });
            });
        })
        .catch((err) => {
          console.log(err);
          res.json({
            status: "FAILED",
            message: "Couldn't save password reset data!",
          });
        });
    })
    .catch((err) => {
      console.log(err);
      res.json({
        status: "FAILED",
        message: "Clearing existing password reset records failed",
      });
    });
};

// Actually reset the password

router.post("/resetPassword", (req, res) => {
  let { userId, resetString, newPassword } = req.body;

  PasswordReset.find({ userId })
    .then((result) => {
      if (result.length > 0) {
        // password reset record exists so we proceed

        const { expiresAt } = result[0];

        // chekcing for expire reset string
        if (expiresAt < Date.now()) {
          PasswordReset.deleteOne({ userId })
            .then(() => {
              res.json({
                status: "FAILED",
                message: "Password reset link has expired",
              });
            })
            .catch(() => {
              res.json({
                status: "FAILED",
                message: "Clearing password reset record failed",
              });
            });
        } else {
          if (result) {
            User.updateOne({ _id: userId }, { password: newPassword })
              .then(() => {
                PasswordReset.deleteOne({ userId })
                  .then(() => {
                    res.json({
                      status: "SUCCESS",
                      message: "Password has been reset successfully",
                    });
                  })
                  .catch(() => {
                    res.json({
                      status: "FAILED",
                      message:
                        "An error occurred while finalizing password reset",
                    });
                  });
              })
              .catch(() => {
                res.json({
                  status: "FAILED",
                  message: "Updating user password failed",
                });
              });
          } else {
            res.json({
              status: "FAILED",
              message: "Invalid password reset details passed",
            });
          }
        }
      } else {
        // password reset record doesn't exist
        res.json({
          status: "FAILED",
          message: "Password reset record request not found",
        });
      }
    })
    .catch((err) => {
      console.log(err);
      res.json({
        status: "FAILED",
        message: "Checking for existing password reset record failed",
      });
    });
});

module.exports = router;
