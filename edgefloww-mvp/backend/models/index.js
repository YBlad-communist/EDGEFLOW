import mongoose from "mongoose";

export async function connectDB() {
  const uri = process.env.MONGODB_URI || "mongodb://localhost:27017/edgefloww";
  await mongoose.connect(uri);
  console.log("MongoDB connected:", uri.replace(/\/\/.*@/, "//****:****@"));
}

export async function disconnectDB() {
  await mongoose.disconnect();
}
