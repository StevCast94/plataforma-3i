const https = require('https');
const fs = require('fs');

const query = JSON.stringify({
  query: '{ service(id: "f5a221f7-85fe-4232-8b9f-30d85da66468") { variableValues } }'
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
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const parsed = JSON.parse(data);
    const vars = parsed?.data?.service?.variableValues;
    if (vars?.CLOUDINARY_URL) {
      fs.writeFileSync('C:/Users/Admin/Desktop/PLATAFORMA 3I/cloudinary_full.txt', vars.CLOUDINARY_URL);
      console.log('OK. Length:', vars.CLOUDINARY_URL.length);
    } else {
      console.log('NO URL:', JSON.stringify(parsed).slice(0, 400));
    }
  });
});
req.on('error', e => console.log('ERR:', e.message));
req.write(query);
req.end();
