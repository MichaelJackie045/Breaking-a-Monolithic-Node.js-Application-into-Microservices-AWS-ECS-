const Koa = require("koa");
const Router = require("koa-router");

const threads = [
  { id: 1, title: "Welcome to the board", userId: 1 },
  { id: 2, title: "AWS ECS tips", userId: 2 },
];

function nextId(items) {
  return items.reduce((max, item) => Math.max(max, item.id), 0) + 1;
}

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

  router.get("/api/threads", async (ctx) => {
    ctx.body = threads;
  });

  router.get("/api/threads/:id", async (ctx) => {
    const id = Number(ctx.params.id);
    const thread = threads.find((t) => t.id === id);
    if (!thread) ctx.throw(404, "Thread not found");
    ctx.body = thread;
  });

  router.post("/api/threads", async (ctx) => {
    const body = await readJsonBody(ctx.req);
    if (!body || typeof body.title !== "string" || typeof body.userId !== "number") {
      ctx.throw(400, "Invalid body");
    }
    const thread = { id: nextId(threads), title: body.title, userId: body.userId };
    threads.push(thread);
    ctx.status = 201;
    ctx.body = thread;
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
