import { defineApp } from "rwsdk/worker";
import { route, render } from "rwsdk/router";
import { Document } from "@/app/Document";
import Home from "@/app/pages/Home";
import Conventional from "@/app/pages/Conventional";
import About from "@/app/pages/About";
import Musings from "@/app/pages/Musings";
import Contact from "@/app/pages/Contact";
import { performHandler } from "@/app/agent/openrouter";

export default defineApp([
  render(Document, [
    route("/", Home),
    route("/conventional", Conventional),
    route("/about", About),
    route("/musings", Musings),
    route("/projects", Musings),
    route("/contact", Contact),
    route("/api/perform", { post: performHandler }),
  ]),
]);
