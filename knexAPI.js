const express = require("express");
const upload = require("express-fileupload");
const path = require("path");
const knex = require("knex");
const bcrypt = require("bcrypt");

const app = express();
app.use(express.json());
app.use(upload());
app.use(express.static("uploads"));


///__________________________ validations _______________________________________ */

//check valid value || not empty value
const isValidInputValue = function (value) {
  // console.log("data", value.organization_email)
  if (typeof value === "undefined" || value === null) return false;
  if (typeof value === "string" && value.trim().length > 0) return true;
  return false;
};
//check valid name
const isValidOnlyCharacters = function (value) {
  return /^[A-Za-z]+$/.test(value);
};
//valid email
const isValidEmail = function (email) {
  const regexForEmail = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
  return regexForEmail.test(email);
};
//valid password
const isValidPassword = function (password) {
  const regexForPass =   /^(?=.*[A-Za-z])(?=.*\d)(?=.*[!@#$%^&*()])[A-Za-z\d!@#$%^&*()]{4,}$/;
  return regexForPass.test(password);
};
//------------------ connection knex ----------------------------
const db = knex({
  client: "mysql",
  connection: {
    host: "localhost",
    user: "root",
    password: "", //password
    database: "attendance_dev",
  },
});

//__________________________ to get data ____________________________

app.get("/getData", async (req, res) => {
  try {
    //select all data from table ptr_organization
    const result = await db.select("*").from("ptr_organization");
    return res.send(result);
  } catch (error) {
    return res.status(500).send({ error: error.message });
  }
});

//____________________________ to upload data __________________ */

app.post("/uploadData", async (req, res) => {
  try {
    
    const data = req.body;
    
    let { organization_name,organization_email,organization_password,updated_by} = data;

    if (!organization_name ||!isValidInputValue(organization_name) ||!isValidOnlyCharacters(organization_name))
    {return res.status(400).send({status: false,message:"Organization name is required and should contain only alphabets",});};
      
    console.log("email",organization_email)

    if (!organization_email ||!isValidInputValue(organization_email) ||!isValidEmail(organization_email))
    {return res.status(400).send({status: false,message:"Email address is required and should be a valid email address",});};

    if (!organization_password ||!isValidInputValue(organization_password) || !isValidPassword(organization_password)) 
    {return res.status(400).send({ status: false, message: "organization_password is required and should be of 4 characters and must contain 1 letter,one number and one special char" });}

        // password encryption
        const salt = await bcrypt.genSalt(13);
        const encryptedPassword = await bcrypt.hash(organization_password, salt);

        console.log("encryptedPassword",encryptedPassword)

       
    //_____________________________ profile upload _____________________________
    
    if(!req.files) return res.status(400).json({status:false,message:"profile required"})
      
    const profile = req.files.profile;
    const fileSize = profile.size / 1000;//convert number into kb
    const arr = profile.name.split(".");//split profile name into name.jpg to match extension jpg ,png only

    const fileExt=arr[arr.length-1]//geeting last index of an array

    if (fileSize > 1000) {
      return res
        .status(400)
        .json({ message: "file size must be lower than 1000kb" });
    }
    console.log("fileExt",fileExt)
    if (!["jpeg","pdf","jpg","png"].includes(fileExt)) {
      return res
        .status(400)
        .json({ message: "file extension must be jpg,png and jpeg" });
    }
    //given the image name
    const fileName = `${req.body.organization_name}${path.extname(profile.name)}`; //extname:give the extension name 
    console.log(fileName)
    
    profile.mv(`uploads/${fileName}`, async (err) => { //mv:its function helps to upload file
      if (err) {
        console.log(err);
        return res.status(500).send(err);
      }
      //console.log("data",data[organization_name])
    db("ptr_organization")
      .insert({
        organization_name: data["organization_name"],
        organization_email: data["organization_email"],
        organization_password:encryptedPassword,
        organization_profile:fileName,
        created_by:'7',
        updated_by,
        organization_status: 0,
      })  
      .then((resp) => {
         return res.status(201).json({
            data: {status:true,mesage:"inserted successfully",
              profileUrl:`${req.protocol}://${req.get("host")}/${fileName}`,
            },
          });
        })
         .catch((error) => {
        return res.status(500).send({ error: error.message });
      }); 
    })
  } catch (error) {
    return res.status(500).send({ error: error.message });
  }
});

app.listen(3000, () => {
  console.log("Server started at post 3000");
});
