const ruuvi = require('node-ruuvitag');
const http = require("http");

if (process.argv.length < 5) {
    console.log("Usage: node start <RuuviTag ID> <metrics host> <minimum write interval (sec)>")
    process.exit()
}

var ruuviID = process.argv[2]
var writeHost = process.argv[3]
var interval = process.argv[4]

console.log("RuuviTag id: " + ruuviID)
console.log("Writing to host: " + writeHost)
console.log("Minimum write interval: " + interval)

var lastPoll = 0

ruuvi.on('found', tag => {
    console.log('Found RuuviTag id: ' + tag.id)
    tag.on('updated', data => {
        // console.log('Got data from RuuviTag ' + tag.id + ':\n' + JSON.stringify(data, null, '\t'))

        const now = Date.now()
        if (tag.id == ruuviID && now - lastPoll > interval * 1000) {
            lastPoll = now
            write(data)
        }
    })
})
  
ruuvi.on('warning', message => {
    console.error(new Error(message))
})
  
function write(data) {
    const options = {
        hostname: writeHost,
        port: 8428,
        path: '/write',
        method: 'POST',
        headers: {}
      }
    
    var req = http.request(
        options,
        resp => {
            resp.on("data", d => {
                process.stdout.write(d)
            });
        })
        .on("error", err => {
            console.log("Error: " + err.message)
        }
    )

    var s = `ruuvi,tag=ruuvi rssi=${data.rssi},temperature=${data.temperature},humidity=${data.humidity},battery=${data.battery}`

    req.write(s)
    req.end()
}