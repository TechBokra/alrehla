import { LoadingState, type LoadingStateProps } from './components/layout/loading-state';

export type PageLoaderProps = LoadingStateProps;

export default function PageLoader({ text = 'جاري التحميل...', fullPage = true, ...props }: PageLoaderProps) {
  return <LoadingState text={text} fullPage={fullPage} {...props} />;
}

export { LoadingState, PageLoader };
