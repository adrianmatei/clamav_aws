const AWS = require('aws-sdk');
const s3 = new AWS.S3();
const constants = require('./constants');
const clamav = require('./clamav');
const utils = require('./utils');
const path = require('path');
const fs = require('fs');

exports.handler = (event, context) => {
    let s3ObjectKey = utils.extractKeyFromS3Event(event);
    let pathToFile = path.basename(s3ObjectKey);

    // perform file scan
    scanLocalFile(event, pathToFile);

    return context.logStreamName;
};

async function scanLocalFile(event, pathToFile) {
    let s3ObjectKey = utils.extractKeyFromS3Event(event);
    let s3ObjectBucket = utils.extractBucketFromS3Event(event);
    let virusScanStatus = constants.STATUS_SKIPPED_FILE;
    let objectHead = await s3.headObject({ Bucket:s3ObjectBucket, Key:s3ObjectKey }).promise();
    let objectIsFileImage = utils.isFileImage(objectHead["ContentType"]);
    let objectIsSVG = utils.isSVG(objectHead["ContentType"]);

    await clamav.downloadAVDefinitions(constants.CLAMAV_BUCKET_NAME, constants.PATH_TO_AV_DEFINITIONS);
    await downloadFileFromS3(s3ObjectKey, s3ObjectBucket);

    // Check if the file is a dummy file. If yes, skip scanning
    const tagData = await clamav.getObjectTaggingFromS3(s3ObjectBucket, s3ObjectKey);

    if (tagData && tagData.TagSet && tagData.TagSet.length) {
        const fileTypeTag = tagData.TagSet.find(
            tag => tag.Key === constants.FILE_TYPE
        );

        if (fileTypeTag.Value === constants.PDF_REPLACEMENT || fileTypeTag.Value === constants.GIF_REPLACEMENT) {
            console.log("--- Skipping file --");
            return constants.STATUS_SKIPPED_FILE;
        }
    }

    // scan file if it's not too big
    if(!await utils.isS3FileTooBig(s3ObjectKey, s3ObjectBucket)) {

        // run the scanner
        virusScanStatus = clamav.scanLocalFile(path.basename(s3ObjectKey));

        // check svg files for embeded scripts
        if(objectIsSVG && virusScanStatus === constants.STATUS_CLEAN_FILE){
            let fullPath = '/tmp/download/' + path.basename(s3ObjectKey);
            var svgData = fs.readFileSync(fullPath, 'utf8');

            if(svgData.includes('<script')) {
                virusScanStatus = constants.STATUS_INFECTED_FILE;
            }
        }

        utils.generateSystemMessage(`Scan status: ${virusScanStatus}`);
    }

    // replace file if infected and add tags
    try {
        const tagSetForScannedFile = utils.generateTagSet(virusScanStatus);

        if (virusScanStatus === constants.STATUS_INFECTED_FILE) {
            // remove the infected file
            let removeResult = await clamav.removeObjectFromS3(
                s3ObjectBucket, // source bucket
                s3ObjectKey
            );
            utils.generateSystemMessage(`Remove the infected file successful with result ${removeResult}`);

            // Replace the source file with dummy PDF/GIF
            let putResult = await replaceFile(s3ObjectBucket, s3ObjectKey, objectIsFileImage);
            utils.generateSystemMessage(`Put the dummy file successful with result ${putResult}`);

            // Tag the dummy file with the same detail as original file
            await clamav.taggingObjectInS3(
                s3ObjectBucket,
                s3ObjectKey,
                utils.addDummyTagSet(tagSetForScannedFile)
            );
        } else if (virusScanStatus === constants.STATUS_CLEAN_FILE) {
            await clamav.taggingObjectInS3(
                s3ObjectBucket,
                s3ObjectKey,
                utils.generateTagSet(virusScanStatus)
            );
        }
    } catch(err) {
        console.log("Tagging error" + err);
    }

    return virusScanStatus;
}

// download the file about to be scanned from S3 and save it in /tmp/download
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

// replace infected file with the canned message in S3
async function replaceFile(s3ObjectBucket, s3ObjectKey, isImage){
    let fileName = isImage ? constants.GIF_FILE_NAME : constants.PDF_FILE_NAME;
    let contentType = isImage ? 'image/gif' : "application/pdf";

    let putResult = await clamav.putObjectToS3(
        s3ObjectBucket,
        s3ObjectKey,
        fs.createReadStream(
            path.join(
                constants.ASSET_PATH,
                fileName
            )
        ),
        { ContentType: contentType }
    );

    return putResult;
}
