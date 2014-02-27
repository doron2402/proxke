//require app configuration
var argv = require('minimist')(process.argv.slice(2)),
	proxke = {},
	fs = require('fs'),
	hapi = require('hapi'),
	response_data = {};

proxke.config = require('../config/config.json');
proxke.routes = require('../config/routes.json');
proxke.random_function = require('objifuncy').objifuncy;


if (argv.p || argv.partner){
    if (!argv.partner)
        argv.partner = argv.p;

    proxke.partner = argv.partner.toString().toLowerCase();

    //Checking if client exsist on configuration
    if (!proxke.routes[ proxke.partner]){
       proxke.partner = proxke.random_function.getFirstEleFromObj(proxke.routes);
       console.warn('Couldnt find the partner you were looking for, using default: %s',proxke.partner);
    }
}
