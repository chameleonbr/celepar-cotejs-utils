export default class MsgError extends Error {
    constructor(message, file, line) {
        super(message, file, line)
    }
    toJSON() {
        return {
            ok: 0,
            message: this.message,
        }
    }
    static fromError(err){
        return new MsgError(err.message)
    }
}