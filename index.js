if(process.env.NODE_ENV !="production"){
  require("dotenv").config()
}
const express = require("express");
const app = express();
const mongoose = require("mongoose");
const path = require("path"); 
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate"); 
const session = require("express-session");
const MongoStore = require("connect-mongo")
{import('tailwindcss').Config}
const flash = require("connect-flash");
const passport = require("passport");
const LocalStrategy = require("passport-local");


const Listing = require("./models/listing.js");
const Blog = require("./models/blog.js");
const Education = require("./models/education.js");
const User = require("./models/user.js");
const Customer = require("./models/customer.js");
const Review = require("./models/review.js");

const dbUrl = process.env.ATLASDB_URL;
const {isLoggedIn} =require ("./middleware.js")
const {saveRedirectUrl} =require ("./middleware.js")
main()
  .then(() => {
    console.log("connected to DB");
  })
  .catch((err) => {
    console.log(err);
  });

async function main() {
  await mongoose.connect(dbUrl);
}

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));

app.use(express.static(path.join(__dirname, "/public")));

const store = MongoStore.create({
  mongoUrl: dbUrl,
  crypto: {
    secret: process.env.SECRET,
  },
  touchAfter: 24 * 3600,
});

store.on("error",()=>{
  console.log("ERROR in MONGO SESSION STORE", err)
})

const sessionOptions = {
  store,
  secret: process.env.SECRET,
  resave: false,
  saveUninitialized: true,
  cookie: {
    expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
    maxAge: 7 * 24 * 60 * 60 * 1000,
    httpOnly: true,
  },
};
app.use(session(sessionOptions));
app.use(flash());

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req, res, next) => {
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  res.locals.currUser = req.user;
  next();
})

app.get("/login", async (req, res) => {
  res.render("login.ejs");
});
app.get("/", async (req, res) => {
  const allListings = await Listing.find({});
  const allReviews = await Review.find({});
  res.render("index.ejs", { allReviews : allReviews, allListings: allListings });
});
app.get("/about", async (req, res) => {
    res.render("about.ejs");
});
app.get("/blog", async (req, res) => {
  const allListings = await Blog.find({});
  res.render("blog.ejs", { allListings });
});
app.get('/profile', isLoggedIn ,async (req, res) => {
  const user = await User.findOne({ email: req.user.email });
  res.render("profile.ejs", { user }); 
});

app.get("/education",  async (req, res) => {
  const allListings = await Education.find({});
  res.render("education.ejs", { allListings });
});
app.get("/new",  isLoggedIn ,async (req, res) => { const allowedEmail = "freeforfire15@gmail.com";  

  if (req.user && req.user.email === allowedEmail) {  res.render("new.ejs"); }
    else {
    res.status(403).send("Access denied: You are not authorized to view this page.");
  }
   
   
  
 
 });app.get("/newReview",  isLoggedIn ,async (req, res) => { const allowedEmail = "freeforfire15@gmail.com";  

  if (req.user && req.user.email !== allowedEmail) {  res.render("reviewnew.ejs"); }
    else {
    res.status(403).send("Access denied: You are not authorized to view this page.");}});
  
  app.post("/newReview", isLoggedIn , async (req, res) =>  { const allowedEmail = "freeforfire15@gmail.com";  

    if (req.user && req.user.email !== allowedEmail) {
      const newreview = new Review(req.body.histing); 
      await newreview.save();
     res.redirect("/");
    } else {
      res.status(403).send("Access denied: You are not authorized to view this page.");
    }
   
   
  
 
 });
 app.get("/blognew", isLoggedIn , async (req, res) => { const allowedEmail = "freeforfire15@gmail.com";  

  if (req.user && req.user.email === allowedEmail) {  res.render("blognew.ejs");
   
  } else {
    res.status(403).send("Access denied: You are not authorized to view this page.");
  }
   
  });
  app.get("/educationnew", isLoggedIn , async (req, res) => { const allowedEmail = "freeforfire15@gmail.com";  

    if (req.user && req.user.email === allowedEmail) {
      res.render("educationnew.ejs");
    } else {
      res.status(403).send("Access denied: You are not authorized to view this page.");
    }
   
  });
  
  
