import type { JqWorkerInbound, JqWorkerOutbound } from "@/types/worker-messages";

let jqModule: { json: (data: unknown, filter: string) => unknown; raw: (json: string, filter: string) => string } | null = null;
let currentJson = "";

function post(msg: JqWorkerOutbound) {
  self.postMessage(msg);
}

async function initJq() {
  if (!jqModule) {
    // Dynamic import of jq-web WASM module
    const mod = await import("jq-web");
    jqModule = mod.default || mod;
  }
}

self.onmessage = async (e: MessageEvent<JqWorkerInbound>) => {
  const msg = e.data;

  switch (msg.type) {
    case "INIT": {
      currentJson = msg.payload.json;
      try {
        await initJq();
        post({ type: "READY" });
      } catch (err) {
        post({ type: "ERROR", payload: { message: `jq init failed: ${(err as Error).message}` } });
      }
      break;
    }

    case "QUERY": {
      if (!jqModule) {
        post({ type: "ERROR", payload: { message: "jq not initialized" } });
        return;
      }

      const start = performance.now();
      try {
        const result = jqModule.raw(currentJson, msg.payload.filter);
        post({
          type: "RESULT",
          payload: { output: result, timeMs: performance.now() - start },
        });
      } catch (err) {
        post({
          type: "ERROR",
          payload: { message: (err as Error).message },
        });
      }
      break;
    }

    case "CANCEL":
      currentJson = "";
      break;
  }
};
