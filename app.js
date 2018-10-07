'use strict';

const Homey = require('homey');
const http = require('http');

const settings = Homey.ManagerSettings;

class homeyAlarmeringDroid extends Homey.App {

    async onInit() {
        this.logMessage('nl.alarmeringdroid.homey is being initialized');

        // Initiele zoekslag om last id te bepalen
        this.fetchFeed(false);
        settings.set('lastnotify', 0);
    }

    logMessage(sLog) {
        // Only for debug purposes
        this.log(sLog);
    }

    feedReceived(sFeed, bNotify) {
        // feed is binnen, check of er meldingen zijn
        try {
            var obj = JSON.parse(sFeed);

            // melding gevonden? Dan notify starten
            if (obj.meldingen.length) {
                if (bNotify) {
                    var item = obj.meldingen[0];

                    this.logMessage('Notified with: ' + item.tekstmelding);

                    if (settings.get('lastnotify') != item.id) {
                        settings.set('lastnotify', item.id);

                        // flow triggeren als we een melding binnen hebben gekregen
                        let startTrigger = new Homey.FlowCardTrigger('new_message');
                        startTrigger
                            .register()
                            .trigger({ tekst: item.tekstmelding, ruwetekst: item.melding, dienst: item.dienst });

                        // flow.trigger('new_message', { tekst: item.tekstmelding, ruwetekst: item.melding, dienst: item.dienst });
                    }
                }
            }

            this.logMessage('Setting high_id to: ' + obj.high_id);
            settings.set('lastid', obj.high_id);
        }
        catch (ex) {
            this.logMessage('Exception: ' + ex);
        }
    }

    fetchFeed(bNotify) {
        // meldingen feed ophalen
        var data = '';
        var params = {
            regios: this.paramToArray('' + settings.get('regio')),
            diensten: this.paramToArray('' + settings.get('dienst')),
            prio1: settings.get('prio1'),
            lifeliners: settings.get('life'),
            gemeenten: this.paramToArray(settings.get('gemeente')),
            capcodes: this.paramToArray(settings.get('capcode')),
            woonplaatsen: this.paramToArray(settings.get('woonplaats')),
            minid: settings.get('lastid')
        };

        this.logMessage('params: ' + JSON.stringify(params) + ', uri: /api2/find/' + encodeURIComponent(JSON.stringify(params)));

        var req = http.request({
            host: 'beta.alarmeringdroid.nl',
            path: '/api2/find/' + encodeURIComponent(JSON.stringify(params)),
            method: 'GET'
        },
            (response) => {
                response.on('data', chunk => data += chunk);
                response.on('end', () => this.feedReceived(data, bNotify));
            });

        req.on('error', e => this.logMessage('Exception in fetchFeed: ' + e));
        req.end();

        var myApp = this;
        setTimeout(function () { 
            myApp.fetchFeed(true); 
        }, 15000);
    }

    // omkatten string naar array van strings, of null als leeg
    paramToArray(sParam) {
        var retval = null;

        if (typeof sParam === 'string' && sParam != '') {
            retval = [];
            sParam.split(';').forEach(function (str) { retval.push(str) });
        }

        return retval;
    }
}

module.exports = homeyAlarmeringDroid;