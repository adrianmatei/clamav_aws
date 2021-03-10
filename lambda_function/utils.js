const AWS = require('aws-sdk');
const s3 = new AWS.S3();
const constants = require('./constants');

//Extract the key from an S3 event
function extractKeyFromS3Event(s3Event) {
    let key = s3Event['Records'][0]['s3']['object']['key'];
    let decodedKey = decodeURIComponent(key);

    if (!key) {
        throw new Error("Unable to retrieve key information from the event");
    }

    return decodedKey.replace(/\+/g,' ');
}

//Extract the bucket from an S3 event
function extractBucketFromS3Event(s3Event) {
    let bucketName = s3Event['Records'][0]['s3']['bucket']['name'];

    if (!bucketName) {
        throw new Error("Unable to retrieve bucket information from the event");
    }

    return bucketName;
}

// Generate S3 object tags
function generateTagSet(virusScanStatus) {
    return {
        TagSet: [
            {
                Key  : constants.VIRUS_STATUS_STATUS_KEY,
                Value: virusScanStatus
            },
            {
                Key  : constants.VIRUS_SCAN_TIMESTAMP_KEY,
                Value: new Date().getTime().toString()
            }
        ]
    };
}

// Retrieve the file size of S3 object without downloading.
async function sizeOf(key, bucket) {
    let res = await s3.headObject({ Key: key, Bucket: bucket }).promise();
    return res.ContentLength;
}

// Check if S3 object is larger then the MAX_FILE_SIZE set.
async function isS3FileTooBig(s3ObjectKey, s3ObjectBucket) {
    let fileSize = await sizeOf(s3ObjectKey, s3ObjectBucket);

    return (fileSize > constants.MAX_FILE_SIZE);
}

// Add tags for the dummy file
function addDummyTagSet (tagSet = { TagSet: [] }) {
    return {
        TagSet: [
            ...tagSet.TagSet,
            {
                Key: constants.FILE_TYPE,
                Value: constants.PDF_REPLACEMENT
            }
        ]
    };
}

// Check if the file is an image
function isFileImage(fileType) {
    const acceptedImageTypes = ['image/bmp', 'image/gif', 'image/jpeg', 'image/png', 'image/vnd.microsoft.icon', 'image/tiff', 'image/svg+xml', 'image/webp'];

    if(acceptedImageTypes.includes(fileType)) {
        return true;
    } else {
        return false;
    }
}

// Check if the file is an SVG
function isSVG(fileType) {
    const acceptedImageTypes = ['image/svg+xml'];

    if(acceptedImageTypes.includes(fileType)) {
        return true;
    } else {
        return false;
    }
}

function generateSystemMessage(systemMessage) {
    let finalMessage = `--- ${systemMessage} ---`;
    console.log(finalMessage);
    return finalMessage;
}

module.exports = {
    extractKeyFromS3Event   : extractKeyFromS3Event,
    extractBucketFromS3Event: extractBucketFromS3Event,
    generateSystemMessage   : generateSystemMessage,
    generateTagSet          : generateTagSet,
    isS3FileTooBig          : isS3FileTooBig,
    addDummyTagSet          : addDummyTagSet,
    isFileImage             : isFileImage,
    isSVG                   : isSVG
};
