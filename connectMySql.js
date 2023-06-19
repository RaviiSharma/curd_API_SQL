const mySql = require("mysql2");
//const knex = require("knex");
const con = mySql.createConnection({
  host: "localhost",
  user: "root",
 //password:"Ravi@036",
  database: "attendance_dev",
});


//connection knex
// const con = knex({
//     client: "mysql",
//     connection: {
//       host: "localhost",
//       user: "root",
//       password: "", //password
//       database: "attendance_dev",
//     },
//   });

con.connect((err)=>{
  if (err) {
    throw err
  }
  else{
    console.log("My Sql DataBase Connected.....")
  }
});



module.exports=con;