
const cote = require('cote')

const responder1 = new cote.Responder({
    name: 'resp1'
});
const responder2 = new cote.Responder({
    name: 'resp2'
});

responder1.on('mtd1', (req, cb) => {
    cb('OK1!');
});

responder2.on('mtd2', (req, cb) => {
    cb('OK2!');
});

const requester = new cote.Requester({
    name: 'req1'
});

const request = {
    type: 'mtd1',
    val: 'test'
};


setInterval(() => {
    console.log('calling...')
    requester.send(request, (res) => {
        console.log(res);
    });
}, 1000)