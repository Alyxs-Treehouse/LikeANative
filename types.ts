export enum TargetLanguage {
  English = 'English',
  Chinese = 'Chinese (Mandarin)',
  Spanish = 'Spanish',
  Japanese = 'Japanese',
  Korean = 'Korean',
  French = 'French',
  German = 'German',
}

export enum SocialPlatform {
  Twitter = 'X (Twitter)',
  Reddit = 'Reddit',
  LinkedIn = 'LinkedIn',
  Instagram = 'Instagram',
  RedNote = 'RedNote (Xiaohongshu)',
  Weibo = 'Weibo',
  WeChat = 'WeChat',
  Line = 'Line',
  KakaoTalk = 'KakaoTalk',
  General = 'General / No Specific Platform',
}

export enum SystemLanguage {
  English = 'English',
  Chinese = '简体中文',
  Spanish = 'Español',
  Japanese = '日本語',
  Korean = '한국어',
  French = 'Français',
  German = 'Deutsch',
}

export interface GenerationResult {
  id: string;
  tone: string;
  content: string;
  explanation?: string;
}

export interface AppState {
  input: string;
  targetLanguage: TargetLanguage;
  platform: SocialPlatform;
  persona: string;
  systemLanguage: SystemLanguage;
  customApiKey: string;
  isLoading: boolean;
  results: GenerationResult[];
  error: string | null;
}

export interface SelectionState {
  text: string;
  context: string;
  top: number;
  left: number;
  visible: boolean;
}