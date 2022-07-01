const express = require('express');
const cors=require('cors');
const jwt = require('jsonwebtoken');

const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require ('dotenv').config();
// console.log(process.env)

const port=process.env.PORT || 5000;
const app=express();
// middleware
app.use(cors());
app.use(express.json());

// const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.adkux.mongodb.net/?retryWrites=true&w=majority`;
const uri=`mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.dbg5s.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run(){
try{
await client.connect();
const userCollection=client.db('users').collection('user');
const billCollection=client.db('bills').collection('bill');
app.get('/',(req,res)=>{
    res.send('runnning test')
});

app.get('/api/login',async (req,res)=>{
   const email=req.query.email;
   const query={Email:email};
   const cursor=await userCollection.find(query);
   const result=await cursor.toArray();
   console.log(result);

res.send(result);

})
app.get('/api/billing-list',async (req,res)=>{
    const page = parseInt(req.query.page);
    const size = parseInt(req.query.size);
   const query={};

   const cursor=await billCollection.find(query).sort({ _id : -1});
   let bills;
            if(page || size){
                const rest=(page-1);
                
                bills = await cursor.skip(rest*size).limit(size).toArray();
            }
            else{
               bills = await cursor.toArray();
            }

            
            res.send(bills);
   

})
// api for delete 
app.delete('/api/delete-billing/:id',async(req,res)=>{
    const id=req.params.id;
    const query={_id:ObjectId(id)};
    const result = await billCollection.deleteOne(query);
    res.send(result);
    console.log(result);
    
    

})

// api for search
// app.get('/tsearch',async (req,res)=>{
//     // const page = parseInt(req.query.page);
//     // const size = parseInt(req.query.size);
//     const searchText = req.query.search;
//     console.log(searchText);
// //    const query={$or:[ { email: {searchText } }, { name: {searchText} },{ phone: {searchText } } ] }
//    const query1= {name:searchText}
// //    const query2={phone:searchText};

//    const cursor=billCollection.find(query1);
//    console.log(cursor);
  
//    let bills;
//             if(page || size){
//                 const rest=(page-1);
                
//                 bills = await cursor.skip(rest*size).limit(size).toArray();
//             }
            // else{
               
            // }
//             bills = await cursor.toArray();
            
//             res.send(bills);
   

// })
app.get('/api/entityCount', async (req, res) => {
    const query = {};
    const cursor = billCollection.find(query);
    const count = await billCollection.countDocuments();
    res.send({ count });
})
app.post('/api/registration',async (req,res)=>{
    const user=req.body;
    const query={Email:user.Email}
    const userFound=await userCollection.findOne(query);
    if(userFound){
     res.send('the user is already registred please login')
    }
    else{
     const result=await userCollection.insertOne(user);
 
  
    res.send(result)
 
    }
 })

 app.post('/api/add-billing',async (req,res)=>{
    const bill=req.body;
    const billPost=await billCollection.insertOne(bill);
    console.log(billPost);
    res.send(billPost);

 })




//auth jwt
}
finally{

}
}

run().catch(console.dir);



app.listen(port,()=>{
    console.log('listening to',port);
})
