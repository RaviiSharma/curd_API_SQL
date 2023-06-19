const nodemailer = require("nodemailer");
const Mailgen = require("mailgen");
const knex = require("knex");

const express = require("express");
const app = express();
app.use(express.json());
const PORT = process.env.PORT || 5000;
//____________________________/ connection knex /_________________
const db = knex({
  client: "mysql",
  connection: {
    host: "localhost",
    user: "root",
    password: "", //password
    database: "attendance_dev",
  },
});
//SETUP_____________________/ user mail pass /____________________

var EMAIL = "engineerravi036@gmail.com";
var PASSWORD = "jqnsxdeoiesptqhk";

//________________________/ mail to emp mail /______________
let config = {
  service: "gmail",
  auth: {
    user: EMAIL,
    pass: PASSWORD,
  },
};
let transporter = nodemailer.createTransport(config);

let MailGenerator = new Mailgen({
  theme: "default",
  product: {
    name: "Rcharge Kit Fintech  Pvt Ltd",
    link: "https://mailgen.js/",
  },
});

//____________________________/ send mail from real gmail account /___________________

app.post("/getEmail", async (req, res) => {
try{
  const { userEmail } = req.body;

  console.log("userEmail", userEmail[0]);
  //console.log("userEmail[0]->",userEmail[0])
 
  const correctEmail = await db.select("employee_id").from("ptr_employees").where("employee_email", userEmail[0]);
  if(correctEmail.length==0){return res.status(400).send({message:"no employee found"});}
  console.log("employee_id--", correctEmail[0].employee_id);

  const correctId = await db.select("leave_status").from("ptr_employee_leave").where("employee_id", correctEmail[0].employee_id);
  console.log("correctId",correctId)

  if(correctId.length==0){
    return res.status(400).send({message:"no leave data found"});
  }else {
    if (correctId[0].leave_status === 1) {
        console.log("leave_status--", correctId[0].leave_status);
        var response = {
          body: {
            intro: "Your leave is disaaproved",
            outro: "Looking forward to get response",
          },
        };
      }
      if (correctId[0].leave_status === 0) {
        console.log("leave_status--", correctId[0].leave_status);
        var response = {
          body: {
            intro: "Your leave is approved",
            outro: "Looking forward to get response",
          },
        };
      }
  }
 
  //___________/ mail connections /_______________

  let mail = MailGenerator.generate(response);

  let message = {
    from: EMAIL,
    to: userEmail,
    subject: "employees leaves reports",
    html: mail,
  };
  transporter
    .sendMail(message)
    .then(() => {
      return res.status(200).json({
        msg: "email successfully sended",
      });
    })
    .catch((error) => {
      return res.status(500).json({ error });
    });
 
}catch (error) {
    return res.status(500).send({error: error.message});
  }

});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
