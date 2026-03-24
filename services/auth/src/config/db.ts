import mongoose from "mongoose";

const connecDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI as string, {
      dbName: "fudo",
    });

    console.log("connected to mongodb");
  } catch (error) {
    console.log(error);
  }
};

export default connecDB;
