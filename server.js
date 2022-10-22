const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config({path: './.env'});
const app = require('./app');


const DB = process.env.DATABASE
.replace('<PASSWORD>',process.env.DATABASE_PASSWORD);

mongoose.connect(DB,{
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false
}).then(connection => {
    // console.log(connection.connections);
    console.log('DB CONNECT SUCCESSFUL')
})


//start server
const port = process.env.PORT || 3000;

const server = app.listen(port,() =>{
    console.log(`app running on port ${port}`)
});

process.on('unhandledRejection',err =>{
    console.log(err.name,err.message);
    console.log('Unhandled Rection,closing app');
    server.close(()=>{
        process.exit(1);
    })
    
}) 