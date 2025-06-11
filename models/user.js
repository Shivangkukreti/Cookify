const mongoose=require('mongoose')
const passportlocalmongoose=require('passport-local-mongoose')
const Schema=mongoose.Schema
main().then(()=>{
    console.log('done');
}).catch((err)=>{
    console.log(err);
})


async function main() {
    await mongoose.connect('mongodb://127.0.0.1:27017/cookify');
}



let usersch= new Schema({
    email:{type:String,required:true}
})

usersch.plugin(passportlocalmongoose)

let user=mongoose.model("user",usersch)
module.exports=user