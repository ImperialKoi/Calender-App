// lib/mongo.ts
import { MongoClient, type Db, ServerApiVersion } from "mongodb";

if (!process.env.MONGODB_URI) {
  throw new Error('Invalid/Missing environment variable: "MONGODB_URI"');
}

const uri = process.env.MONGODB_URI;

// **Add TLS and Server API options**
const options = {
  tls: true,                          // enforce TLS
  serverApi: ServerApiVersion.v1,     // opt into the stable v1 API
  // retryWrites is on by default in SRV URIs, but you can set it explicitly:
  retryWrites: true,
  // During development you can temporarily allow invalid certs—but remove this in prod:
  // tlsAllowInvalidCertificates: process.env.NODE_ENV === "development",
};

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

if (process.env.NODE_ENV === "development") {
  // Use a global variable in dev to preserve the client across HMR reloads
  const globalWithMongo = global as typeof globalThis & {
    _mongoClientPromise?: Promise<MongoClient>;
  };

  if (!globalWithMongo._mongoClientPromise) {
    client = new MongoClient(uri, options);
    globalWithMongo._mongoClientPromise = client.connect();
  }
  clientPromise = globalWithMongo._mongoClientPromise;
} else {
  // In production, just create a new client
  client = new MongoClient(uri, options);
  clientPromise = client.connect();
}

export async function connectToDatabase(): Promise<{ client: MongoClient; db: Db }> {
  const client = await clientPromise;
  const db = client.db("calendar_app");
  return { client, db };
}

export default clientPromise;
