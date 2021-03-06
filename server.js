/* server.js - Express server*/
"use strict";
const log = console.log;
log("Express server");
const datetime = require("date-and-time");

const express = require("express");
const { mongoose } = require("./db/mongoose");
mongoose.set("useFindAndModify", false); // for some deprecation issues
const cors = require("cors");
const app = express();
// CORS for React back-end
// REMOVE OPTIONS IN CORS CALL IF BUILDING
// app.use(cors({ credentials: true, origin: "http://localhost:3000" }));
app.use(cors());

// import mongoose models
const { Store } = require("./models/store");
const { User, Employee, Owner, Admin } = require("./models/user");
const { Event } = require("./models/events");
const { getLatLong, getDistance } = require("./third-party-api");
const { ObjectID } = require("mongodb");
const {
  getStoreByID,
  getAllStores,
  getAllUsers,
  getUserByID,
  getEventsByStoreID,
  updateUser,
  updateStore,
  getJoinedEventByUserID,
  getInQueueEventsByStoreID,
} = require("./basic._mongo");

const bcrypt = require("bcryptjs");

// body-parser: middleware for parsing HTTP JSON body into a usable object
const bodyParser = require("body-parser");
app.use(bodyParser.json());

// Setting up a static directory for the files in /pub
app.use(express.static(__dirname + "/client/build"));

// express-session for managing user sessions
const session = require("express-session");
app.use(bodyParser.urlencoded({ extended: true }));

/*** Webpage routes below **********************************/
// Serve the build
// app.use(express.static(__dirname + "/client/public"));

/*************************************************
 * Session Handling */
app.use(
  session({
    secret: "oursecret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      expires: 4 * 60000,
      httpOnly: true,
      // secure: false,
    },
  })
);

app.post("/newAdmin", (req, res) => {
  log("new admin");
  const user = new Admin({
    password: req.body.password,
    email: req.body.email,
    username: req.body.username,
    phone_number: req.body.phone_number,
  });

  // Save the user
  user.save().then(
    (user) => {
      res.send({ _id: user._id });
    },
    (error) => {
      res.status(400).send(error);
    }
  );
});

// A route to login and create a session
app.post("/login", (req, res) => {
  const username = req.body.username;
  const password = req.body.password;
  log("login:", username, password);

  // Use the static method on the User model to find a user by their username and password
  User.findByUsernamePassword(username, password)
    .then((user) => {
      // Add the user's id to the session cookie.
      // We can check later if this exists to ensure we are logged in.
      req.session.user = user._id;
      req.session.username = user.username;
      req.session.__t = !user.__t ? "visitor" : user.__t.toLowerCase();
      res.send({
        currentUser: user.username,
        __t: req.session.__t,
      });
    })
    .catch((error) => {
      res.status(400).send();
    });
});

// A route to logout a user
app.get("/logout", (req, res) => {
  log("logout");
  // Remove the session
  req.session.destroy((error) => {
    if (error) {
      res.status(500).send(error);
    } else {
      res.send();
    }
  });
});

// A route to check if a use is logged in on the session cookie
app.get("/check-session", (req, res) => {
  if (req.session.user) {
    res.send({ currentUser: req.session.username, __t: req.session.__t });
  } else {
    res.status(401).send();
  }
});

/*************************************************/
// MiddleWares for checking Mongo Stuff

const mongoStoreIDChecker = (req, res, next) => {
  // check mongoose connection established.
  if (!ObjectID.isValid(req.query.store_id)) {
    res.status(500).send("Wrong Mongo ID");
    return;
  } else {
    next();
  }
};

const mongoUserIDChecker = (req, res, next) => {
  // check mongoose connection established.
  if (!ObjectID.isValid(req.query.user_id)) {
    res.status(500).send("Wrong Mongo ID");
    return;
  } else {
    next();
  }
};

// session authentication middleware
const authenticate = (req, res, next) => {
  if (req.session.user) {
    User.findById(req.session.user)
      .then((user) => {
        if (!user) {
          return Promise.reject();
        } else {
          req.user = user;
          next();
        }
      })
      .catch((error) => {
        res.status(401).send("Unauthorized");
      });
  } else {
    res.status(401).send("Unauthorized");
  }
};

const userExists = (req, res, next) => {
  let invalid = false;
  User.findOne(
    {
      username: req.body.username,
    },
    (err, obj) => {
      if (obj !== null) {
        res.status(403).send(err);
        invalid = true;
      }
    }
  );
  if (!invalid) next();
};

