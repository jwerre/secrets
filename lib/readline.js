const readline = require( 'readline' );
const Secrets = require( './secrets' );

const rl = readline.createInterface( {
	input: process.stdin,
	output: process.stdout
});

rl.on( 'line', function (input) {

	try {

		let secrets = new Secrets( JSON.parse( input ) );
		
		secrets.config()
			.then( (config) => {

				try {
					console.log( JSON.stringify( { config } ) );
				} catch (err) {
					return Promise.reject(err);
				}
				
			})
			.catch( errorHandler );

	} catch( err ) {

		errorHandler( err );

	} finally {

		rl.close();

	}

});


function errorHandler( err ) {

	let error = Object.assign( 
		{},
		err,
		{ message: err.message }
	);

	console.log( JSON.stringify( { error } ) );

}
