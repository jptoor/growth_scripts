const measurement_id = `XXXXX`;
const api_secret = `XXXXX`;


response = fetch(`https://www.google-analytics.com/debug/mp/collect?measurement_id=${measurement_id}&api_secret=${api_secret}`, {
  method: "POST",
  body: JSON.stringify({
  client_id: '123.123',
  timestamp_micros: 1719257050000000
})
}).then(response => response.json())
.then(data => {
  console.log('Success:', data);
})
.catch(error => {
  console.error('Error:', error);
});
