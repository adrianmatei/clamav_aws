const AWS = require('aws-sdk');
const fs = require('fs');
const utils = require('./utils');
const path = require('path');
const constants = require('./constants');
const execSync = require('child_process').execSync;

const S3 = new AWS.S3();

// Download ClamAV virus database
async function downloadAVDefinitions() {
    const downloadPromises = constants.CLAMAV_DEFINITIONS_FILES.map((filenameToDownload) => {
        return new Promise((resolve, reject) => {
            let destinationFile = path.join('/tmp/', filenameToDownload);
            let localFileWriteStream = fs.createWriteStream(destinationFile);

            let options = {
                Bucket: constants.CLAMAV_BUCKET_NAME,
                Key   : `${constants.PATH_TO_AV_DEFINITIONS}/${filenameToDownload}`,
            };

            let s3ReadStream = S3.getObject(options).createReadStream().on('end', function () {
                resolve();
            }).on('error', function (err) {
                console.log('Error downloading definition file ' + filenameToDownload);
                console.log(`${constants.PATH_TO_AV_DEFINITIONS}/${filenameToDownload}`)
                console.log(err);
                reject();
            });

            s3ReadStream.pipe(localFileWriteStream);
        });
    });

    return await Promise.all(downloadPromises);
}

// Scan uploaded file
function scanLocalFile(pathToFile) {
    try {
        let result = execSync(`${constants.PATH_TO_CLAMAV} -v -a --stdout -d /tmp/ '/tmp/download/${pathToFile}'`);
        return constants.STATUS_CLEAN_FILE;
    } catch(err) {
        // Error status 1 means that the file is infected.
        if (err.status === 1) {
            utils.generateSystemMessage('SUCCESSFUL SCAN, FILE INFECTED');
            return constants.STATUS_INFECTED_FILE;
        } else {
            utils.generateSystemMessage('-- SCAN FAILED --');
            console.log(err);
            return constants.STATUS_ERROR_PROCESSING_FILE;
        }
    }
}

// Save object in S3
async function putObjectToS3(bucketName, objectKey, body, options = {}) {
    let putOptions = {
        Bucket: bucketName,
        Key: objectKey,
        Body: body,
        ...(Object.keys(options).length === 0 && options.constructor === Object
            ? {}
            : options)
    };

    return S3.putObject(putOptions).promise();
}

// Remove file from source folder
async function removeObjectFromS3(sourceBucket, sourceKey) {
    const deleteObjectParams = {
        Bucket: sourceBucket,
        Key: sourceKey
    };
    const deleteResult = await S3.deleteObject(deleteObjectParams).promise();

    return `${deleteResult}`;
}

// Tag S3 object
async function taggingObjectInS3(bucketName, objectKey, tag) {
    var taggingParams = {
        Bucket: bucketName,
        Key: objectKey,
        Tagging: tag
    };

    return S3.putObjectTagging(taggingParams).promise();
}

// Get S3 object tags
async function getObjectTaggingFromS3(bucketName, objectKey) {
    const params = {
        Bucket: bucketName,
        Key: objectKey
    };
    return S3.getObjectTagging(params).promise();
}

module.exports = {
    downloadAVDefinitions: downloadAVDefinitions,
    scanLocalFile         : scanLocalFile,
    putObjectToS3         : putObjectToS3,
    removeObjectFromS3    : removeObjectFromS3,
    taggingObjectInS3     : taggingObjectInS3,
    getObjectTaggingFromS3: getObjectTaggingFromS3
};
