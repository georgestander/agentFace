import { defineApp } from "rwsdk/worker";
import { route, render } from "rwsdk/router";
import { env } from "cloudflare:workers";
import { Document } from "@/app/Document";
import Home from "@/app/pages/Home";
import HomeV3 from "@/app/pages/HomeV3";
import Conventional from "@/app/pages/Conventional";
import About from "@/app/pages/About";
import Musings from "@/app/pages/Musings";
import Contact from "@/app/pages/Contact";
import { performHandler } from "@/app/agent/openrouter";
import {
  sessionStartHandler,
  sessionStepHandler,
} from "@/app/agent/session-api";

const isV3 = (env as any).EXPERIENCE_V3 === "true";
const HomePage = isV3 ? HomeV3 : Home;

export default defineApp([
  render(Document, [
    route("/", HomePage),
    route("/conventional", Conventional),
    route("/about", About),
    route("/musings", Musings),
    route("/projects", Musings),
    route("/contact", Contact),
    route("/api/perform", { post: performHandler }),
    route("/api/session/start", { post: sessionStartHandler }),
    route("/api/session/step", { post: sessionStepHandler }),
  ]),
]);
