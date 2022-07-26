const indexedDB =
  window.indexedDB ||
  window.mozIndexedDB ||
  window.webkitIndexedDB ||
  window.msIndexedDB ||
  window.shimIndexedDB;

// create a variable to hold db connection
let db;
const request = indexedDB.open("budget_tracker", 1);

request.onupgradeneeded = ({ target }) => {
  let db = target.result;
  db.createObjectStore("new_transaction", { autoIncrement: true });
};

request.onsuccess = ({ target }) => {
  db = target.result;

  // check if app is online before reading from db
  if (navigator.onLine) {
    checkDatabase();
  }
};

request.onerror = function(event) {
    console.log("Woops! " + event.target.errorCode);
  };
  
  // This function will be executed if we attempt to submit a new transaction and there's no internet connection
  function saveRecord(record) {
    const transaction = db.transaction(["new_transaction"], "readwrite");
    const store = transaction.objectStore("new_transaction");
  
    store.add(record);
  }

  function checkDatabase() {
    const transaction = db.transaction(["new_transaction"], "readwrite");
    const store = transaction.objectStore("new_transaction");
    const getAll = store.getAll();
  
    getAll.onsuccess = function() {
      if (getAll.result.length > 0) {
        fetch("/api/transaction/bulk", {
          method: "POST",
          body: JSON.stringify(getAll.result),
          headers: {
            Accept: "application/json, text/plain, */*",
            "Content-Type": "application/json"
          }
        })
        .then(response => {        
          return response.json();
        })
        .then(() => {
          // delete records if successful
          const transaction = db.transaction(["new_transaction"], "readwrite");
          const store = transaction.objectStore("new_transaction");
          store.clear();
        });
      }
    };
  }
  
  // listen for app coming back online
  window.addEventListener("online", checkDatabase);