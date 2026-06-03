const https = require('https');

// Get the full CLOUDINARY_URL from Railway API
const mutation = JSON.stringify({
  query: `query {
    variables(serviceId: "f5a221f7-85fe-4232-8b9f-30d85da66468", environmentId: "f4163da5-8ab5-4b4e-8127-7c53524f5ddf") {
      edges { node { name value } }
    }
  }`
});

const req = https.request({
  hostname: 'backboard.railway.com',
  path: '/graphql/v2',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': '***'
  }
}, res => {
  let d = '';
  res.on('data', c => d += c);
  res.on('end', () => {
    console.log(d.slice(0, 2000));
  });
});
req.on('error', e => console.log('ERR:', e.message));
req.write(mutation);
req.end();
