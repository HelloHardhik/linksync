const http = require('http');

const options = {
    hostname: 'localhost',
    port: 5173,
    path: '/',
    method: 'GET'
};

const req = http.request(options, (res) => {
    console.log(`STATUS: ${res.statusCode}`);
    res.on('data', (d) => {
        // just print first 50 chars to avoid spam
        process.stdout.write(d.toString().substring(0, 50));
    });
});

req.on('error', (e) => {
    console.error(`problem with request: ${e.message}`);
});

req.end();
