import { defineApp } from "rwsdk/worker";
import { route, render } from "rwsdk/router";
import { Document } from "@/app/Document";
import Home from "@/app/pages/Home";
import Conventional from "@/app/pages/Conventional";
import { chatHandler, performHandler } from "@/app/agent/openrouter";

export default defineApp([
  render(Document, [
    route("/", Home),
    route("/conventional", Conventional),
    route("/api/chat", { post: chatHandler }),
    route("/api/perform", { post: performHandler }),
  ]),
]);
