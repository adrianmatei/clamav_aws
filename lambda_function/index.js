const constants = require('./constants');
const clamav = require('./clamav');
const utils = require('./utils');
const path = require('path');
const fs = require('fs');

const AWS = require('aws-sdk');
const s3 = new AWS.S3();

exports.handler = (event, context) => {
    let s3ObjectKey = utils.extractKeyFromS3Event(event);
    let pathToFile = path.basename(s3ObjectKey)

    // perform file scan
    scanLocalFile(event, pathToFile);

    return context.logStreamName;
};

async function scanLocalFile(event, pathToFile) {
    let s3ObjectKey = utils.extractKeyFromS3Event(event);
    let s3ObjectBucket = utils.extractBucketFromS3Event(event);
    var virusScanStatus = constants.STATUS_SKIPPED_FILE;

    await clamav.downloadAVDefinitions(constants.CLAMAV_BUCKET_NAME, constants.PATH_TO_AV_DEFINITIONS);
    await downloadFileFromS3(s3ObjectKey, s3ObjectBucket);

    if(!await utils.isS3FileTooBig(s3ObjectKey, s3ObjectBucket)) {
        virusScanStatus = clamav.scanLocalFile(path.basename(s3ObjectKey));
        utils.generateSystemMessage(`Scan status: ${virusScanStatus}`);
    }

    var taggingParams = {
        Bucket: s3ObjectBucket,
        Key: s3ObjectKey,
        Tagging: utils.generateTagSet(virusScanStatus)
    };

    try {
        await s3.putObjectTagging(taggingParams).promise();
    } catch(err) {
        console.log("Tagging error" + err);
    }

    return virusScanStatus;
}

function downloadFileFromS3(s3ObjectKey, s3ObjectBucket) {
    const downloadDir = `/tmp/download`;
    if (!fs.existsSync(downloadDir)){
        fs.mkdirSync(downloadDir);
    }
    let localPath = `${downloadDir}/${path.basename(s3ObjectKey)}`;
    let writeStream = fs.createWriteStream(localPath);

    let options = {
        Bucket: s3ObjectBucket,
        Key   : s3ObjectKey,
    };

    return new Promise((resolve, reject) => {
        s3.getObject(options).createReadStream().on('end', function () {
            resolve();
        }).on('error', function (err) {
            console.log("Error when downloading file from S3: " + err);
            reject();
        }).pipe(writeStream);
    });
}
