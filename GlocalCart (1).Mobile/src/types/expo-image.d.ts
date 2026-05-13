/**
 * Type declarations for expo-image
 * This provides proper TypeScript support for the expo-image package.
 * Fixes JSX element type incompatibility between expo-image Image and @types/react.
 */
declare module 'expo-image' {
  import { ComponentType } from 'react';
  import { ImageStyle, StyleProp } from 'react-native';

  export type ImageContentFit = 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
  export type ImageContentPosition = 'center' | 'top' | 'right' | 'bottom' | 'left' |
    'top center' | 'top right' | 'top left' |
    'right center' | 'right top' | 'right bottom' |
    'bottom center' | 'bottom right' | 'bottom left' |
    'left center' | 'left top' | 'left bottom';

  export interface ImageSource {
    uri?: string;
    width?: number;
    height?: number;
    headers?: Record<string, string>;
    cacheKey?: string;
  }

  export interface ImageProps {
    source?: ImageSource | string | number | null;
    style?: StyleProp<ImageStyle>;
    contentFit?: ImageContentFit;
    contentPosition?: ImageContentPosition;
    placeholder?: ImageSource | string | number | null;
    placeholderContentFit?: ImageContentFit;
    transition?: number | { duration?: number; effect?: string; timing?: string };
    cachePolicy?: 'none' | 'disk' | 'memory' | 'memory-disk';
    blurRadius?: number;
    tintColor?: string;
    priority?: 'low' | 'normal' | 'high';
    recyclingKey?: string;
    onLoad?: (event: any) => void;
    onLoadStart?: () => void;
    onLoadEnd?: () => void;
    onError?: (event: any) => void;
    onProgress?: (event: any) => void;
    accessible?: boolean;
    accessibilityLabel?: string;
    alt?: string;
    /** @deprecated Use contentFit instead */
    resizeMode?: 'cover' | 'contain' | 'stretch' | 'repeat' | 'center';
    [key: string]: any;
  }

  export const Image: ComponentType<ImageProps>;
  export const ImageBackground: ComponentType<ImageProps & { children?: React.ReactNode }>;

  export function prefetch(urls: string | string[]): Promise<boolean>;
  export function clearMemoryCache(): Promise<boolean>;
  export function clearDiskCache(): Promise<boolean>;
  export function getCachePathAsync(url: string): Promise<string | null>;
}
