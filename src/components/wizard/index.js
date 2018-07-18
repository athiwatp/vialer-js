module.exports = (app) => {
    // Initialize sub-components of the wizard.
    Vue.component('StepMicPermission', require('./components/step_mic_permission')(app))
    Vue.component('StepTelemetry', require('./components/step_telemetry')(app))
    Vue.component('StepVoipaccount', require('./components/step_voipaccount')(app))
    Vue.component('StepWelcome', require('./components/step_welcome')(app))
    /**
    * @memberof fg.components
    */
    const Wizard = {
        computed: app.helpers.sharedComputed(),
        data: function() {
            let data = {
                account: {
                    selection: app.state.availability.voip.selection,
                },
                steps: [
                    {name: 'welcome', ready: true},
                    {name: 'telemetry', ready: null}, // hide the next button.
                    {name: 'microphone', ready: null},
                ],
            }

            if (app.state.availability.voip.selection) {
                data.steps.push({name: 'voipaccount', ready: false})
            }

            return data
        },
        methods: Object.assign({
            finish: function() {
                app.setState({settings: {wizard: {completed: true, step: 0}}}, {persist: true})
                app.notify({icon: 'settings', message: this.$t('almost done! Please check your audio settings.'), type: 'info'})
            },
            nextStep: function() {
                app.setState({settings: {wizard: {step: this.step += 1}}}, {persist: true})
            },
            validateStep: function(type) {
                if (type === 'microphone') {
                    if (this.settings.webrtc.media.permission) {
                        this.steps.find((i) => i.name === 'microphone').ready = true
                    }
                } else if (type === 'voipaccount') {
                    const selectedVoipaccountId = this.settings.webrtc.account.selected.id
                    const accountsLoading = this.settings.webrtc.account.status === 'loading'
                    this.steps.find((i) => i.name === 'voipaccount').ready = (this.validVoipSettings && selectedVoipaccountId && !accountsLoading) ? true : false
                }
            },
        }, app.helpers.sharedMethods()),
        /**
        * Adjusting the wizard steps is done when the component
        * mounts, and when data changes. That is being tracked
        * in appropriate watchers.
        */
        mounted: function() {
            // The microphone step is ready when the permission
            // is already there.
            this.validateStep('microphone')
            if (this.account.selection) this.validateStep('voipaccount')
        },
        render: templates.wizard.r,
        staticRenderFns: templates.wizard.s,
        store: {
            app: 'app',
            permission: 'settings.webrtc.media.permission',
            settings: 'settings',
            step: 'settings.wizard.step',
        },
        watch: {
            permission: function(newPermission) {
                this.validateStep('microphone')
            },
            /**
            * The `voipaccount` step can only be passed when a VoIP account is selected.
            * @param {String} selectedVoipaccountId - The VoIP account that is being selected.
            */
            'settings.webrtc.account.selected.id': function(selectedVoipaccountId) {
                if (this.account.selection) this.validateStep('voipaccount')
            },
            'settings.webrtc.account.status': function(status) {
                if (this.account.selection) this.validateStep('voipaccount')
            },
            'settings.wizard.step': function(newStep) {
                if (this.steps[newStep].name === 'voipaccount') {
                    if (!app.state.availability.voip.selection) {
                        // Skip the account selection step when there are no
                        // accounts from a platform backend to choose from.
                        app.setState({settings: {wizard: {step: this.step += 1}}}, {persist: true})
                    }

                    app.setState({
                        settings: {
                            webrtc: {
                                account: {
                                    selected: this.settings.webrtc.account.selected,
                                },
                                enabled: true,
                            },
                        },
                    }, {persist: true})
                }
            },
        },
    }

    return Wizard
}
