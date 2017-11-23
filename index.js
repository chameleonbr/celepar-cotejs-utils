const cote = require('cote')

const Message = require('./proto/message')
const MsgError = require('./proto/msgerror')

class CeleparCoteRequester extends cote.Requester {
    async request(service, message) {
        let req = {
            type: service,
            message: message
        }
        try {
            return await this.send(req)
        } catch (err) {
            throw err
        }
    }
}

function getAllMethods(object) {
    return Object.getOwnPropertyNames(object).filter(function (property) {
        return typeof object[property] == 'function';
    });
}

module.exports = class CeleparCote {
    constructor(opt, config) {
        this.opt = opt
        this.config = config || {}
        if (opt.keys !== undefined && opt.keys.length > 0) {
            let that = this
            opt.keys.forEach((item) => {
                let cfg = Object.assign({}, opt, {
                    name: opt.name + ':' + item + ':Requester',
                    key: item,
                    keys: undefined
                })
                that[item] = new CeleparCoteRequester(cfg, that.config)
            })
        }
        this.serverMethod = new cote.Responder(Object.assign({}, this.opt, {
            name: this.opt.name + ':Responder'
        }), this.config)
        this.publisher = new cote.Publisher(Object.assign({}, this.opt, {
            name: this.opt.name + ':Publisher'
        }), this.config)
        this.subscriber = new cote.Subscriber(Object.assign({}, this.opt, {
            name: this.opt.name + ':Subscriber'
        }), this.config)
    }
    pub(topic, body) {
        try {
            this.publisher.publish(topic, body)
        } catch (err) {
            throw MsgError.fromError(err)
        }
    }
    sub(topic, subscribeFunc) {
        try {
            this.subscriber.on(topic, subscribeFunc)
        } catch (err) {
            throw MsgError.fromError(err)
        }
    }
    method(topic, serviceFunc) {
        this.serverMethod.on(topic, async(req) => {
            try {
                let msg = req.message
                return await serviceFunc(msg)
            } catch (err) {
                throw MsgError.fromError(err)
            }
        })
    }
    use(obj) {
        let that = this
        getAllMethods(Object.getPrototypeOf(obj)).forEach((method) => {
            if (method !== 'constructor') {
                that.serverMethod.on(method, async(req) => {
                    try {
                        let msg = req.message
                        return await obj[method].call(obj, msg)
                    } catch (err) {
                        throw MsgError.fromError(err)
                    }
                })
            }
        })
    }
}