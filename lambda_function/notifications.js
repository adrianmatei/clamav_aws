const https = require('https');
const AWS = require('aws-sdk');
const s3 = new AWS.S3();

const doPostRequest = (bucketName, fileName) => {
    const params = {'Bucket': bucketName, 'Key': fileName};
    var objectURL  = '';
    s3.getSignedUrl('putObject', params, function (err, url) {
        objectURL = url;
    });

    console.log("--- objectURL: " + objectURL);

    const data = {
        file_url:    objectURL,
        bucket_name: bucketName
    };

    return new Promise((resolve, reject) => {
        const options = {
            host: 'www.matrix-lms.com', // TODO: select host according to bucket name
            path: '/info/virus_detected',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        };

        //create the request object with the callback with the result
        const req = https.request(options, (res) => {
            resolve(JSON.stringify(res.statusCode));
        });

        // handle the possible errors
        req.on('error', (e) => {
            reject(e.message);
        });

        //do the request
        req.write(JSON.stringify(data));

        //finish the request
        req.end();
    });
};


exports.handler = async (event) => {
    await doPostRequest()
        .then(result => console.log(`Status code: ${result}`))
        .catch(err => console.error(`Error doing the request for the event: ${JSON.stringify(event)} => ${err}`));
};

module.exports = {
    doPostRequest   : doPostRequest
};
