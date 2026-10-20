import React from 'react';
import {Composition, Still} from 'remotion';
import {QuickStartV2, TOTAL_FRAMES_V2} from './sketcher-v2/Video';
import {ThumbnailV2} from './sketcher-v2/usage';
import {QuickStart, TOTAL_FRAMES} from './v1/Video';
import {Thumbnail} from './v1/scenes';

export const Root: React.FC = () => (
	<>
		<Composition id="QuickStartV2" component={QuickStartV2} durationInFrames={TOTAL_FRAMES_V2} fps={30} width={1920} height={1080} />
		<Still id="ThumbnailV2" component={ThumbnailV2} width={1280} height={720} />
		<Composition id="QuickStart" component={QuickStart} durationInFrames={TOTAL_FRAMES} fps={30} width={1920} height={1080} />
		<Still id="Thumbnail" component={Thumbnail} width={1280} height={720} />
	</>
);
