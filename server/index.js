const express = require("express");
const bodyParser = require("body-parser");
const pino = require("express-pino-logger")();
const formidable = require("formidable");
const app = express();
const fs = require("fs");
const csv = require("neat-csv");
app.use(bodyParser.urlencoded({ extended: false }));
app.use(pino);

// app.get("/api/greeting", async (req, res) => {
//   console.log(req.query.snp, req.query.nwk);
//   let saveResult = await executeJava(req.query.snp, req.query.nwk);
//   // console.log(saveResult);
//   const name = req.query.name || "World";
//   res.setHeader("Content-Type", "application/json");
//   res.send(JSON.stringify({ greeting: `Hello ${name}!` }));
// });

// app.get("/api/greeting", async (req, res) => {
//   console.log(req.query.snp, req.query.nwk);
//   var form = new formidable.IncomingForm();
//   form.parse(req, function (err, fields, files) {
//     console.log(fields);
//     console.log(files);
//     console.log(err);
//     // var oldpath = files.filetoupload.path;
//     // var newpath = 'C:/Users/Administrator/' + files.filetoupload.name;
//     // fs.rename(oldpath, newpath, function (err) {
//     //   if (err) throw err;
//     //   res.write('File uploaded and moved!');
//     //   res.end();
//     // });
//   });
// });

app.post("/api/upload", (req, res, next) => {
  const form = formidable({ multiple: true });
  form.parse(req, async (err, fields, files) => {
    if (err) {
      next(err);
      return;
    }
    let result = await executeJava(files.snp.path, files.nwk.path);
    let newick = fs.readFileSync(files.nwk.path, "utf8");
    let taxaInfo = await readStream(files.taxainfo.path);
    let snpInfo = await readStream(files.SNPinfo.path);
    let noHeaders = { separator: "\t", headers: false };
    let ids = await readStream("./server/Ergebnis/IDzuordnung.txt", noHeaders);

    let support = await readStream(
      "./server/Ergebnis/supportSplitKeys.txt",
      noHeaders
    );
    let notSupport = await readStream(
      "./server/Ergebnis/notSupportSplitKeys.txt",
      noHeaders
    );

    res.json({
      newick: newick,
      taxaInfo: taxaInfo,
      snpInfo: snpInfo,
      ids: ids,
      support: support,
      notSupport: notSupport,
    });
  });
});

const readStream = async (path, info = { separator: "\t" }, data, end) => {
  let csvText = fs.readFileSync(path, "utf8");
  let information = await csv(csvText, info);
  return information;
  // let information = [];
  // return fs
  //   .createReadStream(path)
  //   .pipe(csv(info))
  //   .on("data", data ? data : (d) => information.push(d))
  //   .on("end", end ? end : () => information);
  // return information;
};
const executeJava = async (snp, nwk) => {
  let exec = require("child_process").exec;
  return new Promise((resolve, reject) => {
    const child = exec(
      `java -jar ./server/main.jar ${snp} ${nwk} ./server/`,
      async function (error, stdout, stderr) {
        console.log(stdout);
        resolve(stdout);
        if (error !== null) {
          console.log(`exec error: ${error}`);
          reject(error);
        }
      }
    );
  });
};

app.listen(3001, () =>
  console.log("Express server is running on localhost:3001")
);
