const cote = require('cote')

const Message = require('./proto/message')
const MsgError = require('./proto/msgerror')

module.exports = class {
    constructor(name, config) {
        this.name = name
        this.config = config || {}
        this.service = {
            client: new cote.Requester({
                name: this.name + ':Client'
            }, this.config),
            server: new cote.Responder({
                name: this.name + ':Server'
            }, this.config),
            pub: new cote.Publisher({
                name: this.name + ':Publisher',
            }, this.config),
            sub: new cote.Subscriber({
                name: this.name + ':Subscriber',
            }, this.config)
        }
    }
    async pub(topic, body) {
        try {
            await this.service.pub.publish(topic, body)
        } catch (err) {
            throw MsgError.fromError(err)
        }
    }
    async sub(topic, serviceFunc) {
        try {
            this.service.pub.on(topic, (req) => {
                let msg = req.message
                try {
                    return await serviceFunc(msg)
                } catch (err) {
                    throw MsgError.fromError(err)
                }
            })
        } catch (err) {
            throw MsgError.fromError(err)
        }
    }
    async request(topic, msg) {
        let msg = new Message(topic, msg)
        try {
            let data = await this.service.client.send(msg)
            return data.message
        } catch (err) {
            throw MsgError.fromError(err)
        }
    }
    async service(topic, serviceFunc) {
        this.service.server.on(topic, (req) => {
            let msg = req.message
            try {
                return await serviceFunc(msg)
            } catch (err) {
                throw MsgError.fromError(err)
            }
        })
    }
}