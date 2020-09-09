//jshint esversion:6
require('dotenv').config();                         // Environment variable file with the dotenv package
const express = require('express');
const bodyParser = require('body-parser');
const ejs = require ('ejs');
const mongoose = require('mongoose');
// const encrypt = require('mongoose-encryption');  // replaced with md5 hash
// encryption keep for reference purpose
// const md5 = require('md5'); // replaced with becrypt has and saling
const bcrypt = require('bcrypt');
const saltRounds = 10;


const app = express();

// console.log(process.env.SECRET); // console log of an environment variable
// stored in the .env file.

app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));

mongoose.connect('mongodb://localhost:27017/userDB', { useNewUrlParser: true, useUnifiedTopology: true }); 

// Creating a mongoose schema
const userSchema = new mongoose.Schema({
        email: String,
        password: String
});

// Mongoose encryption with a secret code // read docs // look at dotenv file //
// replaced with md5 hash encryption keep for reference purposes.
// userSchema.plugin(encrypt, { secret: process.env.SECRET, encryptedFields: ['password'] });

const User = new mongoose.model("User", userSchema);


app.get("/", function(req, res) {
    res.render("home")
});

app.get("/login", function(req, res) {
    res.render("login")
});

app.get("/register", function(req, res) {

    res.render('register');
});

app.post("/register", function(req, res) {

    // becrypt hashes the password and adds "saltRounds" pass the created hash
    // to the new user which is stored in the DB.

    bcrypt.hash(req.body.password, saltRounds, function(err, hash) {
        
            // Userdata
            const newUser = new User({
            email: req.body.username,
            password: hash
        });
    
        newUser.save(function(err) {
            if(!err) {
                res.render('secrets');
            }
        });
    });

});

app.get("/secrets", function(req, res) {
    
    
});

app.get("/logout", function(req, res) {
    res.redirect('/');
});

app.post("/login", function(req, res) {
    const username = req.body.username;
    const password = req.body.password

    User.findOne({email: username}, function(err, foundUser) {
       if (err) {
           console.log(err);
       } else {
           if (foundUser) {
            bcrypt.compare(password, foundUser.password, function(err, result) {
                if (result === true) {
                    res.render('secrets');
                }
            });
           }
        } 
    });
});






app.listen(3000, function() {
    console.log("Server started on port 3000.");
});