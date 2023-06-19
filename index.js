const express = require("express");
const app = express();
const con = require("./connectMySql");
let PORT = process.env.PORT || 3000;

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

app.use(express.json());


// To the mySql data get
app.get("/getData", (req, res) => {
  try {
    con.query("select * from ptr_organization", (err, result) => {
      if (err) {
       throw err;
      } else {
       return res.send(result);
      }
    });
  } catch (error) {
    return res.status(500).send({ error: error.message });
  }
});

//_________________________________________To post a data

app.post("/postData", (req, res) => {
    try {
      const data = req.body;
  
      if (!data) {
        return res
          .status(400)
          .send({ status: false, message: "Data is required" });
      }
  
      let {
        organization_name,
        organization_email,
        created_by,
        updated_by,
      } = data;
  
      let realName = organization_name;
//
      con.query(
        `SELECT organization_name FROM ptr_organization WHERE organization_name = '${realName}'`,
        (err, result) => {
          if (err) {
            throw err;
          } else {
            if (result.length != 0) {
              console.log("result.length", result.length);
              console.log("result.orgName", result);
              return res.status(400).send({
                status: false,
                message: "Organization name already exists, please provide a different name",
              });
            }else{

                console.log("hello")
                if (
                  !organization_name ||
                  !isValidInputValue(organization_name.trim()) ||
                  !isValidOnlyCharacters(organization_name.trim())
                ) {
                  return res.status(400).send({
                    status: false,
                    message: "Organization name is required and should contain only alphabets",
                  });
                }
          
                if (
                  !organization_email ||
                  !isValidInputValue(organization_email) ||
                  !isValidEmail(organization_email)
                ) {
                  return res.status(400).send({
                    status: false,
                    message: "Email address is required and should be a valid email address",
                  });
                }
            
                if (!created_by || !isValidInputValue(created_by) || !isValidOnlyCharacters(created_by)) {
                  return res.status(400).send({
                    status: false,
                    message: "Created by name is required and should contain only alphabets",
                  });
                }
            
                if (updated_by && !isValidOnlyCharacters(updated_by)) {
                  return res.status(400).send({
                    status: false,
                    message: "Updated by name should contain only alphabets",
                  });
                }
            
                const organizationData = {
                  organization_name,
                  organization_email,
                  created_by,
                  updated_by,
                  organization_status: 0
                };
            
                con.query("INSERT INTO ptr_organization SET ?", organizationData, (err, result) => {
                  if (err) {
                    throw err;
                  } 
                   return res.send(result);
                });
                

            }
          }
        }
      );

 
    } catch (error) {
       return res.status(500).send({ error: error.message });
    }
  });
  
  app.listen(PORT, function () {
    console.log("App is running on port:", PORT);
  });
  