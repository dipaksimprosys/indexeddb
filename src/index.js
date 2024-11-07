class DatabaseHandler {
  constructor() {} 

  async openDatabase(databaseName) {
    return new Promise((resolve, reject) => {
      const indexedDB =
        window.indexedDB ||
        window.mozIndexedDB ||
        window.webkitIndexedDB ||
        window.msIndexedDB ||
        window.shimIndexedDB;
      const request = indexedDB.open(databaseName);
      request.onerror = function (e) {
        reject();
      };
      request.onsuccess = (event) => {
        this.db = event.target.result;
        // this.userTransaction = this.db.transaction("users", "readwrite");
        // this.userObjectStore = this.userTransaction.objectStore("users");

        resolve(event.target.result);
      };
      request.onupgradeneeded = (event) => {
        this.db = event.target.result;
        const objectStore = this.db.createObjectStore("users", {
          keyPath: "userid",
        });
        objectStore.createIndex("name", "name");
        objectStore.createIndex("email", "email");
      };
    });
  }

  async viewAllUsers() {
    return new Promise((resolve, reject) => {
      const userTransaction = this.db.transaction("users", "readwrite");
      const userObjectStore = userTransaction.objectStore("users");
      userObjectStore.getAll().onsuccess = function (event) {
        resolve(event.target.result);
      };
    });
  }

  async addItem(data) {
    return new Promise((resolve, reject) => {
      const userTransaction = this.db.transaction("users", "readwrite");
      const userObjectStore = userTransaction.objectStore("users");
      const addRequest = userObjectStore.add(data);
      addRequest.onsuccess = function () {
        resolve();
      };
      addRequest.onerror = (e) => {
        reject(e);
      };
    });
  }

  async removeItem(id) {
    return new Promise((resolve, reject) => {
      const request = this.db
        .transaction("users", "readwrite")
        .objectStore("users")
        .delete(Number(id));
      request.onsuccess = () => {
        resolve();
      };
    });
  }
}

async function submitDetail(e) {
  e.preventDefault();
  var formData = new FormData(this);
  const data = Object.fromEntries(formData);
  await database.addItem({ ...data, userid: Number(data.userid) });
  let users = await database.viewAllUsers();
  renderHtml(users);
  document.getElementById("user_detail").reset();
}

function renderHtml(data) {
  document.getElementById("user_data").innerHTML = data
    .map(
      (user) => `<tr>
      <td>${user.userid}</td> 
      <td>${user.name}</td>
      <td>${user.email}</td> 
      <td><button class="remove-button" data-id="${user.userid}">Remove</button></td>
    </tr>`
    )
    .join("");

  document.querySelectorAll(".remove-button").forEach((el) =>
    el.addEventListener("click", async () => {
      await database.removeItem(Number(el.dataset.id));
      let users = await database.viewAllUsers();
      renderHtml(users);
    })
  );
}

const database = new DatabaseHandler();

database
  .openDatabase("mydb")
  .then((db) => database.viewAllUsers())
  .then((data) => {
    renderHtml(data);
  });

document.getElementById("user_detail").addEventListener("submit", submitDetail);
