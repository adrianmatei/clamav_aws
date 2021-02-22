const constants = require('./constants');
const clamav = require('./clamav');
const utils = require('./utils');
const path = require('path');
const fs = require('fs');

const AWS = require('aws-sdk');
const s3 = new AWS.S3();

exports.handler = (event, context) => {
    var timestamp = new Date().getTime().toString();

    var bucket = event.Records[0].s3.bucket.name;
    var key = event.Records[0].s3.object.key;
    var pathToFile = path.basename(key)


    var params = {
        Bucket: bucket,
        Key: key,
        Tagging: {
            TagSet: [
                {
                    Key: "av-status",
                    Value: "INFECTED"
                },
                {
                    Key: "av-timestamp",
                    Value: timestamp
                }
            ]
        }
    };

    // perform file scan
    let virusScanStatus = scanLocalFile(event, pathToFile);

    console.log("Scan result: " + virusScanStatus);

    s3.putObjectTagging(params, function(err, data) {
        if (err) console.log(err, err.stack); // an error occurred
        else     console.log(data);           // successful response
    });


    console.log("------ logging -------");
    console.log("date: " + timestamp);
    return context.logStreamName
};

async function scanLocalFile(event, pathToFile) {
    let s3ObjectKey = utils.extractKeyFromS3Event(event);
    let s3ObjectBucket = utils.extractBucketFromS3Event(event);

    await clamav.downloadAVDefinitions(constants.CLAMAV_BUCKET_NAME, constants.PATH_TO_AV_DEFINITIONS);

    await downloadFileFromS3(s3ObjectKey, s3ObjectBucket);

    let virusScanStatus = clamav.scanLocalFile(path.basename(s3ObjectKey));

    utils.generateSystemMessage(`Scan status: ${virusScanStatus}`);

    return 'SAFE';
}

function downloadFileFromS3(s3ObjectKey, s3ObjectBucket) {
    const downloadDir = `/tmp/download`;
    if (!fs.existsSync(downloadDir)){
        fs.mkdirSync(downloadDir);
    }
    let localPath = `${downloadDir}/${path.basename(s3ObjectKey)}`;

    let writeStream = fs.createWriteStream(localPath);

    utils.generateSystemMessage(`Downloading file s3://${s3ObjectBucket}/${s3ObjectKey}`);

    let options = {
        Bucket: s3ObjectBucket,
        Key   : s3ObjectKey,
    };

    return new Promise((resolve, reject) => {
        s3.getObject(options).createReadStream().on('end', function () {
            utils.generateSystemMessage(`Finished downloading new object ${s3ObjectKey}`);
            resolve();
        }).on('error', function (err) {
            console.log(err);
            reject();
        }).pipe(writeStream);
    });
}
