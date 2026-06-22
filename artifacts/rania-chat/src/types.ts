/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Product {
  id: string;
  title: string;
  price: number;
  category: "property" | "vehicle" | "job" | "local" | "tech" | "food" | "jastip" | "other";
  location: string;
  badges: ("verified" | "local" | "ship" | "jastip" | "china" | "pending")[];
  sellerName: string;
  rating: number;
  description: string;
  image: string;
  expiryDays: number;
  videoUrl?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  whatsapp: string;
  dob: string;
  accountType: "personal" | "agent";
  adCredits: number;
  freeListings: number;
  isVerified: boolean;
  agentStatus?: "pending" | "approved" | "rejected";
}

export interface AdCreditPackage {
  id: string;
  name: string;
  priceUSD: number;
  baseCredits: number;
  bonusCredits: number;
}


export interface Story {
  id: string;
  name: string;
  avatar: string;
  image: string;
  live?: boolean;
  seen: boolean;
  productCTA?: {
    title: string;
    price: number;
    productId: string;
  };
}

export interface Comment {
  id: string;
  name: string;
  avatar: string;
  text: string;
  time: string;
  likes: number;
}

export interface CommissionItem {
  id: string;
  icon: string;
  title: string;
  time: string;
  amount: number;
  isAd?: boolean;
}

export interface Message {
  role: "user" | "model" | "seller";
  text: string;
}
