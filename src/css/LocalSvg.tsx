import * as React from 'react';
import { useState, useEffect, Component } from 'react';
import { Image, Platform, type ImageSourcePropType } from 'react-native';
import { fetchText, type SvgProps } from 'react-native-svg';
import { resolveAssetUri } from '../lib/resolveAssetUri';
import { SvgCss, SvgWithCss } from './css';

export function getUriFromSource(source: ImageSourcePropType) {
  const resolvedAssetSource =
    Platform.OS === 'web'
      ? resolveAssetUri(source)
      : Image.resolveAssetSource(source);
  return resolvedAssetSource?.uri;
}

export function loadLocalRawResourceDefault(source: ImageSourcePropType) {
  const uri = getUriFromSource(source);
  return fetchText(uri);
}

export function isUriAnAndroidResourceIdentifier(uri?: string) {
  return typeof uri === 'string' && uri.indexOf('/') <= -1;
}

export async function loadAndroidRawResource(uri: string) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const RNSVGRenderableModule: any =
      // neeeded for new arch
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      require('../fabric/NativeSvgRenderableModule').default;
    return await RNSVGRenderableModule.getRawResource(uri);
  } catch (e) {
    console.error(
      'Error in RawResourceUtils while trying to natively load an Android raw resource: ',
      e
    );
    return null;
  }
}

export function loadLocalRawResourceAndroid(source: ImageSourcePropType) {
  const uri = getUriFromSource(source);
  if (uri && isUriAnAndroidResourceIdentifier(uri)) {
    return loadAndroidRawResource(uri);
  } else {
    return fetchText(uri);
  }
}

export const loadLocalRawResource =
  Platform.OS !== 'android'
    ? loadLocalRawResourceDefault
    : loadLocalRawResourceAndroid;

export type LocalProps = SvgProps & {
  asset: ImageSourcePropType;
  override?: object;
};
export type LocalState = { xml: string | null };

export function LocalSvg(props: LocalProps) {
  const { asset, ...rest } = props;
  const [xml, setXml] = useState<string | null>(null);
  useEffect(() => {
    loadLocalRawResource(asset).then(setXml);
  }, [asset]);
  return <SvgCss xml={xml} {...rest} />;
}

export class WithLocalSvg extends Component<LocalProps, LocalState> {
  state = { xml: null };
  componentDidMount() {
    this.load(this.props.asset);
  }

  componentDidUpdate(prevProps: { asset: ImageSourcePropType }) {
    const { asset } = this.props;
    if (asset !== prevProps.asset) {
      this.load(asset);
    }
  }

  async load(asset: ImageSourcePropType) {
    try {
      this.setState({ xml: asset ? await loadLocalRawResource(asset) : null });
    } catch (e) {
      console.error(e);
    }
  }

  render() {
    const {
      props,
      state: { xml },
    } = this;
    return <SvgWithCss xml={xml} override={props} />;
  }
}

export default LocalSvg;
