const express = require("express");
const upload = require("express-fileupload");
const knex = require("knex");
const app = express();
app.use(express.json());
app.use(upload());
app.use(express.static("uploads"));

const jwt = require("jsonwebtoken");
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
//_____________________middleware_______________________________

const authentication = function (req, res, next) {
    try {
        let token = req.headers['x-api-key']

        if (!token) {
            return res.status(401).send({ status: false, message: "neccessary header token is missing" })
        }
        
        jwt.verify(token, "Project-1", (err, Decoded)=> {
            if(err){ return res.status(403).send("failed authentication")}
          
            // console.log(Decoded)
           req.user=Decoded

        })
        next()
         
    }catch (err) {
        return res.status(500).send({ status: false, message: err.message })
    }
}
//module.exports.authentication = authentication

// login User
app.post("/loginUser", async function (req, res) {
  try {
    let employee_name = req.body.employee_name;
    let employee_no = req.body.employee_no;


    console.log("user_employee_no-",employee_no)

     if (!employee_name ||!isValidInputValue(employee_name) ||!isValidOnlyCharacters(employee_name))
    {return res.status(400).send({status: false,message:"employee_name is required and should contain only alphabets",});};
      
    if (!employee_no ||!isValidInputValue(employee_no) ||!(employee_no).match(/^[a-zA-Z0-9]+$/))
    {return res.status(400).send({status: false,message:"employee_id is required but only matches a string containing only alphabets and numbers",});};


    //matching employee_id from db
    const correctEmp = await db.select("*").from("ptr_employees").where("employee_no",employee_no);

    if(correctEmp.length ==0){return res.send({status:false,message:"incorrect number, employee_no is not present"})}
    //console.log("correctEmp",correctEmp)
    console.log("employee_id",correctEmp[0].employee_id)
    console.log("employee_type",correctEmp[0].employee_type)
    console.log("employee_no",correctEmp[0].employee_no)

    // token gen
    let token = jwt.sign(
      { 
        employee_id: correctEmp[0].employee_id,
        employee_type: correctEmp[0].employee_type,
      },
      "Project-1"
    );
    res.status(201).send({ status: true, data: token });
  } catch (err) {
    res.status(500).send({ message: "Error", error: err.message });
  }
});


//____________________________ to upload data for taking leave __________________ */

app.post("/getLeave",authentication, async (req, res) => {
  try {
    
    const data = req.body;
    
    const empTkn = req.user; //decoded token
    //console.log("empToken-", empTkn);

    const empTYPE= empTkn.employee_type
    const empID=empTkn.employee_id
   //employee type from token
    console.log("empTYPE", empTYPE);
    //employee id from tokn
    console.log("empID", empID);

  let { leave_status,employee_id,reporting_person} = data;

  if (empTYPE !== 2 && empTYPE !== 5) {
    return res.status(400).send({
      status: false,
      message: "Employee type is required and employee can only be hr or admin",
    });
  }
    
    if (!leave_status ||!isValidInputValue(leave_status) ||!["0","1"].includes(leave_status))
    {return res.status(400).send({status: false,message:"leave_status is required and should contain only 0 || 1",});};

    // if (!reporting_person ||!isValidInputValue(reporting_person) ||!isValidOnlyCharacters(reporting_person))
    // {return res.status(400).send({status: false,message:"reporting_person name is required and should contain only alphabets",});};
      

    if (!employee_id ||!isValidInputValue(employee_id) ||!isValidNumber(employee_id))
    {return res.status(400).send({status: false,message:"employee_id is required and should contain only numbers",});};

    //matching employee_id from db
    const id = await db.select("*").from("ptr_employees").where("employee_id",employee_id);

    if(id.length ==0){return res.send({status:false,message:"incorrect id , employee_id is not present"})}
    console.log("emp_id",id)
    //console.log("data",data[organization_name])
    db("ptr_employee_leave")
      .insert({
        leave_status:data["leave_status"],
        employee_id:id[0].employee_id,
        reporting_person:empID,//taken employee_id from token hr || admin
       
      
      })  
      .then((resp) => {
         return res.status(201).json({
            data: {status:true,mesage:"inserted successfully"},
          });
        })
         .catch((error) => {
        return res.status(500).send({ error: error.message });
      }); 
   
  } catch (error) {
    return res.status(500).send({ error: error.message });
  }
});


//________________________/ get all data of reporting person by right join /___________________

app.get("/reportingPersonData", async (req, res) => {
  try {
    const reporting_Details = await db.raw(`
      SELECT ptr_employees.employee_id,employee_no,employee_name,employee_dob,employee_email,employee_mobile,employee_gender,employee_home_address, ptr_employee_leave.reporting_person
      FROM ptr_employees
      RIGHT JOIN ptr_employee_leave
      ON ptr_employees.employee_id = ptr_employee_leave.reporting_person
    `);
    console.log("reporting_Details", reporting_Details[0]);
    return res.send(reporting_Details[0]);

  } catch (error) {
    return res.status(500).send({error: error.message});
  }
});

//____________________/ filter data of employees by passing 2 dates /___________________

app.get("/filtertLeaveData", async (req, res) => {
  try {
    const requestBody=req.body
    //console.log("requestBody",requestBody)
    

   let {leave_date_start,leave_date_end,leave_id,leave_employee_id,leave_types_id,leave_day_type,leave_reason}=requestBody;
   
    if (!leave_date_start ||!isValidInputValue(leave_date_start) ||!(leave_date_start).match(/\b\d{2,4}[-]\d{1,2}[-]\d{1,2}\b/))
    {return res.status(400).send({status: false,message:"leave_date_start is required and only can match dates like 2023-09-22, 23-1-21"});};

    if (!leave_date_end ||!isValidInputValue(leave_date_end) ||!(leave_date_end).match(/\b\d{2,4}[-]\d{1,2}[-]\d{1,2}\b/))
    {return res.status(400).send({status: false,message:"leave_date_end is required and only can match dates like 2023-09-22, 23-1-21"});};
    
    //concate with body dates ************
     const fromDate=leave_date_start +" "+ "00:00:00";
     console.log("fromDate ->",fromDate);
     const toDate=leave_date_end +" "+ "23:59:59";
     console.log("toDate ->",toDate);


  const correctEmp = await db.select("leave_id", "leave_employee_id", "leave_types_id", "leave_reason", "leave_day_type")
  .from("ptr_leaves").where((builder) => {
    if (fromDate && toDate) {
      builder.whereBetween('leave_date_created',[fromDate, toDate]);
    }
    if (leave_employee_id) {builder.where('leave_employee_id',leave_employee_id);
      console.log("leave_employee_id",leave_employee_id)
    }
    if (leave_reason){builder.where('leave_reason',leave_reason);
      console.log("leave_reason",leave_reason)
    }
    if (leave_id){builder.where('leave_id',leave_id);
      console.log("leave_id",leave_id)
    }
    if (leave_types_id){builder.where('leave_types_id',leave_types_id);
      console.log("leave_types_id",leave_types_id)
    }
    if (leave_day_type){builder.where('leave_day_type',leave_day_type);
      console.log("leave_day_type",leave_day_type)
    }
  });
    console.log("no_of_employees",correctEmp.length)
    console.log("correctEmp",correctEmp)

    res.status(200).send({ status: true, message:"lists of data",no_of_employees:correctEmp.length, data: correctEmp });
   
  
  } catch (error) {
    return res.status(500).send({error: error.message});
  }
});

app.listen(3000, () => {
  console.log("Server started at post 3000");
});


