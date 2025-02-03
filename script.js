// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, collection, query, where, orderBy, onSnapshot, addDoc, doc, getDocs, updateDoc, deleteDoc, serverTimestamp} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyBxKTjkgMv0Tef9Y2pZZ3ddoRCNfauDPZ0",
    authDomain: "library-4e436.firebaseapp.com",
    projectId: "library-4e436",
    storageBucket: "library-4e436.firebasestorage.app",
    messagingSenderId: "1007543918375",
    appId: "1:1007543918375:web:cc581e662259e878011302",
    measurementId: "G-NHVFWFW6L1"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
let unsubscribe;

let bookStatus = "Read";

class Book {
    constructor(
        name = 'Unknown',
        author = 'Unknown',
        isRead = false
    ) {
        this.name = name;
        this.author = author;
        this.isRead = isRead;
    }
}

class Library {
    constructor() {
        this.books = [];
    }

    addBook(newBook) {
        if (!this.isInLibrary(newBook)) {
            this.books.push(newBook)
        }
    }

    deleteBook(name) {
        this.books = this.books.filter((book) => book.name !== name);
    }

    getBook(name) {
        return this.books.find((book) => book.name === name);
    }

    isInLibrary(newBook) {
        return this.books.some((book) => book.name === newBook.name);
    }
}

const addBook = (e) => {
    e.preventDefault();
    if (bName.value.length === 0 || bAuthor.value.length === 0) {
        alert("Please fill in all the fields.");
        return;
    }
    const newBook = createBook();
    if (library.isInLibrary(newBook)) {
        errorMsg.textContent = 'This book already exists in your library'
        errorMsg.classList.add('active')
        return;
    }
    
    if (auth.currentUser) {
        addBookDB(newBook);
    } else {
        library.addBook(newBook);
        updateLocalStorage();
        render();
    }
    closeBookModal();
}

const updateTable = (e) => {
    e.preventDefault();
    const currentTarget = e.target.parentNode.parentNode.childNodes[1];
    if (e.target.textContent == "Delete") {
        library.deleteBook(currentTarget.innerText);
    }
    if (e.target.classList.contains("status-button")) {
        changeStatus(library.getBook(currentTarget.innerText));
    }
    updateLocalStorage();
    render();
}

const bName = document.getElementById("name");
const bAuthor = document.getElementById("author");
const bStatus = document.getElementById("isRead");
const tableBody = document.querySelector("#table-body");
const bookForm = document.querySelector("form");
const bForm = document.querySelector("form").addEventListener('submit', addBook);
const bTable = document.querySelector("table").addEventListener("click", updateTable);
const addBookBtn = document.getElementById('addBookBtn');
const bookModal = document.querySelector('.bookModal');
const overlay = document.getElementById('overlay');
const errorMsg = document.getElementById('errorMsg');
const accountModal = document.getElementById('accountModal');
const loggedIn = document.getElementById('loggedIn');
const loggedOut = document.getElementById('loggedOut');
const loadingRing = document.getElementById('loadingRing');
const accountBtn = document.getElementById('accountBtn');

const openAddBookModal = () => {
    bookForm.reset();
    bookModal.classList.add('active');
    overlay.classList.add('active');
}

const closeBookModal = () => {
    bookModal.classList.remove('active')
    overlay.classList.remove('active')
    errorMsg.classList.remove('active')
    errorMsg.textContent = ''
}

const openAccountModal = () => {
    accountModal.classList.add('active')
    overlay.classList.add('active')
}
  
const closeAccountModal = () => {
    accountModal.classList.remove('active')
    overlay.classList.remove('active')
}

const closeAllModals = () => {
    closeAddBookModal()
    closeAccountModal()
}
  

accountBtn.onclick = openAccountModal;
addBookBtn.onclick = openAddBookModal;
overlay.onclick = closeBookModal;

const library = new Library();

function createBook() {
    return new Book(bName.value, bAuthor.value, bStatus.checked);
}

