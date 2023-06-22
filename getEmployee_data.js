const express = require("express");
const upload = require("express-fileupload");
const knex = require("knex");
const app = express();
app.use(express.json());
app.use(upload());
app.use(express.static("uploads"));


//__________________________ validations _______________________________________ */

//check valid value || not empty value
const isValidInputValue = function (value) {
  // console.log("data", value.organization_email)
  if (typeof value === "undefined" || value === null) return false;
  if (typeof value === "string" && value.trim().length > 0) return true;
  return false;
};
//check valid name
const isValidOnlyCharacters = function (value) {
  return /^[A-Za-z\s]+$/.test(value); // with space 
};
//^[a-zA-Z\s]+$


const isValidNumber = function (value) {
  if (typeof (value) === "undefined" || value === null) return false;
  if (typeof (value) === "string" && value.trim().length > 0 && Number(value) !== NaN && Number(value) >= 0) return true
  if (typeof (value) === "number" && value >= 0) return true;
  return false;
};

//check a valid date format
const isValidDate = function (date) {
  const regexForPass =/\b\d{2,4}[-/]\d{1,2}[-/]\d{1,2}\b/;
  return regexForPass.test(date);
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
//__________________/ get employee data from two tables /____________________________
app.get("/getEmpData", async (req, res) => {
try {
        employeeID =req.body.leave_employee_id
        console.log("employeeID--",employeeID)
if(employeeID){
  const emp_Details = await db.raw(`
  SELECT ptr_leaves.leave_days,leave_balance, ptr_leave_types.leave_type_name,leave_type_default_credit
  FROM ptr_leaves INNER JOIN ptr_leave_types ON ptr_leaves.leave_types_id = ptr_leave_types.leave_type_id
  WHERE ptr_leaves.leave_employee_id = ? `, [employeeID]);

   console.log("emp_Details", emp_Details[0]);

    if(emp_Details[0].length !==0){
      return res.send(emp_Details[0]);
    }else{
      return res.status(400).send({message:"leave_employee_id is not present"})
    }
        
}else{
  return res.status(400).send({message:"please give the employee_id to get details"})
}
    } catch (error) {
      return res.status(500).send({error: error.message});
    }
  });
  
  app.listen(3000, () => {
    console.log("Server started at get 3000");
  });
  