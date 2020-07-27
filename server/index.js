const express = require("express");
const bodyParser = require("body-parser");
const pino = require("express-pino-logger")();
const formidable = require("formidable");
const app = express();
const fs = require("fs");
const csv = require("neat-csv");
const _ = require("lodash");
const pathparser = require("path");
const puppeteer = require("puppeteer");

app.use(bodyParser.urlencoded({ limit: "50mb", extended: true }));
app.use(bodyParser.json({ limit: "50mb", extended: true }));
app.use(pino);

async function processFiles({ nwk, snp, taxainfo: taxametadata, SNPinfo: snpmetadata = {} }) {
  // Execute Processing Tool
  await executeJava(snp.path, nwk.path).catch((err) => {
    console.log(err);
    throw err;
  });
  // Read all files
  let newick = fs.readFileSync(nwk.path, "utf8").replace(/[^a-zA-Z0-9.:,()_-]/g, "_");
  let taxaInfo = await readCSV(taxametadata.path, {
    separator: pathparser.extname(taxametadata.name) === ".tsv" ? "\t" : ",", // is it tsv or csv?
  });
  let { metadataInfo, taxaInfoMod } = await extractMetadata(taxaInfo); // extract line with metadata information
  metadataInfo = _.assign(
    { SNP: { type: "SNP", extent: ["A", "C", "T", "G", "N"] } },
    metadataInfo
  );
  // let snpInfo = await readCSV(snpmetadata.path, {
  //   separator: pathparser.extname(snpmetadata.name) === ".tsv" ? "\t" : ",",
  // });
  let noHeaders = { separator: "\t", headers: false };
  let ids = await readCSV("./server/Ergebnis/IDzuordnung.txt", noHeaders);
  let { numToLabel, labToNum } = zippedIds(ids);

  let support = await readCSV(
    "./server/Ergebnis/supportSplitKeys.txt",
    noHeaders,

    true
  );
  let notSupport = await readCSV("./server/Ergebnis/notSupportSplitKeys.txt", noHeaders);

  let resultTransformation = transformKeys(support, numToLabel);
  let transformedSupportKeys = resultTransformation[0];
  let resultTransformationNonSupport = transformKeys(
    notSupport,
    numToLabel,
    resultTransformation[1]
  );
  let transformedNonSupportKeys = resultTransformationNonSupport[0];
  let setOfSnps = _.sortBy([...resultTransformationNonSupport[1].values()], (d) => parseInt(d));

  let processedFiles = {
    newick: newick,
    taxaInfo: taxaInfoMod,
    // snpInfo: snpInfo,
    ids: { numToLabel, labToNum },
    availableSNPs: setOfSnps,
    support: transformedSupportKeys,
    notSupport: transformedNonSupportKeys,
    metadataInfo: metadataInfo,
  };

  return processedFiles;
}

app.post("/api/init-example", async (req, res, next) => {
  try {
    exampleFiles = {
      nwk: {
        path: "./server/MiniExample/mini_nwk.nwk",
      },
      snp: {
        path: "./server/MiniExample/mini_snp.tsv",
      },
      taxainfo: {
        path: "./server/MiniExample/mini_nodeinfo.csv",
        name: "mini_nodeinfo.csv",
      },
    };

    // exampleFiles = {
    //   nwk: {
    //     path: "./server/Leprosy/nwk.nwk",
    //   },
    //   snp: {
    //     path: "./server/Leprosy/snp.tsv",
    //   },
    //   taxainfo: {
    //     path: "./server/Leprosy/taxainfo.tsv",
    //     name: "taxainfo.tsv",
    //   },
    // };

    let processedFiles = await processFiles(exampleFiles);

    res.status(200).json(processedFiles);
  } catch (error) {
    console.log(error);
    res.status(400).send({ message: new Error(error).message });
  }
});

app.post("/api/upload", (req, res, next) => {
  const form = formidable({ multiple: true });
  form.parse(req, async (err, fields, files) => {
    try {
      if (err) {
        next(err);
        console.log(err);
        return;
      }

      let processedFiles = await processFiles(files);
      // Delete files after they are read
      _.keys(files).forEach((d) => {
        fs.unlink(files[d].path, function (err) {
          if (err) {
            console.log(err);
          }
        });
      });

      res.status(200).json(processedFiles);
    } catch (error) {
      console.log(error);
      res.status(400).send({ message: new Error(error).message });
    }
  });
});

app.post("/api/export", async function (req, res, next) {
  const content = req.body.htmlContent;
  const type = req.body.typeOf;
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.setContent(content);
  await page.addStyleTag({ path: "./src/print.css" });
  let buffer;
  switch (type) {
    case "pdf":
      buffer = await page.pdf({
        printBackground: true,
        landscape: true,
        margin: {
          left: "0px",
          top: "0px",
          right: "0px",
          bottom: "0px",
        },
      });
      break;
    case "jpeg":
      buffer = await page.screenshot({ fullPage: true, type: "jpeg", quality: 100 });
      break;
    default:
      buffer = await page.screenshot({ fullPage: true });
      break;
  }

  await browser.close();
  res.end(buffer);
});

async function extractMetadata(taxaInfo) {
  let metadataInfo = _.head(taxaInfo);
  taxaInfoMod = _.tail(taxaInfo).map((d) =>
    _.update(_.pickBy(d), "Information", (v) => v.replace(/[^a-zA-Z0-9_-]/g, "_"))
  );

  _.toPairs(metadataInfo).forEach((entry) => {
    let k = entry[0],
      v = entry[1];
    let allValues = _.compact(taxaInfoMod.map((info) => info[k]));
    let dataDomain = [];
    switch (v.toLowerCase()) {
      case "numerical":
        allValues = allValues.map((d) => parseFloat(d));
        dataDomain = [Math.min(...allValues), Math.max(...allValues)];
        break;

      case "ordinal":
        dataDomain = _.sortBy(_.uniq(allValues));
        break;

      case "type":
        dataDomain = allValues.map((v) => v.replace(/[^a-zA-Z0-9_-]/g, "_"));
        break;

      default:
        let countedValues = _.countBy(allValues);
        let temp = _.sortBy(_.keys(countedValues), (key) => countedValues[key]);
        dataDomain = _.reverse(temp);
        break;
    }

    metadataInfo[k] = { type: v.toLowerCase(), extent: dataDomain };
  });

  return { metadataInfo, taxaInfoMod };
}

const zippedIds = (ids) => {
  let idsNum = ids.map((d) => d[0]);
  let idsLabel = ids.map((d) => d[1].replace(/[^a-zA-Z0-9_-]/g, "_"));
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

const readCSV = async (path, info = {}) => {
  let csvText = fs.readFileSync(path, "utf-8");
  let information = await csv(csvText, info);

  return information;
};

const executeJava = async (snp, nwk) => {
  console.log("Processing files:");
  console.log(snp, nwk);
  let exec = require("child_process").exec;
  return new Promise((resolve, reject) => {
    console.log(snp);
    const child = exec(`java -jar ./server/main.jar ${snp} ${nwk} ./server/`, async function (
      error,
      stdout,
      stderr
    ) {
      if (error !== null) {
        console.log(`exec error: ${error}`);
        reject(error);
      }
      console.log(stdout);
      resolve(true);
    });
  });
};

app.listen(3001, () => console.log("Express server is running on localhost:3001"));
