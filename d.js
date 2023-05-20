const express = require("express");
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.post("/up1", (req, res) => {
  console.log(req.files);
  console.log(req.body);
  res.send(req.body);
});

app.listen(3000, () => console.log("hi hello left right "));
