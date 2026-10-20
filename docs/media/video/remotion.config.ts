import {Config} from '@remotion/cli/config';

// PNG frames + yuv420p/BT.709 give a standard limited-range H.264 that plays
// in browsers, QuickTime and on GitHub/YouTube.
Config.setVideoImageFormat('png');
Config.setCodec('h264');
Config.setCrf(20);
Config.setPixelFormat('yuv420p');
Config.setColorSpace('bt709');
