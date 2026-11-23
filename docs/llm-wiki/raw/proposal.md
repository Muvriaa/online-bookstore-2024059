# Online Bookstore Capstone Proposal

## Problem and Target Users

University students often have difficulty finding the correct textbooks for their courses. A general online bookstore may allow users to search by title or author, but it does not clearly show which books are required or recommended for a specific course.

This project will build an Online Bookstore that allows users to browse and search for books, place orders, and manage purchases. The individual extension will add a University Textbook Store feature so students can also find books connected to their university courses.

The main target users are university students who want a simple way to search for books and identify textbooks that are relevant to the courses they are taking.

## Individual Extension

The individual extension is **University Textbook Store**.

It will add two new tables:

- `courses` — stores course information.
- `course_books` — connects courses and books.

This creates a many-to-many relationship because one course may use several books, while the same book may be used by several courses.

The system will use SQL JOIN queries to display the books connected to a selected course. It will also prevent duplicate course-book relationships.

## User Story

**As a university student, I want to search for a course and see the books connected to that course so that I can quickly find the textbooks I need.**

## Acceptance Criteria

1. Given an existing course, when a user requests the course's textbooks, the system returns all books connected to that course.

2. A book can be connected to more than one course, and a course can be connected to more than one book.

3. The system must prevent the same book from being added to the same course more than once.

4. The relationship between courses and books must be verifiable using SQL JOIN queries.

5. Existing bookstore features such as book catalog, search, customers, orders, and purchase functionality must continue working after the extension is added.

## Out of Scope

This project will not include real payment processing, real shipping, or a complete university registration system. It will not automatically obtain course information from external university systems. Course and textbook data will be stored and managed within the project database for educational and testing purposes.