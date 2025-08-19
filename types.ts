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

export interface SubCategory {
  text: string;
  question?: string; 
  questions?: string[];
}

export interface MainCategory {
  text: string;
  icon: React.ReactNode;
  subCategories: SubCategory[];
  colorClasses: ColorClasses;
}