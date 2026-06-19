import * as schema from "./schema";

let db: any;
let pool: any;

if (!process.env.DATABASE_URL) {
  // Mock database for local development
  const mockBookings: any[] = [];
  const mockPartners: any[] = [];
  
  pool = {
    query: () => Promise.resolve({ rows: [] }),
    end: () => Promise.resolve(),
  };
  
  // Mock db methods
  db = {
    insert: (table: any) => ({
      values: (vals: any) => {
        if (table === (schema as any).bookingsTable) {
          mockBookings.push(vals);
        } else if (table === (schema as any).partnersTable) {
          mockPartners.push(vals);
        }
        return {
          returning: () => Promise.resolve([vals]),
        };
      },
    }),
    update: (table: any) => ({
      set: (data: any) => ({
        where: (cond: any) => Promise.resolve(),
      }),
    }),
    select: () => ({
      from: (table: any) => {
        let data = [];
        if (table === (schema as any).bookingsTable) {
          data = mockBookings;
        } else if (table === (schema as any).partnersTable) {
          data = mockPartners;
        }
        return {
          orderBy: (orderBy: any) => {
            // Return both a limit() method and as a Promise (if no limit() is called)
            const result = Promise.resolve(data);
            (result as any).limit = (count: number) => Promise.resolve(data.slice(0, count));
            return result;
          },
        };
      },
    }),
  } as any;
} else {
  // Real Postgres
  import("drizzle-orm/node-postgres").then(({ drizzle }) => {
    import("pg").then((pg) => {
      const { Pool } = pg;
      pool = new Pool({ connectionString: process.env.DATABASE_URL! });
      db = drizzle(pool, { schema });
    });
  });
}

export { db, pool };
export * from "./schema";
