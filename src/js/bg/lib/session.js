/**
* Common Session class for Click-to-dial and WebRTC calling.
*/
class Session {

    constructor(sip, numberOrSession) {
        this.sip = sip

        this.app = this.sip.app
        this.ua = this.sip.ua
        this.state = this.app.state.sip
    }


    startTimer() {
        this.app.setState({sip: {session: {timer: {current: new Date().getTime(), start: new Date().getTime()}}}})
        this.timerId = window.setInterval(() => {
            this.app.setState({sip: {session: {timer: {current: new Date().getTime()}}}})
        }, 1000)
    }


    stopTimer() {
        clearInterval(this.timerId)
        this.app.setState({sip: {session: {timer: {current: null, start: null}}}})
    }


    resetState() {
        window.setTimeout(() => {
            const defaultState = this.app.getDefaultState().sip
            for (const key of Object.keys(this.app.state.sip)) {
                // We keep these state properties.
                if (!['ua'].includes(key)) {
                    this.app.state.sip[key] = defaultState[key]
                }
            }

            delete this.session
        }, 3000)
    }
}


module.exports = Session