//jshint esversion:6
require('dotenv').config();                         // Environment variable file with the dotenv package
const express = require('express');
const bodyParser = require('body-parser');
const ejs = require ('ejs');
const mongoose = require('mongoose');
const passport = require('passport');
const session = require('express-session');
const passportLocalMongoose = require('passport-local-mongoose');

const app = express();

// console.log(process.env.SECRET); // console log of an environment variable.

app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));

// Express session configurations
app.use(session({
    secret: "Our little secret.",
    resave: false,
    saveUninitialized: false
}));

// Initilizing passport
app.use(passport.initialize());
app.use(passport.session());

// Connect mongoose with mongoDB
mongoose.connect('mongodb://localhost:27017/userDB', { useNewUrlParser: true, useUnifiedTopology: true }); 
mongoose.set("useCreateIndex", true); // code to fix deprecation warning;

// Creating a mongoose schema
const userSchema = new mongoose.Schema({
        email: String,
        password: String
});

// Plugin to support passport-local-mongoose package
userSchema.plugin(passportLocalMongoose);

const User = new mongoose.model("User", userSchema);

// Passport strategy - check docs for info
passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());


app.get("/", function(req, res) {
    res.render("home")
});

app.get("/login", function(req, res) {
    res.render("login")
});

app.get("/register", function(req, res) {

    res.render('register');
});

app.get("/secrets", function(req, res) {
    // this code checks whether the user is logged in using passport /
    // passport-local and sessions. If isAuthenticated is true redirect to the
    // secrets page else redirect back to login screen.
    if (req.isAuthenticated()) {
        res.render("secrets");
    } else {
        res.redirect("/login");
    }
});

app.get("/logout", function(req, res) {
    req.logout();
    res.redirect('/');
});

app.post("/register", function(req, res) {

    const username = req.body.username;
    const password = req.body.password;

    // Register the user with passport-local-mongoose 
    User.register({username: username} , password, function(err, user) {
        if (err) { 
            console.log(err);
            res.redirect("/");
         } else {
             // if successful authenticate the user with passport.
             // "local" is the type of authentication. Callback is triggered if
             // the authentications was succesful
            passport.authenticate("local")(req, res, function() {
                res.redirect("/secrets");
            });
         }
    });
});


app.post("/login", function(req, res) {
    
    // Create a mogoose user object to reference against the database
    const user = new User({
        username: req.body.username,
        password: req.body.password
    })
    
    // Login function with passport.js
    req.login(user, function(err) {
        if (err) {
            console.log(err);
            res.redirect("/login");
        } else {
            passport.authenticate("local")(req, res, function() {
                res.redirect("/secrets");
            })
        }
    });
});


app.listen(3000, function() {
    console.log("Server started on port 3000.");
});