const userExistsExcludingCurrentUser = (req, res, next) => {
  getUserByID(
    (result) => {
      if (result.username !== req.body.username) {
        userExists(req, res, next);
      } else {
        next();
      }
    },
    (error) => {
      res.status(400).send(error);
    },
    req.session.user
  );
};

/*************************************************/
// API Endpoints Below
app.post("/newCustomer", userExists, (req, res) => {
  log("new customer");
  const user = new User({
    password: req.body.password,
    email: req.body.email,
    username: req.body.username,
    phone_number: req.body.phone_number,
    fav_stores: [],
  });

  // Save the user
  user.save().then(
    (user) => {
      res.send({ _id: user._id });
    },
    (error) => {
      res.status(400).send(error);
    }
  );
});

app.post("/newOwner", userExists, (req, res) => {
  log("new owner");
  const user = new Owner({
    password: req.body.password,
    email: req.body.email,
    username: req.body.username,
    phone_number: req.body.phone_number,
    store_id: "",
  });

  // Save the user
  user.save().then(
    (user) => {
      res.send({ _id: user._id });
    },
    (error) => {
      res.status(400).send(error);
    }
  );
});

app.post("/newEmployee", userExists, (req, res) => {
  log("new employee");
  const user = new Employee({
    password: req.body.password,
    email: req.body.email,
    username: req.body.username,
    phone_number: req.body.phone_number,
    store_id: "",
  });

  // Save the user
  user.save().then(
    (user) => {
      res.send({ _id: user._id });
    },
    (error) => {
      res.status(400).send(error);
    }
  );
});

app.post("/newStore", (req, res) => {
  const store = new Store({
    name: req.body.name,
    address: req.body.address,
    verified: req.body.verified,
    owner_id: req.body.owner_id,
    employee_ids: [],
    lat: 100,
    long: 100,
    in_store: 0,
    open_time: req.body.open_time,
    close_time: req.body.close_time,
    announcement: "",
    activated: false,
  });
  User.findById(req.body.owner_id).then((user) => {
    store.save().then(
      (store) => {
        user.store_id = store.id;
        user.save().catch((error) => res.status(500).send(error));
        res.send(store);
      },
      (error) => res.status(500).send(error)
    );
  });

  // getLatLong(req.body.address)
  //   .then((result) => {
  //     store.lat = result.lat;
  //     store.long = result.long;
  //     return User.findById(req.body.owner_id);
  //   })
  //   .then((user) => {
  //     store.save().then(
  //       (store) => {
  //         user.store_id = store.id;
  //         user.save().catch((error) => res.status(500).send(error));
  //         res.send(store);
  //       },
  //       (error) => res.status(500).send(error)
  //     );
  //   })
  //   .catch((error) => res.status(500).send(error));
});

app.get("/getDistance", (req, res) => {
  const dist = getDistance(
    req.query.fromLat,
    req.query.fromLong,
    req.query.toLat,
    req.query.toLong
  );
  res.send(JSON.stringify({ dist: dist }));
});

app.get("/getAllStores", authenticate, (req, res) => {
  getAllStores(
    (result) => {
      res.send(result);
    },
    (error) => {
      res.status(400).send(error);
    }
  );
});

app.get("/getAllUsers", authenticate, (req, res) => {
  getAllUsers(
    (result) => {
      res.send(result);
    },
    (error) => {
      res.status(400).send(error);
    }
  );
});

app.get("/getUserById", authenticate, mongoUserIDChecker, (req, res) => {
  getUserByID(
    (result) => {
      res.send(result);
    },
    (error) => {
      res.status(400).send(error);
    },
    req.query.user_id
  );
});

app.get("/getUserFavStores", authenticate, (req, res) => {
  getUserByID(
    (result) => {
      res.send(result.fav_stores);
    },
    (error) => {
      res.status(400).send(error);
    },
    req.session.user
  );
});

app.post(
  "/updateUserFavStores",
  authenticate,
  mongoStoreIDChecker,
  (req, res) => {
    User.findById(req.session.user)
      .then((rest) => {
        if (!rest) {
          res.status(404).send("Resource not found");
        } else {
          if (req.query.bool === "true") {
            rest.fav_stores.push(req.query.store_id);
          } else if (req.query.bool === "false") {
            rest.fav_stores.pull(req.query.store_id);
          }
          rest.save();
          res.send(rest.fav_stores);
        }
      })
      .catch((error) => {
        res.status(400).send("Bad Request");
      });
  }
);

