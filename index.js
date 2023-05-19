const express = require("express");
const AWS = require("aws-sdk");
const bodyParser = require("body-parser");
const multer = require("multer");
const multerS3 = require("multer-s3");
const app = express();

AWS.config.update({
  accessKeyId: process.env.ACCESS_KEY,

  secretAccessKey: process.env.SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

const s3 = new AWS.S3();

app.use(bodyParser.json());

const upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: process.env.BUCKET,
    acl: "public-read", // Set the access control list to allow public read access to the uploaded files
    metadata: function (req, file, cb) {
      cb(null, { fieldName: file.fieldname });
    },
    key: function (req, file, cb) {
      cb(null, Date.now().toString()); // Use the current timestamp as the file name
    },
  }),
});

// curl -i https://some-app.cyclic.app/myFile.txt
app.get("*", async (req, res) => {
  let filename = req.path.slice(1);

  try {
    let s3File = await s3
      .getObject({
        Bucket: process.env.BUCKET,
        Key: filename,
      })
      .promise();

    res.set("Content-type", s3File.ContentType);
    res.send(s3File.Body.toString()).end();
  } catch (error) {
    if (error.code === "NoSuchKey") {
      console.log(`No such key ${filename}`);
      res.sendStatus(404).end();
    } else {
      console.log(error);
      res.sendStatus(500).end();
    }
  }
});
app.post("/up1", (req, res) => {
  console.log(req.files);
  console.log(req.body);
});
app.post("/upload", (req, res) => {
  if (!req.body || !req.body.image) {
    return res.status(400).send("No image uploaded.");
  }

  const base64Data = req.body.image.replace(/^data:image\/\w+;base64,/, "");
  const buffer = Buffer.from(base64Data, "base64");

  const params = {
    Bucket: process.env.BUCKET,
    Key: "image" + Math.floor(Math.random() * 23344) + ".jpg",
    Body: buffer,
    ACL: "public-read", // Set the access control list to allow public read access to the uploaded file
  };

  s3.upload(params, (err, data) => {
    if (err) {
      console.error(err);
      return res.status(500).send("Failed to upload image.");
    }

    // File uploaded successfully, return the URL of the uploaded image
    res.send(data.Location);
  });
});

app.get("/", (req, res) => {
  res.send("hi this is 3rd commit ");
});

// curl -i -XPUT --data '{"k1":"value 1", "k2": "value 2"}' -H 'Content-type: application/json' https://some-app.cyclic.app/myFile.txt
app.put("*", async (req, res) => {
  let filename = req.path.slice(1);

  console.log(typeof req.body);

  await s3
    .putObject({
      Body: JSON.stringify(req.body),
      Bucket: process.env.BUCKET,
      Key: filename,
    })
    .promise();

  res.set("Content-type", "text/plain");
  res.send("ok").end();
});

// curl -i -XDELETE https://some-app.cyclic.app/myFile.txt
app.delete("*", async (req, res) => {
  let filename = req.path.slice(1);

  await s3
    .deleteObject({
      Bucket: process.env.BUCKET,
      Key: filename,
    })
    .promise();

  res.set("Content-type", "text/plain");
  res.send("ok").end();
});

// /////////////////////////////////////////////////////////////////////////////
// Catch all handler for all other request.
app.use("*", (req, res) => {
  res.sendStatus(404).end();
});

// /////////////////////////////////////////////////////////////////////////////
// Start the server
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`index.js listening at http://localhost:${port}`);
});
