/* Student mongoose model */
const mongoose = require("mongoose");

const options = { discriminatorKey: "kind" };

const User = mongoose.model("Users", {
  password: { type: String },
  email: { type: String },
  username: { type: String },
  phone_number: { type: String },
  fav_stores: { type: Array },
});

const Employee = User.discriminator(
  "Employee",
  new mongoose.Schema(
    {
      store_id: String,
    },
    options
  )
);

const Owner = User.discriminator(
  "Owner",
  new mongoose.Schema(
    {
      store_id: String,
    },
    options
  )
);

const Admin = User.discriminator("Admin", new mongoose.Schema({}, options));

module.exports = { User, Employee, Owner, Admin };
