var express = require('express');
var router = express.Router();
const productHelper = require('../helpers/productHelpers')
const verifyAdmin = (req, res, next) => {
  if (req.session.adminloggedin) {
    req.admin = req.session.admin
    next()
  }
  else
  res.redirect('admin/login')
}

router.get('/',verifyAdmin, function (req, res, next) {
  res.render('admin/dashboard', { admin: true });
});

router.get('/login',(req,res)=>{
  if(req.session.admin){
    res.redirect('/admin')
  }else{
    
    res.render('admin/login',{admin:true,'LoggedinErr': req.session.adminLoggedinErr})
    req.session.adminloggedin=null
  }
  

})
router.post('/login',(req,res)=>{
  productHelper.doLogin(req.body).then((response) => {
    if (response.status) {
      
      req.session.admin= response.user
      req.session.adminloggedin = true
      res.redirect('/admin')
    }
    else {
      req.session.adminLoggedinErr = 'Email or password incorrect'
      res.redirect('login')
    }
  })
})

router.get('/logout',(req,res)=>{
  req.session.admin=null
  req.session.adminloggedin=null
  req.session.adminLoggedinErr=null
  res.redirect('/admin')

})


router.get('/products', function (req, res, next) {
  productHelper.getAllProduct().then((products => {
    res.render('admin/products', { admin: true, products });
  }))

});
router.get('/addproducts', function (req, res) {
  res.render('admin/addproducts', { admin: true })
})
router.post('/addproducts', function (req, res) {
  productHelper.addProduct(req.body, (id) => {
    let image = req.files.image
    image.mv('./public/images/product-images/' + id + '.jpg', (err, done) => {
      if (!err) res.redirect('/admin/products')
      
    })
  })
})

router.get('/delete-product/:id',(req,res)=>{
  let productId=req.params.id
  productHelper.deleteProduct(productId).then((response)=>{
    res.redirect('/admin/products')
  })
})

router.get('/edit-product/:id',async (req,res)=>{
  let product=await productHelper.getProduct(req.params.id)
  res.render('admin/editproducts',{admin:true,product})
})
router.post('/edit-product/:id',(req,res)=>{
  productHelper.editProduct(req.params.id,req.body).then(()=>{
    res.redirect('/admin/products')
    if(req.files && req.files.image){
      let image = req.files.image
      image.mv('./public/images/product-images/' + req.params.id + '.jpg')
    }
  })

})


module.exports = router;
