sap.ui.define([
	"sap/ui/core/ComponentContainer"
], function(
	ComponentContainer
) {
	"use strict";

	new ComponentContainer({
		name: "de.mk.hackertron"",
		settings : {
			id : "hackertron"
		},
		async: true
	}).placeAt("content");
});