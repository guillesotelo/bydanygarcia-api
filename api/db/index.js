const dotenv = require('dotenv');
const mongoose = require('mongoose');

dotenv.config();

const { DB_USER, DB_PASS, DB_CONFIG } = process.env

const uri = `mongodb+srv://${DB_USER}:${DB_PASS}@${DB_CONFIG}`;

mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true }).then(() => console.log('* DB Connected to Cluster *'))
.catch(err => { console.log('Error connecting to Cluster', err) }); 
  
module.exports = mongoose