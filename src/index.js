class DatabaseHandler {
  constructor() {
    this.localStorageKey = "users_data";
  } 

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
      request.onsuccess = async (event) => {
        this.db = event.target.result;
        // this.userTransaction = this.db.transaction("users", "readwrite");
        // this.userObjectStore = this.userTransaction.objectStore("users");

        try {
          // Sync IndexedDB data to LocalStorage on database open
          await this.syncToLocalStorage();
          resolve(event.target.result);
        } catch (error) {
          reject(error);
        }
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
      const userTransaction = this.db.transaction("users", "readonly");
      const userObjectStore = userTransaction.objectStore("users");
      const getAllRequest = userObjectStore.getAll();
      getAllRequest.onsuccess = function (event) {
        resolve(event.target.result);
      };
      getAllRequest.onerror = function (event) {
        reject(event.target.error);
      };
    });
  }

  async syncToLocalStorage() {
    try {
      const users = await this.viewAllUsers();
      localStorage.setItem(this.localStorageKey, JSON.stringify(users));
    } catch (error) {
      console.error("Failed to sync to LocalStorage:", error);
      throw error;
    }
  }

  async addItem(data) {
    return new Promise((resolve, reject) => {
      const userTransaction = this.db.transaction("users", "readwrite");
      const userObjectStore = userTransaction.objectStore("users");
      const addRequest = userObjectStore.add(data);
      addRequest.onsuccess = async () => {
        try {
          // Sync to LocalStorage after adding to IndexedDB
          await this.syncToLocalStorage();
          resolve();
        } catch (error) {
          reject(error);
        }
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
      request.onsuccess = async () => {
        try {
          // Sync to LocalStorage after removing from IndexedDB
          await this.syncToLocalStorage();
          resolve();
        } catch (error) {
          reject(error);
        }
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
