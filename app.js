//jshint esversion:6
require('dotenv').config();                         // Environment variable file with the dotenv package
const express = require('express');
const bodyParser = require('body-parser');
const ejs = require ('ejs');
const mongoose = require('mongoose');
const passport = require('passport');
const session = require('express-session');
const passportLocalMongoose = require('passport-local-mongoose');
const findOrCreate = require('mongoose-findorcreate');
const GoogleStrategy = require('passport-google-oauth20').Strategy;

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
        password: String,
        googleId: String,
        secret: String
});

// Plugin to support passport-local-mongoose package
userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = new mongoose.model("User", userSchema);

// Passport strategy - check docs for info
passport.use(User.createStrategy());

// serialize or check user
passport.serializeUser(function(user, done) {
    done(null, user.id);
});

passport.deserializeUser(function(id, done) {
    User.findById(id, function(err, user) {
        done(err, user);
    });
});

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
  },

  function(accessToken, refreshToken, profile, cb) {
    console.log(profile);
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));


app.get("/", function(req, res) {
    res.render("home")
});

app.get("/login", function(req, res) {
    res.render("login")
});

app.get("/register", function(req, res) {

    res.render('register');
});

app.get("/auth/google", 
passport.authenticate("google", { scope: ["profile"]})
);

app.get("/auth/google/secrets", 
  passport.authenticate('google', { failureRedirect: "/login" }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect("/secrets");
  });


app.get("/secrets", function(req, res) {
    User.find({"secret": {$ne:null} }, function(err, foundUsers) {
        if (err) {
            console.log(err);
        } else {
            if (foundUsers) {
                res.render("secrets", {usersWithSecrets: foundUsers});
            }
        }
    })
});

app.get("/submit", function(req, res) {
    if (req.isAuthenticated()) {
        res.render("submit");
    } else {
        res.redirect('/login');
    }
});

app.post("/submit", function(req ,res) {
    const submittedSecret = req.body.secret;
    console.log(req.user._id);

    User.findById(req.user._id, function(err, foundUser) {
        if (err) {
            console.log(err);
        } else {
            if (foundUser) {
                foundUser.secret = submittedSecret;
                foundUser.save(function() {
                    res.redirect("/secrets");
                })
            }
        }
    });
    
});

app.get("/logout", function(req, res) {
    req.logout();
    res.redirect("/");
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