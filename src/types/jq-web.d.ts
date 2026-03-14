declare module "jq-web/jq.wasm.js" {
  interface JqModule {
    json(data: unknown, filter: string): unknown;
    raw(json: string, filter: string): string;
  }

  const jq: JqModule;
  export default jq;
}

declare module "jq-web" {
  interface JqModule {
    json(data: unknown, filter: string): unknown;
    raw(json: string, filter: string): string;
  }

  const jq: JqModule;
  export default jq;
}
