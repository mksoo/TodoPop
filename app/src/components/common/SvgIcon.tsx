import { FC, memo, useMemo } from "react";
import { ColorValue, PixelRatio, StyleProp, View, ViewStyle } from "react-native";

import AddIcon from '@/assets/icons/add.svg';

export type IconName = 
  | 'add';

const IconMap: {[key in IconName]: FC<any>} = {
  add: AddIcon,
}

interface Props {
  name: IconName;
  size?: number;
  color?: ColorValue;
  style?: StyleProp<ViewStyle>;
}

const isIconName = (name: string): name is IconName => {
  if (IconMap[name as IconName]) {
    return true;
  }
  return false;
}

const SvgIcon: FC<Props> = ({ name, size = 24, color = '#000', style }) => {
  const fixedSize = useMemo(() => PixelRatio.roundToNearestPixel(size), [size]);

  const IconComponent = useMemo(() => {
    if (!isIconName(name)) {
      return null;
    }
    return IconMap[name];
  }, [name]);

  if (!IconComponent) {
    return null;
  }

  return <View style={[{width: fixedSize, height: fixedSize}, style]}>
    <IconComponent 
      width={fixedSize} 
      height={fixedSize} 
      fill={color} 
      style={{color}}
    />
  </View>;
}

export default memo(SvgIcon);