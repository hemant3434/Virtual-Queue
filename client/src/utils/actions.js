/* Utility functions to help with back-end calls and global information. */

import datetime from "date-and-time";

export const REFRESH_INTERVAL = 3000;
export const AVG_WAIT_TIME = 3;

export const login = (setUser, data) => {
  // call backend to login, get the user (if valid) and call the setUser
  // to set it to the returned value
  if (
    (data.userName === "user" && data.password === "user") ||
    (data.userName === "admin" && data.password === "admin")
  ) {
    setUser({ username: data.userName });
    return true;
  }
};

export const signup = (setUser, data) => {
  // call backend to sign up, get the user (if valid) and call the setUser
  // to set it to the returned value
  // if backend returns error for some of the fields, then return an array
  // of all the string names of the fields errorring
  setUser({ username: data.userName });
  return true;
};

export const getUserById = async (id, setUser) => {
  setUser({
    username: "user",
    email: "user@user.com",
    password: "user",
    phone_number: "123",
  });
};

export const getStoreById = async (id, setStore) => {
  setStore({
    owner_id: "1",
    name: "Walmart",
    address: "300 Borough Dr Unit 3635, Scarborough, ON M1P 4P5",
    employee_ids: [],
    open_time: datetime.parse("09:00:00 AM", "hh:mm:ss A"),
    close_time: datetime.parse("08:00:00 PM", "hh:mm:ss A"),
  });
};

export const getUserStore = async (setUser, setStore) => {
  setUser({
    username: "user",
    email: "user@user.com",
    password: "user",
    phone_number: "123",
  });
  const store = {
    id: 1,
    owner_id: "1",
    name: "Walmart",
    address: "300 Borough Dr Unit 3635, Scarborough, ON M1P 4P5",
    employee_ids: [],
    in_store: 54,
    open_time: datetime.parse("09:00:00 AM", "hh:mm:ss A"),
    close_time: datetime.parse("08:00:00 PM", "hh:mm:ss A"),
    customer_visits: [
      { user_id: "1001", entry_time: new Date(2020, 7, 12, 18), exit_time: "" },
      { user_id: "1001", entry_time: new Date(2020, 7, 12, 17), exit_time: "" },
      { user_id: "1001", entry_time: new Date(2020, 7, 12, 16), exit_time: "" },
      {
        user_id: "1001",
        entry_time: new Date(2020, 7, 12, 15),
        exit_time: new Date(2020, 7, 12, 15, 10),
      },
      {
        user_id: "1001",
        entry_time: new Date(2020, 7, 12, 14),
        exit_time: new Date(2020, 7, 12, 14, 10),
      },
      {
        user_id: "1001",
        entry_time: new Date(2020, 7, 11, 13),
        exit_time: new Date(2020, 7, 11, 13, 10),
      },
    ],
  };
  getQueue(store, () => {});
  getAvgAdmissions(store, () => {});
  getNumVisitsToday(store, () => {});
  getLeastBusyTime(store, () => {});
  getMostBusyTime(store, () => {});
  getForeCastWaitTime(store, () => {});
  setStore(store);
};

export const resetStoreCall = async (setStore) => {
  setStore({
    id: 1,
    owner_id: "1",
    name: "Walmart",
    address: "300 Borough Dr Unit 3635, Scarborough, ON M1P 4P5",
    employee_ids: [],
    open_time: datetime.parse("09:00:00 AM", "hh:mm:ss A"),
    close_time: datetime.parse("08:00:00 PM", "hh:mm:ss A"),
  });
};

export const saveUserSettingsCall = async (
  user,
  setUser,
  setUserError,
  setPhoneError,
  setEmailError,
  setPassError,
  setNewPassError
) => {
  // call backend to set 'user', if any errors set them
  return [];
};

export const saveStoreSettingsCall = async (
  store,
  setStore,
  storeError,
  addressError,
  openTimeError,
  closeTimeError
) => {
  // call backend to set 'store', if any errors set them
  return [];
};

export const deactivateQueueCall = async (setStore) => {};

export const emptyQueueCall = async (setStore) => {
  setStore({
    id: 1,
    name: "Walmart",
    address: "300 Borough Dr Unit 3635, Scarborough, ON M1P 4P5",
    in_store: 54,
    in_queue: 0,
  });
};

export const customerExitedCall = async (setStore) => {
  setStore((store) => ({ ...store, in_store: store.in_store - 1 }));
};

export const getNumVisitsToday = async (store, setStore) => {
  const dayStart = new Date();
  dayStart.setHours(0);
  dayStart.setMinutes(0);
  dayStart.setSeconds(0);

  let num_visits_today = 0;
  while (
    num_visits_today + store.queue.length < store.customer_visits.length &&
    dayStart <
      store.customer_visits[num_visits_today + store.queue.length].exit_time
  ) {
    num_visits_today += 1;
  }
  store.num_visits_today = num_visits_today;
  setStore(store);
};

export const getAvgAdmissions = async (store, setStore) => {
  const num_admissions = new Array(
    store.close_time.getHours() - store.open_time.getHours()
  ).fill(0);

  let num_days = 0;
  let last_day = 0;
  let last_month = 0;
  let last_year = 0;
  for (let i = store.queue.length; i < store.customer_visits.length; i++) {
    const visit = store.customer_visits[i].exit_time;

    if (
      visit.getDay() != last_day ||
      visit.getMonth() != last_month ||
      visit.getYear() != last_year
    ) {
      last_day = visit.getDay();
      last_month = visit.getMonth();
      last_year = visit.getYear();
      num_days += 1;
    }
    num_admissions[visit.getHours() - store.open_time.getHours()] += 1;
  }
  store.avg_num_admissions = num_admissions.map((n) => n / num_days);
  setStore(store);
};

export const getLeastBusyTime = async (store, setStore) => {
  const min_num_admissions = Math.min.apply(null, store.avg_num_admissions);
  store.least_busy_time =
    store.avg_num_admissions.indexOf(min_num_admissions) +
    store.open_time.getHours();
  setStore(store);
};

export const getMostBusyTime = async (store, setStore) => {
  const max_num_admissions = Math.max.apply(null, store.avg_num_admissions);
  store.most_busy_time =
    store.avg_num_admissions.indexOf(max_num_admissions) +
    store.open_time.getHours();
  setStore(store);
};

export const getQueue = async (store, setStore) => {
  let i = 0;
  while (
    i < store.customer_visits.length &&
    store.customer_visits[i].exit_time == ""
  ) {
    i++;
  }
  store.queue = store.customer_visits.slice(0, i);
  store.in_queue = store.queue.length;
  setStore(store);
};

export const getForeCastWaitTime = async (store, setStore) => {
  const queue_size = store.queue.length;
  store.forecast_wait_time = queue_size * AVG_WAIT_TIME;
  setStore(store);
};

export const getAllStores = () => {
  const url = "http://localhost:5000/getAllStores";
  return fetch(url);
};

export const getDistance = (userLat, userLong, storeLat, storeLong) => {
  const url = `http://localhost:5000/getDistance?fromLat=${userLat}&fromLong=${userLong}&toLat=${storeLat}&toLong=${storeLong}`;

  return fetch(url);
};
