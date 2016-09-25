'use strict';

const http = require('http');
const settings = Homey.manager('settings');
const cron = Homey.manager('cron');
const flow = Homey.manager('flow');

function init() {
	logMessage('nl.alarmeringdroid.homey is being initialized');

    // Initiele zoekslag om last id te bepalen
    fetchFeed(false);
    
    // Toevoegen aan cron voor iedere minuut een nieuwe zoekslag
    cron.registerTask('alarmeringdroid', '* * * * *', null, function(err, success) {
        if (! success) {
            logMessage('Could not register crontask');
        }
        else {
            logMessage('Succesfully registered crontask');
        }
    });
    
    // meldingen zoeken als cron ons start
    cron.on('alarmeringdroid', function(data) {
        logMessage('crontab aanroep');
        
        try {
            fetchFeed(true);
            
            setTimeout(function() { fetchFeed(true) }, 25000);
        }
        catch (ex) {
            logMessage('Exception: ' + ex);
        }
    });
    
    // crontab verwijderen
    Homey.on('unload', function(){
        cron.unregisterTask('alarmeringdroid', function(err, success) {
            logMessage('We\'re out of here');
        });
    });
}

function logMessage(sLog) {
    // Only for debug purposes
    // Homey.log(sLog);
}

function feedReceived(sFeed, bNotify) {
    // feed is binnen, check of er meldingen zijn
    try {
        var obj = JSON.parse(sFeed);

        // melding gevonden? Dan notify starten
        if (obj.meldingen.length) {
            if (bNotify) {
                var item = obj.meldingen[0];
                
                logMessage('Notified with: ' + item.tekstmelding);
                
                // flow triggeren als we een melding binnen hebben gekregen
                flow.trigger('new_message', { tekst: item.tekstmelding, dienst: item.dienst });
            }            
        }

        logMessage('Setting high_id to: ' + obj.high_id);
        settings.set('lastid', obj.high_id);
    }
    catch (ex) {
        logMessage('Exception: ' + ex);
    }
}

function fetchFeed(bNotify) {
    // meldingen feed ophalen
    var data = '';
    var params = { 
        regios: paramToArray('' + settings.get('regio')),
        diensten: paramToArray('' + settings.get('dienst')),
        prio1: settings.get('prio1'),
        gemeenten: paramToArray(settings.get('gemeente')),
        capcodes: paramToArray(settings.get('capcode')),
        woonplaatsen: paramToArray(settings.get('woonplaats')),
        minid: settings.get('lastid')
    }; 
    
    logMessage('params: ' + JSON.stringify(params));
    
    var req = http.request({
            host:   'beta.alarmeringdroid.nl',
            path:   '/api2/find/' + encodeURIComponent(JSON.stringify(params)),
            method: 'GET'
        },
        (response) => {
            response.on('data', chunk => data += chunk);
            response.on('end', () => feedReceived(data, bNotify));
        });

    req.on('error', e => logMessage('Exception in fetchFeed: ' + e));
    req.end();
}

// omkatten string naar array van strings, of null als leeg
function paramToArray(sParam) {
    var retval = null;
    
    if (typeof sParam === 'string' && sParam != '') {
        retval = [];
        sParam.split(';').forEach(function(str) { retval.push(str) });
    }

    return retval;
}
    
module.exports.init = init;