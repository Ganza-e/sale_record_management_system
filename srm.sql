CREATE DATABASE SRMS;
USE SRMS;


CREATE TABLE Customer (
    CustomerNumber INT AUTO_INCREMENT PRIMARY KEY,
    firstName VARCHAR(50) NOT NULL,
    lastName VARCHAR(50) NOT NULL,
    telephone VARCHAR(20) NOT NULL,
    address VARCHAR(100) NOT NULL,
    password VARCHAR(255) NOT NULL
);


CREATE TABLE Product (
    ProductCode INT AUTO_INCREMENT PRIMARY KEY,
    productName VARCHAR(100) NOT NULL,
    unitPrice DECIMAL(10, 2) NOT NULL
);


CREATE TABLE Sale (
    InvoiceNumber INT AUTO_INCREMENT PRIMARY KEY,
    salesDate DATETIME DEFAULT CURRENT_TIMESTAMP,
    paymentMethod VARCHAR(50) NOT NULL,
    totalAmountPaid DECIMAL(10, 2) NOT NULL,
    CustomerNumber INT,
    FOREIGN KEY (CustomerNumber) REFERENCES Customer(CustomerNumber) ON DELETE SET NULL
);


CREATE TABLE Sale_Items (
    InvoiceNumber INT,
    ProductCode INT,
    quantitySold INT NOT NULL,
    PRIMARY KEY (InvoiceNumber, ProductCode),
    FOREIGN KEY (InvoiceNumber) REFERENCES Sale(InvoiceNumber) ON DELETE CASCADE,
    FOREIGN KEY (ProductCode) REFERENCES Product(ProductCode) ON DELETE CASCADE
);