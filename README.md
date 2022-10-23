# Openui5-App
Just an example app how to use api-layers with an openui5-app.
To use this app register following Api-Layers under https://apilayer.com/marketplace/:
- https://apilayer.com/marketplace/bank_data-api
- https://countrylayer.com/
- https://ipstack.com/
- https://weatherstack.com/

Then go to file controller/Start.controller and replace all the keys this._bankAccesKey, this._ipstackAccessKey, this._weatherstackAccessKey and this._countrylayerAccessKey in function onInit with your own keys.

Move the complete folder to a webserver. Then you can see the result.
