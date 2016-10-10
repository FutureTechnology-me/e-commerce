var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
var mongoUrl = "mongodb://localhost:27017/hydrosource";
var User = require('../models/user');
var Item = require('../models/item');
mongoose.connect(mongoUrl);

var bcrypt = require('bcrypt-nodejs');
var randToken = require('rand-token');

var configT = require('../config/config');
//config module we created to store secret keys:
//configT.secretTestKey;
var stripe = require('stripe')(configT.secretTestKey);

router.post('/getUser', function(req, res, next) {
	var token = req.body.userToken;
	User.findOne({'token': token}, function(err, docs) {
		if (err) {
			console.log(err);
			res.json({
				passFail: 0,
				status: "DB connection failed"
			});
		} else {
			if (docs == null) {
				res.json({
					passFail: 0,
					status: "badToken"
				});
			} else {
				res.json({
					passFail: 1,
					obj: docs
				});
			}
		}
	});
});

router.post('/removeToken', function(req, res, next) {
	var token = req.body.userToken;
	console.log("removeToken: " + token);
	User.findOneAndUpdate({'token': token}, {$set: {'token': ""}}, {new: true}, function(err, docs) {
		if (err) { 
			console.log(err);
			res.json({
				passFail: 0,
				status: "DB connection failed"
			}); 
		} else {
			console.log(docs);
			res.json({
				passFail: 1,
				obj: docs
			});
		}
	});
});

router.post('/saveMyPlan', function(req, res, next) {
	console.log(req.body);
	var plan = req.body.plan;
	var token = req.body.token;
	User.findOneAndUpdate({'token': token}, {$set: {'plan': plan}}, {new: true}, function(err, docs) {
		if (err) { console.log(err); } 
		else {
			console.log(docs);
			res.json({
				passFail: 1,
				obj: docs
			});
		}
	});
});

router.post('/saveCart', function(req, res, next) {
	console.log(req.body);
	var token = req.body.token;
	var cart = req.body.cart;
	User.findOneAndUpdate({'token': token}, {$set: {'cart': cart}}, {new: true}, function(err, docs) {
		if (err) { console.log(err); } 
		else {
			console.log("cart saved-----------------");
			console.log(docs);
			res.json({
				passFail: 1,
				obj: docs
			});
		}
	});
});

router.post('/products', function(req, res, next) {
	console.log(req.body);
	Item.find({}, function(err, docs) {
		if (err) {
			console.log(err);
		} else {
			console.log(docs);
			res.json({
				obj: docs
			});
		}
	});
});

router.post('/firstStripe', function(req, res, next) {
	var amount = req.body.amount;
	var source = req.body.stripeToken;
	var email = req.body.description;
	console.log(amount);
	console.log(source);
	console.log(email);
	stripe.customers.create({
		source: source, 
		email: userEmail,
		currency: "USD"
	}).then(function(customer) {
		console.log(customer);
		// !!!! Save Stripe customer.id to DB for later use
		// User.findOne({'token': token}, function(err, docs) {
		// 	if (err) {
		// 		console.log(err);
		// 		res.json({
		// 			passFail: 0,
		// 			status: "DB connection failed"
		// 		});
		// 	} else {
		// 		if (docs == null) {
		// 			res.json({
		// 				passFail: 0,
		// 				status: "badToken"
		// 			});
		// 		} else {
		// 			res.json({
		// 				passFail: 1,
		// 				obj: docs
		// 			});
		// 		}
		// 	}
		// });
		return stripe.charges.create({
			amount: amount,
			currency: "USD",
			customer: customer.id
		});
	}).then(function paid(charge) {
		console.log("charged~~~~~~~~");
		console.log(charge);
		res.json({
			passFail: 1,
			status: "Paid",
			obj: charge
		});
	}, function failed(err) {
		res.json({
			passFail: 0,
			status: "Failed",
			obj: err
		});
	});
});


