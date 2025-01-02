const express = require('express');
const router = express.Router();



const{createUser,getphotos,getpdfs,findusers}=require('../Controller/usercontroller.js');
const { route } = require('./auth.route.js');

router.post('/adduser', createUser);

router.get('/photos',getphotos);

router.get('/pdfs', getpdfs);

router.get('/users', findusers)



module.exports = router;   
