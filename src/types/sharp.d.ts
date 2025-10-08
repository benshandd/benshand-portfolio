declare module "sharp" {
  interface SharpOptions {
    failOn?: "none" | "error";
  }

  interface SharpMetadata {
    format?: string;
    width?: number;
    height?: number;
  }

  interface SharpInstance {
    metadata(): Promise<SharpMetadata>;
  }

  function sharp(input?: Buffer | ArrayBuffer | string, options?: SharpOptions): SharpInstance;

  export type Sharp = SharpInstance;
  export type Metadata = SharpMetadata;

  export default sharp;
}
