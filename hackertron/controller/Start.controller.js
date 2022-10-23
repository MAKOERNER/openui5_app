sap.ui.define([
	"sap/ui/core/mvc/Controller",
    "sap/m/MessageBox",
    "sap/ui/model/json/JSONModel"
], function(
	Controller,
	MessageBox,
	JSONModel
) {
	"use strict";

	return Controller.extend("de.mk.hackertron.controller.Start", {
        /**
         * @override
         */


        onInit: function() {
            //Get IP-Data and location
            this._bankAccesKey = <YOUR_KEY>;
            this._ipstackAccessKey = <YOUR_KEY>;
            this._weatherstackAccessKey = <YOUR_KEY>;
            this._countrylayerAccessKey = <YOUR_KEY>;
            var that = this;
            var viewData = {
                weather: false,
                bank: false,
                iban: false
            }
            var ibanData = {};
            this.getView().setModel(new JSONModel(viewData), "viewData");
            this.getView().setModel(new JSONModel(ibanData), "iban");
            this.getView().setModel(new JSONModel(ibanData), "ibanData");
            $.getJSON("http://ip-api.com/json", function(data) {
                that._getIpData(data);
            });        
        },

        _onNewIbanTab(oEvent){
            //Wenn eine Ibane erzeugt werden soll und wir noch keine Länder haben, dann 
            //werden die ersteinmal gesuch
            var key = oEvent.getParameter("key");
            var that = this;
            var country = this.getView().getModel("startData").getData().country_code;
            if (key === "getIban" && !this._countries)
            {
                $.ajax({
                    url: 'http://api.countrylayer.com/v2/all',
                    data: {
                      access_key: this._countrylayerAccessKey
                    },
                    dataType: 'json',
                    success: function(apiResponse) {
                        that.getView().setModel(new JSONModel(apiResponse), "countries");
                        that._countries = true;
                        that.getView().byId("countries").setSelectedKey(country);
                    },
                    error: function(apiResponse){
                        MessageBox.error(apiResponse.error.info);
                    }
                  });
            } 
        },

        _getIbanStructure(country){
            //Definition der IBAN lesen
            var that = this;
            this.getView().setBusy(true);
            var myHeaders = new Headers();
            myHeaders.append("apikey", this._bankAccesKey);

            var requestOptions = {
                method: 'GET',
                redirect: 'follow',
                headers: myHeaders
            };

        fetch("https://api.apilayer.com/bank_data/iban_fields?country=" + country, requestOptions)
            .then(response => response.text())
            .then(result => {
                this.getView().setBusy(false);
                var data = JSON.parse(result);
                var struc = {};
                data.fields.forEach(element => {
                    if (element.field === "bank_code") {
                        struc.bankLength = parseInt(element.length);
                    }
                    if (element.field === "account_number") {
                        struc.accLength = parseInt(element.length);
                    }
                });
                that.getView().setModel(new JSONModel(struc), "ibanStruc");
             })
            .catch(error => {
                this.getView().setBusy(false);
                MessageBox.error(error)
            });
        },

        _getIpData(data){
            var that = this;
        $.ajax({
            url: 'http://api.ipstack.com/' + data.query,
            data: {
              access_key: this._ipstackAccessKey
            },
            dataType: 'json',
            success: function(apiResponse) {
                that.getView().setModel(new JSONModel(apiResponse), "startData");
                that._getIbanStructure(apiResponse.country_code);
            },
            error: function(apiResponse){
                MessageBox.error(apiResponse.error.info);
            }
          });
        },

		_getWeather: function(oEvent) {
            //Wetterdaten holen und darstellen
            var that = this;
            const oData = this.getView().getModel("startData").getData();
            var viewData = this.getView().getModel("viewData").getData();
            $.ajax({
                url: 'http://api.weatherstack.com/current',
                data: {
                  access_key: this._weatherstackAccessKey,
                  query: oData.city
                },
                dataType: 'json',
                success: function(apiResponse) {
                    viewData.weather = true;
                    viewData.bank = false;
                    viewData.iban = false;
                    if (apiResponse.error) {
                        MessageBox.error(apiResponse.error.info);
                    } else {
                    that.getView().setModel(new JSONModel(viewData), "viewData");
                    that.getView().setModel(new JSONModel(apiResponse.current), "weather");
                    that.getView().byId("icon").setSrc(apiResponse.current.weather_icons[0]);
                }
                },
                error: function(apiResponse){
                    MessageBox.error(apiResponse.error.info);
                }
              });
        },
        
        _checkIban: function(oEvent) {
            var that = this;
            this.getView().setBusy(true);
            var oData = this.getView().getModel("iban").getData();
            var myHeaders = new Headers();
            myHeaders.append("apikey", this._bankAccesKey);

            var requestOptions = {
                method: 'GET',
                redirect: 'follow',
                headers: myHeaders
            };

        fetch("https://api.apilayer.com/bank_data/iban_validate?iban_number=" + oData.iban, requestOptions)
            .then(response => response.text())
            .then(result => {
                this.getView().setBusy(false);
                var data = JSON.parse(result);
                if (!data.valid) {
                    MessageBox.error(data.message);
                } else {
                that.getView().setModel(new JSONModel(data), "iban");
            }})
            .catch(error => {
                this.getView().setBusy(false);
                MessageBox.error(error)
            });
        },

		_getBankData: function(oEvent) {
			//API-Key= BKbxXeugtbXJlvlQVNl97hfYQ2hqAqfw
            var viewData = this.getView().getModel("viewData").getData();
            viewData.weather = false;
            viewData.bank = true;
            viewData.iban = false;
            this.getView().setModel(new JSONModel(viewData), "viewData");
		},

        _getIban (oEvent){
            //Iban-Daten prüfen, generieren
            var viewData = this.getView().getModel("viewData").getData();
            viewData.weather = false;
            viewData.bank = false;
            viewData.iban = true;
            this.getView().setModel(new JSONModel(viewData), "viewData");
        },

		_getIbanCode: function(oEvent) {
			//Aus Bankkonto und BLZ die IBAN generieren
            var that = this;
            var oData = this.getView().getModel("ibanData").getData();
            var oStruc = this.getView().getModel("ibanStruc").getData();
            if (oData.account && oData.account.length < oStruc.accLength){
                for (var i = oData.account.length; i < oStruc.accLength; i++) {
                    oData.account = "0" + oData.account;
                }
            }
            if (oData.account && oData.account.length === oStruc.accLength
                && oData.bank_code && oData.bank_code.length === oStruc.bankLength
                && this.getView().byId("countries").getSelectedKey() !== "") {
                    this.getView().setBusy(true);
                    var myHeaders = new Headers();
                    myHeaders.append("apikey", this._bankAccesKey);

                    var requestOptions = {
                    method: 'GET',
                    redirect: 'follow',
                    headers: myHeaders
                    };
                    var country = this.getView().byId("countries").getSelectedKey();
            fetch("https://api.apilayer.com/bank_data/iban_generate?country=" + country + "&bank_code=" + 
            oData.bank_code + "&account_number=" + oData.account, requestOptions)
                .then(response => response.text())
                .then(result => {
                    this.getView().setBusy(false);
                    var data = JSON.parse(result);
                    if (!data.valid) {
                        MessageBox.error(data.message);
                    } else {
                    that.getView().setModel(new JSONModel(data), "ibanData");
                }})
                .catch(error => {
                    this.getView().setBusy(false);
                    MessageBox.error(error)
                });
                }
		},

		_getStructure: function(oEvent) {
			//Land wurde geändert, Struktur der Iban neu lesen
            var country = oEvent.getParameter("selectedItem").getKey();
            this._getIbanStructure(country);
		}
	});
});
