const express = require('express')
const cors = require('cors');
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const port = process.env.PORT || 5000
const stripe = require("stripe")(process.env.STRIPE_SECRET);

const app = express()
app.use(cors())
app.use(express.json())

    

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.pbaqirc.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run(){
    try{      
        const allProducts = client.db('mens-fashion').collection('all-products');
        const users = client.db('mens-fashion').collection('users');
        const bookings = client.db('mens-fashion').collection('bookings');
        const paymentCollec = client.db('mens-fashion').collection('payment');


    app.get('/', async(req,res)=>{
                res.send(`server is rinning!`)

    })

  
    //products
    app.get('/cetegori/:cetegori', async(req,res)=>{
        const name = req.params.cetegori
        const query = {cetegori: name}
        const result = await allProducts.find(query).toArray()
        res.send(result)
    })

    app.get('/cetegori/:cetegori/:id', async(req,res)=>{
        const ids = req.params.id
        const query = {_id: new ObjectId(ids)}
        const result = await allProducts.findOne(query)
        res.send(result)
    })

    //users
    app.post('/users', async(req,res)=>{
        const query = req.body
        const result = await users.insertOne(query)
        res.send(result)
    })

    app.get('/users', async(req,res)=>{
        const query = {}
        const result = await users.find(query).toArray()
        res.send(result)
    })

    app.get('/users/buyers',async(req,res)=>{
        const filter = {role: 'Buyer'}
        const result = await users.find(filter).toArray()
        res.send(result)
    })

    app.get('/users/sellers',async(req,res)=>{
        const filter = {role: 'Seller'}
        const result = await users.find(filter).toArray()
        res.send(result)
    })

    app.delete('/users/:id',async(req,res)=>{
        const ids = req.params.id
        const query = {_id: new ObjectId(ids)}
        const result = await users.deleteOne(query)
        res.send(result)
    })

    //user-admin
    app.put('/users/admin/:id', async (req,res)=>{          
        const ids = req.params.id;
        const filter = {_id: new ObjectId(ids)}
        const option = {upsert: true}
        const updateDoc= {
            $set:{
                role: 'admin',
                //verify: 'verified'
            }
        }
        const result =await users.updateOne(filter, updateDoc, option)
        res.send(result)
    })
    //isAdmin
    app.get('/users/admin/:email', async (req,res)=>{
        const email = req.params.email;
        const query = {email}
        const user = await users.findOne(query)
        res.send({
            isAdmin: user?.role === 'admin',
            //isVerify: user?.verify === 'verified'
        })
    });

    app.get('/users/sellers/:email', async (req,res)=>{
        const email = req.params.email
        const query = {email}
        const user = await users.findOne(query)
        res.send({ isSeller: user?.role === 'Seller' })
    });

    //bookings
    app.post('/bookings', async(req,res)=>{
        const booking = req.body
        const query ={
            name: booking.name,
            email: booking.email
        }
        const allRedyBooked = await bookings.find(query).toArray()
        if(allRedyBooked.length){
            const message = `You are alredy booking ${booking.name}`
            return res.send({acknowledged: false, message})
        }
        const result = await bookings.insertOne(booking)
        res.send(result)
    })

    app.get('/bookings', async(req,res)=>{
        const email = req.query.email
        const query ={email: email}
        const result = await bookings.find(query).toArray()
        res.send(result)
    })

    app.get('/bookings/:id', async(req,res)=>{
        const ids = req.params.id
        const query ={_id: new ObjectId(ids)}
        const result = await bookings.findOne(query)
        res.send(result)

    })

    app.delete('/bookings/:id', async(req,res)=>{
        const ids = req.params.id
        const query ={_id: new ObjectId(ids)}
        const result = await bookings.deleteOne(query)
        res.send(result)

    })
    
    //add-product
    app.post('/products', async(req,res)=>{
        const query = req.body;
        const result = await allProducts.insertOne(query)
        res.send(result)
    })

    app.get('/products', async(req,res)=>{
         const email = req.query.useR
        const user = {useR: email}
        const result = await allProducts.find(user).toArray()
        res.send(result)
    })

     //delete your product
     app.delete('/products/:id', async(req,res)=>{
        const ids = req.params.id
        const query = {_id: new ObjectId(ids)}
        const result = await allProducts.deleteOne(query)
        res.send(result)
    })

    //payment system
    app.post('/create-payment-intent',async (req,res)=>{
        const booking = req.body;
        const price = booking.price;
        const amount = price * 100;
        const paymentInten = await stripe.paymentIntents.create({
            currency: 'usd',
            amount: amount,
            "payment_method_types": [
                "card"
              ]
        });
        res.send({
            clientSecret: paymentInten.client_secret,
          });
    })

    app.post('/payments', async(req,res)=>{
        const payment = req.body;
        const result = await paymentCollec.insertOne(payment);
        const id = payment.bookingId;
        const filter = {_id: new ObjectId(id)}
        const updateDoc ={
            $set :{
                paid: true,
                transId: payment.transId,
            }
        }
        const updateResult = await bookings.updateOne(filter, updateDoc)
        res.send(result)
    })





    }
    finally{}
    }
run().catch(err=> console.log(err))
    

    app.listen(port,()=>{
        console.log(`server is running ${port}`);
    })
