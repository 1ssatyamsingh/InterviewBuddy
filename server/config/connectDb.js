import dns from "node:dns";
import mongoose from "mongoose";

const connectDb = async () => {
  try {
    const dnsServers = process.env.DNS_SERVERS
      ?.split(",")
      .map((server) => server.trim())
      .filter(Boolean);

    if (process.env.DNS_SERVERS && !dnsServers?.length) {
      throw new Error("DNS_SERVERS must contain one or more DNS server IP addresses.");
    }

    if (dnsServers?.length) {
      dns.setServers(dnsServers);
    }

    await mongoose.connect(process.env.MONGODB_URL);

    console.log(" Database Connected");
  } catch (error) {
    console.error(" Database Connection Failed:", error.message);

    process.exit(1);
  }
};

export default connectDb;