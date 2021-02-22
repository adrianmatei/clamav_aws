const AWS = require('aws-sdk');
const fs = require('fs');
const utils = require('./utils');
const path = require('path');
const constants = require('./constants');
const execSync = require('child_process').execSync;

const S3 = new AWS.S3();

async function downloadAVDefinitions() {
    const downloadPromises = constants.CLAMAV_DEFINITIONS_FILES.map((filenameToDownload) => {
        return new Promise((resolve, reject) => {
            let destinationFile = path.join('/tmp/', filenameToDownload);

            console.log('Downloading ' + filenameToDownload + 'from S3 to' + destinationFile);

            let localFileWriteStream = fs.createWriteStream(destinationFile);

            let options = {
                Bucket: constants.CLAMAV_BUCKET_NAME,
                Key   : `${constants.PATH_TO_AV_DEFINITIONS}/${filenameToDownload}`,
            };

            let s3ReadStream = S3.getObject(options).createReadStream().on('end', function () {
                console.log('Finished download ' + filenameToDownload);
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

function scanLocalFile(pathToFile) {
    try {
        let result = execSync(`${constants.PATH_TO_CLAMAV} -v -a --stdout -d /tmp/ '/tmp/download/${pathToFile}'`);

        utils.generateSystemMessage('SUCCESSFUL SCAN, FILE CLEAN');

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

module.exports = {
    downloadAVDefinitions: downloadAVDefinitions,
    scanLocalFile: scanLocalFile
};
