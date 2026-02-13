import { initClient, initClientNavigation } from "rwsdk/client";

const { handleResponse } = initClientNavigation({
  scrollBehavior: "auto",
});

initClient({ handleResponse });
