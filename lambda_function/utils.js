const constants = require('./constants');


//Extract the key from an S3 event
function extractKeyFromS3Event(s3Event) {
    let key = s3Event['Records'][0]['s3']['object']['key'];

    if (!key) {
        throw new Error("Unable to retrieve key information from the event");
    }

    return key.replace(/\+/g,' ');
}

//Extract the bucket from an S3 event
function extractBucketFromS3Event(s3Event) {
    let bucketName = s3Event['Records'][0]['s3']['bucket']['name'];

    if (!bucketName) {
        throw new Error("Unable to retrieve bucket information from the event");
    }

    return bucketName;
}

function generateSystemMessage(systemMessage) {
    let finalMessage = `--- ${systemMessage} ---`;
    console.log(finalMessage);
    return finalMessage
}

module.exports = {
    extractKeyFromS3Event   : extractKeyFromS3Event,
    extractBucketFromS3Event: extractBucketFromS3Event,
    generateSystemMessage   : generateSystemMessage
};
