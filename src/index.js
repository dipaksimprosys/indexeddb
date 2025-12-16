class DatabaseHandler {
  constructor() {
    this.storageKey = "users_data";
  } 

  async openDatabase() {
    return new Promise((resolve) => {
      // Initialize localStorage if not exists
      if (!localStorage.getItem(this.storageKey)) {
        localStorage.setItem(this.storageKey, JSON.stringify([]));
      }
      resolve(true);
    });
  }

  async viewAllUsers() {
    return new Promise((resolve) => {
      const users = JSON.parse(localStorage.getItem(this.storageKey) || "[]");
      resolve(users);
    });
  }

  async addItem(data) {
    return new Promise((resolve, reject) => {
      try {
        const users = JSON.parse(localStorage.getItem(this.storageKey) || "[]");
        // Check if user with same ID exists
        const existingIndex = users.findIndex(u => u.userid === data.userid);
        if (existingIndex !== -1) {
          reject(new Error("User ID already exists"));
          return;
        }
        users.push(data);
        localStorage.setItem(this.storageKey, JSON.stringify(users));
        resolve();
      } catch (e) {
        reject(e);
      }
    });
  }

  async removeItem(id) {
    return new Promise((resolve) => {
      const users = JSON.parse(localStorage.getItem(this.storageKey) || "[]");
      const filteredUsers = users.filter(u => u.userid !== Number(id));
      localStorage.setItem(this.storageKey, JSON.stringify(filteredUsers));
      resolve();
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

function renderHtml(data, filterText = "") {
  // Filter data based on search text
  const filteredData = filterText
    ? data.filter(
        (user) =>
          String(user.userid).includes(filterText) ||
          user.name.toLowerCase().includes(filterText.toLowerCase()) ||
          user.email.toLowerCase().includes(filterText.toLowerCase())
      )
    : data;

  document.getElementById("user_data").innerHTML = filteredData
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
      const currentFilter = document.getElementById("filter_input").value;
      renderHtml(users, currentFilter);
    })
  );
}

const database = new DatabaseHandler();

database
  .openDatabase("mydb")
  .then(() => database.viewAllUsers())
  .then((data) => {
    renderHtml(data);
  });

document.getElementById("user_detail").addEventListener("submit", submitDetail);

// Add filter functionality
document.getElementById("filter_input").addEventListener("input", async (e) => {
  const filterText = e.target.value;
  const users = await database.viewAllUsers();
  renderHtml(users, filterText);
});
