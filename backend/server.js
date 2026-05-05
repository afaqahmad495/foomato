const app = require('./src/app');
const connectDB = require('./src/db/db')
const dotenv = require('dotenv') 
const path = require('path');


dotenv.config({ path: path.resolve(__dirname, '.env') });


connectDB();


const port = Number(process.env.PORT) || 3000;
app.listen(port, () =>{
    console.log(`Server is running on port ${port}`)
})
