const cote = require('cote')

const Message = require('./proto/message')
const MsgError = require('./proto/msgerror')

module.exports = class CeleparCote {
    constructor(opt, config) {
        this.opt = opt
        this.config = config || {}
        this.cote = {
            client: new cote.Requester(this.opt, this.config),
            server: new cote.Responder(this.opt, this.config),
            pub: new cote.Publisher(this.opt, this.config),
            sub: new cote.Subscriber(this.opt, this.config)
        }
    }
    pub(topic, body) {
        try {
            this.cote.pub.publish(topic, body)
        } catch (err) {
            throw MsgError.fromError(err)
        }
    }
    sub(topic, subscribeFunc) {
        try {
            this.cote.pub.on(topic, subscribeFunc)
        } catch (err) {
            throw MsgError.fromError(err)
        }
    }
    async request(topic, req) {
        try {
            let options = {
                type: topic,
                message: req
            }
            console.log(options)
            return await this.cote.client.send(options)
        } catch (err) {
            throw MsgError.fromError(err)
        }
    }
    method(topic, serviceFunc) {
        this.cote.server.on(topic, async(req) => {
            try {
                let msg = req.message
                return await serviceFunc(msg)
            } catch (err) {
                throw MsgError.fromError(err)
            }
        })
    }
}