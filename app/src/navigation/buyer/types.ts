"use client";

import type { NavigatorScreenParams } from "@react-navigation/native";

export type BuyerTabParamList = {
  Search: undefined;
  WholesalersList: { category?: string } | undefined;
  Saved: undefined;
  Profile: undefined;
};

export type BuyerStackParamList = {
  BuyerTabs: NavigatorScreenParams<BuyerTabParamList> | undefined;
  BuyerAccess: undefined;
  WholesalerProfile: { wholesalerId: string } | undefined;
};
