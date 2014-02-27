//require app configuration
var argv = require('minimist')(process.argv.slice(2)),
	proxke = {},
	fs = require('fs'),
	hapi = require('hapi'),
	response_data = {},
	server_routes = [];

proxke.config = require('../config/config.json');
proxke.routes = require('../config/routes.json');
proxke.random_function = require('objifuncy').objifuncy;

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

        if (request && request.query) { //?phone_number
            console.log(request.query);
        }

        if (request && request.payload) {//json call
            console.log(request.payload);
        }

        console.log(request.url.path);
        if (!response_data[request.route.path].code)
            response_data[request.route.path].code = 200;

        reply(response_data[request.route.path].data)
            .type(response_data[request.route.path].type)
            .header(response_data[request.route.path].header[0], response_data[request.route.path].header[1])
            .code(response_data[request.route.path].code);
    };

    cb(handler);

};


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


/*
	Getting partner name from the command line, if is not define will use the first partner from the routes.json file
*/
if (argv.p || argv.partner){
    if (!argv.partner)
        argv.partner = argv.p;

    proxke.partner = argv.partner.toString().toLowerCase();

    //Checking if client exsist on configuration
    if (!proxke.routes[proxke.partner]){
       proxke.partner = proxke.random_function.getFirstEleFromObj(proxke.routes);
       console.warn('Couldnt find the partner you were looking for, using default: %s',proxke.partner);
    }
}



//Going throw the routes.json
for (var i=0; i < proxke.routes[proxke.partner].path.length; i++){
	var tmp_obj_server = {
		method:  proxke.routes[proxke.partner].path[i].method || 'GET',
		path: proxke.routes[proxke.partner].path[i].req_url || '/api/' + i + '/'
	};

	if (!proxke.routes[proxke.partner].path[i].response.data)
		throw new Error('Theres no data for the request, Please configure routes.json');

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
