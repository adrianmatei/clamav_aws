const AWS = require('aws-sdk');
const fs = require('fs');
const path = require('path');
const constants = require('./constants');

const S3 = new AWS.S3();

async function downloadAVDefinitions() {
    const downloadPromises = constants.CLAMAV_DEFINITIONS_FILES.map((filenameToDownload) => {
        return new Promise((resolve, reject) => {
            let destinationFile = path.join('/tmp/', filenameToDownload);

            console.log('Downloading' + filenameToDownload + 'from S3 to' + destinationFile);

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


module.exports = {
    downloadAVDefinitions: downloadAVDefinitions,
};
