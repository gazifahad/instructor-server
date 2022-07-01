const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');

const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();
// console.log(process.env)

const port = process.env.PORT || 5000;
const app = express();
// middleware
app.use(cors());
app.use(express.json());
const verifyToken=(req,res,next)=>{
  const authHeader =req.headers.authorization; 
  if(!authHeader){
    res.status(401).send('unauthorized')
  }
}

// const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.adkux.mongodb.net/?retryWrites=true&w=majority`;
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.dbg5s.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {
    try {
        await client.connect();
        const userCollection = client.db('users').collection('user');
        const billCollection = client.db('bills').collection('bill');
        app.get('/', (req, res) => {
            res.send('runnning test')
        });

        app.get('/api/login', async (req, res) => {
            const email = req.query.email;
            const pass=req.query.pass;
            // console.log(pass);
            const query = { Email: email,password:pass };
            const cursor = await userCollection.find(query);
            const result = await cursor.toArray();
            
            if(result){
                let accessToken=jwt.sign({Email:email},process.env.ACCESS_TOKEN_SECRET,{
                    expiresIn:'12h'
                });
                res.send({result,accessToken:accessToken})
            }
            else{
                    res.send({success:false})
            }

        })
        app.get('/api/billing-list', async (req, res) => {
            // console.log(req.headers.authorization);
            const page = parseInt(req.query.page);
            const size = parseInt(req.query.size);
            const query = {};

            const cursor = await billCollection.find(query).sort({ _id: -1 });
            let bills;
            if (page || size) {
                const rest = (page - 1);

                bills = await cursor.skip(rest * size).limit(size).toArray();
            }
            else {
                bills = await cursor.toArray();
            }


            res.send(bills);


        })
        // api for update 
        app.put('/api/update-billing/:id', async (req, res) => {
            const id = req.params.id;
            const updatedUser = req.body;
            // console.log(req.body);
            const filter = { _id: ObjectId(id) };
            const option = { upsert: true };
            const updateDoc = {
                $set: {
                    name: updatedUser.name,
                    email: updatedUser.email

                }
            };
            const result = await billCollection.updateOne(filter, updateDoc, option);
            res.send(result);
        })

        // get updated item 
        app.get('/api/update-billing/:id', async (req, res) => {
            const id = req.params.id;
            // console.log(id);
            const query = { _id: ObjectId(id) };
            const result = await billCollection.findOne(query);
            res.send(result)

        })
        app.get('/totalAmount', async (req, res) => {
            const query = {};
            billCollection.find(query).toArray((err, rest) => {
                if (err) {
                    throw err;
                }
                // console.log(rest);
                const totalAmount = rest.reduce((acc, obj) => {
                    return acc + parseInt(obj.amount);

                }, 0)
                res.send({ totalAmount });
            }

            );
            // console.log(result);
            // res.send(result.reduce((acc,object)=>{
            //     return acc+object.amount;
            //     },0))
        })
        // api for delete 
        app.delete('/api/delete-billing/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await billCollection.deleteOne(query);
            res.send(result);
            // console.log(result);



        })

        // api for search
        app.get('/tsearch', async (req, res) => {
            const page = parseInt(req.query.page);
            const size = parseInt(req.query.size);
            const searchText = req.query.search;
           const regex = new RegExp(searchText, "g");
            
            const query = { $or: [{ email: regex }, { name: regex }, { phone: regex }] }
            //    const query1= {name:searchText}
            //    const query2={phone:searchText};

            const cursor = billCollection.find(query);


            if (page || size) {
                const rest = (page - 1);

             cursor.skip(rest * size).limit(size).toArray((err,rest)=>{
                if(err){
                    throw err;
                    
                }
                console.log(rest);
                return;
            });
            }
           
          cursor.toArray((err,rest)=>{
            if(err){
                throw err;
            }
            console.log(rest);
            return;
           });

           


        })
        app.get('/api/entityCount', async (req, res) => {
            const query = {};
            const cursor = billCollection.find(query);
            const count = await billCollection.countDocuments();
            res.send({ count });
        })
        app.post('/api/registration', async (req, res) => {
            const user = req.body;
            const query = { Email: user.Email }
            const userFound = await userCollection.findOne(query);
            if (userFound) {
                res.send('the user is already registred please login')
            }
            else {
                const result = await userCollection.insertOne(user);


                res.send(result)

            }
        })

        app.post('/api/add-billing', async (req, res) => {
            const bill = req.body;
            const billPost = await billCollection.insertOne(bill);
            // console.log(billPost);
            res.send(billPost);

        })




        //auth jwt
    }
    finally {

    }
}

run().catch(console.dir);



app.listen(port, () => {
    console.log('listening to', port);
})
