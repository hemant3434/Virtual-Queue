import React from "react";

import Header from "../../components/Header";

import StoreSettingsPopup from "../../components/StoreSettingsPopup";
import UserSettingsPopup from "../../components/UserSettingsPopup";

import { getCurrentUser } from "../../utils/actions";

import useStyles from "./styles";

export default function SettingsPage(props) {
  const classes = useStyles();
  const userType = props.currentUser.__t
  return (
    <div className={classes.root}>
      <Header></Header>
      {(userType == "owner" || userType == "employee") ? <UserSettingsPopup isAdmin={false} close={() => {}} /> : null}
      {(userType == "visitor" ) ? <StoreSettingsPopup isAdmin={false} close={() => {}} /> : null}
    </div>
  );
}
