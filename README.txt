# AlarmeringDroid-for-Homey

This app gives Homey the ability to respond to messages of the Dutch P2000 network.

Keep in mind that all messages send on this network are in Dutch.

What works:
* Basic search abilities (capcode, town, region, etc.)
* Use in flow to trigger anything, e.g. speech so Homey tells you what is happening

What could be better:
* Runs approximately twice per minute. (Near) real time would be a nice feature. We are still looking into this.

Last update:
* 1.3.1: Changed code to Homey SDK level 3
* 1.2.0: Changed code to Homey SDK level 2
* 1.1.5: Try harder to prevent duplicate message problem
* 1.1.4: Added option to use raw message text in flows
* 1.1.3: Added option to receive all lifeliner messages
