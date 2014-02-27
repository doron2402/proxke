//require app configuration
var argv = require('minimist')(process.argv.slice(2)),
	proxke = {},
	fs = require('fs'),
	hapi = require('hapi'),
	response_data = {},
	server_routes = [];

proxke.config = require('../config/config.json'); //Server configuration
proxke.routes = require('../config/routes.json'); //Routes
proxke.random_function = require('objifuncy').objifuncy; //Some random object function

/*
    Getting partner name from the command line, if is not define will use the first partner from the routes.json file
*/
if (!argv.partner)
    argv.partner = argv.p;

if (argv.partner)
    proxke.partner = argv.partner.toString().toLowerCase();

//Checking if client exsist on configuration
if (!proxke.routes[proxke.partner]){
    proxke.partner = proxke.random_function.getFirstEleFromObj(proxke.routes);
    console.warn('Couldnt find the partner you were looking for, using default: %s',proxke.partner);
}

//Setting handler for the specific route
proxke.setHandlerAsync = function setHandlerAsync(args, cb){

    //Checking that we using a xml file or a json file by the data two first chars `./`
    if (args.file || (args.response && args.response.data.charAt(0) === '.' && args.response.data.charAt(1) === '/')) {
        fs.readFile(args.response.data, function (err, data) {
            if (err) {
                throw err;
            }
            response_data[args.req_url].data = data;
        });
    }

    var handler = function (request, reply) {
        var validation_query = null;
        if (request && request.query) //?query
            validation_query = request.query;

        if (validation_query == null && request && request.payload) //json
            validation_query = request.payload;

        if (!response_data[request.route.path].code)
            response_data[request.route.path].code = 200;

        console.log(request.url.path);

        reply(response_data[request.route.path].data)
            .type(response_data[request.route.path].type)
            .header(response_data[request.route.path].header[0], response_data[request.route.path].header[1])
            .code(response_data[request.route.path].code);
    };

    cb(handler);

};

// Building server
proxke.buildServer = function buildServer(args){
	var options;

    if (args.tls && args.tls.active){
        options = {
            tls: {
                key: fs.readFileSync(args.tls.key),
                cert: fs.readFileSync(args.tls.cert)
            },
            cors: true
        };
    } else {
        options = {cors: true};
    }

    var server = hapi.createServer(proxke.config.name, proxke.config.port,options);
    server.route(server_routes);
    server.start();
};





// Going throw the routes.json
for (var i=0; i < proxke.routes[proxke.partner].path.length; i++){

    var tmp_obj_server = {
	 	method:  proxke.routes[proxke.partner].path[i].method || 'GET', // Route method
		path: proxke.routes[proxke.partner].path[i].req_url || '/api/' + i + '/'  // Route path
	};

	if (!proxke.routes[proxke.partner].path[i].response.data && !proxke.routes[proxke.partner].path[i].response[0].data)
		throw new Error('Theres no data for the request, Please configure routes.json');

    if (typeof proxke.routes[proxke.partner].path[i].response === 'array')
        response_data[tmp_obj_server.path] = proxke.routes[proxke.partner].path[i].response[0];
    else
	   response_data[tmp_obj_server.path] = proxke.routes[proxke.partner].path[i].response;

	proxke.setHandlerAsync(proxke.routes[proxke.partner], function(result){
		tmp_obj_server.handler = result;
		server_routes.push(tmp_obj_server);

		if ((i+1) === proxke.routes[proxke.partner].path.length){
			proxke.routes[proxke.partner].name = proxke.partner;
			proxke.buildServer(proxke.routes[proxke.partner]);
		}
	});

}



console.log('Proxy Server is running listening on port: ' + proxke.config.port);
console.log('Starting...: %s', proxke.partner);
