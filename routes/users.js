var express = require('express');
var router = express.Router();
const productHelper = require('../helpers/productHelpers')
const userHelper = require('../helpers/userHelpers');

const verifyUser = (req, res, next) => {
  if (req.session.userloggedin) {
    req.user = req.session.user
    next()
  }
  else{
    let cartCount = 0;
    req.session.cartLogout='Log in to view your cart and orders'
    res.redirect('/login')
  }
  
}

router.get('/', async function (req, res, next) {
  let user = req.session.user
  let cartCount=0
  if(req.session.user){
    cartCount=await userHelper.getCartCount(req.session.user._id)
  }
 
  productHelper.getAllProduct().then((products => {
    res.render('index', { products, user,cartCount });
  }))

});

router.get('/login', function (req, res, next) {
  if (req.session.user) {
    res.redirect('/');
  } else {
    let cartCount = 0;
    if(req.query.cartLogout){
    req.session.cartLogout = req.query.cartLogout;  
    }
    res.render('users/login', { 'LoggedinErr': req.session.userLoggedinErr, cartCount,cartLogout: req.session.cartLogout });
    req.session.userLoggedinErr=''
  }
});

router.post('/login', (req, res, next) => {
  userHelper.doLogin(req.body).then((response) => {
    if (response.status) {
      
      req.session.user = response.user
      req.session.userloggedin = true
      res.redirect('/')
      
    }
    else {
      req.session.userLoggedinErr = 'Email or password incorrect'
      res.redirect('/login')
      
    }
  })
})

router.get('/signup', function (req, res, next) {
  let cartCount=0
  res.render('users/signup',{cartCount});
})

router.post('/signup', (req, res, next) => {
  userHelper.doSignup(req.body).then((response)=>{
   
    req.session.user=response
    req.session.userloggedin = true
    res.redirect('/')
  })

})

router.get('/logout', (req, res) => {
  req.session.user=null
  req.session.userloggedin=null
  req.session.userLoggedinErr=null
  res.redirect('/')
})

router.get('/cart', verifyUser, async(req, res) => {
  
  let cartProducts=await userHelper.getCartProducts(req.session.user._id)
  let totalcartamount=await userHelper.totalCartAmount(req.session.user._id)

  let cartCount=0
 
  if(req.session.user){
    cartCount=await userHelper.getCartCount(req.session.user._id)
  }

  if(cartCount==0){
    res.render('users/emptycart',{ user: req.user,cartCount})
   
  }else{
    res.render('users/cart', { user: req.user,cartProducts,totalcartamount,cartCount})
  }
  
})

router.get('/add-to-cart/:id',(req,res)=>{
    
    userHelper.addToCart(req.params.id,req.session.user._id).then(async()=>{
        cartCount=await userHelper.getCartCount(req.session.user._id)
       
        res.json({status:true,cartCount:cartCount})
    })  
})

router.get('/buynow',verifyUser,async(req,res)=>{
  let cartProducts=await userHelper.getProducttemplate(req.query._id)
  let totalcartamount=cartProducts[0].total
  res.render('users/checkout',{user: req.user,cartProducts,totalcartamount});

})


router.post('/change-product-quantity',(req,res,next)=>{
  userHelper.changeCartQuantity(req.body).then(async(response)=>{
    response.total=await userHelper.totalCartAmount(req.body.user)
    response.cartProducts=await userHelper.getCartProducts(req.body.user)
    response.cartCount=await userHelper.getCartCount(req.body.user)
    res.json(response)
  })
})
router.post('/delete-cart-product',(req,res)=>{
  userHelper.deleteCartProduct(req.body).then(async(response)=>{
    response.total=await userHelper.totalCartAmount(req.body.user)
    response.cartCount=await userHelper.getCartCount(req.body.user)
    res.json(response)
  })
})
router.get('/checkout',verifyUser,async(req,res)=>{
  let totalcartamount=await userHelper.totalCartAmount(req.session.user._id)
  let cartProducts=await userHelper.getCartProducts(req.session.user._id)
  res.render('users/checkout',{user: req.user,cartProducts,totalcartamount});
})
router.post('/checkout',async(req,res)=>{
  const cartProducts1 = await JSON.parse(req.body.cartProducts);
  userHelper.placeOrder(req.body,cartProducts1,req.body.total).then((response)=>{
    if(req.body['paymentMethod']=='Cash On Delivery'){
      res.json(response)
    }else{
      userHelper.generateRazorpay(response.orderId,response.total).then((response)=>{
        res.json(response)
      })
    }
    
  })
 
})
router.get('/orderplaced',verifyUser,async(req,res)=>{
  let orderdetails=await userHelper.getLastOrderDetails(req.session.user._id)
  
  let totalOrderAmount=await userHelper.totalLastOrderAmount(req.session.user._id)
  res.render('users/orderplaced',{user:req.user,orderdetails,totalOrderAmount})
})
router.get('/orders',verifyUser,async(req,res)=>{
  let cartCount=0
  if(req.session.user){
    cartCount=await userHelper.getCartCount(req.session.user._id)
  }
  let order=await userHelper.getAllOrderDetails(req.session.user._id)
  res.render('users/orders',{user:req.user,order,cartCount})
})
router.post('/verifypayment',(req,res)=>{
  userHelper.verifyPayment(req.body).then(()=>{
    userHelper.changePaymentStatus(req.body['order[receipt]']).then(()=>{
      res.json({status:true})
    })
    
  }).catch(()=>{
    res.json({status:false,errMsg:'Payment Failed'})
  })  
})
router.post('/getRazorPayOrder',(req,res)=>{
  userHelper.getPaymentDetails(req.body.orderId).then((response)=>{
    res.json(response)

  })
})

module.exports = router;
