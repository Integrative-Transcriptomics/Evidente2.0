const express = require("express");
const bodyParser = require("body-parser");
const pino = require("express-pino-logger")();
const formidable = require("formidable");
const app = express();
const fs = require("fs");
const csv = require("neat-csv");
const _ = require("lodash");
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
    let taxaInfo = await readCSV(files.taxainfo.path, { separator: "," });
    let { metadataInfo, taxaInfoMod } = await extractMetadata(taxaInfo);
    let snpInfo = await readCSV(files.SNPinfo.path);
    let noHeaders = { separator: "\t", headers: false };
    let ids = await readCSV("./server/Ergebnis/IDzuordnung.txt", noHeaders);
    let { numToLabel, labToNum } = zippedIds(ids);

    let support = await readCSV(
      "./server/Ergebnis/supportSplitKeys.txt",
      noHeaders,

      true
    );
    let notSupport = await readCSV(
      "./server/Ergebnis/notSupportSplitKeys.txt",
      noHeaders
    );
    let resultTransformation = transformKeys(support, numToLabel);
    let transformedSupportKeys = resultTransformation[0];
    let resultTransformationNonSupport = transformKeys(
      notSupport,
      numToLabel,
      resultTransformation[1]
    );
    let transformedNonSupportKeys = resultTransformationNonSupport[0];
    let setOfSnps = [...resultTransformationNonSupport[1].values()];
    res.json({
      newick: newick,
      taxaInfo: taxaInfoMod,
      snpInfo: snpInfo,
      ids: { numToLabel, labToNum },
      availableSNPs: setOfSnps,
      support: transformedSupportKeys,
      notSupport: transformedNonSupportKeys,
      metadataInfo: metadataInfo,
    });
  });
});

async function extractMetadata(taxaInfo) {
  let metadataInfo = _.head(taxaInfo);
  taxaInfoMod = _.tail(taxaInfo);

  _.toPairs(metadataInfo).forEach((entry) => {
    let k = entry[0],
      v = entry[1];
    let allValues = taxaInfoMod.map((info) => info[k]);
    let dataDomain = [];
    if (v.toLowerCase() === "numerical") {
      allValues = allValues.map((d) => parseFloat(d));
      dataDomain = [Math.min(...allValues), Math.max(...allValues)];
    } else {
      dataDomain = [...new Set(allValues).values()];
    }

    metadataInfo[k] = { type: v, extent: dataDomain };
  });
  return { metadataInfo, taxaInfoMod };
}
const zippedIds = (ids) => {
  let idsNum = ids.map((d) => d[0]);
  let idsLabel = ids.map((d) => d[1]);
  let numToLabel = _.zipObject(idsNum, idsLabel);
  let labToNum = _.invert(numToLabel);

  return { numToLabel, labToNum };
};
const transformKeys = (keys, numToLab, set = []) => {
  let setOfSnps = new Set(set);
  let transformedKeys = keys.map((d) => {
    let endNode = numToLab[d[0].split(d[0].includes("Root") ? " " : "->")[1]];
    return _.chunk(d[2].match(/(\d+)|([ACTGN])/gi), 2).map((snp) => {
      setOfSnps.add(snp[0]);
      return { node: endNode, pos: snp[0], allele: snp[1] };
    });
  });
  transformedKeys = _.flatten(transformedKeys);
  return [transformedKeys, setOfSnps];
};

const readCSV = async (path, info = { separator: "\t" }, data, end) => {
  let csvText = fs.readFileSync(path, "utf-8");

  let information = await csv(csvText, info);
  return information;
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
