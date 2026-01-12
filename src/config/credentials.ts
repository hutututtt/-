import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const CREDENTIALS_FILE = path.resolve('data/credentials.json');
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'default-key-change-in-production';

export type OkxCredentials = {
  paperApiKey: string;
  paperApiSecret: string;
  paperApiPassphrase: string;
  liveApiKey?: string;
  liveApiSecret?: string;
  liveApiPassphrase?: string;
};

function encrypt(text: string): string {
  const iv = crypto.randomBytes(16);
  const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32);
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

function decrypt(text: string): string {
  const parts = text.split(':');
  const iv = Buffer.from(parts[0], 'hex');
  const encrypted = parts[1];
  const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32);
  const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

export function loadCredentials(): OkxCredentials | null {
  // 优先从环境变量读取
  if (process.env.OKX_PAPER_API_KEY) {
    return {
      paperApiKey: process.env.OKX_PAPER_API_KEY,
      paperApiSecret: process.env.OKX_PAPER_API_SECRET || '',
      paperApiPassphrase: process.env.OKX_PAPER_API_PASSPHRASE || '',
      liveApiKey: process.env.OKX_API_KEY,
      liveApiSecret: process.env.OKX_API_SECRET,
      liveApiPassphrase: process.env.OKX_API_PASSPHRASE
    };
  }

  // 从文件读取
  if (!fs.existsSync(CREDENTIALS_FILE)) {
    return null;
  }

  try {
    const raw = fs.readFileSync(CREDENTIALS_FILE, 'utf-8');
    const encrypted = JSON.parse(raw);
    
    return {
      paperApiKey: encrypted.paperApiKey ? decrypt(encrypted.paperApiKey) : '',
      paperApiSecret: encrypted.paperApiSecret ? decrypt(encrypted.paperApiSecret) : '',
      paperApiPassphrase: encrypted.paperApiPassphrase ? decrypt(encrypted.paperApiPassphrase) : '',
      liveApiKey: encrypted.liveApiKey ? decrypt(encrypted.liveApiKey) : undefined,
      liveApiSecret: encrypted.liveApiSecret ? decrypt(encrypted.liveApiSecret) : undefined,
      liveApiPassphrase: encrypted.liveApiPassphrase ? decrypt(encrypted.liveApiPassphrase) : undefined
    };
  } catch (error) {
    console.error('Failed to load credentials:', error);
    return null;
  }
}

export function saveCredentials(credentials: OkxCredentials): void {
  const encrypted = {
    paperApiKey: credentials.paperApiKey ? encrypt(credentials.paperApiKey) : '',
    paperApiSecret: credentials.paperApiSecret ? encrypt(credentials.paperApiSecret) : '',
    paperApiPassphrase: credentials.paperApiPassphrase ? encrypt(credentials.paperApiPassphrase) : '',
    liveApiKey: credentials.liveApiKey ? encrypt(credentials.liveApiKey) : undefined,
    liveApiSecret: credentials.liveApiSecret ? encrypt(credentials.liveApiSecret) : undefined,
    liveApiPassphrase: credentials.liveApiPassphrase ? encrypt(credentials.liveApiPassphrase) : undefined
  };

  // 确保 data 目录存在
  const dataDir = path.dirname(CREDENTIALS_FILE);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  fs.writeFileSync(CREDENTIALS_FILE, JSON.stringify(encrypted, null, 2), 'utf-8');
  console.log('Credentials saved successfully');
}

export function getMaskedCredentials(): Partial<OkxCredentials> {
  const credentials = loadCredentials();
  if (!credentials) {
    return {};
  }

  const mask = (str: string) => {
    if (!str || str.length < 8) return '****';
    return str.slice(0, 4) + '****' + str.slice(-4);
  };

  return {
    paperApiKey: credentials.paperApiKey ? mask(credentials.paperApiKey) : '',
    paperApiSecret: credentials.paperApiSecret ? '****' : '',
    paperApiPassphrase: credentials.paperApiPassphrase ? '****' : '',
    liveApiKey: credentials.liveApiKey ? mask(credentials.liveApiKey) : undefined,
    liveApiSecret: credentials.liveApiSecret ? '****' : undefined,
    liveApiPassphrase: credentials.liveApiPassphrase ? '****' : undefined
  };
}
