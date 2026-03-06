import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

interface ChatMessage {
  role: string;
  content:
    | string
    | Array<{ type: string; text?: string; image_url?: { url: string } }>;
}

interface NvidiaPayload {
  model: string;
  messages: ChatMessage[];
  max_tokens: number;
  temperature: number;
  top_p: number;
  frequency_penalty: number;
  presence_penalty: number;
  stream: boolean;
}

interface NvidiaResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

@Injectable()
export class NvidiaService {
  private readonly logger = new Logger(NvidiaService.name);
  private readonly ngcApiKey: string;
  private readonly baseUrl =
    'https://integrate.api.nvidia.com/v1/chat/completions';

  constructor(private configService: ConfigService) {
    // ✅ Safely pulling your new (safe) API key from the .env file
    this.ngcApiKey = this.configService.get<string>('NGC_API_KEY') || '';
  }

  async generateResponse(prompt: string, imageData?: string): Promise<string> {
    // ✅ Using the exact model from your snippet!
    let selectedModel = 'meta/llama-4-maverick-17b-128e-instruct';
    let messageContent: ChatMessage['content'] = prompt;

    // Smart Fallback: If you send an image, switch to a Vision model
    if (imageData) {
      selectedModel = 'meta/llama-3.2-90b-vision-instruct';
      messageContent = [
        { type: 'text', text: prompt },
        { type: 'image_url', image_url: { url: imageData } },
      ];
    }

    // ✅ Added the exact payload parameters from your snippet
    const payload: NvidiaPayload = {
      model: selectedModel,
      messages: [
        {
          role: 'user',
          content: messageContent,
        },
      ],
      max_tokens: 2048,
      temperature: 1.0,
      top_p: 1.0,
      frequency_penalty: 0.0,
      presence_penalty: 0.0,
      stream: false,
    };

    try {
      this.logger.log(`🚀 Sending request to NVIDIA API...`);
      this.logger.log(`🧠 Target Model: ${selectedModel}`);

      const response = await axios.post<NvidiaResponse>(this.baseUrl, payload, {
        headers: {
          Authorization: `Bearer ${this.ngcApiKey}`,
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
      });

      this.logger.log(`✅ Success! Response received.`);
      return response.data.choices[0]?.message.content || '';
    } catch (error: any) {
      console.log('\n\n=================================================');
      this.logger.error(
        `🚨 NVIDIA API REJECTED THE REQUEST FOR: ${selectedModel}`,
      );
      this.logger.error(
        error.response?.data?.detail || error.response?.data || error.message,
      );
      console.log('=================================================\n\n');

      throw new Error(`NVIDIA API request failed for model: ${selectedModel}`);
    }
  }
}
