const constants = require('./constants');
const clamav = require('./clamav');
const path = require('path');

exports.handler = (event, context) => {
    // dependencies
    const AWS = require('aws-sdk');
    const s3 = new AWS.S3();

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
    let virusScanStatus = scanLocalFile(pathToFile);

    console.log("Scan result: " + virusScanStatus);

    s3.putObjectTagging(params, function(err, data) {
        if (err) console.log(err, err.stack); // an error occurred
        else     console.log(data);           // successful response
    });


    console.log("------ logging -------");
    console.log("date: " + timestamp);
    return context.logStreamName
};

async function scanLocalFile(pathToFile) {
    await clamav.downloadAVDefinitions(constants.CLAMAV_BUCKET_NAME, constants.PATH_TO_AV_DEFINITIONS);

    return 'SAFE';
}
