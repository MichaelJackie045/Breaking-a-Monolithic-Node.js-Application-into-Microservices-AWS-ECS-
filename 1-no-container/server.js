const Koa = require("koa");
const Router = require("koa-router");
const { readDb, writeDb, nextId } = require("./index");

async function readJsonBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString("utf8").trim();
  if (!raw) return null;
  return JSON.parse(raw);
}

function createApp() {
  const app = new Koa();
  const router = new Router();

  router.get("/api/users", async (ctx) => {
    const db = await readDb();
    ctx.body = db.users;
  });

  router.get("/api/users/:id", async (ctx) => {
    const db = await readDb();
    const id = Number(ctx.params.id);
    const user = db.users.find((u) => u.id === id);
    if (!user) ctx.throw(404, "User not found");
    ctx.body = user;
  });

  router.get("/api/threads", async (ctx) => {
    const db = await readDb();
    ctx.body = db.threads;
  });

  router.get("/api/threads/:id", async (ctx) => {
    const db = await readDb();
    const id = Number(ctx.params.id);
    const thread = db.threads.find((t) => t.id === id);
    if (!thread) ctx.throw(404, "Thread not found");
    ctx.body = thread;
  });

  router.post("/api/threads", async (ctx) => {
    const db = await readDb();
    const body = await readJsonBody(ctx.req);
    if (!body || typeof body.title !== "string" || typeof body.userId !== "number") {
      ctx.throw(400, "Invalid body");
    }
    const user = db.users.find((u) => u.id === body.userId);
    if (!user) ctx.throw(400, "Unknown userId");

    const thread = { id: nextId(db.threads), title: body.title, userId: body.userId };
    db.threads.push(thread);
    await writeDb(db);
    ctx.status = 201;
    ctx.body = thread;
  });

  router.get("/api/posts/in-thread/:threadId", async (ctx) => {
    const db = await readDb();
    const threadId = Number(ctx.params.threadId);
    const posts = db.posts.filter((p) => p.threadId === threadId);
    ctx.body = posts;
  });

  router.post("/api/posts", async (ctx) => {
    const db = await readDb();
    const body = await readJsonBody(ctx.req);
    if (
      !body ||
      typeof body.threadId !== "number" ||
      typeof body.userId !== "number" ||
      typeof body.message !== "string"
    ) {
      ctx.throw(400, "Invalid body");
    }

    const thread = db.threads.find((t) => t.id === body.threadId);
    if (!thread) ctx.throw(400, "Unknown threadId");
    const user = db.users.find((u) => u.id === body.userId);
    if (!user) ctx.throw(400, "Unknown userId");

    const post = {
      id: nextId(db.posts),
      threadId: body.threadId,
      userId: body.userId,
      message: body.message,
    };

    db.posts.push(post);
    await writeDb(db);
    ctx.status = 201;
    ctx.body = post;
  });

  app.use(async (ctx, next) => {
    try {
      await next();
    } catch (err) {
      ctx.status = err.status || 500;
      ctx.body = { error: err.message || "Internal Server Error" };
    }
  });

  app.use(router.routes());
  app.use(router.allowedMethods());

  return app;
}

const port = Number(process.env.PORT || 3000);
createApp().listen(port);
