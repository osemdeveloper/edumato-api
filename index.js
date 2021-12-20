var express = require("express");
const app = express();
const bodyParser = require("body-parser");
const cors = require("cors");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
dotenv.config();
mongoose
  .connect(process.env.MONGO_URL)
  .then(() => console.log("DB Connection Successfull!"))
  .catch((err) => {
    console.log(err);
  });

//to recieve data from form
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cors());

app.get("/", (req, res) => {
  res.send(
    "<h1>Welcome to Edumato Api</h1> <h3>/location := to view all cities</h3> <h3>/restaurants := to view all restaurents</h3> <h3>restaurants?cityId= := to view all restaurents wrt to city</h3> <h3>/mealType  := to view all cuisines</h3>"
  );
});

//List All cities
app.get("/location", (req, res) => {
  db.collection("location")
    .find()
    .toArray((err, result) => {
      if (err) throw err;
      res.send(result);
    });
});

//List all restaurants
// app.get('/restaurants',(req,res) =>{
//     db.collection('restaurants').find().toArray((err,result)=>{
//         if(err) throw err;
//         res.send(result)
//     })
// })

// query example
app.get("/restaurants", (req, res) => {
  var query = {};
  if (req.query.stateId) {
    query = { state_id: Number(req.query.stateId) };
  } else if (req.query.mealtype_id) {
    query = { "mealTypes.mealtype_id": Number(req.query.mealtype_id) };
  }
  db.collection("restaurants")
    .find(query)
    .toArray((err, result) => {
      if (err) throw err;
      res.send(result);
    });
});

//filterapi
//(http://localhost:8210/filter/1?lcost=500&hcost=600)
app.get("/filter/:mealType", (req, res) => {
  let sort = { cost: 1 };
  let skip = 0;
  let limit = 1000000000000;
  if (req.query.sortkey) {
    sort = { cost: req.query.sortkey };
  }
  if (req.query.skip && req.query.limit) {
    skip = Number(req.query.skip);
    limit = Number(req.query.limit);
  }
  let mealType = Number(req.params.mealType);
  let query = { "mealTypes.mealtype_id": mealType };
  if (req.query.lcost && req.query.hcost) {
    query = {
      $and: [
        {
          cost: { $gt: Number(req.query.lcost), $lt: Number(req.query.hcost) },
        },
      ],
      "mealTypes.mealtype_id": mealType,
    };
  } else if (req.query.cuisine) {
    let cusineArr = req.query.cuisine.split('')
    let finalCuisine = [];
    cusineArr.map((item) => {
      finalCuisine.push(Number(item));
    })
    query = {
      "mealTypes.mealtype_id": mealType,
      "cuisines.cuisine_id": {$in : finalCuisine},
    };
    console.log(query);
    //query = {"type.mealtype":mealType,"Cuisine.cuisine":{$in:["1","5"]}}
  } else if (req.query.lcost && req.query.hcost) {
    let lcost = Number(req.query.lcost);
    let hcost = Number(req.query.hcost);
    query = {
      $and: [{ cost: { $gt: lcost, $lt: hcost } }],
      "mealTypes.mealtype_id": mealType,
    };
  }
  db.collection("restaurants")
    .find(query)
    .sort(sort)
    .skip(skip)
    .limit(limit)
    .toArray((err, result) => {
      if (err) throw err;
      res.send(result);
    });
});

//List all QuickSearches
app.get("/quicksearch", (req, res) => {
  db.collection("Mealtypes")
    .find()
    .toArray((err, result) => {
      if (err) throw err;
      res.send(result);
    });
});

//Details of perticular restaurant
app.get("/details/:id", (req, res) => {
  db.collection("restaurants")
    .find({ restaurant_id: Number(req.params.id) })
    .toArray((err, data) => {
      if (err) throw err;
      res.send(data);
    });
});

//restaurant menu
app.get("/restaurantMenu/:res_id", (req, res) => {
  console.log(req.params.res_id);
  db.collection("restaurantMenu")
    .find({ restaurant_id: Number(req.params.res_id) })
    .toArray((err, data) => {
      if (err) throw err;
      res.send(data);
    });
});

//place orders
app.post("/placeOrder", (req, res) => {
  // console.log(req.body)
  db.collection("orders").insert(req.body, (err) => {
    if (err) throw err;
    res.send("order Placed");
  });
});

app.get("/viewOrders/:emailid", (req, res) => {
  let query = {};
  let emailid = req.params.emailid;
  let skip = 0;
  let limit = 1000000000000000;
  if (req.query.skip && req.query.limit) {
    skip = Number(req.query.skip);
    limit = Number(req.query.limit);
  }
  query = { "email": emailid};

  db.collection("orders")
    .find(query)
    .skip(skip)
    .limit(limit)
    .toArray((err, data) => {
      res.send(data);
    });
});

app.get("/viewOrders/:id", (req, res) => {
  let id = mongo.ObjectID(req.params.id);
  db.collection("orders")
    .find({ _id: id })
    .toArray((err, data) => {
      res.send(data);
    });
});

app.delete("/deleteOrder", (req, res) => {
  db.collection("orders").remove({}, (err, result) => {
    if (err) throw err;
    res.send(result);
  });
});

//update order: use put call
app.put("/updateOrder/:id", (req, res) => {
  let id = mongo.ObjectId(req.params.id);
  let status = "Pending";
  let statusVal = 2;

  if (req.query.status) {
    statusVal = Number(req.query.status);
    if (statusVal == 1) {
      status = "Accepted";
    } else if (statusVal == 0) {
      status = "Rejected";
    } else {
      status = "Pending";
    }
  }
  db.collection("orders").updateOne(
    { _id: id },
    {
      $set: {
        status: status,
      },
    },
    (err, result) => {
      if (err) throw err;
      res.send(`Your order status is ${status}`);
    }
  );
});

app.listen(process.env.PORT || 5000, () => {
  console.log("Edumato server is running!");
});


