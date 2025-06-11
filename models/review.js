const mongoose=require('mongoose')
const Schema=mongoose.Schema
main().then(()=>{
    console.log('done');
}).catch((err)=>{
    console.log(err);
})


async function main() {
    await mongoose.connect('mongodb://127.0.0.1:27017/cookify');
}


let reviewsch=new Schema({
    comment:{type:String,required:true},
    username:{type:String,required:true}
})

let review=mongoose.model("review",reviewsch)
module.exports=review
