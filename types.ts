
import React from 'react';

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  isStreaming?: boolean;
  sources?: { title: string; uri: string }[];
}

export interface ColorClasses {
  bg: string;
  border: string;
  text: string;
  hoverBorder: string;
}

export interface QuestionItem {
  id: string;
  text: string;
}

export interface SubCategory {
  id: string;
  text: string;
  questions: QuestionItem[];
}

export interface MainCategory {
  id: string;
  text: string;
  icon: React.ReactNode;
  subCategories: SubCategory[];
  colorClasses: ColorClasses;
}