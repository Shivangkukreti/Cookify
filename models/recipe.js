const mongoose=require('mongoose');
const review = require('./review');
const Schema=mongoose.Schema
main().then(()=>{
    console.log('done');
}).catch((err)=>{
    console.log(err);
})


async function main() {
    await mongoose.connect('mongodb://127.0.0.1:27017/cookify');
}


let recipesch= new Schema({
    dish:{type:String,required:true},
    recipe:{type:String,required:true},
    chef:{type:String,required:true,default:"chef"},
    review:[{type:Schema.Types.ObjectId,ref:"review"}],
    img:{type:String,required:true,default:"https://images.unsplash.com/photo-1653233797467-1a528819fd4f?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"}
})

recipesch.post("findOneAndDelete", async function (data) {
    if (data) {
        await review.deleteMany({ _id: { $in: data.review } });
    }
});


let recipe=mongoose.model("recipe",recipesch)
module.exports=recipe;

await recipes.create({ dish: "Chole Bhature", chef: "Shivang" });
