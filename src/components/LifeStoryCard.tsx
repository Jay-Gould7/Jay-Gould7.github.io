'use client';

import type { ReactNode } from 'react';
import PixelTransition from './reactbits/PixelTransition';

interface Props {
	image: string;
	alt?: string;
	date: string;
	title?: string;
	children: ReactNode;
}

/* React wrapper that composes PixelTransition with a markdown-rendered
   caption. Exists because PixelTransition wants two ReactNode props
   (first/second), and Astro can only forward a single <Content /> slot
   as `children`. The photo is the front face (always visible by
   default); date, title, and the full caption body sit on the back
   face and only appear after a click/hover triggers the pixel flip. */
export default function LifeStoryCard({ image, alt, date, title, children }: Props) {
	return (
		<PixelTransition
			className="life-story"
			gridSize={8}
			pixelColor="#dcdcdc"
			once={false}
			animationStepDuration={0.4}
			autoHeight
			firstContent={
				<img
					src={image}
					alt={alt ?? title ?? ''}
					loading="lazy"
					style={{ width: '100%', height: 'auto', display: 'block' }}
				/>
			}
			secondContent={
				<div className="life-story__caption">
					<time className="life-story__date">{date}</time>
					{title && <h3 className="life-story__title">{title}</h3>}
					<div className="life-story__body">{children}</div>
				</div>
			}
		/>
	);
}