function checkLocalStorage() {
    const books = JSON.parse(localStorage.getItem("library"));
    if (books) {
        library.books = books.map((book) => JSONToBook(book))
    } else {
        library.books = []
    }
}

function updateLocalStorage() {
    localStorage.setItem('library', JSON.stringify(library.books));
}

const JSONToBook = (book) => {
    return new Book(book.name, book.author, book.isRead);
}

function render() {
    checkLocalStorage();
    tableBody.innerHTML = "";
    library.books.forEach((book) => {
        if (book.isRead === true) {
            bookStatus = "Read"
        } else {
            bookStatus = "Not Read";
        }
        const htmlBook = `
        <tr>
            <td>${book.name}</td>
            <td>${book.author}</td>
            <td><button class="status-button">${bookStatus}</button></td>
            <td><button class="delete">Delete</button></td>
        </tr>
        `;
        tableBody.insertAdjacentHTML("afterbegin", htmlBook);
    })
}

function changeStatus(book) {
    if (book.isRead === false) {
        book.isRead = true;
        bookStatus = "Read"
    } else {
        book.isRead = false;
        bookStatus = "Not Read";
    }
}

const setupNavbar = (user) => {
    if (user) {
      loggedIn.classList.add('active')
      loggedOut.classList.remove('active')
    } else {
      loggedIn.classList.remove('active')
      loggedOut.classList.add('active')
    }
    loadingRing.classList.remove('active')
}

const setupAccountModal = (user) => {
    if (user) {
      accountModal.innerHTML = `
        <p>Logged in as</p>
        <p><strong>${user.email.split('@')[0]}</strong></p>`;
    } else {
      accountModal.innerHTML = '';
    }
}

render();

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries


const logInBtn = document.getElementById('logInBtn');
const logOutBtn = document.getElementById('logOutBtn');

onAuthStateChanged(auth, async (user) => {
    if (user) {
        setupRealTimeListener();
    } else {
        if (unsubscribe) unsubscribe();
        render();
    }
    setupAccountModal(user);
    setupNavbar(user);
})

const sign_In = () => {
    const provider = new GoogleAuthProvider();
    signInWithPopup(auth, provider).catch((error) => {
        console.error("Error during sign in:", error);
    });
}
  
const sign_Out = () => {
    signOut(auth).catch((error) => {
        console.error("Error during sign out:", error);
    });
}
  
logInBtn.onclick = sign_In;
logOutBtn.onclick = sign_Out;

const setupRealTimeListener = () => {
    const booksQuery = query(
        collection(db, "books"),
        where("ownerId", "==", auth.currentUser.uid),
        orderBy("createdAt")
    );

    unsubscribe = onSnapshot(booksQuery, (snapshot) => {
        library.books = docsToBooks(snapshot.docs);
        updateBooksGrid();
    }, (error) => {
        console.error("Error fetching books: ", error);
    });
}

const addBookDB = async (newBook) => {
    await addDoc(collection(db, "books"), bookToDoc(newBook));
}

const removeBookDB = async (title) => {
    const bookId = await getBookIdDB(title);
    await deleteDoc(doc(db, "books", bookId));
}

const toggleBookIsReadDB = async (book) => {
    const bookId = await getBookIdDB(book.name);
    await updateDoc(doc(db, 'books', bookId), { isRead: !book.isRead });
}

const getBookIdDB = async (name) => {
    const booksQuery = query(
        collection(db, 'books'),
        where('ownerId', '==', auth.currentUser.uid),
        where('name', '==', name)
    );
    const snapshot = await getDocs(booksQuery);
    const bookId = snapshot.docs.map((doc) => doc.id).join('');
    return bookId;
}

const docsToBooks = (docs) => {
    return docs.map((doc) => {
      return new Book(
        doc.data().name,
        doc.data().author,
        doc.data().isRead
      )
    })
}

const bookToDoc = (book) => {
    return {
      ownerId: auth.currentUser.uid,
      name: book.name,
      author: book.author,
      isRead: book.isRead,
      createdAt: serverTimestamp(),
    }
}