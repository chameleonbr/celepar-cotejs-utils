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
class CeleparCotePublisher extends cote.Publisher {
    async pub(service, message) {
        let req = {
            type: service.toLowerCase(),
            message: message
        }
        try {
            this.publish(service.toLowerCase(), req)
        } catch (err) {
            throw MsgError.fromError(err)
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
        this.subscriber = new cote.Subscriber(Object.assign({}, this.opt, {
            name: this.opt.name + ':Subscriber'
        }), this.config)
        this.publisher = new CeleparCotePublisher(Object.assign({}, this.opt, {
            name: this.opt.name + ':Publisher'
        }), this.config)
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
        let methods = getAllMethods(obj).concat(getAllMethods(Object.getPrototypeOf(obj)))
        methods.forEach((method) => {
            if (method !== 'constructor') {
                if (method.substring(3,0).toLowerCase() === 'sub') {
                    that.subscriber.on(method.substring(3).toLowerCase(), async(req) => {
                        try {
                            let msg = req.message
                            return await obj[method].call(obj, msg)
                        } catch (err) {
                            throw MsgError.fromError(err)
                        }
                    })
                }
                else {
                    that.serverMethod.on(method, async(req) => {
                        try {
                            let msg = req.message
                            return await obj[method].call(obj, msg)
                        } catch (err) {
                            throw MsgError.fromError(err)
                        }
                    })
                }
            }
        })
    }
}