router.post('/stripe', function(req, res, next) {
	var amount = req.body.amount;
	var source = req.body.stripeToken;
	var desc = req.body.description;
	console.log(amount);
	console.log(source);
	console.log(desc);
	stripe.charges.create({
		amount: amount,
		currency: "USD",
		soruce: source,
		description: desc
	}).then(function paid(charge) {
		console.log('charge successful');
		console.log(charge);
		res.json({
			passFail: 1,
			status: "Paid",
			obj: charge
		});
	}, function failed(err) {
		console.log('failed');
		console.log(err);
		res.json({
			passFail: 0,
			status: "Failed",
			obj: err
		});
	});
});

router.post('/validatePW', function(req, res, next) {
	console.log(req.body);
	var username = req.body.username;
	var password = req.body.password;
	var item = req.body.item;
	var newValue = req.body.newValue;
	User.findOne({'username': username}, function(err, docs) {
		console.log("findingOne");
		if (err) {
			console.log(err);
			res.json({
				passFail: 0,
				status: "Connection failed"
			});
		console.log('newValue: ' + new Value);
		} else {
			var result = bcrypt.compareSync(password, docs.password);
			if (result) {
				console.log("pw match success ~~~~~~~~~~~~");
				if (item === 'password') {
					var newPW = bcrypt.hashSync(newValue);
					User.findOneAndUpdate({'username': username}, {$set: {'password': newPW}}, function(err, docs) {
						console.log('updating password');
						console.log(newValue);
						console.log(newPW);
						if (err) {console.log(err);}
						else {
							console.log(docs);
							res.json({
								passFail: 1,
								obj: docs
							});
						}
					});
				} else if (item === 'email') {
					User.findOneAndUpdate({'username': username}, {$set: {'email': newValue}}, function(err, docs) {
						console.log('updating password');
						if (err) {console.log(err);}
						else {
							console.log(docs);
							res.json({
								passFail: 1,
								obj: docs
							});
						}
					});
				} else if (item === 'address') {
					User.findOneAndUpdate({'username': username}, {$set: {'address':newValue}}, {'new':true}, function(err, docs) {
						console.log('updating others');
						if (err) {console.log(err);}
						else {
							console.log('finedOneandUpdated success')
							console.log(docs);
							res.json({
								passFail: 1,
								obj: docs
							});
						}
					});
				} else if (item === 'username') {
					User.findOneAndUpdate({'username': username}, {$set: {'username':newValue}}, {'new':true}, function(err, docs) {
						console.log('updating others');
						if (err) {console.log(err);}
						else {
							console.log(docs);
							res.json({
								passFail: 1,
								obj: docs
							});
						}
					});
				} else {
					res.json({
						passFail: 0,
						status: 'item is not valid (username, email, address, password)'
					});
				}
			} else {
				console.log("password match failed ~~~~~~~");
				res.json({
					passFail: 0,
					status: 'Password match failed'
				});
			}
		}
	});
});


router.post('/register', function(req, res, next) {
	console.log(req.body);
	var username = req.body.username;
	var password = req.body.password;
	var email = req.body.email;
	var address = req.body.address;
	var plan = req.body.plan;
	var newUser = new User({
		username: username,
		password: bcrypt.hashSync(password),
		email: email,
		address: address,
		plan: plan
	});
	console.log(newUser);
	newUser.save(function(err, saved, status) {
		if (err) {
			res.json(err);
		} else {
			res.json(saved);
		}
	});
});

router.post('/signin', function(req, res, next) {
	console.log(req.body);
	var username = req.body.username;
	var password = req.body.password;
	User.findOne({'username': username}, function(err, docs) {
		if (err) {
			console.log(err);
			res.json({
				passFail: 0,
				status: "Connection failed"
			});
		} else {
			console.log(docs);
			if (docs == null) {
				res.json({
					passFail: 0,
					status: 'No User Found. Try a different user name.'
				});
			} else {
				//1st arg: pw, 2nd: hash; returns true or false
				var result = bcrypt.compareSync(password, docs.password);
				if (result) {
					var token = randToken.generate(32);
					console.log(token);
					console.log(docs._id);
					User.findOneAndUpdate({'_id': docs._id}, {$set: {'token': token}}, {upsert: true, new: true}, function(err, docs) {
						res.json({
							passFail: 1,
							status: "User Found",
							obj: docs,
						});
					});
				} else {
					res.json({
						passFail: 0,
						status: 'User name and password did not match.'
					});
				}
			}
		}
	});
});

module.exports = router;
