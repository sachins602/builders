import { PrismaClient, Prisma } from "@prisma/client";
import DbData from "./homebuilders.json";

// Define interfaces for the JSON data structure to ensure type safety
interface UserData {
  id: string;
  name: string | null;
  email: string | null;
  emailVerified: string | null;
  image: string | null;
}

interface AccountData {
  id: string;
  userId: string;
  type: string;
  provider: string;
  providerAccountId: string;
  refresh_token: string | null;
  access_token: string | null;
  expires_at: string | null;
  token_type: string | null;
  scope: string | null;
  id_token: string | null;
  session_state: string | null;
  refresh_token_expires_in: string | null;
}

interface SessionData {
  id: string;
  sessionToken: string;
  userId: string;
  expires: string;
}

interface ResponseData {
  id: string;
  prompt: string;
  url: string;
  createdAt: string;
  updatedAt: string;
  createdById: string;
  sourceImageId: string | null;
  previousResponseId: string | null;
}

interface ImageData {
  id: string;
  name: string;
  url: string;
  address: string | null;
  lat: string | null;
  lng: string | null;
  createdAt: string;
  updatedAt: string;
  createdById: string;
}

interface Table<T> {
  type: "table";
  name: string;
  data: T[];
}

// Cast the imported JSON to our defined structure
const typedDbData = DbData as Array<
  Table<UserData | AccountData | SessionData | ImageData | ResponseData>
>;

const prisma = new PrismaClient();

async function main() {
  console.log("Start seeding...");

  // Clear existing data in the correct order to avoid foreign key constraints
  await prisma.response.deleteMany({});
  await prisma.images.deleteMany({});
  await prisma.session.deleteMany({});
  await prisma.account.deleteMany({});
  await prisma.verificationToken.deleteMany({});
  await prisma.user.deleteMany({});

  console.log("Old data cleared.");

  // Use type guards to safely access data for each table
  const usersData = typedDbData.find(
    (table): table is Table<UserData> => table.name === "user",
  )?.data;
  const accountsData = typedDbData.find(
    (table): table is Table<AccountData> => table.name === "account",
  )?.data;
  const sessionsData = typedDbData.find(
    (table): table is Table<SessionData> => table.name === "session",
  )?.data;
  const imagesData = typedDbData.find(
    (table): table is Table<ImageData> => table.name === "images",
  )?.data;
  const responsesData = typedDbData.find(
    (table): table is Table<ResponseData> => table.name === "response",
  )?.data;

  // Seed Users
  if (usersData) {
    for (const user of usersData) {
      await prisma.user.create({
        data: {
          id: user.id,
          name: user.name,
          email: user.email,
          emailVerified: user.emailVerified
            ? new Date(user.emailVerified)
            : null,
          image: user.image,
        },
      });
    }
    console.log(`${usersData.length} users seeded.`);
  }

  // Seed Accounts
  if (accountsData) {
    for (const account of accountsData) {
      await prisma.account.create({
        data: {
          id: account.id,
          userId: account.userId,
          type: account.type,
          provider: account.provider,
          providerAccountId: account.providerAccountId,
          refresh_token: account.refresh_token,
          access_token: account.access_token,
          expires_at: account.expires_at
            ? parseInt(account.expires_at, 10)
            : null,
          token_type: account.token_type,
          scope: account.scope,
          id_token: account.id_token,
          session_state: account.session_state,
          refresh_token_expires_in: account.refresh_token_expires_in
            ? parseInt(account.refresh_token_expires_in, 10)
            : null,
        },
      });
    }
    console.log(`${accountsData.length} accounts seeded.`);
  }

  // Seed Sessions
  if (sessionsData) {
    for (const session of sessionsData) {
      await prisma.session.create({
        data: {
          id: session.id,
          sessionToken: session.sessionToken,
          userId: session.userId,
          expires: new Date(session.expires),
        },
      });
    }
    console.log(`${sessionsData.length} sessions seeded.`);
  }

  // Seed Images
  if (imagesData) {
    for (const image of imagesData) {
      await prisma.images.create({
        data: {
          id: parseInt(image.id, 10),
          name: image.name,
          url: image.url,
          address: image.address,
          lat: image.lat ? parseFloat(image.lat) : null,
          lng: image.lng ? parseFloat(image.lng) : null,
          createdAt: new Date(image.createdAt),
          updatedAt: new Date(image.updatedAt),
          createdById: image.createdById,
        },
      });
    }

    console.log(`${imagesData.length} images seeded.`);

    // Seed Responses
    if (responsesData) {
      for (const response of responsesData) {
        await prisma.response.create({
          data: {
            id: parseInt(response.id, 10),
            prompt: response.prompt,
            url: response.url,
            createdAt: new Date(response.createdAt),
            updatedAt: new Date(response.updatedAt),
            createdById: response.createdById,
            sourceImageId: response.sourceImageId
              ? parseInt(response.sourceImageId, 10)
              : null,
            previousResponseId: response.previousResponseId
              ? parseInt(response.previousResponseId, 10)
              : null,
          },
        });
      }
      console.log(`${responsesData.length} responses seeded.`);
    }
  }

  console.log("Seeding finished.");
}

void (async () => {
  try {
    await main();
  } catch (e) {
    console.error(e);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
})();