app.get("/getStoreById", authenticate, mongoStoreIDChecker, (req, res) => {
  getStoreByID(
    (result) => {
      res.send(result);
    },
    (error) => {
      res.status(400).send(error);
    },
    req.query.store_id
  );
});

app.get("/getUserStore", authenticate, (req, res) => {
  User.findById(req.session.user)
    .then((user) => {
      if (user.store_id === "") res.send({ user });
      else {
        Store.findById(user.store_id)
          .then((store) => res.send({ user, store }))
          .catch((e) => res.status(400).send(e));
      }
    })
    .catch((e) => res.status(400).send(e));
});

app.post("/joinQueue", (req, res) => {
  const event = new Event({
    store_id: req.body.store_id,
    user_id: req.session.user,
    username: req.session.username,
    entry_time: req.body.entry_time,
    exit_time: req.body.exit_time,
    accepted: false,
    notified: false,
  });

  getJoinedEventByUserID(
    (result) => {
      if (result.length > 0) {
        res.send(result);
      } else {
        event.save().then(
          (event) => {
            res.send(event);
          },
          (error) => {
            res.status(400).send(error); // 400 for bad request
          }
        );
      }
    },
    (error) => {
      res.status(400).send(error);
    },
    req.session.user
  );
});

app.post("/updateEvent", (req, res) => {
  const event = req.body;
  Event.findOneAndUpdate({ _id: event._id }, event, (error, result) => {
    log(result);
    res.send(result);
  });
});

app.post("/exitQueue", (req, res) => {
  const update = { exit_time: req.body.exit_time };
  const filter = { user_id: req.session.user, exit_time: "" };
  Event.findOneAndUpdate(filter, update, (error, result) => {
    res.send(result);
  });
});

app.get(
  "/getEventsByStoreId",
  authenticate,
  mongoStoreIDChecker,
  (req, res) => {
    getEventsByStoreID(
      (result) => {
        res.send(result);
      },
      (error) => {
        res.status(400).send(error);
      },
      req.query.store_id
    );
  }
);
app.patch(
  "/updateUser",
  authenticate,
  userExistsExcludingCurrentUser,
  (req, res) => {
    const fields = req.body;
    const updatePassword = fields.password !== "" && fields.new_password !== "";
    console.log(fields);
    new Promise((resolve, reject) => {
      getUserByID(
        (result) => {
          resolve(result.password);
        },
        (error) => {
          res.status(400).send(error);
        },
        req.session.user
      );
    }).then((password) => {
      bcrypt.compare(fields.password, password, (err, result) => {
        if (!result && updatePassword) {
          res.status(402).send();
        } else {
          bcrypt.genSalt(10, (err, salt) => {
            bcrypt.hash(fields.new_password, salt, (err, hash) => {
              fields.password = hash;
              if (!updatePassword) {
                delete fields.password;
              }
              updateUser(
                () => {
                  res.status(200).send();
                },
                (error) => {
                  res.status(400).send(error);
                },
                req.session.user,
                fields
              );
            });
          });
        }
      });
    });
  }
);

app.patch("/updateUserAdmin", (req, res) => {
  const fields = req.body;
  console.log(fields);

  updateUser(
    () => {
      res.status(200).send();
    },
    (error) => {
      res.status(400).send(error);
    },
    req.body._id,
    fields
  );
});

app.patch("/updateStore", authenticate, (req, res) => {
  console.log(req.body);
  console.log("a");
  getLatLong(req.body.address)
    .then((result) => {
      console.log(result);
      req.body.lat = result.lat;
      req.body.long = result.long;

      updateStore(
        (store) => {
          User.find({ store_id: req.query.store_id, __t: "Employee" }).then(
            (out) => {
              out.map((each) => {
                each.store_id = "";
                console.log("right before out.save()");
                return each.save();
              });
              Promise.all(out).then(() => {
                Promise.all(
                  req.body.employee_ids.map((e) => {
                    console.log("each employee", e);
                    return User.findOneAndUpdate(
                      { username: e, __t: "Employee" },
                      { store_id: req.query.store_id },
                      {
                        new: true,
                      }
                    ).exec();
                  })
                ).then(() => {
                  console.log("returning");
                  res.send();
                });
              });
            }
          );
        },
        (error) => {
          res.status(400).send(error);
        },
        req.query.store_id,
        req.body
      );
    })

    /*
      //return User.findById(req.body.owner_id);
     .then((user) => {
       store.save().then(
         (store) => {
           user.store_id = store.id;
           user.save().catch((error) => res.status(500).send(error));
           res.send(store);
         },
         (error) => res.status(500).send(error)
       );
     })*/
    .catch((error) => res.status(500).send(error));
});