app.post("/new", isLoggedIn , async (req, res) =>  { const allowedEmail = "freeforfire15@gmail.com";  

  if (req.user && req.user.email === allowedEmail) {
    const newlistings = new Listing(req.body.listing); 
    await newlistings.save();
   res.redirect("/");
  } else {
    res.status(403).send("Access denied: You are not authorized to view this page.");
  }
 
 
});
app.post("/blognew", isLoggedIn , async (req, res) =>  { const allowedEmail = "freeforfire15@gmail.com";  

  if (req.user && req.user.email === allowedEmail) {
    const newblog = new Blog(req.body.pisting); 
    await newblog.save();
   res.redirect("/blog");
  } else {
    res.status(403).send("Access denied: You are not authorized to view this page.");
  }
 
 
});
app.post("/educationnew", isLoggedIn , async (req, res) =>  { const allowedEmail = "freeforfire15@gmail.com";  

  if (req.user && req.user.email === allowedEmail) {
    
  const neweducation = new Education(req.body.histing); 
  await neweducation.save();
 res.redirect("/education");
  } else {
    res.status(403).send("Access denied: You are not authorized to view this page.");
  }
 

});
 

  app.post("/register", async (req, res) => {
    try {
      let { username, email, password } = req.body;
      const newUser = new User({ email, username });
      const registeredUser = await User.register(newUser, password);
      console.log(registeredUser);
      req.login(registeredUser, (err) => {
        if (err) {
          return next(err);
        }
        req.flash("success", "Registered Successfully");
        res.redirect("/login");
      });
    } catch (e) {
      req.flash("error", e.message);
      res.redirect("/login");
    }
  });
  app.post("/login",saveRedirectUrl,
    passport.authenticate("local",{failureRedirect: "/",failureFlash: true}), async (req, res) => { let redirectUrl = res.locals.redirectUrl ;
    res.redirect(redirectUrl);
  });
  
  app.get("/logout",isLoggedIn ,  async (req, res) => {
    req.logout((err) => {
      if (err) {
        return next(err);
      }
      req.flash("success", "You are now logged out!");
      res.redirect("/");
    });
  });
  
  app.get("/addtocart/:productid",isLoggedIn,async (req,res)=>  { const allowedEmail = "freeforfire15@gmail.com";  

    if (req.user && req.user.email !== allowedEmail) {

  let user =await User.findOne({email:req.user.email})
  user.cart.push(req.params.productid)
  await user.save(); res.redirect("/")
  req.flash("success", "Added to cart");
    } else {
      res.status(403).send("Access denied: You are not authorized to view this page.");
    }
  })
  app.get("/remove-from-cart/:productid",isLoggedIn , async (req, res) => {
    const user = await User.findOne({ email: req.user.email });
    
   
    user.cart = user.cart.filter(productId => productId.toString() !== req.params.productid);
    await user.save();
  
    req.flash("success", "Removed from cart");
    res.redirect("/shop"); 
  });
  app.get("/shop", isLoggedIn , async (req, res) => { const allowedEmail = "freeforfire15@gmail.com";  

    if (req.user && req.user.email !== allowedEmail) { let user =await User.findOne({email:req.user.email}).populate("cart")
      let users =await User.findOne({email:req.user.email}).populate("order")
       const totalAmount = user.cart.reduce((sum, item) => sum + item.price, 0);
       const allListings = await Listing.find({});
       const cartTitles = user.cart.map(item => item.title).join(", ");
       res.render("shop.ejs",{user: user,users: users, totalAmount: totalAmount, cartTitles: cartTitles, allListings: allListings});
     
    } else {
      res.status(403).send("Access denied: You are not authorized to view this page.");
    }
  
});
  
app.get("/checkout", isLoggedIn , async (req, res) => {
  let user =await User.findOne({email:req.user.email}).populate("cart")
 

  const cartTitles = user.cart.map(item => item.title).join(", ");
  const totalAmount = user.cart.reduce((sum, item) => sum + item.price, 0);
  res.render("checkout.ejs",{user: user, cartTitles: cartTitles, totalAmount: totalAmount});
  
});

app.post("/checkout", isLoggedIn , async (req, res) => {
const newlistings = new Customer(req.body.listing); 
await newlistings.save();
const user = await User.findOne({ email: req.user.email }).populate("cart");
const productIds = req.body.productIds;
if (!productIds || productIds.length === 0) {
    req.flash("error", "Your cart is empty.");
    return res.redirect("/cart"); 
  }
const cartProducts = await Listing.find({ '_id': { $in: productIds } });
user.order = [...user.order, ...cartProducts]; 
user.cart = [];
await user.save();req.flash("success", "Purchased Successfully");
res.redirect("/home");
});

app.get("/customer", isLoggedIn, async (req, res) => {
  const allowedEmail = "freeforfire15@gmail.com";  

  if (req.user && req.user.email === allowedEmail) {
    const allListings = await Customer.find({});
    res.render("customer.ejs", { allListings });
  } else {
    res.status(403).send("Access denied: You are not authorized to view this page.");
  }
});
 app.listen(8080, () => {
      console.log("server is listening to port 8080");
  }); 

  