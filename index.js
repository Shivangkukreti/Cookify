const express = require('express');
const app = express();
const router=express.Router()
require('dotenv').config()
const port = 3000;
const path = require('path');
const methodOverride = require('method-override')
const mongostore=require('connect-mongo')
const session=require('express-session')
const cookieparser=require('cookie-parser')
const flash=require('connect-flash')
const passport=require('passport')
const localstrategy=require('passport-local').Strategy
const multer = require('multer');  
const {storage} = require('./cloud');
const upload = multer({ storage });


mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log("MongoDB connected"))
.catch((err) => console.log("MongoDB connection error:", err));
const recipes=require("./models/recipe")
const user=require("./models/user");
const reviews=require("./models/review");
let uri=process.env.uri

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
const store=mongostore.create({mongoUrl:uri,secret:"abc",touchAfter:24*3600})
app.use(session({store,secret:'abc',saveUninitialized:true,resave:false,cookie:{}}))
app.use(flash());
app.use(passport.initialize())
app.use(passport.session())
passport.use(new localstrategy(user.authenticate()))
passport.serializeUser(user.serializeUser())
passport.deserializeUser(user.deserializeUser())
app.use(cookieparser())
app.use(methodOverride('_method'))
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use((req, res, next) => {
    res.locals.any=req.session.any
     res.locals.currentuser=req.user
     res.locals.success = req.flash('success');
     res.locals.fail = req.flash('fail')
      next();
});
app.use('/', router)


let ifuser=(req,res,next)=>{
    if (!req.isAuthenticated()) {
        req.session.any=req.originalUrl;
        req.flash("fail","Login First!!!");
        res.redirect("/cookify/login");
    } else {
       next();
    }
}

let ifown=async(req,res,next)=>{
    let {id}=req.params
    let any= await recipes.findById(id)
    if (req.user && req.user.username==any.chef) {
        next()
    } else {
        res.redirect(`/cookify/${id}`)
    }
}



app.listen(port, () => {
console.log("http://localhost:3000/cookify/")});



app.get("/",(req,res)=>{
    res.render("land.ejs")
})

app.get("/cookify",async(req,res)=>{
    let all=await recipes.find()
    res.render("home.ejs",{all})
    
})


router.route("/cookify/signup")
.get((req,res)=>{
    res.render("signup.ejs")
})
.post(async (req,res,next)=>{
    let {username,password,email}=req.body
    let any= new user({username,password,email})
    await user.register(any,password) 
    req.logIn(any,(err)=>{
        if (err) {
          next(err)  
        } else {
            req.flash("success","WELCOME TO COOKIFY")
          res.redirect("/cookify")  
        }
    })
})


router.route("/cookify/login")
.get((req,res)=>{
    res.render("login.ejs")
})
.post(passport.authenticate("local",
    {failureRedirect:"/cookify/login",failureMessage:"error",failureFlash:true,failWithError:true}),(req,res)=>{
        req.flash("success","WELCOME BACK")
        res.redirect(res.locals.any|| "/cookify")
    })



app.get("/cookify/logout",(req,res,next)=>{
    req.logOut((err)=>{
        if (err) {
            next(err)
        } else {
            req.flash("success","LOGGED OUT")
         res.redirect("/cookify")   
        }
    })
})


router.route("/cookify/new")
.get(ifuser,(req,res)=>{
    res.render("new.ejs")
})
.post(upload.single("img"),(req,res)=>{
    let {dish,recipe}=req.body
    let img
    if (req.file) {
         img=req.file.path
    }
    let chef=req.user.username
    let any= new recipes({dish,recipe,chef,img})
    any.save()
    req.flash("success","NEW RECIPE SAVED")
    res.redirect("/cookify")
})


app.get("/cookify/explore",async(req,res)=>{
    let {search}=req.query
    let mysearch=search.trim().toLowerCase()
    let allresults= await recipes.find()
    let all=allresults.filter((ele)=>{
    return (ele.dish.trim().toLowerCase().includes(mysearch) || ele.chef.trim().toLowerCase().includes(mysearch))
    })

          res.render("home.ejs",{all})

})




app.get("/cookify/:id",async(req,res)=>{
    let {id}=req.params
    let any=await recipes.findById(id).populate("review")
    res.render("each.ejs",{any})
})

router.route("/cookify/:id/edit")
.get(ifown,async(req,res)=>{
    let {id}=req.params
    let any=await recipes.findById(id)
    res.render("edit.ejs",{any})
})
.put(upload.single('img'),async(req,res)=>{
    let {id}=req.params
    let img
    if (req.file) {
        img=req.file.path
    }
    let {dish,recipe}=req.body
    await recipes.findByIdAndUpdate(id,{dish,recipe,img})
    req.flash("success","RECIPE EDITED")
    res.redirect("/cookify")
})


router.route("/cookify/:id/addreviews")
.get(async(req,res)=>{
    let {id}=req.params
    let any=await recipes.findById(id).populate("review")
    res.render("each.ejs",{any})
})
.post(ifuser,async(req,res)=>{
    let {id}=req.params
    let recipe=await recipes.findById(id)
    let {comment}=req.body
    let username=req.user.username
    let any=new reviews({comment,username})
    await any.save()
    recipe.review.push(any)
    await recipe.save()
    res.redirect(`/cookify/${id}`)
})


app.delete("/cookify/:id/:reviewid/deletereviews",ifown,async(req,res)=>{
    let {id,reviewid}=req.params
    await recipes.findByIdAndUpdate(id,{$pull:{review:reviewid}})
    await reviews.findByIdAndDelete(reviewid)
    res.redirect(`/cookify/${id}`)

})

app.delete("/cookify/:id",ifown,async(req,res)=>{
    let {id}=req.params
   await recipes.findByIdAndDelete(id)
   req.flash("success","RECIPE DELETED")
   res.redirect("/cookify")
})












app.use((err,req,res,next)=>{
    let{status=500,message='error'}=err
    res.status(status).render('error.ejs',{message})
})


