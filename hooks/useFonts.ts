import { useFonts as useExpoFonts } from 'expo-font';
import {
  PressStart2P_400Regular,
} from '@expo-google-fonts/press-start-2p';
import {
  RobotoMono_400Regular,
  RobotoMono_500Medium,
  RobotoMono_700Bold,
} from '@expo-google-fonts/roboto-mono';

export const useFonts = () => {
  const [fontsLoaded] = useExpoFonts({
    PressStart2P_400Regular,
    RobotoMono_400Regular,
    RobotoMono_500Medium,
    RobotoMono_700Bold,
  });

  return fontsLoaded;
};