var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const exphbs = require('express-handlebars');
var fileUpload = require('express-fileupload');
var db=require('./config/connection')
var session=require('express-session')

console.log("Feature")
console.log("other")




db.connect((err)=>{
  if(err) console.log('Connection Error'+err)
  else  console.log('Connection Succesfull')
})

var usersRouter = require('./routes/users');
var adminRouter = require('./routes/admin');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

const hbs = exphbs.create({
  extname: 'hbs',  
  defaultLayout: 'layout',
  layoutsDir: path.join(__dirname, 'views', 'layouts'),
  partialsDir: path.join(__dirname, 'views', 'partials'),
  helpers: {
    increment: function(value) {
      return value + 1;
    },
    json: (context) => {
      return JSON.stringify(context);
    },
    ifEquals: function(arg1, arg2) {
      return (arg1 == arg2);
    }
  }
});


app.engine('hbs', hbs.engine);
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(session({secret:"Key",cookie:{maxAge:600000},}))
app.use(express.static(path.join(__dirname, 'public')));
app.use(fileUpload());
app.use(express.urlencoded({ extended: false }));


app.use('/', usersRouter);
app.use('/admin', adminRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});





module.exports = app;
