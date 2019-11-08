/***********************
 
  Load Components!

  Express      - A Node.js Framework
  Body-Parser  - A tool to help use parse the data in a post request
  Pug          - A view engine for dynamically rendering HTML pages
  Pg-Promise   - A database tool to help use connect to our PostgreSQL database

***********************/

const express = require('express'); // Add the express framework has been added
let app = express();

const bodyParser = require('body-parser'); // Add the body-parser tool has been added
app.use(bodyParser.json());              // Add support for JSON encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // Add support for URL encoded bodies

const pug = require('pug'); // Add the 'pug' view engine

//Create Database Connection
const pgp = require('pg-promise')();


/**********************
  
  Database Connection information

  host: This defines the ip address of the server hosting our database.  We'll be using localhost and run our database on our local machine (i.e. can't be access via the Internet)
  port: This defines what port we can expect to communicate to our database.  We'll use 5432 to talk with PostgreSQL
  database: This is the name of our specific database.  From our previous lab, we created the football_db database, which holds our football data tables
  user: This should be left as postgres, the default user account created when PostgreSQL was installed
  password: This the password for accessing the database.  You'll need to set a password USING THE PSQL TERMINAL THIS IS NOT A PASSWORD FOR POSTGRES USER ACCOUNT IN LINUX!

**********************/
// REMEMBER to chage the password

const dbConfig = {
	host: 'localhost',
	port: 5432,
	database: 'football_db',
	user: 'postgres',
	password: 'Lyx!19980128'
};

let db = pgp(dbConfig);

// set the view engine to ejs
app.set('view engine', 'pug');
app.use(express.static(__dirname + '/')); // This line is necessary for us to use relative paths and access our resources directory


// login page 
app.get('/login', function(req, res) {
	res.render('pages/login',{
		local_css:"signin.css", 
		my_title:"Login Page"
	});
});

// registration page 
app.get('/register', function(req, res) {
	res.render('pages/register',{
		my_title:"Registration Page"
	});
});

app.get('/home', function (req, res) {
	var query = 'select * from favorite_colors;';
	db.any(query)
		.then(function (rows) {
			res.render('pages/home', {
				my_title: "Home Page",
				data: rows,
				color: '',
				color_msg: ''
			})

		})
		.catch(function (err) {
			// display error message in case an error
			req.flash('error', err); //if this doesn't work for you replace with console.log
			res.render('pages/home', {
				title: 'Home Page',
				data: '',
				color: '',
				color_msg: ''
			})
		})
});

/* /home/pick_color - get request (color)
		This route will read in a get request which provides the color (in hex) that the user has selected from the home page.
		Next, it will need to handle multiple postgres queries which will:
		1. Retrieve all of the color options from the favorite_colors table (same as /home)
		2. Retrieve the specific color message for the chosen color
		The results for these combined queries will then be passed to the home view (pages/home) */
app.get('/home/pick_color', function (req, res) {
	var color_choice = req.query.color_selection;
	var color_options = 'select * from favorite_colors;';
	var color_message = "select color_msg from favorite_colors where hex_value = '" + color_choice + "';";
	db.task('get-everything', task => {
		return task.batch([
			task.any(color_options),
			task.any(color_message)
		]);
	})
		.then(info => {
			res.render('pages/home', {
				my_title: "Home Page",
				data: info[0],
				color: color_choice,
				color_msg: info[1][0].color_msg
			})
		})
		.catch(error => {
			// display error message in case an error
			req.flash('error', error);//if this doesn't work for you replace with console.log
			res.render('pages/home', {
				title: 'Home Page',
				data: '',
				color: '',
				color_msg: ''
			})
		});

});

/* /home/pick_color - post request (color_message)
  		This route will be used for reading in a post request from the user which provides the color message for the default color.
  		We'll be "hard-coding" this to only work with the Default Color Button, which will pass in a color of #FFFFFF (white).
  		The parameter, color_message, will tell us what message to display for our default color selection.
  		This route will then render the home page's view (pages/home) */
app.post('/home/pick_color', function (req, res) {
	var color_hex = req.body.color_hex;
	var color_name = req.body.color_name;
	var color_message = req.body.color_message;
	var insert_statement = "INSERT INTO favorite_colors(hex_value, name, color_msg) VALUES('" + color_hex + "','" +
		color_name + "','" + color_message + "') ON CONFLICT DO NOTHING;";

	var color_select = 'select * from favorite_colors;';
	db.task('get-everything', task => {
		return task.batch([
			task.any(insert_statement),
			task.any(color_select)
		]);
	})
		.then(info => {
			res.render('pages/home', {
				my_title: "Home Page",
				data: info[1],
				color: color_hex,
				color_msg: color_message
			})
		})
		.catch(error => {
			// display error message in case an error
			req.flash('error', error); //if this doesn't work for you replace with console.log
			res.render('pages/home', {
				title: 'Home Page',
				data: '',
				color: '',
				color_msg: ''
			})
		});
});


app.get('/team_stats', function (req, res) {

	
	var query0 = 'SELECT TO_CHAR(game_date, \'Mon. dd, yyyy\') AS date, visitor_name, home_score, visitor_score FROM football_games WHERE game_date >= \'2018-09-06\' AND game_date <= \'2018-12-31\';';
	var query1 = 'SELECT COUNT(*) FROM football_games WHERE game_date >= \'2018-09-06\' AND game_date <= \'2018-12-31\' AND home_score > visitor_score;';
	var query2 = 'SELECT COUNT(*) FROM football_games WHERE game_date >= \'2018-09-06\' AND game_date <= \'2018-12-31\' AND home_score < visitor_score;';

	db.task('get-everything', task => {
		return task.batch([
			task.any(query0),
			task.any(query1),
			task.any(query2)
		]);
	})
		.then(data => {
			
			res.render('pages/team_stats', {
				my_title: "Team Stats",
				stats: data[0],
				wins: data[1][0],
				losses: data[2][0]
			})
		})

		.catch(error => {
			
			request.flash('error', err);
			res.render('pages/team_stats', {
				my_title: "Team Stats",
				stats: '',
				wins: '',
				losses: ''
			})
		});
});


app.get('/player_info', function (req, res) {
	
	var query = 'SELECT id, name FROM football_players;';

	db.any(query)
		.then(function (rows) {
			
			res.render('pages/player_info', {
				my_title: "Player Info",
				player_all: rows
			})
		})
		.catch(function (err) {
			// display error message in case an error
			req.flash('error', err); //if this doesn't work for you replace with console.log
			res.render('pages/player_info', {
				title: 'Player Info',
				data: '',
				color: '',
				color_msg: ''
			})
		});
});


app.get('/player_info/select_player', function (req, res) {
	var player_id = req.query.player_choice;

	var query = ['SELECT id, name FROM football_players;',
		'SELECT id, year, major, passing_yards, rushing_yards, receiving_yards, img_src FROM football_players WHERE id=' + player_id + ';', 
		'SELECT COUNT(*) FROM football_games WHERE ' + player_id + '=ANY(players);']

	
	db.task('get-everything', task => {
		return task.batch([
			task.any(query[0]),
			task.any(query[1]),
			task.any(query[2])
		]);
	})
		.then(data => {
			
			res.render('pages/player_info', {
				my_title: "Player Info",
				player_all: data[0],
				player_selected: data[1][0],
				player_games: data[2][0]
			})
		})

		.catch(error => {
			// display error message in case an error
			request.flash('error', err);
			res.render('pages/player_info', {
				my_title: "Player Info",
				player_all: '',
				player_selected: '',
				player_games: ''
			})
		});
})


app.listen(3000);
console.log('3000 is the magic port');
