export type Root = Array<{
  id: string;
  name: string;
  providers: Array<{
    provider: string;
    model_id: string;
    context_length: number;
    per_mtok?: {
      prompt: number;
      completion: number;
    };
    input_modalities: string[];
    output_modalities: string[];
    tps?: number;
    ttfb?: number;
    reasoning_efforts: string[];
    extra?: {
      model_picker_enabled?: boolean;
      supported_endpoints?: string[];
      quantization?: string;
    };
    cost_multiplier?: number;
  }>;
  elo_direct?: number;
  elo_thinking?: number;
}>;

export type BrokieModels = Root;
export type BrokieModel = Root[number];
export type BrokieProvider = BrokieModel['providers'][number];
export type BrokiePricing = NonNullable<BrokieProvider['pricing']>;
export type BrokieExtra = NonNullable<BrokieProvider['extra']>;
