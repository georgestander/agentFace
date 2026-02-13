import { defineApp } from "rwsdk/worker";
import { route, render } from "rwsdk/router";
import { Document } from "@/app/Document";
import Home from "@/app/pages/Home";
import { chatHandler } from "@/app/agent/openrouter";

export default defineApp([
  render(Document, [
    route("/", Home),
    route("/api/chat", { post: chatHandler }),
  ]),
]);
