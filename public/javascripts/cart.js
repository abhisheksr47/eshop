function addToCart(prodId) {
    $.ajax({
        url: '/add-to-cart/' + prodId,
        method: 'get',

        success: (response) => {
            if (response.status) {

                document.getElementById('cartcount').innerHTML = response.cartCount

            }
        },
        error: () => {
            let cartLogout = 'Please log in or sign up to add items to your cart';
            location.href = `/login?cartLogout=${cartLogout}`;
        }
    });
}
function changeQuantity(cartId, productId, user, count) {
    quantity = parseInt(document.getElementById(productId).innerHTML)
    count = parseInt(count)

    $.ajax({
        url: '/change-product-quantity',
        data: {
            user: user,
            cart: cartId,
            product: productId,
            count: count,
            quantity: quantity
        },
        method: 'post',
        success: (response) => {
            if (response.removeProduct) {
                document.getElementById('cartcount').innerHTML = response.cartCount
                document.getElementById('row_' + productId).remove();
                document.getElementById('totalPrice').innerHTML = `<strong>₹ ${response.total}</strong>`
                if(response.cartCount==0){
                    location.reload()
                }
            } else {
                document.getElementById('cartcount').innerHTML = response.cartCount
                document.getElementById('totalPrice').innerHTML = `<strong>₹ ${response.total}</strong>`
                let updatedProduct = response.cartProducts.find(product => product.item === productId);
                if (updatedProduct) {
                    document.getElementById('subtotal_' + productId).innerHTML = '₹ ' + updatedProduct.total;
                    document.getElementById(productId).innerHTML = updatedProduct.quantity
                }
            }


        }
    })
}
function removeProduct(cartId, productId, userId) {
    $.ajax({
        url: '/delete-cart-product',
        data: {
            cart: cartId,
            product: productId,
            user: userId
        },
        method: 'post',
        success: (response) => {
            if(response.cartCount==0){
                location.reload()
            }
            document.getElementById('totalPrice').innerHTML = `<strong>₹ ${response.total}</strong>`
            document.getElementById('cartcount').innerHTML = response.cartCount
            document.getElementById('row_' + productId).remove();
        }
    })
}



$("#checkoutform").submit((e) => {
    e.preventDefault()
    $.ajax({
        url: '/checkout',
        method: 'post',
        data: $("#checkoutform").serialize(),
        success: (response) => {
            if (response.status==='Placed') {
                location.href = '/orderplaced'
            }
            else {
                razorpay(response)
            }
        }
    })
})

function razorpay(order) {

    var options = {
        "key": "rzp_test_Tv4qtHKlzz61Z8", // Enter the Key ID generated from the Dashboard
        "amount": order.amout, // Amount is in currency subunits. Default currency is INR. Hence, 50000 refers to 50000 paise
        "currency": "INR",
        "name": "Eshop", //your business name
        "description": "Test Transaction",
        "image": "https://example.com/your_logo",
        "order_id": order.id, //This is a sample Order ID. Pass the `id` obtained in the response of Step 1
        "handler":function(response){
            verifypayment(response,order)
        },
        "prefill": { //We recommend using the prefill parameter to auto-fill customer's contact information especially their phone number
            "name": "Gaurav Kumar", //your customer's name
            "email": "gaurav.kumar@example.com",
            "contact": "9000090000" //Provide the customer's phone number for better conversion rates 
        },
        "notes": {
            "address": "Razorpay Corporate Office"
        },
        "theme": {
            "color": "#3399cc"
        }
    };
    var rzp1 = new Razorpay(options);
    rzp1.open();
}

function verifypayment(response,order){
    $.ajax({
        url:'/verifypayment',
        data:{
            response,
            order
        },
       method:'post',
       success:(response)=>{
        if(response){
            location.href = '/orderplaced'
        }else{
            alert('Payment Failed,please retry')
        }
       }
    })
}

$(document).ready(function() {
    $('#retryPayment').click(function() {
        let orderId=$(this).data('orderid')
        $.ajax({
            url:'/getRazorPayOrder',
            data:{
                orderId
            },
           method:'post',
           success:(response)=>{
                razorpay(response)

           }
        })
    });
});

window.setTimeout(function() {
    $(".msg").fadeTo(400, 0).slideUp(500, function(){
        $(this).remove(); 
    });
}, 2000);