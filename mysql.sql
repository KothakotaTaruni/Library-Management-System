-- CREATE TABLE Users (
--     id INTEGER NOT NULL PRIMARY KEY,
--     email TEXT NOT NULL UNIQUE,
--     password TEXT NOT NULL,
--     role TEXT NOT NULL CHECK(role IN ('librarian', 'user'))
-- );

-- INSERT INTO Users
-- (email, password, role)
-- VALUES 
-- ('jhon.doe@gamil.com', '$2b$10$R8g6pH', 'librarian'),
-- ('jane.smith@gmail.com', '$2b$10$R9G7pH', 'librarian'),
-- ('bob.johnson@gmail.com', '$2b$10$R10G8pH', 'user'),
-- ('alice.william@gmail.com', '$2b$10$R11G9pH', 'user'),
-- ('mike.davis@gmail.com', '$2b$10$R12G10pH', 'librarian');

SELECT * FROM Users;

-- CREATE TABLE Books(
--     id INTEGER NOT NULL PRIMARY KEY,
--     title TEXT NOT NULL,
--     author TEXT NOT NULL,
--     quantity INTEGER NOT NULL,
-- );

-- INSERT INTO Books
-- (title, author, quantity)
-- VALUES('To Kill a Mockingbird', 'Harpee Lee', 10),
-- ('1984', 'George Orwell', 8),
-- ('Pride and Prejudice', 'Jane Austen', 12),
-- ('The Great Gatsby', 'F.Scott Fitzgerlad', 9),
-- ('The Catcher in the Rye', 'J.D. Salinger', 11);

