import React, { useState } from "react";
import { Route, Switch, BrowserRouter } from "react-router-dom";

// importing all the pages
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import StoreSearchPage from "./pages/StoreSearchPage";
import SettingsPage from "./pages/SettingsPage";
import AdminPanelPage from "./pages/AdminPanelPage";
import StoreAnalytics from "./pages/StoreAnalyticsPage";
import QueueDashboard from "./pages/QueueDashboardPage";
import QueueStatus from "./pages/QueueStatusPage";
import "./App.css";

const readCookie = (setCurrentUser) => {
  const url = "/users/check-session";
  fetch(url)
    .then((res) => {
      if (res.status === 200) {
        return res.json();
      }
    })
    .then((json) => {
      if (json && json.currentUser) {
        setCurrentUser({ currentUser: json.currentUser });
      }
    })
    .catch((error) => {
      console.log(error);
    });
};

export default function App() {
  const [currentUser, setCurrentUser] = useState();
  return (
    <div className="App">
      <BrowserRouter>
        <Switch>
          <Route path="/settings" render={() => <SettingsPage />} />
          <Route path="/store-search" render={() => <StoreSearchPage />} />
          <Route path="/admin-panel" render={() => <AdminPanelPage />} />
          <Route
            exact
            path="/signup"
            render={() => <SignupPage redirect="/store-search" />}
          />
          <Route
            exact
            path="/"
            render={() => <LoginPage redirect="/store-search" />}
          />
          <Route path="/store-analytics" render={() => <StoreAnalytics />} />
          <Route path="/queue-dashboard" render={() => <QueueDashboard />} />
          <Route path="/queue-status" render={() => <QueueStatus />} />
        </Switch>
      </BrowserRouter>
    </div>
  );
}
