const db = require('../config/connection')
const collection = require('../config/collection')
var ObjectId = require('mongodb').ObjectId
const bcrypt = require('bcrypt')
module.exports = {
    doLogin:(userData)=>{
        return new Promise(async(resolve)=>{
            let response = {}
            let user = await db.get().collection(collection.ADMIN_COLLECTION).findOne({ user: userData.email })
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



    }
    ,addProduct: (product, callback) => {
        db.get().collection(collection.PRODUCT_COLLECTION).insertOne(product).then(() => {
            callback(product._id)
        })
    },
    getAllProduct: () => {
        return new Promise(async (resolve, reject) => {
            let products = await db.get().collection(collection.PRODUCT_COLLECTION).find().toArray()
            resolve(products)
        })
    },
    deleteProduct: (productId) => {
        return new Promise((resolve) => {
            db.get().collection(collection.PRODUCT_COLLECTION).deleteOne({ _id: new ObjectId(productId) }).then(() => {
                resolve()
            })
        })
    },
    getProduct: (productId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.PRODUCT_COLLECTION).findOne({ _id: new ObjectId(productId) }).then((product) => {
                resolve(product)
            })
        })
    },
    editProduct:(productId,productDetails)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.PRODUCT_COLLECTION).updateOne({_id:new ObjectId(productId)},{$set:{pname:productDetails.pname,price:productDetails.price,brand:productDetails.brand}}).then(()=>{
                resolve()
            })
        })
    }
}