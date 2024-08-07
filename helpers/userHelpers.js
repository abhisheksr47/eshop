const db = require('../config/connection')
const collection = require('../config/collection')
const bcrypt = require('bcrypt')
var ObjectId = require('mongodb').ObjectId
const Razorpay = require('razorpay');

var instance = new Razorpay({
    key_id: 'rzp_test_Tv4qtHKlzz61Z8',
    key_secret: '4Pwm5IvPggwkqkF1mN0PrdTp',
  });
  

module.exports = {
    doSignup: (userData) => {
        return new Promise(async (resolve, reject) => {
            userData.password = await bcrypt.hash(userData.password, 10)
            db.get().collection(collection.USER_COLLECTION).insertOne(userData).then(() => {
                resolve(userData)
            })
        })

    },
    doLogin: (userData) => {
        return new Promise(async (resolve) => {
            let response = {}
            let user = await db.get().collection(collection.USER_COLLECTION).findOne({ email: userData.email })
            if (user) {
                bcrypt.compare(userData.password, user.password).then((status) => {
                    if (status) {
                        response.user = user
                        response.status = true
                        resolve(response)
                    }
                    else {
                        resolve({ status: false })
                    }
                })
            }
            else {
                resolve({ status: false })
            }
        })
    },
    addToCart: (productId, userId) => {
        return new Promise(async (resolve, reject) => {
            let productObj={
                item:new ObjectId(productId),
                quantity:1
            }
            let userCart = await db.get().collection(collection.CART_COLLECTION).findOne({ user: new ObjectId(userId) })
            if (userCart) {
                let productExist=userCart.products.findIndex(product => product.item.equals(new ObjectId(productId)))
                if(productExist!=-1){
                    db.get().collection(collection.CART_COLLECTION).
                    updateOne(
                        { user: new ObjectId(userId), 'products.item': new ObjectId(productId) },
                        { $inc: { 'products.$.quantity': 1 } }
                    ).then(()=>{
                        resolve()
                    })
                        
                }else{
                db.get().collection(collection.CART_COLLECTION).updateOne({ user: new ObjectId(userId) },
                    {

                        $push: {products:productObj}

                    }).then((response) => {
                        resolve()
                    })
                }
            } else {
                let cartObj = {
                    user: new ObjectId(userId),
                    products: [productObj]
                }
                db.get().collection(collection.CART_COLLECTION).insertOne(cartObj).then((response) => {
                    resolve()
                })
            }
        })
    },
    getCartProducts: (userId) => {
        return new Promise(async (resolve, reject) => {
            let cart = await db.get().collection(collection.CART_COLLECTION).aggregate([
                {
                    $match: { user: new ObjectId(userId) }
                },
                {
                    $unwind:'$products'
                },
                {
                    $lookup: {
                        from: collection.PRODUCT_COLLECTION,
                        localField: 'products.item',
                        foreignField: '_id',
                        as: 'CartItems'
                    }
                },
                {   
                    $project:{
                        item:'$products.item',quantity:'$products.quantity',CartItems:{$arrayElemAt:['$CartItems',0]}
                    }

                },
                {
                    $project:{
                        item:1,quantity:1,CartItems:1,total: { $multiply: ['$quantity', { $toDouble: '$CartItems.price' }] }
                    }

                }
            ]).toArray();
            resolve(cart)

        })
    },
    getCartCount:(userId)=>{
        return new Promise(async(resolve,reject)=>{
            let cart=await db.get().collection(collection.CART_COLLECTION).findOne({user:new ObjectId(userId)})
            let cartCount=0
            if(cart){
                cartCount=cart.products.length
            }
            resolve(cartCount)
        })
    },
    changeCartQuantity:(details)=>{
        
        details.count=parseInt(details.count)
        details.quantity=parseInt(details.quantity)
        return new Promise((resolve,reject)=>{
            if((details.count+details.quantity)==0){
                db.get().collection(collection.CART_COLLECTION).updateOne({_id:new ObjectId(details.cart)},
                {
                    $pull:{products:{item:new ObjectId(details.product)}}
                }).then(()=>{
                    resolve({removeProduct:true})
                })

            }
            else{
                db.get().collection(collection.CART_COLLECTION).updateOne({_id:new ObjectId(details.cart),'products.item':new ObjectId(details.product)},
            {
                $inc:{'products.$.quantity':details.count}
            } 
            ).then(()=>{
                resolve({status:true})
            })
            }
        })
    },
    deleteCartProduct:(details)=>{
        return new Promise((resolve)=>{
            db.get().collection(collection.CART_COLLECTION).updateOne({_id:new ObjectId(details.cart)},
            {
                $pull:{products:{item:new ObjectId(details.product)}}
            }).then(()=>{
                resolve({status:true})
            })
        })
       
    },
    totalCartAmount: (userId)=>{
        return new Promise(async (resolve, reject) => {
            console.log(userId)
            let totalCartAmount = await db.get().collection(collection.CART_COLLECTION).aggregate([
                {
                    $match: { user: new ObjectId(userId) }
                },
                {
                    $unwind:'$products'
                },
                {
                    $lookup: {
                        from: collection.PRODUCT_COLLECTION,
                        localField: 'products.item',
                        foreignField: '_id',
                        as: 'CartItems'
                    }
                },
                {   
                    $project:{
                        item:'$products.item',quantity:'$products.quantity',CartItems:{$arrayElemAt:['$CartItems',0]}
                    }

                },
                {
                    $group:{
                        _id:null,
                        total:{$sum:{$multiply:[{$toInt:'$quantity'},{$toDouble:'$CartItems.price'}]}}
                    }
                }
            
              
                
            ]).toArray();
            if (totalCartAmount.length > 0) {
                resolve(totalCartAmount[0].total);
            } else {
                resolve(0); 
            }
        })

    },
    getCartProOnly:(userId)=>{
        return new Promise(async(resolve)=>{
            let cartProducts=await db.get().collection(collection.CART_COLLECTION).findOne({user:new ObjectId(userId)})
            resolve(cartProducts.products)

        })
    },
    placeOrder:(orderdetails,products,total)=>{
        return new Promise((resolve)=>{
            let status=orderdetails.paymentMethod==='Cash On Delivery'?'Placed':'Pending'
            let orderObj={
                address:{
                    firstName:orderdetails.firstName,
                    lastName:orderdetails.lastName,
                    houseName:orderdetails.houseName,
                    city:orderdetails.city,
                    pincode:orderdetails.pincode,
                    phone:orderdetails.phone,
                },
                status:status,
                paymentMethod:orderdetails.paymentMethod,
                user:new ObjectId(orderdetails.user),
                products:products,
                totalamount:total,
                orderdate:new Date()
            }
            db.get().collection(collection.ORDER_COLLECTION).insertOne(orderObj).then((response)=>{
                if(products[0]._id!=products[0].item){
                    db.get().collection(collection.CART_COLLECTION).deleteOne({user:new ObjectId(orderdetails.user)})
                }
                resolve({status:orderObj.status,orderId:response.insertedId,total:orderObj.totalamount})
            })
        })
    },
        getLastOrderDetails:(userId)=>{
            return new Promise(async(resolve)=>{
                console.log(userId)

                let orderdetails=await db.get().collection(collection.ORDER_COLLECTION).aggregate([

                    {$match:{user:new ObjectId(userId)}},
                    { $sort: { orderdate: -1 } },
                    { $limit: 1 },
                    {$unwind:'$products'},
                    {    $lookup: {
                        from: collection.PRODUCT_COLLECTION,
                        let: { productId: { $toObjectId: '$products.item' } }, 
                        pipeline: [
                          {
                            $match: {
                              $expr: {
                                $eq: ['$_id', '$$productId'] 
                              }
                            }
                          }
                        ],
                        as: 'orderdetails',
                    }
                    },
                    {   
                        $project:{
                            quantity:'$products.quantity',orderdetail:{$arrayElemAt:['$orderdetails',0]}
                        }
    
                    },
                    {
                        $project:{
                            quantity:1,orderdetail:1,total: { $multiply: ['$quantity', { $toDouble: '$orderdetail.price' }] }
                        }
    
                    }
        
        
                ]).toArray()
                resolve(orderdetails)
            })
        
            
        },
        totalLastOrderAmount: (userId)=>{
            return new Promise(async (resolve, reject) => {
                let totalOrderAmount = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
                    {
                        $match: { user: new ObjectId(userId) }
                    },
                    { $sort: { orderdate: -1 } },
                    { $limit: 1 },
                    {
                        $unwind:'$products'
                    },
                    {
                        $lookup: {
                            from: collection.PRODUCT_COLLECTION,
                            let: { productId: { $toObjectId: '$products.item' } }, 
                            pipeline: [
                              {
                                $match: {
                                  $expr: {
                                    $eq: ['$_id', '$$productId'] 
                                  }
                                }
                              }
                            ],
                            as: 'OrderItems',
                        }
                    },
                    {   
                        $project:{
                            quantity:'$products.quantity',OrderItems:{$arrayElemAt:['$OrderItems',0]}
                        }
    
                    },
                    {
                        $group:{
                            _id:null,
                            total:{$sum:{$multiply:[{$toInt:'$quantity'},{$toDouble:'$OrderItems.price'}]}}
                        }
                    }
                
                  
                    
                ]).toArray();
                if (totalOrderAmount.length > 0) {
                    resolve(totalOrderAmount[0].total);
                } else {
                    resolve(0); 
                }
            })
    
        },
        
        getAllOrderDetails:(userId)=>{
            return new Promise(async (resolve) => {

            
                let orderdetails = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
                    { $match: { user: new ObjectId(userId) } },
                    { $unwind: '$products' },
                    {
                        $lookup: {
                            from: collection.PRODUCT_COLLECTION,
                            let: { productId: { $toObjectId: '$products.item' } }, 
                            pipeline: [
                              {
                                $match: {
                                  $expr: {
                                    $eq: ['$_id', '$$productId'] 
                                  }
                                }
                              }
                            ],
                            as: 'orderdetails',
                        }
                    },
                    {   
                        $project: {
                            orderdate: {
                                $dateToString: { format: "%d-%B-%Y", date: "$orderdate" }
                            },
                            address:'$address',
                            paymentMethod: '$paymentMethod',
                            status: '$status',
                            quantity: '$products.quantity',
                            orderdetail: { $arrayElemAt: ['$orderdetails', 0] }
                        }
                    },
                    {
                        $project: {
                            address:1,
                            orderdate: 1,
                            paymentMethod: 1,
                            status: 1,
                            quantity: 1,
                            orderdetail: 1,
                            total: { $multiply: ['$quantity', { $toDouble: '$orderdetail.price' }] }
                        }
                    },
                    {
                        $group: {
                            _id: '$_id',
                            products: { $push: { quantity: '$quantity', orderdetail: '$orderdetail', total: '$total' } },
                            totalQuantity: { $sum: '$quantity' },
                            totalPrice: { $sum: '$total' },
                            address:{$first: '$address'},
                            orderdate: { $first: '$orderdate' },
                            paymentMethod: { $first: '$paymentMethod' },
                            status: { $first: '$status' }
                        }
                    }   
                ]).toArray();
                
                resolve(orderdetails);
            });
            
        
            
        },
        
        getProducttemplate:(proId)=>{
            return new Promise(async(resolve)=>{
                let product=await db.get().collection(collection.PRODUCT_COLLECTION).findOne({_id:new ObjectId(proId)})
                let templateprdouct=[{
                    _id:product._id,
                    item:product._id,
                    quantity:1,
                    CartItems:product,
                    total:product.price
                }]
               
                resolve(templateprdouct)
            })
    
        },
        generateRazorpay:(orderId,total)=>{
            return new Promise((resolve)=>{
                var options={
                    amount:total*100,
                    currency:'INR',
                    receipt:orderId,

                }
                instance.orders.create(options,(err,order)=>{
                    if(err){
                        console.log(err)
                    }else{
                        db.get().collection(collection.PAYMENT_COLLECTION).insertOne(order).then(() => {
                            resolve(order)
                        })
                        
                    }
                })
            })

        },
        verifyPayment:(details)=>{
            return new Promise((resolve,reject)=>{
            const { createHmac } = require('node:crypto');
            const hmac=createHmac('sha256','4Pwm5IvPggwkqkF1mN0PrdTp').update(details['response[razorpay_order_id]']+'|'+details['response[razorpay_payment_id]']).digest('hex') //secret key
            if(hmac===details['response[razorpay_signature]']){
                resolve()
            }else{
                reject()
            }
        })
        },
        changePaymentStatus:(orderID)=>{
            return new Promise((resolve)=>{
                db.get().collection(collection.ORDER_COLLECTION).updateOne({_id:new ObjectId(orderID)},
                {
                    $set:{status:'Placed'}
                } 
            ).then(()=>{
                resolve()
            })

            })
        },
        getPaymentDetails:(orderId)=>{
            return new Promise(async(resolve)=>{
                let order=await db.get().collection(collection.PAYMENT_COLLECTION).findOne({receipt:orderId})
                resolve(order)
            })
        }

    


}