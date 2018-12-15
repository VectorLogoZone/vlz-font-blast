// server.js
// where your node app starts

// init project
const express = require('express');
const fontBlast = require('font-blast');
const fs = require('fs');
const hbs = require('hbs');
const minio = require('minio');
const multer  = require('multer');
const os = require('os');
const path = require('path');
const rp = require('request-promise-native');
const request = require('request');
const tmp = require('tmp');
const bodyParser = require('body-parser');

// hack for nodejs SSL error: https://github.com/nodejs/node/issues/16196
require("tls").DEFAULT_ECDH_CURVE = "auto";

tmp.setGracefulCleanup();
const tmpDir = tmp.dirSync({ prefix: 'fonts-', unsafeCleanup: true }).name;
console.log("INFO: font upload tmpdir=" + tmpDir);

const app = express();

app.use(bodyParser.urlencoded({ extended: false }));
app.set('view engine', 'hbs');
app.set('views', './templates');
app.use(express.static('static'));

hbs.registerPartial("above", fs.readFileSync("./partials/above.hbs", "utf-8"));
hbs.registerPartial("below", fs.readFileSync("./partials/below.hbs", "utf-8"));

hbs.registerHelper('isUrl', function(url, options) { return this.url == url || this.url.startsWith(url + "?") ? options.fn(this) : '';});
hbs.registerHelper('isParam', function(param, value, options) { return options.data.root[param] == value ? options.fn(this) : options.inverse(this);});
hbs.registerHelper('toJSON', function(object){ return JSON.stringify(object);});  //NOTE: use new hbs.SafeString() if you need to avoid HTML encoding

const minioClient = new minio.Client({
  endPoint: 's3.amazonaws.com',
  secure: true,
  accessKey: process.env.S3_ACCESS_KEY,
  secretKey: process.env.S3_SECRET_KEY
});

function getStatus() {
	const retVal = {};

	retVal["success"] = true;
	retVal["message"] = "OK";
    retVal["timestamp"] = new Date().toISOString();
    retVal["lastmod"] = process.env.LASTMOD || null;
    retVal["commit"] = process.env.COMMIT || null;
    retVal["tech"] = "NodeJS " + process.version;
	retVal["__dirname"] = __dirname;
	retVal["__filename"] = __filename;
	retVal["os.hostname"] = os.hostname();
	retVal["os.type"] = os.type();
	retVal["os.platform"] = os.platform();
	retVal["os.arch"] = os.arch();
	retVal["os.release"] = os.release();
	retVal["os.uptime"] = os.uptime();
	retVal["os.loadavg"] = os.loadavg();
	retVal["os.totalmem"] = os.totalmem();
	retVal["os.freemem"] = os.freemem();
	retVal["os.cpus.length"] = os.cpus().length;
	// too much junk: retVal["os.networkInterfaces"] = os.networkInterfaces();
	
	retVal["process.arch"] = process.arch;
	retVal["process.cwd"] = process.cwd();
	retVal["process.execPath"] = process.execPath;
	retVal["process.memoryUsage"] = process.memoryUsage();
	retVal["process.platform"] = process.platform;
	retVal["process.release"] = process.release;
    retVal["process.title"] = process.title;
	retVal["process.uptime"] = process.uptime();
	retVal["process.version"] = process.version;
	retVal["process.versions"] = process.versions;
	retVal["process.installPrefix"] = process.installPrefix;
	
	return retVal;
}

app.get('/status.json', function(req, res) {
    res.writeHead(200, {
        "Content-Type": "text/plain",
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, GET',
        'Access-Control-Max-Age': '604800',
    });

    sendJson(req, res, getStatus());
});

const asyncMiddleware = fn =>
    (req, res, next) => {
        Promise.resolve(fn(req, res, next))
            .catch(next);
    };

app.get('/robots.txt', function(req, res) {

    res.setHeader("content-type", "text/plain; charset=utf-8");
    res.write("User-Agent: *\n");
    res.write("Disallow: /\n");
    res.end();

});

app.get(['/', '/index.html'], function(req, res) {
    res.render("index");
    return;
});

app.post(['/', '/index.html'], multer({ dest: tmpDir }).single('file'), asyncMiddleware(async (req, res, next) => {

    var metadata = req.file || {};

    var svgTmpDir = tmp.dirSync({ prefix: 'YYYYMMDD-', unsafeCleanup: true }).name;
    console.log("INFO: expanding to " + svgTmpDir);

    var svgimages = [];

    await fontBlast(metadata.path, svgTmpDir);

    var fileNames = fs.readdirSync(svgTmpDir + '/svg');

    fileNames.forEach(function(fileName) {
        var image = { name: fileName };
        image.text = fs.readFileSync(path.join(svgTmpDir, "svg", fileName), { encoding: "UTF-8"});
        image.base64 = new Buffer(image.text).toString('base64');
        svgimages.push(image);
    });

    res.render("output", { metadata, svgimages });

}));

app.use(function (req, res, next) {
    console.log("404: " + req.url + " referrer=" + req.header("Referer"));
    res.setHeader("content-type", "text/plain; charset=utf-8");
    res.status(404).send("404: unable to find file '" + req.url + "'");
});

app.use(function (err, req, res, next) {
    console.error(err.stack);
    res.setHeader("content-type", "text/plain; charset=utf-8");
    res.status(500).send("500: " + err);
});

function sendJson(req, res, jsonObj) {
    if ('callback' in req.query)
    {
        res.write(req.query["callback"]);
        res.write("(");
        res.write(JSON.stringify(jsonObj));
        res.write(");");
    }
    else
    {
        res.write(JSON.stringify(jsonObj));
    }
    res.end();
}

const listener = app.listen(process.env.PORT || 4000, function () {
    console.log('Listening on port ' + listener.address().port);
});

