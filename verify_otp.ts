import mongoose from "mongoose";
import { OtpModel } from "./packages/models/otp.model";

const verify = async () => {
  try {
    // Connect to a test database (or just check schema/model if no DB)
    // Since I don't have a running DB guaranteed, ct.
    //I will check the schema paths and indexes from the model obje
    console.log("Checking Schema Paths...");
    const expiresAtPath = OtpModel.schema.path("expiresAt");

    if (typeof expiresAtPath.options.default === "function") {
      console.log("PASS: expiresAt default is a function.");
      const defaultVal = expiresAtPath.options.default();
      console.log(`Default value generated: ${defaultVal}`);
      if (defaultVal instanceof Date && defaultVal.getTime() > Date.now()) {
        console.log("PASS: Default value is a future Date.");
      } else {
        console.error("FAIL: Default value is not a future Date.");
      }
    } else {
      console.error("FAIL: expiresAt default is NOT a function.");
    }

    console.log("\nChecking Indexes...");
    const indexes = OtpModel.schema.indexes();
    const ttlIndex = indexes.find(
      (idx) => idx[0].expiresAt === 1 && idx[1].expireAfterSeconds === 0,
    );

    if (ttlIndex) {
      console.log("PASS: TTL index found:", JSON.stringify(ttlIndex));
    } else {
      console.error("FAIL: TTL index NOT found.");
      console.log("Available indexes:", JSON.stringify(indexes));
    }
  } catch (error) {
    console.error("Error during verification:", error);
  }
};

verify();
