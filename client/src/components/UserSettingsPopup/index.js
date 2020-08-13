import React, { useState } from "react";
import { Link } from "react-router-dom";

import {
  Paper,
  Typography,
  TextField,
  InputAdornment,
  IconButton,
  Button,
} from "@material-ui/core";
import Visibility from "@material-ui/icons/Visibility";
import VisibilityOff from "@material-ui/icons/VisibilityOff";
import SaveButton from "../SaveButton";
import useStyles from "./styles";

export default function UserSettingsPopup(props) {
  const classes = useStyles();

  const [userName, setUserName] = useState("user");
  const [userError, setUserError] = useState(false);

  const [phone, setPhone] = useState("123456789");
  const [phoneError, setPhoneError] = useState(false);

  const [email, setEmail] = useState("user@user.com");
  const [emailError, setEmailError] = useState(false);

  const [password, setPassword] = useState("");
  const [passError, setPassError] = useState(false);

  const [newPassword, setNewPassword] = useState("");
  const [newPassError, setNewPassError] = useState(false);

  const [newConfirmPassword, setNewConfirmPassword] = useState("");
  const [newConfirmPassError, setNewConfirmPassError] = useState(false);

  const [showPass, setShowPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);

  function saveUserSettings() {
    let updated = [];
    // call server to get all the current info about user
    // call server to change any of them if it's different
    if (!userError && userName !== "" && userName !== "user")
      updated.push("username");
    if (!phoneError && phone !== "" && phone !== "123456789")
      updated.push("phone");
    if (!emailError && email !== "" && email !== "user@user.com")
      updated.push("email");
    if (
      !passError &&
      !newPassError &&
      !newConfirmPassError &&
      password !== newPassword
    )
      updated.push("password");
    if (updated.length > 0) {
      alert(
        "The following fields have been updated: ".concat(updated.join(", "))
      );
    } else {
      alert(
        "No fields have been updated! Please make sure all fields are valid and are different from the current fields!"
      );
    }
    props.close();
  }

  function deactivateAccount() {
    // send a server call to deactivate the account
    alert("Account deactivated!");
  }

  return (
    <div className={classes.root}>
      <Paper elevation={2} variant="elevation" className={classes.paper}>
        <SaveButton onClick={saveUserSettings}></SaveButton>
        <Typography className={classes.title}>User Settings</Typography>

        <div className={classes.topLeftMargin}>
          <TextField
            onChange={(e) => {
              setUserName(e.target.value);
              setUserError(false);
            }}
            value={userName}
            variant="outlined"
            size="small"
            label="Username"
            error={userError}
            className={`${classes.textField} ${classes.rightMargin}`}
          ></TextField>
          <TextField
            onChange={(e) => {
              setPhone(e.target.value);
              if (isNaN(e.target.value)) {
                setPhoneError(true);
              } else {
                setPhoneError(false);
              }
            }}
            value={phone}
            variant="outlined"
            size="small"
            label="Phone"
            error={phoneError}
            className={`${classes.textField} ${classes.rightMargin}`}
          ></TextField>
          <TextField
            onChange={(e) => {
              setEmail(e.target.value);
              const reg = /\S+@\S+\.\S+/;
              if (e.target.value !== "" && !reg.test(e.target.value)) {
                setEmailError(true);
              } else {
                setEmailError(false);
              }
            }}
            value={email}
            variant="outlined"
            size="small"
            label="Email"
            error={emailError}
            className={classes.textField}
          ></TextField>
        </div>

        {props.showPass && (
          <>
            <Typography
              className={`${classes.changePassTitle} ${classes.topLeftMargin}`}
            >
              Change Password
            </Typography>

            <div className={classes.topLeftMargin}>
              <TextField
                onChange={(e) => {
                  setPassword(e.target.value);
                  setPassError(false);
                }}
                variant="outlined"
                size="small"
                type={showPass ? "text" : "password"}
                value={password}
                label="Old Password"
                error={passError}
                className={`${classes.textField} ${classes.rightMargin}`}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowPass(!showPass)}>
                        {showPass ? <Visibility /> : <VisibilityOff />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              ></TextField>
              <TextField
                onChange={(e) => {
                  setNewPassword(e.target.value);
                  setNewPassError(false);
                }}
                variant="outlined"
                size="small"
                type={showNewPass ? "text" : "password"}
                label="New Password"
                value={newPassword}
                error={newPassError}
                className={`${classes.textField} ${classes.rightMargin}`}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowNewPass(!showNewPass)}>
                        {showNewPass ? <Visibility /> : <VisibilityOff />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              ></TextField>
              <TextField
                onChange={(e) => {
                  setNewConfirmPassword(e.target.value);
                  if (e.target.value !== newPassword) {
                    setNewConfirmPassError(true);
                  } else {
                    setNewConfirmPassError(false);
                  }
                }}
                variant="outlined"
                size="small"
                type={showConfirmPass ? "text" : "password"}
                value={newConfirmPassword}
                label="Confirm Password"
                error={newConfirmPassError}
                className={`${classes.textField} ${classes.rightMargin}`}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowConfirmPass(!showConfirmPass)}
                      >
                        {showConfirmPass ? <Visibility /> : <VisibilityOff />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              ></TextField>
            </div>
          </>
        )}

        <Link to="/" className={classes.linkButton}>
          <Button
            color="primary"
            variant="contained"
            className={classes.topLeftMargin}
            onClick={deactivateAccount}
          >
            Deactivate Account
          </Button>
        </Link>
      </Paper>
    </div>
  );
}
