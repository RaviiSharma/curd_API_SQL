const express = require("express");
const upload = require("express-fileupload");
const path = require("path");

const knex = require("knex");


const app = express();
app.use(express.json());
app.use(upload());

/**************************** validations **************************************** */


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

//************************ to upload data****************** */

app.post("/importPic", async (req, res) => {
  try {
    
    const profile = req.files.profile;
    // Validate Image
    console.log(profile)
    //if(!profile){return res.status(400).json({ message: "profile empty" });}

    const fileSize = profile.size / 1000;//convert number into kb
    const fileExt = profile.name.split(".")[1];//split profile name into name.jpg to match extension jpg ,png only
    if (fileSize > 1000) {
      return res
        .status(400)
        .json({ message: "file size must be lower than 1000kb" });
    }

    if (!["pdf","jpg","JPEG","png"].includes(fileExt)) {
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
        //update student profile field
        // await Student.findByIdAndUpdate(req.params.id, { profile: fileName });
        // res.status(200).json({
        //   data: {
        //     file: `${req.protocol}://${req.get("host")}/${fileName}`,
        //   },
        // });
        db("ptr_org_profile")
        .insert({
          
          organization_profile:fileName
         
        //   updated_by,
        //   organization_status: 0,
        })
        .then((resp) => {
          //console.log(data)
          return res
            .status(201)
            .send({ status: true, message: "successfully inserted" });
        })
        .catch((error) => {
          return res.status(500).send({ error: error.message });
        });
      });

  } catch (error) {
    return res.status(500).send({ error: error.message });
  }
});

app.listen(3000, () => {
  console.log("Server started at post 3000");
});
