import mongoose, {Document, Schema} from "mongoose";

export interface IUser extends Document{
    name : string;
    email : string;
    image:string;
    role:String;
}



const userSchema :Schema<IUser>=new Schema({
    name:{
        type:String,
        required:true,
    },
     email:{
        type:String,
        required:true,
        unique:true,
    },
     image:{
        type:String,
        required:true,
    },
     role:{
        type:String,
        default:null
    },
},{timestamps:true});

const User = mongoose.model<IUser>("User",userSchema);
export default User;
