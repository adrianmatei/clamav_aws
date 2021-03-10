const https = require('https');

const doPostRequest = (bucketName, objectKey) => {
    var domainName = bucketName;

    // replace some bucket names
    if(bucketName == 's3.edu20.com'){ domainName = 'matrixlms.com'; }
    if(bucketName == 's3.edu20.org'){ domainName = 'neolms.com'; }
    if(bucketName == 's3.matrix-lms.com'){ domainName = 'neo-lms.com'; }

    domainName = 'www.' + domainName.replace('s3.','');

    console.log("--- domain name: " + domainName);

    const data = {
        file_path:    objectKey,
        bucket_name:  bucketName
    };

    return new Promise((resolve, reject) => {
        const options = {
            host: domainName,
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