app.patch("/queueChanged", authenticate, (req, res) => {
  console.log(req.body);
  console.log("got here");
  getLatLong(req.body.address)
    .then((result) => {
      console.log(result);
      req.body.lat = result.lat;
      req.body.long = result.long;

      updateStore(
        (out) => {
          console.log("printing out", out);
          // req.body.employee_ids.forEach((e) =>
          //   User.findOneAndUpdate(
          //     { username: e },
          //     { store_id: req.query.store_id }
          //   )
          // );
          res.status(200).send();
        },
        (error) => {
          res.status(400).send(error);
        },
        req.query.store_id,
        req.body
      );
    })
    .catch((error) => res.status(500).send(error));
});

app.get("/getCurrentUser", authenticate, (req, res) => {
  getUserByID(
    (result) => {
      res.send({
        id: result.id,
        username: result.username,
        email: result.email,
        phone_number: result.phone_number,
        fav_stores: result.fav_stores,
      });
    },
    (error) => {
      res.status(400).send(error);
    },
    req.session.user
  );
});

app.get("/getStoreIdFromJoinedQueue", authenticate, (req, res) => {
  getJoinedEventByUserID(
    (result) => {
      if (result.length === 0) {
        res.send({ store_id: "exited" });
      } else {
        res.send({ store_id: result[0].store_id });
      }
    },
    (error) => {
      res.status(400).send(error);
    },
    req.session.user
  );
});

app.get("/getUserId", authenticate, (req, res) => {
  res.send({ user_id: req.session.user });
});

app.delete("/deleteUser", authenticate, (req, res) => {
  User.deleteOne({ _id: req.session.user })
    .then(() => {
      res.status(400).send();
    })
    .catch(() => {
      res.status(400).send();
    });
});

app.get("/checkValidEmployee", authenticate, (req, res) => {
  User.find({ username: req.query.username })
    .then((result) => {
      if (result[0].__t !== "Employee") {
        res.send({ valid: "incorrect" });
      } else {
        if (result[0].store_id !== "") {
          res.send({ valid: "incorrect" });
        }
        res.send({ valid: "correct" });
      }
    })
    .catch((error) => {
      res.send({ valid: "incorrect" });
    });
});

app.get("/getFancyQueue", authenticate, (req, res) => {
  getJoinedEventByUserID(
    (result) => {
      let fancy = [];
      if (result.length === 0) {
        res.send({ queue: fancy });
      } else {
        getInQueueEventsByStoreID(
          (allEvents) => {
            const sorted = allEvents;
            sorted.sort((a, b) => {
              return datetime
                .subtract(
                  datetime.parse(a.entry_time, "MMM D YYYY hh:mm:ss A"),
                  datetime.parse(b.entry_time, "MMM D YYYY hh:mm:ss A")
                )
                .toSeconds();
            });

            sorted.map((each, i) => {
              sorted[i] = { ...sorted[i].toObject(), position: i };
            });
            const index = sorted.findIndex((elem) => {
              return elem.user_id === req.session.user;
            });
            if (index === -1) {
              res.send({ queue: [] });
            } else {
              sorted[index] = { ...sorted[index], isUser: "True" };
              const temp = sorted.slice(0, index + 1);
              if (temp.length > 6) {
                res.send({ queue: temp.slice(index - 5, index + 1) });
              } else {
                res.send({ queue: temp });
              }
            }
          },
          (error) => {
            console.log(error);
          },
          result[0].store_id
        );
      }
    },
    (error) => {
      res.status(400).send(error);
    },
    req.session.user
  );
});

// All routes other than above will go to index.html
app.get("*", (req, res) => {
  res.sendFile(__dirname + "/client/build/index.html");
});

/*************************************************/
// Express server listening...
const port = process.env.PORT || 5000;
app.listen(port, () => {
  log(`Listening on port ${port}...`);
});
