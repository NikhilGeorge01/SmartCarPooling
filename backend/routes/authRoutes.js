const express = require("express");
const { register, login } = require("../controllers/authController");
const router = express.Router();

// Register Route (POST /api/auth/register)
router.post("/register", register);

// Login Route (POST /api/auth/login)
router.post("/login", login);

module.exports = router; // Make sure you are exporting the router properly
/*
Invoke-WebRequest -Uri http://localhost:3000/api/auth/login `
>>                   -Method POST `
>>                   -Headers @{ "Content-Type" = "application/json" } `
>>                   -Body '{"email": "john@example.com", "password": "123456"}'
*/
/*Invoke-WebRequest -Uri http://localhost:3000/api/auth/register `
>>                   -Method POST `
>>                   -Headers @{ "Content-Type" = "application/json" } `
>>                   -Body '{"name": "John Doe", "email": "john@example.com", "password": "123456", "gender": "male"}'
>> 
*/
